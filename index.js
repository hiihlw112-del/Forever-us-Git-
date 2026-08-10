/**
 * Cloud Functions for Forever Us: push notifications only.
 *
 * The "Spark" AI feature used to live here as a Cloud Function calling
 * Anthropic's API. It's since moved to run directly in the browser via
 * Firebase AI Logic (Gemini's free tier) - see AI_LOGIC_ENABLED near the
 * top of index.html's <script>. That means no function, no API key, and
 * no billing plan is needed just for Spark anymore.
 *
 * This file now only handles notifications: when a new memory, letter, or
 * journal entry is created, look up who created it (stored as "createdBy"
 * on the item itself), then push a notification to every *other*
 * signed-in user's saved device token(s). The person who added the thing
 * never gets pinged for their own addition.
 *
 * SETUP (see SETUP.md "Notifications" section for the full walkthrough):
 *   1. In the Firebase console: Project settings > Cloud Messaging > Web
 *      configuration > Generate key pair. That's your VAPID key.
 *   2. Paste the VAPID key into VAPID_KEY near the top of index.html.
 *   3. From your project folder: firebase init functions (choose your
 *      existing project, choose JavaScript), then replace the generated
 *      index.js and package.json with the ones provided here.
 *   4. Deploy: firebase deploy --only functions
 *      (Cloud Functions require Firebase's Blaze pay-as-you-go plan - it
 *      has a generous free tier, but a payment method is required to
 *      enable it. This requirement is specific to Cloud Functions, not
 *      to Spark anymore.)
 */

const { onValueCreated } = require('firebase-functions/v2/database');
const admin = require('firebase-admin');

admin.initializeApp();

async function notifyOtherPartner(creatorUid, title, body) {
  if (!creatorUid) return; // no author recorded (e.g. item predates this feature) - skip
  const db = admin.database();
  const tokensSnap = await db.ref('forever-us-data/fcmTokens').once('value');
  const allTokens = tokensSnap.val() || {};

  const sends = [];
  for (const uid of Object.keys(allTokens)) {
    if (uid === creatorUid) continue; // don't notify whoever just added it
    const tokensForUser = allTokens[uid] || {};
    for (const key of Object.keys(tokensForUser)) {
      const token = tokensForUser[key];
      sends.push({ uid, key, token });
    }
  }

  await Promise.all(
    sends.map(async ({ uid, key, token }) => {
      try {
        await admin.messaging().send({
          token,
          notification: { title, body },
          webpush: {
            fcmOptions: { link: '/' },
            notification: { icon: '/icon-192.png' }
          }
        });
      } catch (err) {
        // Token is stale (browser data cleared, notifications revoked, etc.) - clean it up.
        if (
          err.code === 'messaging/registration-token-not-registered' ||
          err.code === 'messaging/invalid-registration-token'
        ) {
          await db.ref(`forever-us-data/fcmTokens/${uid}/${key}`).remove();
        } else {
          console.error('Notification send failed:', err);
        }
      }
    })
  );
}

exports.notifyOnMemory = onValueCreated('/forever-us-data/memories/{id}', async (event) => {
  const memory = event.data.val() || {};
  await notifyOtherPartner(
    memory.createdBy,
    `New memory: ${memory.title || 'Untitled'}`,
    (memory.story || '').slice(0, 100)
  );
});

exports.notifyOnLetter = onValueCreated('/forever-us-data/letters/{id}', async (event) => {
  const letter = event.data.val() || {};
  const isLocked = letter.unlockDate && new Date(letter.unlockDate).getTime() > Date.now();
  await notifyOtherPartner(
    letter.createdBy,
    isLocked ? 'A new letter is waiting' : `New letter: ${letter.title || 'Untitled'}`,
    isLocked ? "It's locked until the right day - tap to see when." : 'Tap to read it.'
  );
});

exports.notifyOnJournal = onValueCreated('/forever-us-data/journal/{id}', async (event) => {
  const entry = event.data.val() || {};
  await notifyOtherPartner(
    entry.createdBy,
    'New journal entry',
    (entry.text || '').slice(0, 100)
  );
});
