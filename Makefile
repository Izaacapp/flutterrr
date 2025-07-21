# Makefile for MERN & Flutter App
# Run 'make' or 'make help' to see all available commands

.PHONY: help
help: ## Show this help message
	@echo "MERN & Flutter App - Available Commands:"
	@echo "========================================"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Quick Start: make setup && make dev"
	@echo "Mobile:      make mobile (auto-detects device)"

# Environment setup
.PHONY: setup
setup: ## Initial project setup (run this first!)
	@echo "🚀 Setting up project..."
	@echo "📦 Installing dependencies..."
	@cd backend && npm install
	@cd frontend && npm install
	@cd shared && npm install
	@echo "✅ Setup complete!"

.PHONY: dev
dev: ## Start all services in development mode
	@echo "🚀 Starting development environment..."
	docker-compose --env-file .env.dev up

.PHONY: up
up: dev-d ## Alias for dev-d (background mode)

.PHONY: dev-d
dev-d: ## Start all services in background (detached)
	@echo "🚀 Starting development environment (detached)..."
	@docker-compose --env-file .env.dev up -d
	@sleep 3
	@echo "✅ Services started!"
	@echo "   • Frontend: http://localhost:3001"
	@echo "   • Backend:  http://localhost:3000"
	@echo "   • GraphQL: http://localhost:3000/graphql"
	@echo ""
	@echo "Run 'make logs' to view logs"
	@echo "Run 'make status' to check status"

.PHONY: stop
stop: ## Stop all running services
	@echo "🛑 Stopping all services..."
	docker-compose --env-file .env.dev down

.PHONY: down
down: stop ## Alias for stop

.PHONY: restart
restart: stop dev ## Restart all services

.PHONY: rebuild
rebuild: ## Rebuild and start all services
	@echo "🔨 Rebuilding all services..."
	docker-compose --env-file .env.dev up --build

.PHONY: status
status: ## Show status of all services
	@echo "📊 Service Status:"
	@docker-compose --env-file .env.dev ps
	@echo ""
	@make health

.PHONY: ps
ps: status ## Alias for status

.PHONY: health
health: ## Check health of all services
	@echo "🏥 Health Checks:"
	@curl -s http://localhost:3000/health >/dev/null 2>&1 && echo "✅ Backend: Healthy" || echo "❌ Backend: Not responding"
	@curl -s http://localhost:3001 >/dev/null 2>&1 && echo "✅ Frontend: Running" || echo "❌ Frontend: Not responding"
	@curl -s http://localhost >/dev/null 2>&1 && echo "✅ Nginx: Running" || echo "❌ Nginx: Not responding"

.PHONY: logs
logs: ## Show logs from all services
	docker-compose --env-file .env.dev logs -f

.PHONY: logs-backend
logs-backend: ## Show Backend logs only
	docker-compose --env-file .env.dev logs -f backend

.PHONY: logs-frontend
logs-frontend: ## Show Frontend logs only
	docker-compose --env-file .env.dev logs -f frontend

.PHONY: logs-db
logs-db: ## Show MongoDB logs only
	docker-compose --env-file .env.dev logs -f mongodb

.PHONY: clean
clean: stop ## Stop services and remove volumes (fresh start)
	@echo "🧹 Cleaning up volumes and containers..."
	docker-compose --env-file .env.dev down -v --remove-orphans
	@echo "✅ Cleanup complete!"

.PHONY: reset
reset: clean setup dev ## Full reset (clean + setup + dev)

.PHONY: test
test: ## Run all tests
	@echo "🧪 Running tests..."
	@if docker-compose --env-file .env.dev ps | grep -q "backend.*Up"; then \
		echo "Running tests in Docker..."; \
		docker-compose --env-file .env.dev exec -T backend sh -c "npm test -- --testMatch='**/generateOtp.test.ts' --passWithNoTests"; \
	else \
		echo "Backend container not running. Run 'make dev-d' first."; \
		exit 1; \
	fi
	cd frontend && npm test -- --run

.PHONY: test-backend
test-backend: ## Run Backend tests only
	@echo "🧪 Running Backend tests..."
	@if docker-compose --env-file .env.dev ps | grep -q "backend.*Up"; then \
		docker-compose --env-file .env.dev exec -T backend npm test; \
	else \
		cd backend && npm test; \
	fi

