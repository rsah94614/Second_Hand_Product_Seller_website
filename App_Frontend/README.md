# CampusMitra Mobile App

React Native Expo app prototype for the CampusMitra marketplace.

## Features

This mobile app communicates with the same backend used by the web client, ensuring true cross-platform parity. 
- Fast email-only authentication flow.
- Intuitive grid layout for product browsing and detailed inspection.
- Native `FormData` image uploads enabling mobile cameras for product listings, avatar changes, and order completion proofs.
- Persistent socket connections for live native chat threading between buyers and sellers.
- Dark-mode enabled component suite built with NativeWind.

## Setup

1. Install dependencies
```bash
npm install
```

2. Create an env file from the example
```bash
cp .env.example .env
```
(On Windows PowerShell: `Copy-Item .env.example .env`)

3. Set the backend URL in `.env`
- Android emulator: `EXPO_PUBLIC_API_URL=http://10.0.2.2:5000`
- iOS simulator: `EXPO_PUBLIC_API_URL=http://127.0.0.1:5000`
- Physical device on same Wi-Fi: `EXPO_PUBLIC_API_URL=http://YOUR_LAPTOP_LAN_IP:5000`

Set `EXPO_PUBLIC_SOCKET_URL` to the exact same URL metric.

4. Start the Expo tunnel
```bash
npx expo start -c
```

## Local API setups

Use one API target at a time and restart Expo after every `.env` change.

### Expo web on localhost
Recommended for rapid logic testing:
```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:5000
EXPO_PUBLIC_SOCKET_URL=http://127.0.0.1:5000
```

### Physical device on same Wi-Fi
```env
EXPO_PUBLIC_API_URL=http://192.168.1.XX:5000
EXPO_PUBLIC_SOCKET_URL=http://192.168.1.XX:5000
```

## Verification checklist

Before launching the app on your device, confirm:
1. Backend node server is healthy: `http://localhost:5000/health`
2. Expo bundler is operating and displays the Metro QR Code.
3. The mobile phone and host desktop are on the exact same Subnet/WiFi channel.
