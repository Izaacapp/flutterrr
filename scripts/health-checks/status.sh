#!/bin/bash
# status.sh - Quick CI/CD health check dashboard

echo "🎯 CI/CD Status Dashboard"
echo "========================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Jenkins
echo "🔧 Jenkins Status:"
jenkins_status=$(curl -s -o /dev/null -w "%{http_code}" http://138.197.72.196:8080 2>/dev/null || echo "000")
if [ "$jenkins_status" = "200" ]; then
    echo -e "  Web UI: ${GREEN}✓ Online${NC} (http://138.197.72.196:8080)"
else
    echo -e "  Web UI: ${RED}✗ Offline${NC} (HTTP $jenkins_status)"
fi

# Check API
echo ""
echo "🌐 API Status:"
api_status=$(curl -s -o /dev/null -w "%{http_code}" http://138.197.72.196:5000/api/health 2>/dev/null || echo "000")
if [ "$api_status" = "200" ]; then
    echo -e "  Health: ${GREEN}✓ Healthy${NC} (http://138.197.72.196:5000/api)"
    
    # Try to get API version
    version=$(curl -s http://138.197.72.196:5000/api/version 2>/dev/null | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    [ -n "$version" ] && echo "  Version: $version"
else
    echo -e "  Health: ${RED}✗ Unhealthy${NC} (HTTP $api_status)"
fi

# Check React Web
echo ""
echo "⚛️  React Web Status:"
web_status=$(curl -s -o /dev/null -w "%{http_code}" http://138.197.72.196:8080 2>/dev/null || echo "000")
if [ "$web_status" = "200" ] || [ "$web_status" = "304" ]; then
    echo -e "  Status: ${GREEN}✓ Online${NC} (http://138.197.72.196:8080)"
else
    echo -e "  Status: ${RED}✗ Offline${NC} (HTTP $web_status)"
fi

# Check GitHub Actions (requires gh CLI)
if command -v gh &> /dev/null; then
    echo ""
    echo "🚀 GitHub Actions Status:"
    echo "  Recent workflow runs:"
    
    # Get recent workflow runs
    gh run list --limit 5 --repo . 2>/dev/null | while read -r line; do
        status=$(echo "$line" | awk '{print $1}')
        workflow=$(echo "$line" | awk '{print $3}')
        
        case $status in
            "completed")
                echo -e "  ${GREEN}✓${NC} $workflow"
                ;;
            "failure")
                echo -e "  ${RED}✗${NC} $workflow"
                ;;
            "in_progress")
                echo -e "  ${YELLOW}⟳${NC} $workflow"
                ;;
        esac
    done
else
    echo ""
    echo "ℹ️  Install GitHub CLI for workflow status: https://cli.github.com"
fi

# Local environment check
echo ""
echo "💻 Local Environment:"

# Flutter
if command -v flutter &> /dev/null; then
    flutter_version=$(flutter --version | grep "Flutter" | awk '{print $2}')
    echo -e "  Flutter: ${GREEN}✓${NC} $flutter_version"
else
    echo -e "  Flutter: ${RED}✗ Not installed${NC}"
fi

# Platform-specific checks
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS - check for Xcode
    if command -v xcodebuild &> /dev/null; then
        xcode_version=$(xcodebuild -version | head -1)
        echo -e "  Xcode: ${GREEN}✓${NC} $xcode_version"
    else
        echo -e "  Xcode: ${RED}✗ Not installed${NC}"
    fi
else
    # Linux/Windows - check for Android SDK
    if [ -n "$ANDROID_HOME" ] || [ -n "$ANDROID_SDK_ROOT" ]; then
        echo -e "  Android SDK: ${GREEN}✓${NC} Found"
    else
        echo -e "  Android SDK: ${YELLOW}⚠${NC} Not configured"
    fi
fi

# Git status
echo ""
echo "📝 Repository Status:"
if [ -d .git ]; then
    branch=$(git branch --show-current 2>/dev/null)
    echo "  Branch: $branch"
    
    # Check for uncommitted changes
    if git diff-index --quiet HEAD -- 2>/dev/null; then
        echo -e "  Changes: ${GREEN}✓ Clean${NC}"
    else
        echo -e "  Changes: ${YELLOW}⚠ Uncommitted changes${NC}"
    fi
    
    # Check if up to date
    git fetch origin $branch --quiet 2>/dev/null
    LOCAL=$(git rev-parse @ 2>/dev/null)
    REMOTE=$(git rev-parse @{u} 2>/dev/null)
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "  Sync: ${GREEN}✓ Up to date${NC}"
    else
        echo -e "  Sync: ${YELLOW}⚠ Behind origin${NC}"
    fi
fi

echo ""
echo "========================"
echo "Run './dev.sh check-api' for detailed API testing"