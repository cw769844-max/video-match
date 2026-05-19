# VideoMatch — P2P Random Video Chat App

A production-ready random video chat platform for iOS and Android, competing with Omegle, Monkey, and CamSurf. Built with React Native, Node.js, WebRTC, Firebase, and Stripe.

---

## Architecture

```
video-match/
├── server/        # Node.js + Socket.io (signaling server + REST API)
├── mobile/        # React Native (iOS + Android)
└── firebase/      # Firestore security rules + indexes
```

### Tech Stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.74 (bare workflow) |
| Video | react-native-webrtc (WebRTC) |
| Signaling | Socket.io |
| Auth | Firebase Auth (Google, Apple, Email) |
| Database | Cloud Firestore |
| Storage | Firebase Storage (profile photos) |
| Payments | Stripe (subscriptions) |
| Server | Node.js + Express + TypeScript |

---

## Features

### Free
- Random P2P video matching worldwide
- Camera / mic toggle controls
- Skip / next person
- Report users (nudity, harassment, underage, etc.)
- Google and Apple Sign-In
- Email/password registration

### Premium ($9.99/mo · $59.99/yr)
- **Gender filter** — match with men, women, or non-binary
- **Age range filter** — e.g. 18–25 only
- **Location filter** — match people from specific countries
- Priority queue position
- Premium badge on profile

---

## Prerequisites

- Node.js 20+
- React Native CLI + Xcode (iOS) or Android Studio (Android)
- Firebase project (Blaze plan for Cloud Functions / Storage)
- Stripe account
- TURN server (see below)

---

## Setup

### 1. Firebase

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** → sign-in methods: Email/Password, Google, Apple
3. Enable **Cloud Firestore** (production mode)
4. Enable **Firebase Storage**
5. Download `google-services.json` → `mobile/android/app/`
6. Download `GoogleService-Info.plist` → `mobile/ios/VideoMatch/`
7. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

### 2. Server

```bash
cd server
cp .env.example .env
# Fill in your Firebase service account, Stripe keys, TURN credentials
npm install
npm run dev      # Development
npm run build && npm start   # Production
```

**Required env vars:**
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — from Firebase console → Project Settings → Service Accounts → Generate new private key
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — from Stripe dashboard
- `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID` — create recurring products in Stripe
- `TURN_URLS`, `TURN_USERNAME`, `TURN_CREDENTIAL` — see TURN server section

### 3. Mobile App

```bash
cd mobile
cp .env.example .env
# Fill in API_URL, Stripe publishable key, Google client ID
npm install

# iOS
cd ios && pod install && cd ..
npx react-native run-ios

# Android
npx react-native run-android
```

**Required env vars:**
- `API_URL` / `SOCKET_URL` — URL of your deployed server
- `STRIPE_PUBLISHABLE_KEY` — from Stripe dashboard (safe to expose)
- `STRIPE_MONTHLY_PRICE_ID` / `STRIPE_YEARLY_PRICE_ID` — same as server
- `GOOGLE_WEB_CLIENT_ID` — from Firebase console → Authentication → Sign-in method → Google → Web client ID

### 4. Google Sign-In (Android)

Add your SHA-1 fingerprint to Firebase:
```bash
# Debug keystore
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
```
Firebase console → Project Settings → Your apps → Android app → Add fingerprint

### 5. Apple Sign-In (iOS only)

1. Enable "Sign In with Apple" capability in Xcode
2. Enable in Apple Developer portal → Certificates, Identifiers & Profiles
3. Add the service ID to Firebase Authentication

---

## TURN Server

WebRTC needs a TURN server for users behind strict NATs (especially mobile networks).

### Free option: Metered.ca
1. Sign up at [metered.ca](https://www.metered.ca)
2. Create a TURN server (free tier: 1GB/month)
3. Copy the credentials to your server `.env`

### Self-hosted: coturn
```bash
# Ubuntu/Debian
apt-get install coturn
# Configure /etc/turnserver.conf
# Set TURN_URLS=turn:your-server.com:3478
```

---

## Stripe Setup

### Create Products

In Stripe Dashboard → Products:

1. **VideoMatch Premium Monthly**
   - Price: $9.99/month, recurring
   - Copy Price ID → `STRIPE_MONTHLY_PRICE_ID`

2. **VideoMatch Premium Yearly**
   - Price: $59.99/year, recurring
   - Copy Price ID → `STRIPE_YEARLY_PRICE_ID`

### Webhook

1. Stripe Dashboard → Webhooks → Add endpoint
2. URL: `https://your-server.com/api/subscriptions/webhook`
3. Events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy signing secret → `STRIPE_WEBHOOK_SECRET`

---

## Matchmaking Algorithm

The server maintains a real-time queue:

1. **Free users** → random matching from the general pool
2. **Premium users with filters** → matched against compatible users first
3. **Filter compatibility** — both users must pass each other's filters (mutual)
4. **Timeout relaxation** — after 30 seconds, premium filters are relaxed to prevent indefinite waiting
5. **Auto-skip** — when a user disconnects, their peer is notified immediately

---

## Content Moderation

- Users can report others with one tap (nudity, harassment, underage, spam)
- Reports are stored in Firestore with reporter/reported UIDs + room ID
- Users with **10+ reports** are automatically flagged for review
- Admins can manually ban accounts via Firestore
- All ban/unban actions are enforced via Firestore security rules (server-side only)

**Recommended additions for production:**
- [Hive Moderation](https://hivemoderation.com) — real-time video content moderation AI
- [Agora Content Moderation](https://www.agora.io) — automated moderation for live video

---

## Deployment

### Server (recommended: Railway / Render / Fly.io)

```bash
# Build
cd server && npm run build

# Environment variables must be set in your hosting platform
# Start command: node dist/index.js
```

### Mobile

- **Android**: Build signed APK/AAB → Google Play Console
- **iOS**: Archive in Xcode → App Store Connect

---

## Security Considerations

- JWT tokens verified on every Socket.io connection and REST request
- Firestore rules prevent users from modifying `isPremium`, `isBanned`, `reportCount`
- Stripe webhook signature verified with `stripe.webhooks.constructEvent`
- Age gate enforced server-side (calculated from `dateOfBirth`)
- Premium filters only applied when server confirms `isPremium: true` (not client-controlled)
- Report system rate-limited by Firestore rules (reporter UID must match auth UID)

---

## License

MIT
