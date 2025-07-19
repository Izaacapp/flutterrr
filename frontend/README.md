# Passport Buddy Frontend

A modern React application built with Vite, featuring a travel-themed social platform interface with Instagram-like functionality.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand + React Context API
- **API Clients**: Axios (REST) + Apollo Client (GraphQL)
- **Styling**: CSS with custom properties (purple/periwinkle theme)
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library

## Project Structure

```
frontend/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component with routing
│   ├── api/                  # API configuration
│   │   ├── axios.ts          # Axios instance setup
│   │   └── graphql/          # GraphQL queries/mutations
│   ├── components/           # Reusable components
│   │   ├── auth/             # Login, Register, OTP
│   │   ├── feed/             # Feed, PostCard, CreatePost
│   │   ├── layout/           # MainLayout, Sidebar
│   │   └── ui/               # Button, Avatar, etc.
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Authentication state
│   ├── pages/                # Route page components
│   ├── hooks/                # Custom React hooks
│   ├── services/             # API service layers
│   ├── stores/               # Zustand stores
│   ├── types/                # TypeScript definitions
│   └── utils/                # Utility functions
├── public/                   # Static assets
├── index.html                # HTML template
└── vite.config.ts            # Vite configuration
```

## Features

### Authentication
- User registration with email verification
- JWT-based authentication
- Protected routes and persistent sessions
- OTP verification flow

### Social Features
- Instagram-like feed with posts
- Multi-image upload (up to 5 images)
- Real-time updates via GraphQL polling
- User profiles and avatars

### Travel Features
- Boarding pass icon for itineraries
- Flight tracking integration ready
- Travel map visualization ready
- Statistics and analytics ready

### UI/UX
- Responsive design for all devices
- Purple/periwinkle theme throughout
- Smooth animations and transitions
- Loading states and error handling

## Theme Colors

The app uses a consistent purple/periwinkle color scheme:

```css
--pb-dark-purple: #7B6BA6;
--pb-medium-purple: #B8B3E9;
--pb-light-purple: #D4D1F5;
--pb-background: #FAFAFF;
--pb-text: #2D2D3F;
--pb-white: #FFFFFF;
```

## Development

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file:
```env
VITE_API_URL=http://localhost:3000
VITE_GRAPHQL_URL=http://localhost:3000/graphql
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3001`

### Docker Development

Using the project's docker-compose:
```bash
# From project root
make dev

# Frontend will be available at http://localhost:3001
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run test:ui` - Run tests with UI
- `npm run coverage` - Generate test coverage

## Testing

### Run Tests
```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With UI
npm run test:ui

# Coverage report
npm run coverage
```

### Test Structure
- `test/components/` - Component tests
- `test/setup.ts` - Test configuration
- Tests use Vitest and React Testing Library

## Building for Production

```bash
# Build the application
npm run build

# Preview the build locally
npm run preview

# The build output will be in dist/
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:3000` |
| `VITE_GRAPHQL_URL` | GraphQL endpoint | `http://localhost:3000/graphql` |

## API Integration

### REST API
The app uses Axios for REST endpoints:
- Authentication (`/api/auth/*`)
- File uploads (`/api/posts`)

### GraphQL API
Apollo Client handles GraphQL queries:
- Post feed queries
- Real-time updates with polling
- Cached results for performance

## Component Guidelines

### Creating New Components
1. Use TypeScript for all components
2. Place in appropriate directory under `src/components/`
3. Include proper types/interfaces
4. Add tests for new components

### Styling
1. Use CSS modules or styled components
2. Follow the established color scheme
3. Ensure responsive design
4. Test on multiple screen sizes

## Deployment

### Docker Production
```bash
docker build -f Dockerfile.prod -t passport-frontend .
docker run -p 80:80 passport-frontend
```

### Static Hosting
The build output can be deployed to any static hosting:
- Vercel
- Netlify
- AWS S3 + CloudFront
- DigitalOcean App Platform

## Troubleshooting

### Common Issues

1. **API Connection Failed**
   - Check backend is running on port 3000
   - Verify environment variables
   - Check CORS settings

2. **Images Not Loading**
   - Ensure backend uploads directory is accessible
   - Check image URLs in network tab
   - Verify storage service configuration

3. **Authentication Issues**
   - Clear localStorage
   - Check JWT token expiry
   - Verify backend auth endpoints

### Debug Mode
Enable debug logs:
```javascript
localStorage.setItem('debug', 'passport:*');
```

## Performance Optimization

- Code splitting with React.lazy()
- Image lazy loading
- GraphQL query caching
- Optimized bundle size with Vite

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome)

## Contributing

1. Follow the existing code style
2. Write tests for new features
3. Ensure responsive design
4. Test on multiple browsers
5. Submit PR with clear description

## License

Private - Passport Buddy