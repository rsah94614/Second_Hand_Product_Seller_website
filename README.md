# CampusMitra - Student Trust & Safety Marketplace

CampusMitra is a full-stack, cross-platform e-commerce marketplace specifically designed for university students. It emphasizes trust, safety, and community trading by leveraging zero-cost email verifications, a robust reputation engine, real-time authenticated chat, and AI-driven automated moderation rules.

## Monorepo Architecture

This repository is organized into three primary layers:

1. **`backend/`** (Node.js, Express, MongoDB, Socket.IO)
   Provides the secure API layer, real-time messaging, the automated rule engine, and Trust & Safety logic.
2. **`client/`** (React, Vite, TailwindCSS)
   A rich, responsive web SPA deployed for desktop users, featuring an advanced administration dashboard.
3. **`App_Frontend/`** (React Native, Expo)
   A native mobile application ensuring students can effortlessly list items via their phone cameras and coordinate meetups via deep-linked chats.

## Key Differentiators

- **Zero Phone Numbers**: A 100% email-based OTP verification system, maximizing student privacy and minimizing operational SMS costs.
- **Trust & Safety Core**: Multi-layered moderation queues, automated listing suspension based on behavior rules, and an advanced administrative resolution dashboard.
- **Secure Order Management**: Structured order histories with formal dispute management, no-show reporting, and required photo delivery confirmations.
- **Real-Time Synchronicity**: Reliable chat interfaces running on `socket.io` handling auto-reconnections seamlessly across both Web and Mobile wrappers.

## Quick Start
See the individual `README.md` files within the `backend/`, `client/`, and `App_Frontend/` directories for dependency instructions and `.env` configuration.
