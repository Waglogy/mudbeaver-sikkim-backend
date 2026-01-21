# Mud Beaver Backend API

Backend API for Mud Beaver Sikkim website built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Contact form submissions
- Internship application form with payment screenshot upload
- Requirements/Appointment form with PDF drawings upload
- Blog posts with up to 4 optional images
- Cloudinary integration for image and file storage
- Admin dashboard API endpoints

## Tech Stack

- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Cloudinary** - Cloud-based image and file storage
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File upload handling

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/mudbeaver

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Admin User (used for initial admin creation)
ADMIN_EMAIL=admin@mudbeaversikkim.in
ADMIN_PASSWORD=Admin@123456
```

3. Make sure MongoDB is running on your system

4. Create admin user:
```bash
npm run create-admin
```

5. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `GET /api/auth/me` - Get current user (protected)

### Contact
- `POST /api/contact` - Submit contact form
- `GET /api/contact` - Get all contacts (admin only)
- `GET /api/contact/:id` - Get single contact (admin only)
- `PATCH /api/contact/:id/status` - Update contact status (admin only)

### Internship
- `POST /api/internship` - Submit internship application (with payment screenshot)
- `GET /api/internship` - Get all applications (admin only)
- `GET /api/internship/:id` - Get single application (admin only)
- `PATCH /api/internship/:id/status` - Update application status (admin only)

### Requirements
- `POST /api/requirements` - Submit requirement/appointment form (with optional PDF)
- `GET /api/requirements` - Get all requirements (admin only)
- `GET /api/requirements/:id` - Get single requirement (admin only)
- `PATCH /api/requirements/:id/status` - Update requirement status (admin only)

### Blogs
- `GET /api/blogs` - Get all published blog posts (public)
- `GET /api/blogs/all` - Get all blog posts including unpublished (admin only)
- `GET /api/blogs/:id` - Get single blog post by ID or slug (public if published)
- `POST /api/blogs` - Create blog post (admin only, max 4 images)
- `PUT /api/blogs/:id` - Update blog post (admin only)
- `DELETE /api/blogs/:id` - Delete blog post (admin only)

## Blog Post Image Upload

When creating or updating a blog post, you can upload up to 4 images. Images are optional and will be stored on Cloudinary.

### Example Request (Create Blog Post)
```
POST /api/blogs
Headers: Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- title: "My Blog Post"
- content: "Blog content here..."
- published: true
- images: [file1, file2, file3, file4] (optional, max 4)
```

## Authentication

Most admin endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Environment Variables

- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `CLOUDINARY_CLOUD_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `ADMIN_EMAIL` - Admin email for initial setup
- `ADMIN_PASSWORD` - Admin password for initial setup

## Project Structure

```
mudbeaver-backend/
├── config/
│   ├── cloudinary.js      # Cloudinary configuration
│   └── database.js        # MongoDB connection
├── middleware/
│   ├── auth.js            # Authentication middleware
│   └── upload.js          # File upload middleware
├── models/
│   ├── User.js            # User model
│   ├── Contact.js         # Contact form model
│   ├── Internship.js      # Internship application model
│   ├── Requirement.js     # Requirements/appointment model
│   └── Blog.js            # Blog post model
├── routes/
│   ├── auth.js            # Authentication routes
│   ├── contact.js         # Contact routes
│   ├── internship.js      # Internship routes
│   ├── requirements.js    # Requirements routes
│   └── blogs.js           # Blog routes
├── scripts/
│   └── createAdmin.js     # Admin user creation script
├── server.js              # Main server file
└── package.json
```

## License

MIT