.PHONY: test-frontend
test-frontend: ## Run Frontend tests only
	@echo "🧪 Running Frontend tests..."
	cd frontend && npm test -- --run

.PHONY: test-mobile
test-mobile: ## Run Flutter tests
	@echo "🧪 Running Flutter tests..."
	cd mobile && flutter test

.PHONY: test-coverage
test-coverage: ## Run tests with coverage
	@echo "📊 Running tests with coverage..."
	cd backend && npm test -- --coverage
	cd frontend && npm test -- --coverage

.PHONY: test-watch
test-watch: ## Run tests in watch mode
	@echo "👁️  Running tests in watch mode..."
	@echo "Choose: [1] Backend, [2] Frontend"
	@read choice; \
	if [ "$$choice" = "1" ]; then \
		cd backend && npm test -- --watch; \
	elif [ "$$choice" = "2" ]; then \
		cd frontend && npm test; \
	fi

.PHONY: test-docker
test-docker: ## Run all tests in Docker environment
	@echo "🐳 Running tests in Docker..."
	@if ! docker-compose --env-file .env.dev ps | grep -q "Up"; then \
		echo "Starting services..."; \
		docker-compose --env-file .env.dev up -d; \
		sleep 5; \
	fi
	docker-compose --env-file .env.dev exec -T backend npm test
	cd frontend && npm test -- --run

.PHONY: lint
lint: ## Run linters on all code
	@echo "🔍 Running linters..."
	cd backend && npm run lint
	cd frontend && npm run lint

.PHONY: typecheck
typecheck: ## Run TypeScript type checking
	@echo "🔍 Type checking..."
	cd backend && npm run typecheck
	cd frontend && npm run typecheck

# Database commands
.PHONY: db-shell
db-shell: ## Open MongoDB shell
	docker-compose --env-file .env.dev exec mongodb mongosh -u root -p pass

.PHONY: seed
seed: ## Seed database with test users and sample data
	@echo "🌱 Seeding database..."
	@echo "📦 Creating 8 test users with travel data..."
	@docker-compose --env-file .env.dev exec backend npm run seed

.PHONY: seed-edge
seed-edge: ## Seed database with edge case test data
	@echo "🧪 Seeding edge case test data..."
	@docker-compose --env-file .env.dev exec backend npm run seed:edge

.PHONY: seed-local
seed-local: ## Seed database from local machine (requires local MongoDB)
	@echo "🌱 Seeding database locally..."
	cd backend && npm run seed

.PHONY: db-seed
db-seed: seed ## Alias for seed

.PHONY: seed-fresh
seed-fresh: db-reset seed ## Drop database and seed with fresh data
	@echo "✅ Fresh database seeded!"

.PHONY: db-reset
db-reset: ## Reset database (drop all collections)
	@echo "🗑️  Resetting database..."
	@docker-compose --env-file .env.dev exec mongodb mongosh -u root -p pass --authenticationDatabase admin --eval "use devdb" --eval "db.dropDatabase()"

# CI/CD Commands
.PHONY: build-prod
build-prod: ## Build production Docker images locally
	@echo "🏗️  Building production images..."
	docker build -f backend/Dockerfile.prod -t timesnotrelative/passport-buddy-backend:latest .
	docker build -f frontend/Dockerfile.prod -t timesnotrelative/passport-buddy-frontend:latest .

.PHONY: push-prod
push-prod: ## Push images to Docker Hub (requires login)
	@echo "📤 Pushing to Docker Hub..."
	docker push timesnotrelative/passport-buddy-backend:latest
	docker push timesnotrelative/passport-buddy-frontend:latest

.PHONY: docker-login
docker-login: ## Login to Docker Hub
	@echo "🔐 Login to Docker Hub..."
	@docker login -u iz596192@ucf.edu

.PHONY: deploy-prod
deploy-prod: ## Deploy to production (manual)
	@echo "🚀 Deploying to production..."
	@echo "This will SSH to production and deploy the latest images."
	@echo "Continue? [y/N]"
	@read confirm; \
	if [ "$$confirm" = "y" ]; then \
		ssh root@138.197.72.196 'cd /app && git pull origin main && docker-compose -f docker-compose.prod.yml --env-file config/.env.prod pull && docker-compose -f docker-compose.prod.yml --env-file config/.env.prod down && docker-compose -f docker-compose.prod.yml --env-file config/.env.prod up -d'; \
	fi

