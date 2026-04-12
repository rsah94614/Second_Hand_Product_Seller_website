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

## Notes

- The backend must be running first.
- If you test on a real phone, `localhost` will not work unless the backend is on the phone itself.
- This app uses Expo Router, React Query, Secure Store, and NativeWind.
