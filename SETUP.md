# VideoMatch — Testing Setup Guide

Everything done in a browser or the GitHub Codespaces terminal.
No local computer required.

---

## Overview

| Tool | What it's used for | Cost |
|---|---|---|
| Firebase | Auth + database | Free (Spark plan) |
| Railway | Host the server | Free tier |
| GitHub Codespaces | Run build commands | Free (60 hrs/month) |
| EAS Build | Compile the Android APK | Free (30 builds/month) |

Estimated total time: **45–60 minutes**

---

## Phase 1 — Firebase (browser, ~15 min)

### 1.1 Create the project

1. Go to **[console.firebase.google.com](https://console.firebase.google.com)**
2. Click **Add project** → name it `VideoMatch` → disable Google Analytics → **Create project**
3. Wait for it to provision (~30 seconds)

### 1.2 Enable Authentication

1. Left sidebar → **Build → Authentication** → **Get started**
2. **Sign-in method** tab → enable **Email/Password** → Save
3. Still in Sign-in method → enable **Google** → set a support email → Save

### 1.3 Enable Firestore

1. Left sidebar → **Build → Firestore Database** → **Create database**
2. Select **Start in production mode** → choose any region (closest to you) → **Enable**
3. After it loads, go to the **Rules** tab and paste:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() { return request.auth != null; }
    function isAdmin() {
      return isAuthenticated() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.isAdmin == true;
    }
    match /config/{doc} {
      allow read: if isAuthenticated();
      allow write: if false;
    }
    match /users/{uid} {
      allow read: if isAuthenticated() && (request.auth.uid == uid || isAdmin());
      allow create: if isAuthenticated() && request.auth.uid == uid;
      allow update: if isAuthenticated() && request.auth.uid == uid &&
        !request.resource.data.diff(resource.data).affectedKeys()
          .hasAny(['isPremium','premiumExpiry','isBanned','reportCount','isAdmin','isSuperAdmin','stripeCustomerId','stripeSubscriptionId']);
      allow delete: if false;
    }
    match /reports/{reportId} {
      allow create: if isAuthenticated() && request.resource.data.reporterUid == request.auth.uid;
      allow read, update, delete: if isAdmin();
    }
    match /{document=**} { allow read, write: if false; }
  }
}
```

4. Click **Publish**

### 1.4 Register the Android app

1. Project overview (home icon) → click the **Android icon** (`</>`) under "Add an app"
2. Android package name: `com.videomatch.app`
3. App nickname: `VideoMatch Android`
4. Click **Register app**
5. Click **Download google-services.json** — save this file, you'll need it in Phase 3
6. Click through **Next → Next → Continue to console** (ignore the SDK setup steps)

### 1.5 Get the Firebase service account (for the server)

1. Top-left gear icon → **Project settings** → **Service accounts** tab
2. Click **Generate new private key** → **Generate key**
3. A JSON file downloads — open it, you'll copy values from it in Phase 2

---

## Phase 2 — Deploy the Server on Railway (browser, ~15 min)

### 2.1 Create a Railway account

1. Go to **[railway.app](https://railway.app)** → **Login with GitHub** → authorize Railway
2. Free tier gives you $5/month of usage — plenty for testing

### 2.2 Create the project

1. Dashboard → **New Project** → **Deploy from GitHub repo**
2. Find and select your `video-match` repo
3. Railway will ask what to deploy — click **Configure** and set the **Root Directory** to `server`
4. It will auto-detect Node.js

### 2.3 Set environment variables

In Railway → your project → **Variables** tab, add each of these:

```
NODE_ENV=production
PORT=3001

# From the service account JSON you downloaded:
FIREBASE_PROJECT_ID=          (value of "project_id" in the JSON)
FIREBASE_CLIENT_EMAIL=        (value of "client_email" in the JSON)
FIREBASE_PRIVATE_KEY=         (value of "private_key" in the JSON — include the full -----BEGIN/END----- block)

# Leave these blank for now (Stripe not needed for basic testing):
STRIPE_SECRET_KEY=sk_test_placeholder
STRIPE_WEBHOOK_SECRET=whsec_placeholder
STRIPE_MONTHLY_PRICE_ID=price_placeholder
STRIPE_YEARLY_PRICE_ID=price_placeholder

# Allow all origins for testing:
ALLOWED_ORIGINS=*
```

> **FIREBASE_PRIVATE_KEY tip**: In the JSON file the key has `\n` in it. In Railway paste it exactly as-is — Railway handles the escaping.

### 2.4 Set the start command

Railway → your project → **Settings** → **Deploy** section:
- **Start command**: `node dist/index.js`
- **Build command**: `npm install && npm run build`

### 2.5 Get your server URL

Once deployed (green "Active" status), click **Settings** → copy the public domain.
It will look like: `https://video-match-production-xxxx.up.railway.app`

**Save this URL — you need it in Phase 3.**

---

## Phase 3 — Configure the App + Trigger a Build (~20 min)

### 3.1 Open GitHub Codespaces

