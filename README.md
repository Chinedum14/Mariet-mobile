# PlayMarkets — Mobile (Expo / React Native)

The mobile companion to the desktop **PlayMarkets** app. Same login, same
markets, same live Yahoo prices and target alerts — with notes synced through
**Firebase Firestore**, so the desktop and mobile apps share one dataset.

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
- **Markets list** — grouped by category, live day-change per row, green dot
  when price is above target. Pull down (or ↻) to refresh quotes.
- **Editor** — notes autosave to Firestore; header shows price + 1D/1W/1M change
  and the target indicator.
- **Add/Edit** — name, symbol, Yahoo symbol, category, target. Price and changes
  come from Yahoo, not entered by hand.

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
