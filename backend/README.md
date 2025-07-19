# Passport Buddy Backend API

A Node.js/Express backend with MongoDB, providing both REST and GraphQL APIs for the Passport Buddy travel social platform.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **APIs**: REST API + GraphQL (Apollo Server)
- **Authentication**: JWT tokens with bcrypt
- **File Storage**: Local filesystem with cloud storage support
- **Email Service**: Mailtrap (development) / Production email service
- **Testing**: Jest with Supertest

## Project Structure

```
backend/
├── src/
│   ├── app.ts                 # Express app configuration
│   ├── server.ts              # Server entry point
│   ├── config/                # Configuration
│   │   ├── db.ts              # MongoDB connection
│   │   ├── env.ts             # Environment variables
│   │   └── cloudinary.ts      # Cloud storage config
│   ├── controllers/           # Request handlers
│   ├── middleware/            # Express middleware
│   ├── models/                # Mongoose models
│   ├── routes/                # API endpoints
│   │   ├── auth.ts            # Authentication routes
│   │   ├── health.ts          # Health checks
│   │   ├── v1/                # REST API v1
│   │   └── graphql/           # GraphQL API
│   ├── services/              # Business logic
│   └── utils/                 # Utility functions
├── test/                      # Test files
├── uploads/                   # File uploads directory
└── package.json               # Dependencies
```

## API Endpoints

### REST API

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token
- `POST /api/auth/logout` - Logout user

#### Posts
- `POST /api/posts` - Create new post with images
- `GET /api/posts` - Get all posts (paginated)
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

#### Health & Testing
- `GET /health` - Health check
- `POST /api/test-email` - Test email delivery

### GraphQL API

Endpoint: `/graphql`

#### Queries
```graphql
type Query {
  posts: [Post]
  post(id: ID!): Post
  user(id: ID!): User
  me: User
}
```

#### Mutations
```graphql
type Mutation {
  createPost(content: String!, images: [String]): Post
  updatePost(id: ID!, content: String): Post
  deletePost(id: ID!): Boolean
  login(email: String!, password: String!): AuthPayload
  register(input: RegisterInput!): AuthPayload
}
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/passport-buddy

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# Email (Mailtrap)
MAILTRAP_TOKEN=your-mailtrap-token
MAILTRAP_ENDPOINT=https://send.api.mailtrap.io/api/send

# File Storage (Optional)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# DigitalOcean Spaces (Optional)
DO_SPACES_KEY=
DO_SPACES_SECRET=
DO_SPACES_ENDPOINT=
DO_SPACES_BUCKET=
```

## Development

### Prerequisites
- Node.js 18+
- MongoDB 5+
- Docker (optional)

### Local Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Start MongoDB:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongo mongo:5

# Or use local MongoDB installation
```

3. Run development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Docker Development

Using the project's docker-compose:
```bash
# From project root
make dev

# Or
docker-compose up -d
```

## Testing

### Run Tests
```bash
# All tests
npm test

# Unit tests only
npm test -- --testPathPattern=unit

# Integration tests only
npm test -- --testPathPattern=integration

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Test Structure
- `test/unit/` - Unit tests for individual functions
- `test/integration/` - API endpoint tests
- `test/setup.ts` - Test configuration

## API Documentation

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### File Upload

The `/api/posts` endpoint accepts multipart/form-data with:
- `content` - Post text content
- `images` - Up to 5 image files

Example using curl:
```bash
curl -X POST http://localhost:3000/api/posts \
  -H "Authorization: Bearer <token>" \
  -F "content=My travel post" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg"
```

### Error Responses

All errors follow this format:
```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "errors": []
  }
}
```

## Database Schema

### User Model
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  fullName: String,
  avatar: String,
  bio: String,
  location: String,
  homeAirport: String,
  passportCountry: String,
  milesFlown: Number,
  countriesVisited: [String],
  isVerified: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Post Model
```javascript
{
  author: ObjectId (ref: User),
  content: String,
  images: [{
    filename: String,
    originalName: String,
    size: Number,
    mimetype: String,
    url: String
  }],
  likes: [ObjectId],
  comments: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

## Production Deployment

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Docker Production
```bash
docker build -f Dockerfile.prod -t passport-backend .
docker run -p 3000:3000 passport-backend
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run seed` - Seed database with sample data

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running on port 27017
- Check `MONGO_URI` in environment variables
- For Docker: ensure containers are on same network

### Email Not Sending
- Verify Mailtrap token is correct
- Check email service logs: `docker-compose logs backend`
- Test with: `make test-email`

### File Upload Issues
- Check `uploads/` directory has write permissions
- Ensure multer middleware is properly configured
- Verify file size limits (default: 5MB per file)

## Contributing

1. Create feature branch
2. Write tests for new features
3. Ensure all tests pass
4. Submit pull request

## License

Private - Passport Buddy