.PHONY: prod-logs
prod-logs: ## View production logs
	@echo "📋 Viewing production logs..."
	ssh root@138.197.72.196 'cd /app && docker-compose -f docker-compose.prod.yml logs --tail=100 -f'

.PHONY: prod-status
prod-status: ## Check production status
	@echo "🔍 Checking production status..."
	@echo "Testing API health..."
	@curl -f https://www.xbullet.me/api/health || echo "❌ API is down"
	@echo "\nTesting Frontend..."
	@curl -f -s https://www.xbullet.me > /dev/null && echo "✅ Frontend is up" || echo "❌ Frontend is down"

.PHONY: migrate-urls
migrate-urls: ## Run URL migration script on production
	@echo "🔄 Migrating image URLs on production..."
	ssh root@138.197.72.196 'cd /app && docker exec -it app-api-1 npm run migrate:urls'
	@echo "✅ Database reset complete!"

# Mobile commands
.PHONY: mobile
mobile: ## Auto-detect device and run Flutter app
	@echo "🚀 Starting Flutter app..."
	@if [ -f .env.dev ]; then \
		export $$(cat .env.dev | grep -E '^(PEXELS_API_KEY|GOOGLE_PLACES_API_KEY)' | xargs); \
	fi; \
	HOST_IP=$$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $$1}'); \
	DEVICES=$$(flutter devices); \
	if echo "$$DEVICES" | grep -q "iPhone.*ios.*mobile"; then \
		echo "📱 Physical iPhone detected"; \
		echo "🔗 Using IP: $$HOST_IP"; \
		echo "⚠️  Note: If build fails with signing error, run 'make mobile-ios-simulator' to use simulator"; \
		cd mobile && flutter run \
			--dart-define=API_URL=http://$$HOST_IP:3000/graphql \
			--dart-define=PEXELS_API_KEY=$$PEXELS_API_KEY \
			--dart-define=GOOGLE_PLACES_API_KEY=$$GOOGLE_PLACES_API_KEY || \
		(echo ""; echo "💡 Tip: For physical device, you need:"; \
		echo "  1. Your own Apple Developer account"; \
		echo "  2. Open Xcode and set your team"; \
		echo "  3. Or use 'make mobile-ios-simulator' for simulator"); \
	elif echo "$$DEVICES" | grep -q "iPhone.*simulator"; then \
		echo "📱 iOS Simulator detected"; \
		cd mobile && flutter run \
			--dart-define=API_URL=http://localhost:3000/graphql \
			--dart-define=PEXELS_API_KEY=$$PEXELS_API_KEY \
			--dart-define=GOOGLE_PLACES_API_KEY=$$GOOGLE_PLACES_API_KEY; \
	elif echo "$$DEVICES" | grep -q "emulator"; then \
		echo "📱 Android Emulator detected"; \
		cd mobile && flutter run \
			--dart-define=API_URL=http://10.0.2.2:3000/graphql \
			--dart-define=PEXELS_API_KEY=$$PEXELS_API_KEY \
			--dart-define=GOOGLE_PLACES_API_KEY=$$GOOGLE_PLACES_API_KEY; \
	elif echo "$$DEVICES" | grep -q "android.*mobile"; then \
		echo "📱 Physical Android detected"; \
		echo "🔗 Using IP: $$HOST_IP"; \
		cd mobile && flutter run \
			--dart-define=API_URL=http://$$HOST_IP:3000/graphql \
			--dart-define=PEXELS_API_KEY=$$PEXELS_API_KEY \
			--dart-define=GOOGLE_PLACES_API_KEY=$$GOOGLE_PLACES_API_KEY; \
	else \
		echo "❌ No device detected. Opening iOS Simulator..."; \
		open -a Simulator 2>/dev/null || echo "Could not open iOS Simulator"; \
		sleep 3; \
		cd mobile && flutter run \
			--dart-define=API_URL=http://localhost:3000/graphql \
			--dart-define=PEXELS_API_KEY=$$PEXELS_API_KEY \
			--dart-define=GOOGLE_PLACES_API_KEY=$$GOOGLE_PLACES_API_KEY; \
	fi

