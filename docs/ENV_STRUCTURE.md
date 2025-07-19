# Environment Files Structure

This project uses a consolidated environment file structure with symlinks for better organization and maintainability.

## File Structure

### Root Directory Files
- `.env.dev` - Development environment configuration (comprehensive)
- `.env.prod` - Production environment configuration  
- `.env.example` - Template file with all available environment variables

### Subdirectory Symlinks
All subdirectories use symlinks pointing to the root environment files:

#### API Directory (`/api`)
- `.env` → `../.env.dev` (default development)
- `.env.test` → `../.env.dev` (test environment)
- `.env.example` → `../.env.example`

#### Web Directory (`/web`)
- `.env` → `../.env.dev` (default development)
- `.env.development` → `../.env.dev`
- `.env.production` → `../.env.prod`
- `.env.example` → `../.env.example`

#### Mobile Directory (`/mobile`)
- `.env` → `../.env.dev` (default development)

## Usage

### Development
By default, all services use `.env.dev` when running locally.

### Production
For production deployment:
1. Update `.env.prod` with your production values
2. The web build process will use `.env.production` (which links to `.env.prod`)
3. Deploy with appropriate environment variables

### Adding New Variables
1. Add to `.env.example` with a descriptive placeholder
2. Add to `.env.dev` with development values
3. Add to `.env.prod` with production values (or environment variable references)

## Benefits
- Single source of truth for each environment
- No duplicate configurations to maintain
- Easy switching between environments
- Consistent structure across all services