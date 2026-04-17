# CampusMitra Mobile

Expo app prototype for the CampusMitra marketplace.

## What this app is for

This mobile app talks to the same backend used by the web version. The goal for the first prototype is to make the main user flows work on mobile:

- sign in / register
- browse products
- open product details
- create listing
- profile and logout

## Setup

1. Install dependencies

```bash
npm install
```

2. Create an env file from the example

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Set the backend URL in `.env`

Examples:

- Android emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000`
- iOS simulator: `EXPO_PUBLIC_API_URL=http://127.0.0.1:5000`
- Physical device on same Wi-Fi: `EXPO_PUBLIC_API_URL=http://YOUR_LAPTOP_LAN_IP:5000`

Set `EXPO_PUBLIC_SOCKET_URL` to the same backend URL unless socket runs elsewhere.

4. Start the app

```bash
npm run start
```

## Local API setups

Use one API target at a time and restart Expo after every `.env` change.

### Expo web on localhost

Recommended for day-to-day local development:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:5000
EXPO_PUBLIC_SOCKET_URL=http://127.0.0.1:5000
```

Requirements:

- backend running on `http://127.0.0.1:5000`
- Expo web running on `http://localhost:8081`
- backend `CLIENT_URL` set to `http://localhost:8081`

### Android emulator

```env
EXPO_PUBLIC_API_URL=http://10.0.2.2:5000
EXPO_PUBLIC_SOCKET_URL=http://10.0.2.2:5000
```

### iOS simulator

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:5000
EXPO_PUBLIC_SOCKET_URL=http://127.0.0.1:5000
```

### Physical device on same Wi-Fi

```env
EXPO_PUBLIC_API_URL=http://YOUR_LAPTOP_LAN_IP:5000
EXPO_PUBLIC_SOCKET_URL=http://YOUR_LAPTOP_LAN_IP:5000
```

### Optional ngrok / tunnel

Only use a tunnel when testing off-network access or sharing a temporary backend:

```env
EXPO_PUBLIC_API_URL=https://YOUR-NGROK-URL.ngrok-free.dev
EXPO_PUBLIC_SOCKET_URL=https://YOUR-NGROK-URL.ngrok-free.dev
```

Important:

- restart Expo after switching between localhost and a tunnel
- prefer `npx expo start -c` after changing `.env`
- if the browser still shows old requests, hard refresh `http://localhost:8081`

## Verification checklist

Before opening the app, confirm:

1. Backend health works: `http://127.0.0.1:5000/health`
2. Categories endpoint works: `http://127.0.0.1:5000/api/categories`
3. Expo web is running at `http://localhost:8081`
4. Browser Network tab shows requests going to the expected host

## Notes

- The backend must be running first.
- If you test on a real phone, `localhost` will not work unless the backend is on the phone itself.
- This app uses Expo Router, React Query, Secure Store, and NativeWind.