1. Go to your `video-match` repo on **github.com**
2. Click the green **Code** button → **Codespaces** tab → **Create codespace on claude/p2p-video-chat-app-mtSGf**
3. Wait ~60 seconds for it to load (browser-based VS Code with a terminal)

### 3.2 Update the server URL in the app

In the Codespaces file explorer, open:
```
mobile/src/constants/config.ts
```

Find these two lines and replace the values with your Railway URL:
```ts
API_URL: 'https://YOUR-RAILWAY-URL.up.railway.app',
SOCKET_URL: 'https://YOUR-RAILWAY-URL.up.railway.app',
```

Save the file (`Ctrl+S`).

### 3.3 Add google-services.json

In the Codespaces terminal:
```bash
# Navigate to the mobile folder
cd mobile
```

Now upload `google-services.json`:
- In Codespaces, right-click the `mobile/` folder in the file explorer
- Click **Upload...** → select the `google-services.json` you downloaded in Phase 1.4
- The file must be at `mobile/google-services.json`

### 3.4 Add google-services.json to .gitignore exception

The file needs to be committed so EAS Build can read it. Run:
```bash
# Make sure it won't be ignored
echo "!google-services.json" >> .gitignore
git add google-services.json
```

### 3.5 Install dependencies

```bash
# Still in the mobile/ folder
npm install
```

### 3.6 Create an Expo account and log in

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Create a free account at expo.dev, then log in:
eas login
# Enter your expo.dev email and password when prompted
```

### 3.7 Link the project to EAS

```bash
eas init --id $(eas project:create --non-interactive 2>/dev/null | grep -oP '(?<=id: ).*' || echo "")
# If that errors, just run:
eas init
# Select "Create a new EAS project" and name it "videomatch"
```

### 3.8 Trigger the APK build

```bash
eas build --platform android --profile preview --non-interactive
```

This uploads your code to Expo's build servers and compiles the APK in the cloud.
Build takes **8–12 minutes**. You'll get a URL to watch progress.

### 3.9 Commit your changes

```bash
git add -A
git commit -m "chore: add EAS config, server URL, google-services.json"
git push
```

---

## Phase 4 — Install the APK on your phone (~5 min)

1. When the build finishes, EAS shows a **Download** button — tap it on your Android phone
2. Or go to **[expo.dev](https://expo.dev)** → your account → Projects → VideoMatch → Builds → tap the build → **Download**
3. On your phone, open the downloaded `.apk` file
4. Android will warn about installing from unknown sources → **Settings → Allow from this source** → go back and install
5. Open VideoMatch

---

## Phase 5 — First Run

1. **Create an account** — the very first account registered becomes Super Admin automatically
2. **Complete your profile** — name, gender, date of birth, country
3. On a second device (or ask a friend), create another account
4. Both users tap **Start** on the Home screen — they should match and video call

---

## Troubleshooting

**"Cannot connect to server"**
- Check Railway deployment is Active (not crashed)
- Verify `API_URL` and `SOCKET_URL` in `config.ts` match your Railway domain exactly (include `https://`)
- In Railway logs, look for `VideoMatch server running on port 3001`

**"Profile not found" on connection**
- Complete profile setup fully (all fields required)

**Video not connecting**
- STUN-only works on the same WiFi network
- For separate networks (4G/WiFi) you need a TURN server — see Phase 6 below

**Build fails in EAS**
- Go to expo.dev → your build → **View logs** for the full error
- Most common: missing `google-services.json` or wrong package name

---

## Phase 6 — TURN Server (needed for calls across different networks)

For calls between two devices on different networks (e.g., your phone on WiFi vs a friend on 4G), you need a TURN server.

### Free option: Metered.ca

1. Go to **[dashboard.metered.ca/auth/signup](https://dashboard.metered.ca/auth/signup)** → create free account
2. **TURN Servers** → **Create TURN server** → copy credentials
3. In Railway → your project → **Variables**, add:
   ```
   TURN_URLS=turn:xxxx.relay.metered.ca:80
   TURN_USERNAME=your-username
   TURN_CREDENTIAL=your-credential
   ```
4. Railway will automatically redeploy

---

## Phase 7 — Google Sign-In (optional, but nice)

For Google Sign-In to work on Android, Firebase needs your app's SHA-1 fingerprint.

1. In **[expo.dev](https://expo.dev)** → your project → **Credentials** → **Android** → you'll see the keystore fingerprints
2. Copy the **SHA-1**
3. In Firebase console → **Project settings** → your Android app → **Add fingerprint** → paste it → **Save**
4. Re-download `google-services.json` (it now includes the fingerprint)
5. Replace `mobile/google-services.json` with the new file, commit, and trigger a new EAS build

---

## Subsequent Builds

After the first setup, triggering a new build is just:

```bash
# In Codespaces terminal, inside the mobile/ folder:
eas build --platform android --profile preview --non-interactive
```

Or add to your workflow — EAS also supports automatic builds on git push via GitHub Actions.
