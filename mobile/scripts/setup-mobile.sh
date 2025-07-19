#!/bin/bash
# setup-mobile.sh
# One-time setup for mobile development

echo "📱 Setting up mobile development..."
echo "================================="

# Make run script executable
if [ -f "mobile/run.sh" ]; then
    chmod +x mobile/run.sh
    echo "✅ Made mobile/run.sh executable"
fi

# Create .gitignore entries if needed
if ! grep -q "\.env" mobile/.gitignore 2>/dev/null; then
    echo "" >> mobile/.gitignore
    echo "# Local environment" >> mobile/.gitignore
    echo ".env" >> mobile/.gitignore
    echo ".env.local" >> mobile/.gitignore
    echo "✅ Updated .gitignore"
fi

# Get dependencies
cd mobile
echo "📦 Getting Flutter dependencies..."
flutter pub get

# Run flutter doctor
echo ""
echo "🏥 Flutter Doctor:"
flutter doctor -v

cd ..

echo ""
echo "✅ Mobile setup complete!"
echo ""
echo "📚 Usage:"
echo "  make mobile     - Auto-detect device and run"
echo "  make dev-mobile - Start backend + mobile"
echo ""
echo "🎯 The app will automatically use the correct API endpoint based on your device type."
echo "   No manual configuration needed!"