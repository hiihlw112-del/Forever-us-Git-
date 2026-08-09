/**
 * Optional Cloud Function powering the "Spark" button in Forever Us.
 *
 * Why this exists: a public GitHub/Firebase-hosted page can't safely hold a
 * real API key in its own code (anyone can view page source and steal it).
 * This function keeps your Anthropic API key on the server side instead -
 * the webpage calls this function, and this function calls Anthropic.
 *
 * SETUP (see SETUP.md for the full walkthrough):
 *   1. Get an API key from https://console.anthropic.com (separate account
 *      from claude.ai, and separately billed).
 *   2. From your project folder:  firebase init functions
 *      (choose JavaScript, and when it creates functions/index.js, replace
 *      it with this file. Keep the generated package.json, or use the one
 *      provided alongside this file.)
 *   3. Store your key as a secret (never paste it directly into code):
 *        firebase functions:secrets:set ANTHROPIC_API_KEY
 *   4. Deploy:
 *        firebase deploy --only functions
 *   5. Copy the deployed function's URL from the deploy output and paste it
 *      into SPARK_FUNCTION_URL near the top of index.html's <script>.
 *
 * Model name: verify the current model identifier at
 * https://docs.anthropic.com/en/docs/about-claude/models before deploying -
 * model names change over time and this file may be out of date by the time
 * you read it.
 */

const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY');

exports.spark = onRequest(
  { secrets: [ANTHROPIC_API_KEY], cors: true },
  async (req, res) => {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method-not-allowed' });
      return;
    }

    const context =
      (req.body && typeof req.body.context === 'string' && req.body.context.slice(0, 200)) ||
      'just because, no particular occasion';

    const prompt =
      'Write one short, warm sentence (max 25 words) that could open a love ' +
      'letter to a partner. Occasion or feeling to reflect, if any: "' +
      context +
      '". Return only the sentence - no quotation marks, no preamble, no signature.';

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY.value(),
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          // Double-check this against https://docs.anthropic.com/en/docs/about-claude/models
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 200,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error('Anthropic API error:', response.status, errText);
        res.status(502).json({ error: 'upstream-error' });
        return;
      }

      const result = await response.json();
      const line = (result.content || [])
        .map((block) => block.text || '')
        .join('')
        .trim();

      res.json({ line });
    } catch (err) {
      console.error('Spark function error:', err);
      res.status(500).json({ error: 'spark-failed' });
    }
  }
);
