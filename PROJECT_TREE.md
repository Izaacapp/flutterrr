# 🗂️ Project Structure

```
📦 mern&flutter
│
├── 📱 Apps
│   ├── 🌐 api/         → Backend API (Express + GraphQL)
│   ├── 💻 web/         → Frontend (React + Vite)
│   └── 📲 mobile/      → Mobile App (Flutter)
│
├── 🔧 Configuration
│   ├── ⚙️  config/     → All configs (env, docker, nginx, jenkins)
│   └── 🔗 Symlinks    → .env.*, docker-compose.yml (point to config/)
│
├── 📚 Documentation
│   └── 📝 docs/        → All markdown docs
│
├── 🛠️ Utilities
│   ├── 🔨 scripts/     → Build, test, deploy scripts
│   └── 🤝 shared/      → Shared TypeScript types
│
├── 📦 Assets
│   └── 🎨 assets/      → Icons, images
│
└── 🚀 Root Files
    ├── 📋 Makefile     → All commands (make dev, make prod, etc.)
    └── 📖 README.md    → Quick start guide
```

## 🎯 Quick Navigation

| What you want | Where to find it |
|--------------|------------------|
| Environment vars | `config/.env.dev` or `config/.env.prod` |
| Docker setup | `config/docker/` |
| API code | `api/src/` |
| React components | `web/src/` |
| Flutter screens | `mobile/lib/` |
| Documentation | `docs/` |
| Scripts | `scripts/` |

## 🚀 Commands

Everything runs through the Makefile:
- `make dev` - Start development
- `make prod` - Start production
- `make test` - Run tests
- `make help` - See all commands

## 📂 Detailed Structure

### `/config` - Central Configuration Hub
```
config/
├── .env.dev              # Development environment
├── .env.prod             # Production environment
├── .env.example          # Template
├── docker/
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   └── docker-compose.override.yml
├── nginx/                # Web server configs
├── jenkins/              # CI/CD pipelines
└── infrastructure/       # IaC (Terraform, etc.)
```

### `/api` - Backend Service
```
api/
├── src/
│   ├── models/          # MongoDB schemas
│   ├── routes/          # REST + GraphQL
│   ├── services/        # Business logic
│   └── middleware/      # Auth, upload, etc.
├── test/                # Unit & integration tests
└── Dockerfile.*         # Container configs
```

### `/web` - Frontend Application
```
web/
├── src/
│   ├── components/      # React components
│   ├── pages/           # Route pages
│   ├── hooks/           # Custom hooks
│   └── graphql/         # Apollo queries
├── public/              # Static assets
└── test/                # Component tests
```

### `/mobile` - Flutter App
```
mobile/
├── lib/
│   ├── screens/         # App screens
│   ├── widgets/         # Reusable widgets
│   ├── services/        # API services
│   └── models/          # Data models
├── scripts/             # Mobile-specific scripts
└── test/                # Widget tests
```

## 🔗 Root Symlinks

All dot files are symlinks to keep root clean:
- `.env.dev` → `config/.env.dev`
- `.env.prod` → `config/.env.prod`
- `.gitignore` → `config/git/gitignore`
- `.dockerignore` → `config/docker/dockerignore`
- `docker-compose.yml` → `config/docker/docker-compose.dev.yml`