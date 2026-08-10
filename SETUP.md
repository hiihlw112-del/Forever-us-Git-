# Setting up Forever Us

This turns `index.html` from a file on your computer into a live site both of
you can open on your own phones, with everything syncing between you in
real time through Firebase.

Total time: about 25 minutes. No coding required for the core setup.

---

## Part 1 - Create your Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and sign in with a Google account.
2. Click **Add project**, give it a name (e.g. `forever-us`), and finish the wizard. You can decline Google Analytics - you don't need it.
3. In the left sidebar, click **Build > Realtime Database**.
4. Click **Create Database**. Pick a location close to you both, and start in **test mode** for now (we'll tighten this in Part 3).

## Part 2 - Connect the app to your project

1. In the Firebase console, click the gear icon next to "Project Overview" > **Project settings**.
2. Scroll to **Your apps** and click the **</>** (Web) icon to register a new web app. Give it any nickname. You don't need Firebase Hosting for this step.
3. Firebase will show you a code block that looks like this:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "forever-us-xxxxx.firebaseapp.com",
     databaseURL: "https://forever-us-xxxxx-default-rtdb.firebaseio.com",
     projectId: "forever-us-xxxxx",
     storageBucket: "forever-us-xxxxx.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
4. Open `index.html` in any text editor, find the `firebaseConfig` object near the top of the `<script>` section, and replace the placeholder values with your real ones. Save the file.
5. Open `index.html` in your browser (just double-click it). If the config is filled in correctly, you'll see the envelope screen instead of the "Almost there" setup notice. Tap it open and try adding a memory.

This config is safe to have in the code - it's not a secret key, it just tells your browser which Firebase project to talk to. Anyone with your site's URL and this config could technically read or write your database, though, so keep the next part in mind.

## Part 3 - Add login so it's just the two of you

The app now has a sign-in screen. There's no public sign-up button on purpose - the only accounts that can log in are the ones you create yourself, directly in the Firebase console.

1. In the Firebase console, go to **Build > Authentication**, then click **Get started**.
2. Click the **Sign-in method** tab, click **Email/Password**, toggle it **Enable**, and click **Save**.
3. Click the **Users** tab, then **Add user**.
4. Enter an email and password for partner one, and click **Add user**. Repeat for partner two. (These don't need to be real inboxes you check daily, but "Forgot password?" in the app does send a real reset email to whatever address you use, so pick ones you can actually access.)
5. Open `index.html`, reload it, and try signing in with one of the two accounts you just created.

That's it - anyone without one of these two accounts will only ever see the sign-in screen, no matter how they got the URL or the config.

## Part 4 - Lock down your database (recommended)

Test mode leaves your database open to anyone for 30 days, then it stops working entirely. Now that you have real accounts, tighten the rules to require sign-in:

1. In the Firebase console, go to **Realtime Database > Rules**.
2. Replace the rules with:
   ```json
   {
     "rules": {
       "forever-us-data": {
         ".read": "auth != null",
         ".write": "auth != null"
       },
       "$other": {
         ".read": false,
         ".write": false
       }
     }
   }
   ```
3. Click **Publish**.

This means the database itself now checks that a real signed-in user is making the request - even if someone got hold of your `firebaseConfig`, they couldn't read or write anything without one of your two accounts' email and password. Combined with Part 3, your data is now genuinely private to the two of you.

If you want to go one step further and restrict it to those *exact two people* (rather than "anyone who signs up" - though there's no sign-up flow in this app anyway, so this is mostly belt-and-suspenders), you can list specific user IDs instead:
```json
".read": "auth != null && (auth.uid === 'PARTNER_A_UID' || auth.uid === 'PARTNER_B_UID')"
```
Find each UID in **Authentication > Users** in the Firebase console, next to each account.

## Part 5 (recommended) - Turn on App Check

Part 4 makes sure only *signed-in* requests reach your database. App Check adds a second, different layer: it makes sure requests are coming from your actual, genuine copy of this site - not a script, a bot, or someone who copied your `firebaseConfig` into their own page. The two work together, not one instead of the other.

1. In the Firebase console, go to **Build > App Check**.
2. Find your web app in the list and click it (or **Register** if it's not listed yet).
3. Choose **reCAPTCHA v3** as the provider. Firebase will either walk you through registering a reCAPTCHA v3 site key with Google, or generate one for you automatically - follow the on-screen steps.
4. Copy the site key it gives you.
5. Open `index.html`, find `RECAPTCHA_SITE_KEY` near the top of the `<script>` section, and paste the key in. Save.
6. Back in the Firebase console, go to **App Check > APIs** (or **Enforce** view). For **Realtime Database**, click **Enforce**. Do the same for **Cloud Messaging** if you plan to use notifications, and for **Firebase AI Logic** if you plan to use Spark (Part 7).
7. Re-upload the updated `index.html` to GitHub (see Part 6 if you haven't put it online yet).

Enforcement can take up to 15 minutes to fully kick in. Until you click **Enforce** for a product, App Check runs in "monitor only" mode - it logs what it sees but doesn't block anything, so it's safe to set up gradually without breaking access for the two of you.

## Part 6 - Put it online with GitHub Pages

1. Create a new **private** GitHub repository (Settings matter here - keep it private since your config lives in the code).
2. Upload `index.html` to the repo (drag-and-drop works fine on github.com, or use git).
3. In the repo, go to **Settings > Pages**.
4. Under "Build and deployment", set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
5. GitHub will give you a URL like `https://yourname.github.io/your-repo/`. It can take a minute or two to go live.
6. Open that URL on both of your phones. You're both now looking at the same live archive - add a memory on one phone and it'll appear on the other within a second or two.

Note: since the repo is private, GitHub Pages sites from private repos are only free/available on paid GitHub plans in some cases - if Pages isn't available on your plan, Firebase Hosting is a good free alternative (`firebase init hosting`, then `firebase deploy`) and works exactly the same way with this file.

## Part 7 (optional) - Turn on the Spark AI button

Spark runs directly in the browser using Google's Gemini models through Firebase AI Logic. Unlike the notification functions in Part 8, this needs **no Cloud Function, no separate API key to manage, and no billing plan** - the Gemini Developer API's free tier is designed to be called straight from an app like this one.

1. In the Firebase console, go to **Build > AI Logic** (sometimes shown as "AI Services > AI Logic").
2. Click **Get started**. When asked which "Gemini API provider" to use, choose **Gemini Developer API** - this is the free-tier option; Firebase will enable the necessary API for you automatically.
3. Complete the on-screen setup steps. If it mentions App Check, that's expected - Google now requires App Check to protect AI Logic. Make sure you've completed Part 5 above first.
4. Open `index.html`, find `AI_LOGIC_ENABLED` near the top of the `<script>` section, and change it from `false` to `true`. Save.
5. Re-upload the updated `index.html` to GitHub.
6. Open the site, sign in, go to Letters, tap **+ Write a letter**, then tap **✨ Spark**.

If you already set up the older Cloud-Function version of Spark from a previous version of this guide, you can safely ignore or delete that function - it's no longer used. `functions/index.js` now only contains the notification functions from Part 8.

If you skip this part entirely, everything else in the app works fine - Spark will just show a gentle "not set up yet" message instead of generating a line.

## Part 8 (optional) - Turn on push notifications

This alerts whichever of you *didn't* just add something - a memory, letter, or journal entry - even if their phone is locked or the site isn't open. This is the one remaining feature that needs a real Cloud Function, which means it needs Firebase's **Blaze (pay-as-you-go)** plan - it has a generous free tier, but a payment method is required to enable it.

**One important limit up front:** on iPhone, push notifications only work if the site has been added to the Home Screen first (Settings icon in Safari's share sheet > **Add to Home Screen**) - this is an Apple requirement for *any* website, not something specific to this app, and needs iOS 16.4 or later. On Android/Chrome, it works normally from a regular browser tab, no install needed.

1. Install the Firebase CLI if you don't have it: `npm install -g firebase-tools`, then `firebase login`.
2. From a folder containing this project, run `firebase init functions`, choose your existing project, choose JavaScript, and when it scaffolds a `functions/` folder, replace the generated `index.js` and `package.json` with the ones provided alongside this guide.
3. In the Firebase console: **Project settings > Cloud Messaging** tab > **Web configuration** > **Generate key pair**. Copy the long key it gives you.
4. Open `index.html`, find `VAPID_KEY` near the top of the `<script>` section, and paste the key in.
5. Open `firebase-messaging-sw.js` (provided alongside this guide) and paste your `firebaseConfig` into it - the *exact same* values you already put in `index.html`. This file can't read the config from `index.html`, so it needs its own copy.
6. Deploy: `firebase deploy --only functions` (this deploys the three notification functions - `notifyOnMemory`, `notifyOnLetter`, `notifyOnJournal`).
7. Upload `index.html`, `firebase-messaging-sw.js`, and `manifest.json` to your GitHub repo - all three need to sit in the same root folder together. Wait for GitHub Pages to redeploy.
8. Open the site, sign in, and tap the bell icon in the header. Your browser will ask for notification permission - allow it.
9. Test it: with one device signed in and notifications enabled, add a memory from the *other* device. The first device should get a notification within a few seconds.

A couple of notes on how this behaves:
- The person who adds something never gets notified about their own addition - only the other partner does.
- For locked letters, the notification just says a letter is waiting, without giving away the title or contents.
- If you sign in on a new phone later, tap the bell again there too - each device needs its own permission and registration.
- Optional polish: the app references `/icon-192.png` for the notification icon. Add your own 192x192 PNG image with that exact filename to the same folder if you'd like a custom icon instead of the browser's default.

---

## Troubleshooting

- **Seeing "Almost there" instead of a sign-in screen** - `firebaseConfig` still has placeholder values. Double check you saved the file after pasting your real config in.
- **Sign-in screen says "Couldn't sign in"** - double check the email/password against what you set up in Authentication > Users, and confirm Email/Password sign-in is actually enabled (Part 3, step 2).
- **Nothing syncs between devices** - make sure both devices are signed in and opening the exact same URL, and check the Realtime Database console (Firebase > Realtime Database > Data) to see if entries are actually showing up there.
- **"Sync error" toast, or things stopped working after enabling App Check** - if you enforced App Check (Part 5) before confirming `RECAPTCHA_SITE_KEY` is correctly saved in `index.html` and re-uploaded, verified requests will be rejected. Recheck the key, or temporarily click **Unenforce** for the affected product in App Check > APIs while you fix it.
- **Spark says "not set up yet"** - `AI_LOGIC_ENABLED` is still `false` in `index.html` (Part 7, step 4), or Part 7's console setup wasn't completed.
- **Spark button does nothing / browser console shows an import error** - the `firebase-ai.js` or `firebase-app-check.js` module failed to load from Google's CDN. Check your internet connection, and confirm the Firebase SDK version in `index.html`'s `<script src="...">` tags matches across all of them.
- **Bell icon doesn't appear** - `VAPID_KEY` is still blank in `index.html` (Part 8, step 4).
- **Notifications never arrive** - check that `firebase-messaging-sw.js` has your real `firebaseConfig` (not the placeholder), that it's uploaded at the same root level as `index.html` (not in a subfolder), and that the Cloud Functions deployed without errors (`firebase deploy --only functions` output, or the Firebase console's Functions logs). On iPhone, confirm the site was added to the Home Screen first.
