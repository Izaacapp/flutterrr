# Environment Configuration

## Structure

Only 3 files exist:

```
Root Directory:
├── .env.dev      - Development configuration (has your Spaces credentials)
├── .env.prod     - Production configuration  
└── .env.example  - Template for new developers

NO .env FILE - We use --env-file flag instead
```

## How It Works

1. **NO `.env` FILE** - We explicitly tell Docker which env file to use:
   - `make dev` → uses `docker-compose --env-file .env.dev`
   - `make prod` → uses `docker-compose --env-file .env.prod`

2. **`.env.example`** - Template file for other developers. They copy this and add their own credentials.

3. **No symlinks needed** - Each command explicitly specifies its env file

## Usage

### Development (Local)
```bash
make dev    # Automatically uses .env.dev
```

### Production (DigitalOcean)  
```bash
make prod   # Automatically uses .env.prod
```

### Testing
```bash
# Uses .env.dev via symlink
make test
```

## Key Features

- **DigitalOcean Spaces** configured for file storage
- **Image variants** automatically generated (thumbnail, small, medium, large)
- **Mailtrap** for email in development
- **MongoDB** connection strings for each environment

## Storage

Using DigitalOcean Spaces with automatic image resizing:
- Bucket: `Passport-Buddy`
- Region: `nyc3`
- CDN enabled for fast delivery

Images are automatically processed into multiple sizes for optimal social media display.