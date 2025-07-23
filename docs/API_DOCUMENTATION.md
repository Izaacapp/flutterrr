# 📚 API Documentation

## Base URLs

- **Development**: `http://localhost:3000`
- **Production**: `https://www.xbullet.me`
- **GraphQL**: `/graphql`

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <token>
```

## REST Endpoints

### Authentication

#### POST `/api/v1/auth/register`
Register new user account.

**Request:**
```json
{
  "username": "string",
  "email": "string", 
  "password": "string",
  "fullName": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "string", "username": "string", "email": "string" },
    "token": "string"
  }
}
```

#### POST `/api/v1/auth/login`
Login existing user.

**Request:**
```json
{
  "email": "string",
  "password": "string"
}
```

#### POST `/api/v1/auth/verify`
Verify account with OTP.

**Request:**
```json
{
  "otp": "string"
}
```

### Flights

#### GET `/api/v1/flights`
Get user's flights with pagination.

**Query Parameters:**
- `limit`: Number of flights (default: 10)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status (upcoming, completed, cancelled)
- `airline`: Filter by airline

#### POST `/api/v1/flights`
Create new flight.

#### PUT `/api/v1/flights/:id`
Update existing flight.

#### DELETE `/api/v1/flights/:id`
Delete flight.

### Posts

#### GET `/api/v1/posts/feed`
Get user's social feed.

#### POST `/api/v1/posts`
Create new post.

#### PUT `/api/v1/posts/:id/like`
Toggle like on post.

#### POST `/api/v1/posts/:id/comments`
Add comment to post.

### Users

#### GET `/api/v1/users/profile`
Get current user profile.

#### PUT `/api/v1/users/profile`
Update user profile.

#### GET `/api/v1/users/:id`
Get public user profile.

## GraphQL Schema

### Queries

```graphql
type Query {
  me: User
  flights(limit: Int, offset: Int): FlightConnection
  posts(limit: Int, offset: Int): PostConnection
  user(id: ID!): User
}
```

### Mutations

```graphql
type Mutation {
  createFlight(input: FlightInput!): Flight
  updateFlight(id: ID!, input: FlightInput!): Flight
  deleteFlight(id: ID!): Boolean
  
  createPost(input: PostInput!): Post
  likePost(id: ID!): Post
  addComment(postId: ID!, content: String!): Comment
  
  updateProfile(input: ProfileInput!): User
}
```

### Subscriptions

```graphql
type Subscription {
  postAdded: Post
  commentAdded(postId: ID!): Comment
  flightUpdated(userId: ID!): Flight
}
```

## Error Handling

API returns consistent error format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

## Rate Limiting

- **Authentication**: 5 requests per minute
- **API Calls**: 100 requests per minute
- **File Uploads**: 10 requests per minute

## File Uploads

Supports multipart/form-data for:
- Profile pictures (max 5MB)
- Post images (max 10MB)
- Flight documents (max 20MB)

Accepted formats: JPEG, PNG, PDF