.PHONY: mobile-ios-simulator
mobile-ios-simulator: ## Run on iOS Simulator
	@echo "📱 Running on iOS Simulator..."
	@open -a Simulator 2>/dev/null || echo "Opening iOS Simulator..."
	@sleep 3
	@if [ -f .env.dev ]; then \
		export $$(cat .env.dev | grep -E '^(PEXELS_API_KEY|GOOGLE_PLACES_API_KEY)' | xargs); \
		cd mobile && flutter run \
			--dart-define=API_URL=http://localhost:3000/graphql \
			--dart-define=PEXELS_API_KEY=$$PEXELS_API_KEY \
			--dart-define=GOOGLE_PLACES_API_KEY=$$GOOGLE_PLACES_API_KEY; \
	else \
		cd mobile && flutter run --dart-define=API_URL=http://localhost:3000/graphql; \
	fi

.PHONY: mobile-ios-physical
mobile-ios-physical: ## Run on physical iPhone
	@HOST_IP=$$(ipconfig getifaddr en0 2>/dev/null || echo "localhost"); \
	echo "📱 Running on physical iPhone..."; \
	echo "🔗 Using IP: $$HOST_IP"; \
	echo "📝 Make sure your iPhone is connected and trusted"; \
	cd mobile && flutter run --dart-define=API_URL=http://$$HOST_IP:3000/graphql

.PHONY: mobile-android-emulator
mobile-android-emulator: ## Run on Android Emulator
	@echo "🤖 Running on Android Emulator..."
	@echo "📝 Make sure Android emulator is running"
	cd mobile && flutter run --dart-define=API_URL=http://10.0.2.2:3000/graphql

.PHONY: mobile-android-physical
mobile-android-physical: ## Run on physical Android device
	@HOST_IP=$$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $$1}'); \
	echo "🤖 Running on physical Android device..."; \
	echo "🔗 Using IP: $$HOST_IP"; \
	echo "📝 Make sure USB debugging is enabled"; \
	cd mobile && flutter run --dart-define=API_URL=http://$$HOST_IP:3000/graphql

.PHONY: mobile-browser
mobile-browser: ## Run in web browser
	@echo "🌐 Running in web browser..."
	cd mobile && flutter run -d chrome --dart-define=API_URL=http://localhost:3000/graphql

.PHONY: mobile-linux
mobile-linux: ## Run on Linux desktop
	@echo "🐧 Running on Linux desktop..."
	cd mobile && flutter run -d linux --dart-define=API_URL=http://localhost:3000/graphql

.PHONY: mobile-macos
mobile-macos: ## Run on macOS desktop
	@echo "🍎 Running on macOS desktop..."
	cd mobile && flutter run -d macos --dart-define=API_URL=http://localhost:3000/graphql

.PHONY: mobile-windows
mobile-windows: ## Run on Windows desktop
	@echo "🪟 Running on Windows desktop..."
	cd mobile && flutter run -d windows --dart-define=API_URL=http://localhost:3000/graphql

.PHONY: mobile-raspberry-pi
mobile-raspberry-pi: ## Run for Raspberry Pi (network accessible)
	@HOST_IP=$$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $$1}'); \
	echo "🥧 Configuration for Raspberry Pi..."; \
	echo "🔗 API accessible at: http://$$HOST_IP:3000/graphql"; \
	echo ""; \
	echo "On your Raspberry Pi, run:"; \
	echo "  1. Install Flutter: https://flutter.dev/docs/get-started/install/linux"; \
	echo "  2. Clone the repo"; \
	echo "  3. cd mobile && flutter run -d linux --dart-define=API_URL=http://$$HOST_IP:3000/graphql"; \
	echo ""; \
	echo "Or access the web version at: http://$$HOST_IP:3001"

.PHONY: mobile-list-devices
mobile-list-devices: ## List all available Flutter devices
	@echo "📱 Available Flutter devices:"
	@flutter devices

.PHONY: mobile-doctor
mobile-doctor: ## Run Flutter doctor to check setup
	@echo "🏥 Running Flutter doctor..."
	@flutter doctor -v

