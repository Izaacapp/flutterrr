#!/bin/bash
# SETUP_INSTRUCTIONS.sh
# Run this to set up the entire mobile CI/CD pipeline

echo "📱 Mobile CI/CD Setup for MERN & Flutter Monorepo"
echo "================================================"
echo ""

# Step 1: Create workflow directory
echo "1️⃣ Creating GitHub Actions workflows..."
mkdir -p .github/workflows

# Step 2: Copy workflow files
echo "2️⃣ Installing workflow files..."
cp ios.yml .github/workflows/
cp android.yml .github/workflows/
cp flutter-tests.yml .github/workflows/

# Step 3: Make scripts executable
echo "3️⃣ Setting up development scripts..."
chmod +x setup-mobile-dev.sh
chmod +x dev.sh
chmod +x status.sh

# Step 4: Run platform-specific setup
echo "4️⃣ Running platform detection and setup..."
./setup-mobile-dev.sh

# Step 5: Show status
echo ""
echo "5️⃣ Checking system status..."
./status.sh

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📚 Documentation:"
echo "  - README.md: Full documentation"
echo "  - ./dev.sh: Development commands"
echo "  - ./status.sh: System health check"
echo ""
echo "🚀 Next Steps:"
echo "  1. Commit the workflow files: git add .github/ && git commit -m 'Add mobile CI/CD'"
echo "  2. Push to trigger builds: git push origin main"
echo "  3. Monitor builds at: https://github.com/YOUR_REPO/actions"
echo ""
echo "💡 Tips:"
echo "  - iOS builds only run when iOS files change (saves macOS runner time)"
echo "  - Android builds only run when Android files change (saves money)"
echo "  - All builds connect to your Jenkins API at 138.197.72.196"
echo "  - Pre-commit hooks ensure code quality before push"