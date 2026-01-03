# Modular Telegram Bot

A modular Telegram bot boilerplate built with Node.js and Telegraf.

Structure follows the provided spec: each feature is a separate module that exports `init(bot, services)`.

Run:
- Copy `.env.example` to `.env` and fill values
- npm install
- npm start

Deploy:
- On Render, create a Web Service that runs `npm start` and ensure the `PORT` env var is set (Render does this automatically). The bot uses long polling and an Express health endpoint.

Notes:
- Persistence is JSON-backed using `lowdb`. Replace with a real DB by implementing an adapter.
- `index.js` should remain a loader only — move business logic into modules and services.