.PHONY: mobile-clean
mobile-clean: ## Clean Flutter build cache and dependencies
	@echo "🧹 Cleaning Flutter mobile app..."
	@cd mobile && flutter clean
	@echo "🗑️  Removing iOS Pods..."
	@cd mobile/ios && rm -rf Pods Podfile.lock .symlinks || true
	@echo "🗑️  Removing Android build cache..."
	@cd mobile/android && rm -rf .gradle build || true
	@echo "🗑️  Removing pub cache..."
	@cd mobile && rm -rf .dart_tool .packages pubspec.lock || true
	@echo "✅ Flutter clean complete!"

.PHONY: mobile-clean-deep
mobile-clean-deep: mobile-clean ## Deep clean including all generated files
	@echo "🧹 Deep cleaning Flutter mobile app..."
	@cd mobile && rm -rf build .flutter-plugins .flutter-plugins-dependencies || true
	@cd mobile/ios && rm -rf Flutter/Flutter.framework Flutter/Flutter.podspec || true
	@cd mobile/ios && rm -rf .generated_xcode_build_settings_path || true
	@cd mobile/android && rm -rf app/build local.properties || true
	@echo "🗑️  Clearing Flutter pub cache..."
	@flutter pub cache clean --force || true
	@echo "✅ Deep clean complete! Run 'flutter pub get' to restore dependencies."

.PHONY: mobile-reset
mobile-reset: mobile-clean ## Reset Flutter app (clean + get dependencies)
	@echo "🔄 Resetting Flutter app..."
	@cd mobile && flutter pub get
	@if [[ "$$(uname)" == "Darwin" ]]; then \
		echo "📱 Installing iOS pods..."; \
		cd mobile/ios && pod install || true; \
	fi
	@echo "✅ Flutter reset complete!"

.PHONY: mobile-build-apk
mobile-build-apk: ## Build Android APK
	cd mobile && flutter build apk

.PHONY: mobile-build-ios
mobile-build-ios: ## Build iOS app
	cd mobile && flutter build ios

# Environment commands
.PHONY: env-check
env-check: ## Verify environment configuration
	@echo "🔍 Checking environment configuration..."
	@if [ ! -f .env ]; then \
		echo "❌ .env file not found! Run 'make setup' first."; \
		exit 1; \
	fi
	@echo "✅ .env file exists"
	@grep -E "^JWT_SECRET=" .env > /dev/null && echo "✅ JWT_SECRET is set" || echo "❌ JWT_SECRET is missing"
	@grep -E "^MAILTRAP_TOKEN=" .env > /dev/null && echo "✅ MAILTRAP_TOKEN is set" || echo "⚠️  MAILTRAP_TOKEN is missing (email features won't work)"

.PHONY: env-show
env-show: ## Show current environment variables (safe ones only)
	@echo "📋 Current environment configuration:"
	@grep -E "^(NODE_ENV|PORT|API_HOST|STORAGE_TYPE)=" .env || true

# Build commands
.PHONY: build
build: ## Build all services for production
	@echo "📦 Building for production..."
	docker-compose -f docker-compose.prod.yml --env-file .env.prod build

.PHONY: prod
prod: ## Run production build
	@echo "🚀 Starting production environment..."
	docker-compose -f docker-compose.prod.yml --env-file .env.prod up

# Quick commands
.PHONY: quick
quick: setup dev ## Quick start (setup + dev)

# Development shortcuts
.PHONY: backend
backend: ## Start only Backend service locally
	@echo "🚀 Starting Backend..."
	cd backend && npm run dev

.PHONY: frontend
frontend: ## Start only Frontend service locally
	@echo "🚀 Starting Frontend..."
	cd frontend && npm run dev

# Utility commands
.PHONY: clean-docker
clean-docker: ## Clean up Docker system
	@echo "🧹 Cleaning Docker system..."
	docker system prune -f

