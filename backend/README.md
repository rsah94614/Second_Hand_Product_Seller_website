# OLX Clone Backend

Backend API for the OLX Clone application built with Node.js, Express.js, and MongoDB.

## Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **Product Management**: CRUD operations for product listings
- **Image Upload**: Support for multiple image uploads per product
- **Search & Filtering**: Advanced product search with multiple filters
- **Pagination**: Efficient data pagination for large datasets
- **Data Validation**: Input validation and sanitization
- **CORS Support**: Cross-origin resource sharing enabled
- **Role-Based Access**: User and admin roles
- **Admin Management**: User management, product moderation, and category management
- **Real-Time Chat**: Socket.IO chat with authenticated socket connections

## API Endpoints

### Authentication Routes (`/api/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | User login | No |
| GET | `/me` | Get current user | Yes |

### Product Routes (`/api/products`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get all products (with filters) | No |
| GET | `/:id` | Get single product | No |
| POST | `/` | Create new product | Yes |
| PUT | `/:id` | Update product | Yes (Owner) |
| DELETE | `/:id` | Delete product | Yes (Owner) |
| GET | `/user/:userId` | Get user's products | No |

### User Routes (`/api/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/:id` | Get user profile | No |
| PUT | `/:id` | Update user profile | Yes (Owner) |

### Admin Routes (`/api/admin`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/overview` | Get admin dashboard metrics | Yes (Admin) |
| GET | `/users` | Get all users with filters | Yes (Admin) |
| PATCH | `/users/:id` | Update role, verification, or active status | Yes (Admin) |
| GET | `/products` | Get all products with moderation filters | Yes (Admin) |
| PATCH | `/products/:id` | Update product active/sold status | Yes (Admin) |
| DELETE | `/products/:id` | Delete product | Yes (Admin) |
| GET | `/categories` | Get all categories for admin analytics | Yes (Admin) |

### Category Routes (`/api/categories`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/` | Get active categories for product forms and filters | No |
| GET | `/admin/all` | Get all categories with product counts | Yes (Admin) |
| POST | `/` | Create category | Yes (Admin) |
| PUT | `/:id` | Update category | Yes (Admin) |
| DELETE | `/:id` | Delete category | Yes (Admin) |

## Query Parameters

### Product List (`GET /api/products`)

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 12)
- `category` - Filter by category
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `location` - Location filter
- `search` - Search in title and description
- `sortBy` - Sort field (createdAt, price, title)
- `sortOrder` - Sort order (asc, desc)

## Data Models

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, min 6 chars),
  phone: String (optional),
  location: String (optional),
  avatar: String (optional),
  role: String ('user' | 'admin'),
  isActive: Boolean (default: true),
  isVerified: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### Product Model
```javascript
{
  title: String (required),
  description: String (required),
  price: Number (required, min: 0),
  category: String (required, enum),
  condition: String (required, enum),
  location: String (required),
  images: [String] (required),
  seller: ObjectId (ref: User, listing owner),
  isSold: Boolean (default: false),
  isActive: Boolean (default: true),
  views: Number (default: 0),
  contactInfo: {
    phone: String,
    email: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

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
SERVE_CLIENT=false
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-app-password
COOKIE_SAME_SITE=strict
COOKIE_SECURE=false
ADMIN_EMAIL=admin@example.com
```

You can also copy from [`.env.example`](/d:/sem%20project%20GU/backend/.env.example).

For production:

- Set `EMAIL_USER` and `EMAIL_PASS` so password reset emails can actually be sent.
- If your frontend and backend are hosted on different sites, set `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true`.
- If you are deploying backend separately, keep `SERVE_CLIENT=false`.
- Only set `SERVE_CLIENT=true` when this backend should serve the built frontend from `client/dist`.

## Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (see above)

3. Start the development server:
```bash
npm run dev
```

4. Start the production server:
```bash
npm start
```

## Admin Setup

There are two supported ways to create or promote an admin account.

### Option 1: Promote by email from `.env`

1. Register a normal user account in the app.
2. Set `ADMIN_EMAIL` in `backend/.env` to that same email.
3. Restart the backend.
4. Log in again with that user.

When the backend authenticates that user, the role is upgraded to `admin`.

### Option 2: Use the admin seed command

This is the cleaner bootstrap flow for demos and project submission.

1. Register a normal user account first.
2. Run the command from the `backend` folder:

```bash
npm run seed:admin -- user@example.com
```

This script:
- finds the user by email
- sets `role = admin`
- sets `isActive = true`
- sets `isVerified = true`

After running it, log in again with that account and open:

- `/admin-dashboard`
- `/admin/users`
- `/admin/products`
- `/admin/categories`

## Recommended Demo Accounts

For college submission, keep two accounts ready:

- `user` account for browsing, listing products, cart, chat, and order flow
- `admin` account for moderation and admin tools

This makes your demo much smoother during viva or evaluation.

## Dependencies

- **express**: Web framework
- **mongoose**: MongoDB ODM
- **bcryptjs**: Password hashing
- **jsonwebtoken**: JWT authentication
- **cors**: Cross-origin resource sharing
- **dotenv**: Environment variable management
- **multer**: File upload handling
- **cloudinary**: Image storage and optimization

## Development Dependencies

- **nodemon**: Development server with auto-restart

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side errors

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Input validation and sanitization
- CORS protection
- Role-based route protection
- Authenticated socket connections for chat
- Upload validation for image type and size
- Rate limiting (can be added)
- Helmet.js for security headers (can be added)

## Database Indexes

The application includes the following database indexes for optimal performance:

- User email (unique)
- Product title and description (text search)
- Product category
- Product location
- Product listing owner
- Product creation date

## Future Enhancements

- Email verification
- Password reset functionality
- Product favorites/wishlist
- Advanced search with geolocation
- Product recommendations
- Order monitoring tools for admin
- Reports and moderation workflow
- Analytics and reporting
