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
  seller: ObjectId (ref: User),
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
MONGODB_URI=mongodb://localhost:27017/olx-clone
JWT_SECRET=your_jwt_secret_key_here
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

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
- Rate limiting (can be added)
- Helmet.js for security headers (can be added)

## Database Indexes

The application includes the following database indexes for optimal performance:

- User email (unique)
- Product title and description (text search)
- Product category
- Product location
- Product seller
- Product creation date

## Future Enhancements

- Email verification
- Password reset functionality
- Product favorites/wishlist
- Messaging system between users
- Advanced search with geolocation
- Product recommendations
- Admin dashboard
- Analytics and reporting
