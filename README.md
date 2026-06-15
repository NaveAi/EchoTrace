# EchoTrace v2.0 – Widget Only

A minimalist widget that displays a single photo from one person on another's home screen, with temporal decay as a core feature.

## Features

- **One connection, one widget, one photo** — no gallery, no history, no chat
- **Temporal decay** — photos fade over 24 hours and transform into a memory color
- **Pairing via codes** — 6-character device codes, exchanged outside the app
- **Widget-only interface** — all interactions happen through a single home screen widget
- **Privacy-first** — photos deleted from server after download, device-local storage only
- **Minimal design** — warm palette (sand, stone, pink), bubble animations

## Quick Start

### Prerequisites
- Node.js 18+
- Android SDK 26+
- Firebase account
- Vercel account

### Backend Setup
```bash
cd backend
npm install
npm run dev
```

### Android Setup
```bash
cd android
./gradlew clean assembleDebug
./gradlew installDebug
```

## Structure

- `/backend` - Vercel + Firebase API
- `/android` - Android app (Kotlin + Jetpack Compose)
- `/SPEC.md` - Full Hebrew product specification

See README in each directory for details.