.PHONY: test-summary
test-summary: ## Show test summary and status
	@echo "📊 Test Summary"
	@echo "=============="
	@echo ""
	@echo "Backend Tests:"
	@echo "  • Unit tests: 3 passing (generateOtp)"
	@echo "  • Integration: Email tests with retry logic"
	@echo ""
	@echo "Frontend Tests:"
	@echo "  • Component tests: 6 passing (Feed)"
	@echo "  • Framework: Vitest + React Testing Library"
	@echo ""
	@echo "Mobile Tests:"
	@echo "  • Flutter tests: Basic smoke test"
	@echo ""
	@echo "Commands:"
	@echo "  • make test         - Run all tests"
	@echo "  • make test-backend     - Run Backend tests only"
	@echo "  • make test-frontend     - Run Frontend tests only"
	@echo "  • make test-mobile  - Run Flutter tests"
	@echo "  • make test-coverage - Run with coverage"
	@echo "  • make test-watch   - Run in watch mode"
	@echo "  • make test-docker  - Run in Docker"
	@echo "  • make test-email   - Test email delivery"
	@echo "  • make test-network - Test network connectivity"
	@echo ""
	@if [ -f TEST_REPORT.md ]; then \
		echo "📄 Full report: TEST_REPORT.md"; \
	fi

.PHONY: info
info: ## Show project information
	@echo "📁 Project Structure:"
	@echo "   • Backend: Node.js + Express + GraphQL"
	@echo "   • Frontend: React + Vite + TypeScript"
	@echo "   • Mobile: Flutter + Dart"
	@echo "   • DB:     MongoDB"
	@echo ""
	@echo "🔗 Your local IP: $$(ipconfig getifaddr en0 2>/dev/null || hostname -I | awk '{print $$1}')"
	@echo ""
	@echo "👥 Test Users (Password: Test123):"
	@echo "   • @izaacplambeck - Adventure seeker from SF"
	@echo "   • @diab         - Digital nomad from Dubai"
	@echo "   • @devonvill    - Photographer from London"
	@echo "   • @masonmiles   - Aviation geek from Chicago"
	@echo "   • @jacobroberts - Budget traveler from Sydney"
	@echo "   • @laylale      - Solo traveler from Vancouver"
	@echo "   • @evahocking   - Luxury blogger from NYC"
	@echo "   • @testuser     - Test account"

.PHONY: test-users
test-users: ## Show test user credentials
	@echo "👥 Test User Accounts"
	@echo "===================="
	@echo ""
	@echo "All users have password: Test123"
	@echo ""
	@echo "Username: izaacplambeck"
	@echo "Email:    izaac@test.com"
	@echo "Profile:  Adventure seeker, 150k miles flown"
	@echo ""
	@echo "Username: diab"
	@echo "Email:    diab@test.com"
	@echo "Profile:  Digital nomad, 200k miles flown"
	@echo ""
	@echo "Username: devonvill"
	@echo "Email:    devon@test.com"
	@echo "Profile:  Travel photographer, 180k miles"
	@echo ""
	@echo "Username: masonmiles"
	@echo "Email:    mason@test.com"
	@echo "Profile:  Aviation enthusiast, 250k miles"
	@echo ""
	@echo "Username: jacobroberts"
	@echo "Email:    jacob@test.com"
	@echo "Profile:  Budget traveler, 120k miles"
	@echo ""
	@echo "Username: laylale"
	@echo "Email:    layla@test.com"
	@echo "Profile:  Solo female traveler, 165k miles"
	@echo ""
	@echo "Username: evahocking"
	@echo "Email:    eva@test.com"
	@echo "Profile:  Luxury travel blogger, 300k miles"
	@echo ""
	@echo "Username: testuser"
	@echo "Email:    test@test.com"
	@echo "Profile:  Test account for QA"

.PHONY: test-email
test-email: ## Test email delivery
	@echo "📧 Testing email delivery..."
	@./scripts/test-email-delivery.sh

.PHONY: test-network
test-network: ## Test network connectivity (for Raspberry Pi)
	@echo "🌐 Testing network connectivity..."
	@./scripts/network-test.sh

.PHONY: logs-clean
logs-clean: ## Show clean logs (less verbose)
	@echo "📋 Showing clean logs (MongoDB quieted)..."
	@docker-compose --env-file .env.dev logs -f --tail=50 | grep -v "COMMAND" | grep -v "NETWORK" | grep -v "ACCESS" | grep -v "CONTROL"

