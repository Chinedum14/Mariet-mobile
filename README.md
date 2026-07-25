# Mariet — Mobile (Expo / React Native)

The mobile companion to the desktop **Mariet** app. Same login, same
markets, same live Yahoo prices and momentum alerts — with notes synced through
**Firebase Firestore**, so the desktop and mobile apps share one dataset.

## More than market research — it's a game

Mariet isn't just a notebook for tracking prices. It's a strategy game of
**anticipating how markets react to supply crises** — an OPEC cut, a drought, a
blocked shipping lane, a chip shortage. You form a thesis about where a shock
will push prices, write it in the market's notes, and let live data and momentum
alerts tell you whether you called it. On mobile you carry that game in your
pocket: your theses sync from the desktop, and a **push notification** buzzes the
moment a market you're watching starts breaking out. (See the desktop README for
the full "how to play.")

## Prerequisites

1. **A Firebase project** (shared with the desktop app). See the main plan:
   - Firestore Database enabled
   - Authentication → Email/Password enabled, with one shared account
2. **Fill in `firebase-config.js`** — paste your web `firebaseConfig` and the
   shared account's email/password.
3. **A phone with the Expo Go app** (iOS App Store / Google Play), or an Android
   emulator. iOS builds require a Mac; Android + Expo Go work from Windows.

## Run it

```bash
npx expo start
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS). The app
live-reloads as you edit.

## How it works

- **Login** (`Varol` / `ResearchAndPlay`) → signs into the shared Firebase
  account behind the scenes.
- **Markets list** — grouped by category, live day-change per row, green dot on
  the fast risers (up ≥ 3% in a day or ≥ 6% over 3 trading days). Pull down (or
  ↻) to refresh quotes.
- **Editor** — notes autosave to Firestore; header shows price + 1D/1W/1M change
  and the momentum indicator.
- **Add/Edit** — name, symbol, Yahoo symbol, category. Price and changes come
  from Yahoo, not entered by hand.

## Structure

```
App.js                 Navigation (Login → Markets → Editor → Add/Edit)
firebase-config.js     ← you fill this in
src/
  firebase.js          Firebase init
  markets.js           Firestore data layer (shared "markets" collection)
  quotes.js            Yahoo Finance live quotes (day/week/month)
  MarketsContext.js    App state: subscribe + refresh
  auth.js              Login gate credentials
  format.js            Change colours/arrows, target check
  theme.js             Dark palette (mirrors desktop)
  screens/             Login, Markets, Editor, EditMarket
```
