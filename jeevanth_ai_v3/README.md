# Jeevanth AI — Version 3.0 (AI-connected starter)

This version changes the chat from a fake demo reply to a real AI API request.
It also gives Jeevanth AI a creator identity: when asked who made the website,
it answers that it was created by Jeevanth (without claiming he created the AI model).

## Important safety and cost notes

- The API key must stay on the server in `.env`. Never paste it into `index.html`,
  browser JavaScript, screenshots, chats, or a public repository.
- API usage may cost money and is subject to the provider account's billing and limits.
- Because the site owner is under 18, ask a parent or guardian to handle any API
  account, billing, key creation, and public hosting.
- AI can make mistakes. Check important answers with trusted sources or a teacher.

## Run locally

You need Node.js 20.6 or newer.

1. Extract this ZIP into a folder.
2. Open a terminal in that folder.
3. Run `npm install`.
4. Copy `.env.example` to a new file named `.env`.
5. Ask a parent/guardian to configure `OPENAI_API_KEY` in `.env` using a key
   created and managed by the adult. Do not share the key with anyone.
6. Run `npm start`.
7. Open `http://localhost:3000` in your browser.

The site will show a setup error until the server has a valid API key.
The browser talks only to your own `/api/chat` server route; the key is not sent
to the browser.

## Change the model

Set `OPENAI_MODEL` in `.env` to a model available to the API project.
The default in this starter is `gpt-5.5`.

## Files

- `public/index.html` — website interface
- `server.mjs` — server-side AI endpoint
- `package.json` — Node.js dependencies and start command
- `.env.example` — environment variable template (no secret key included)