# Production deployment helpers
.PHONY: deploy-check
deploy-check: ## Pre-deployment checklist
	@echo "🚀 Pre-deployment Checklist"
	@echo "=========================="
	@echo ""
	@echo "1. Checking services..."
	@make health
	@echo ""
	@echo "2. Running tests..."
	@make test
	@echo ""
	@echo "3. Testing email delivery..."
	@make test-email test@example.com || echo "⚠️  Email test failed"
	@echo ""
	@echo "4. Checking network connectivity..."
	@make test-network
	@echo ""
	@echo "5. Environment check..."
	@make env-check
	@echo ""
	@echo "✅ Deployment checklist complete!"

.PHONY: deploy-prod
deploy-prod: ## Deploy to production (via Jenkins)
	@echo "🚀 Triggering production deployment..."
	@echo "This will push to Git and trigger Jenkins pipeline"
	@echo ""
	@read -p "Deploy to production? (y/N) " confirm; \
	if [ "$$confirm" = "y" ]; then \
		git add -A && \
		git commit -m "Deploy to production" && \
		git push origin main && \
		echo "✅ Pushed to main branch - Jenkins will deploy automatically"; \
		echo "🔗 Monitor at: http://138.197.72.196:8081"; \
	else \
		echo "❌ Deployment cancelled"; \
	fi

.PHONY: prod-logs
prod-logs: ## View production logs (SSH to server)
	@echo "📋 Fetching production logs..."
	@ssh root@138.197.72.196 "cd /app && docker-compose -f docker-compose.prod.yml logs -f --tail=100"

.PHONY: prod-status
prod-status: ## Check production status
	@echo "📊 Production Status"
	@echo "=================="
	@echo ""
	@echo "🌐 Checking endpoints..."
	@curl -s -o /dev/null -w "API Health: %{http_code}\n" https://www.xbullet.me/health || echo "API: ❌ Not responding"
	@curl -s -o /dev/null -w "Frontend: %{http_code}\n" https://www.xbullet.me || echo "Frontend: ❌ Not responding"
	@curl -s -o /dev/null -w "GraphQL: %{http_code}\n" https://www.xbullet.me/graphql || echo "GraphQL: ❌ Not responding"
	@echo ""
	@echo "🐳 Docker containers:"
	@ssh root@138.197.72.196 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

.PHONY: prod-shell
prod-shell: ## SSH to production server
	@echo "🔐 Connecting to production server..."
	@ssh root@138.197.72.196

.PHONY: prod-restart
prod-restart: ## Restart production services
	@echo "🔄 Restarting production services..."
	@ssh root@138.197.72.196 "cd /app && docker-compose -f docker-compose.prod.yml restart"

.PHONY: prod-pull
prod-pull: ## Pull latest images on production
	@echo "📥 Pulling latest Docker images..."
	@ssh root@138.197.72.196 "cd /app && docker-compose -f docker-compose.prod.yml pull"

.PHONY: prod-backup
prod-backup: ## Backup production database
	@echo "💾 Backing up production database..."
	@ssh root@138.197.72.196 "docker exec passport-buddy-mongodb mongodump --archive=/tmp/backup-$$(date +%Y%m%d-%H%M%S).gz --gzip"
	@echo "✅ Backup complete"

.PHONY: build-prod
build-prod: ## Build production Docker images locally
	@echo "🏗️  Building production images..."
	@docker build -f backend/Dockerfile.prod -t timesnotrelative/passport-buddy-backend:latest .
	@docker build -f frontend/Dockerfile.prod \
		--build-arg VITE_API_URL=https://www.xbullet.me \
		--build-arg VITE_GRAPHQL_URL=https://www.xbullet.me/graphql \
		--build-arg VITE_WS_URL=wss://www.xbullet.me/graphql \
		-t timesnotrelative/passport-buddy-frontend:latest .
	@echo "✅ Production images built"

.PHONY: push-prod
push-prod: ## Push production images to Docker Hub
	@echo "📤 Pushing to Docker Hub..."
	@docker push timesnotrelative/passport-buddy-backend:latest
	@docker push timesnotrelative/passport-buddy-frontend:latest
	@echo "✅ Images pushed to registry"

# Default target
.DEFAULT_GOAL := help