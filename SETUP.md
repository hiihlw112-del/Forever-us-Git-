# Setting up Forever Us

This turns `index.html` from a file on your computer into a live site both of
you can open on your own phones, with everything syncing between you in
real time through Firebase.

Total time: about 15 minutes. No coding required for the core setup.

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

## Part 3 - Lock down your database (recommended)

Test mode leaves your database open to anyone for 30 days, then it stops working entirely. Before that happens (or right away), set proper rules:

1. In the Firebase console, go to **Realtime Database > Rules**.
2. Replace the rules with:
   ```json
   {
     "rules": {
       "forever-us-data": {
         ".read": true,
         ".write": true
       },
       "$other": {
         ".read": false,
         ".write": false
       }
     }
   }
   ```
3. Click **Publish**.

This keeps your data restricted to just the one path the app uses. It's still open to anyone who has your config (there's no login system in this build), so don't publish your config publicly or share your repo/site URL outside the two of you. If you'd like real access control later, Firebase Authentication (e.g. a simple email/password sign-in for just the two of you) is the natural next step - it's a bigger addition than fits here, but very doable if you want to revisit it.

## Part 4 - Put it online with GitHub Pages

1. Create a new **private** GitHub repository (Settings matter here - keep it private since your config lives in the code).
2. Upload `index.html` to the repo (drag-and-drop works fine on github.com, or use git).
3. In the repo, go to **Settings > Pages**.
4. Under "Build and deployment", set Source to **Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
5. GitHub will give you a URL like `https://yourname.github.io/your-repo/`. It can take a minute or two to go live.
6. Open that URL on both of your phones. You're both now looking at the same live archive - add a memory on one phone and it'll appear on the other within a second or two.

Note: since the repo is private, GitHub Pages sites from private repos are only free/available on paid GitHub plans in some cases - if Pages isn't available on your plan, Firebase Hosting is a good free alternative (`firebase init hosting`, then `firebase deploy`) and works exactly the same way with this file.

## Part 5 (optional) - Turn on the Spark AI button

The Spark button in the Letters tab needs its own small backend function so your Anthropic API key isn't exposed in the public webpage. This part does need a little comfort with the command line.

1. Get an API key from [console.anthropic.com](https://console.anthropic.com) (this is separate from a claude.ai account, and billed separately based on usage).
2. Install the Firebase CLI if you don't have it: `npm install -g firebase-tools`, then `firebase login`.
3. From a folder containing this project, run `firebase init functions`, choose your existing project, choose JavaScript, and when it scaffolds a `functions/` folder, replace the generated `index.js` and `package.json` with the ones provided alongside this guide.
4. Store your API key as a secret (this keeps it out of your code entirely):
   ```
   firebase functions:secrets:set ANTHROPIC_API_KEY
   ```
5. Deploy: `firebase deploy --only functions`
6. Note: Cloud Functions that make outbound network calls require Firebase's **Blaze (pay-as-you-go)** plan. It has a generous free tier, but a payment method is required to enable it.
7. Copy the function URL from the deploy output (looks like `https://us-central1-yourproject.cloudfunctions.net/spark`) and paste it into `SPARK_FUNCTION_URL` near the top of `index.html`'s `<script>` section. Redeploy/re-upload the updated `index.html`.

If you skip this part entirely, everything else in the app works fine - Spark will just show a gentle "not set up yet" message instead of generating a line.

---

## Troubleshooting

- **Seeing "Almost there" instead of the envelope** - `firebaseConfig` still has placeholder values. Double check you saved the file after pasting your real config in.
- **Nothing syncs between devices** - make sure both devices are opening the exact same URL, and check the Realtime Database console (Firebase > Realtime Database > Data) to see if entries are actually showing up there.
- **"Sync error" toast** - usually a Realtime Database rules issue. Revisit Part 3, or temporarily set rules back to fully open to confirm that fixes it, then narrow them again.
