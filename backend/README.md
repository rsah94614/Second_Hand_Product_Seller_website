# CampusMitra Backend API

The high-performance, secure backend architecture for the CampusMitra platform built with Node.js, Express.js, and MongoDB.

## Core Features

- **Trust & Safety Pipeline**: Granular moderation queuing, report tracking, and bulk-action management APIs.
- **Automated Rule Engine**: Intelligent data scanning pipelines intercepting malicious user edits before they process into the database.
- **Zero-Cost Email Authentication**: JWT-based session logic bundled with Nodemailer OTP email verifications spanning passwords, updates, and identity assertions.
- **Real-Time Communications**: Dual-transport Socket.IO integration syncing messaging pipelines cross-platform securely.
- **Dynamic Content Pipelines**: Cloudinary `multer` pipelines sanitizing and compressing image uploads (Avatars, Covers, Confirmations).
- **Identity Abstraction**: Complete removal of Phone-Number obligations to preserve privacy.

## File & Security Architectures

- Express Validator middleware guaranteeing schema integrity.
- Role-based Access Control (RBAC) separating base students, verified sellers, and platform administrators.
- Cookie-driven HttpOnly session refreshing strategies.

## Data Models Overview

- **User**: Name, Email, Profile metrics, Reputation Array, Avatar, Role.
- **Product**: Categories, Stock states, Location, FormData images, Wishlist integration.
- **ModerationQueue & Reports**: Resolution logs, assignment statuses, logic histories.
- **Rules**: Regex, Keyword, and behavior algorithms executed independently.

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/campus-mitra
JWT_SECRET=replace-with-a-strong-secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5173
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-app-password
COOKIE_SAME_SITE=strict
COOKIE_SECURE=false
ADMIN_EMAIL=admin@example.com
```

## Installation & Deployment

1. Install dependencies:
```bash
npm install
```

2. Spin up the development server (automatically restarting via nodemon):
```bash
npm run dev
```

3. To boot in Production mode:
```bash
npm start
```

## Admin Setup Route

The easiest way to bootstrap the platform is creating an initial user on the web client interface, and upgrading it directly:

```bash
npm run seed:admin -- your.registered@email.com
```

This upgrades the target user object to `role: 'admin'`, granting root access to the entire moderation and resolution suite exposed on the frontend routes.
