# CampusMitra Web Application

The primary desktop frontend for CampusMitra, built with modern web technologies and optimized for blazing-fast marketplace operations.

## Tech Stack
- **React 19** (UI Library)
- **Vite** (Bundler & Dev Server)
- **@tanstack/react-query** (Caching, Synchronization, and State logic)
- **TailwindCSS** (Rapid Utility Styling)
- **Socket.IO-client** (Real-time Messaging)
- **Lucide React** (Vector Iconography)

## Features
- **Responsive Marketplace**: Highly interactive product cards dynamically requesting chunked data.
- **Deep Administration Dashboard**: Granular tables to manage users, moderation queues, edit rule-engine configurations, and accept/reject seller verifications.
- **Live Websocket Chat**: Persistent, auto-reconnecting socket integration enabling fluid negotiation with fellow students.
- **Cart & Order System**: Full lifecycle monitoring, offering tools to dispute abnormal interactions, leave verified reviews, or mark deliveries complete with uploaded picture proofs.

## Getting Started

1. Navigate to the client directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Populate `.env` with backend URLs. Example: `VITE_API_URL=http://localhost:5000`
4. Spin up the dev server:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   ```

## Session Behavior

- The web client now uses both an access token and a refresh token, matching the mobile app's session model more closely.
- Auth requests send `X-Client: web` so the backend can return refresh tokens for web session restoration.
- Tokens are restored on app boot, and authenticated requests refresh automatically after a `401` when possible.
