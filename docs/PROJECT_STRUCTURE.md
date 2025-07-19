# Project Structure

## Root Directory Organization

```
.
├── backend/                # Backend API (Node.js/Express/GraphQL)
├── frontend/               # Frontend (React/Vite)
├── mobile/                 # Mobile app (Flutter)
├── shared/                 # Shared types and utilities
├── config/                 # All configuration files
│   ├── docker/            # Docker configurations
│   │   ├── docker-compose.dev.yml
│   │   ├── docker-compose.prod.yml
│   │   └── docker-compose.override.yml
│   ├── nginx/             # Nginx configurations
│   ├── jenkins/           # Jenkins CI/CD files
│   └── infrastructure/    # Infrastructure as code
├── scripts/               # Utility scripts
├── docs/                  # Documentation
├── assets/                # Project assets and icons
├── Makefile              # Development commands
├── docker-compose.yml    # Development Docker config (symlink)
├── docker-compose.prod.yml # Production Docker config (symlink)
└── README.md             # Project overview
```

## Backend Directory (/backend)

```
backend/
├── src/
│   ├── app.ts             # Express app configuration
│   ├── server.ts          # Server entry point
│   ├── config/            # Configuration files
│   │   ├── db.ts          # MongoDB connection
│   │   ├── env.ts         # Environment variables
│   │   └── cloudinary.ts  # Cloudinary config (if used)
│   ├── controllers/       # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── post.controller.ts
│   │   └── user.controller.ts
│   ├── middleware/        # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── upload.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/            # MongoDB models
│   │   ├── User.ts
│   │   ├── Post.ts
│   │   └── Comment.ts
│   ├── routes/            # API routes
│   │   ├── auth.ts        # Authentication routes
│   │   ├── health.ts      # Health check endpoints
│   │   ├── v1/            # REST API v1
│   │   └── graphql/       # GraphQL schema and resolvers
│   ├── services/          # Business logic
│   │   ├── auth.service.ts
│   │   ├── email.service.ts
│   │   └── storage.service.ts
│   └── utils/             # Utility functions
├── test/                  # Test files
│   ├── unit/              # Unit tests
│   └── integration/       # Integration tests
├── uploads/               # Uploaded files storage
├── package.json           # Node dependencies
└── tsconfig.json          # TypeScript config
```

## Frontend Directory (/frontend)

```
frontend/
├── src/
│   ├── main.tsx           # React entry point
│   ├── App.tsx            # Main app component
│   ├── api/               # API clients
│   │   ├── axios.ts       # Axios configuration
│   │   └── graphql/       # GraphQL operations
│   ├── components/        # React components
│   │   ├── auth/          # Authentication components
│   │   ├── feed/          # Feed components
│   │   ├── layout/        # Layout components
│   │   └── ui/            # Reusable UI components
│   ├── contexts/          # React contexts
│   │   └── AuthContext.tsx
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── services/          # Frontend services
│   ├── types/             # TypeScript types
│   └── utils/             # Utility functions
├── public/                # Static assets
├── test/                  # Test files
├── index.html             # HTML entry point
├── vite.config.ts         # Vite configuration
├── package.json           # Node dependencies
└── tsconfig.json          # TypeScript config
```

## Mobile Directory (/mobile)

```
mobile/
├── lib/
│   ├── main.dart          # Flutter entry point
│   ├── app.dart           # Main app widget
│   ├── core/              # Core functionality
│   │   ├── api/           # API configuration
│   │   ├── theme/         # App theme
│   │   └── utils/         # Utilities
│   ├── features/          # Feature modules
│   │   ├── auth/          # Authentication feature
│   │   ├── feed/          # Feed feature
│   │   └── profile/       # Profile feature
│   ├── pages/             # Page widgets
│   ├── providers/         # State management
│   ├── services/          # App services
│   └── widgets/           # Reusable widgets
├── android/               # Android-specific files
├── ios/                   # iOS-specific files
├── test/                  # Test files
├── scripts/               # Mobile-specific scripts
├── pubspec.yaml           # Flutter dependencies
└── README.md              # Mobile app documentation
```

## Key Directories

### `/config`
All configuration files are centralized here:
- Docker configurations (`docker/`)
- Nginx configurations (`nginx/`)
- Jenkins pipelines (`jenkins/`)
- Infrastructure definitions (`infrastructure/`)

### `/docs`
All documentation:
- Environment setup guides
- Testing documentation
- Troubleshooting guides
- Project roadmap
- API documentation

### `/scripts`
Utility scripts:
- Database initialization (`database/`)
- Deployment scripts (`deploy/`)
- Health check scripts (`health-checks/`)
- Setup scripts (`setup/`)
- Test scripts

### `/shared`
Shared code between frontend and backend:
- TypeScript types
- Validation schemas
- Common utilities

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **API**: REST API + GraphQL (Apollo Server)
- **Authentication**: JWT tokens with bcrypt
- **File Storage**: Local filesystem + cloud storage support
- **Email**: Mailtrap for development/testing

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand + React Context
- **API Client**: Axios + Apollo Client
- **Styling**: CSS with custom properties
- **Routing**: React Router

### Mobile
- **Framework**: Flutter
- **Language**: Dart
- **State Management**: Provider
- **API Client**: Dio + GraphQL
- **Platform Support**: iOS and Android

### DevOps
- **Containerization**: Docker & Docker Compose
- **CI/CD**: Jenkins
- **Web Server**: Nginx
- **Monitoring**: Health check endpoints

## Development Workflow

All operations are handled through the Makefile:
```bash
make dev           # Start development environment
make prod          # Start production environment
make test          # Run all tests
make logs          # View logs
make health        # Check service health
make test-email    # Test email delivery
make test-network  # Test network connectivity
```

The Makefile automatically uses the correct configuration files from the `/config` directory.