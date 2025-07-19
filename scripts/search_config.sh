#!/bin/bash

echo "🔍 SEARCHING FOR API CONFIGURATIONS IN PROJECT..."
echo "=================================================="

# Function to search in a directory with exclusions
search_dir() {
    local dir=$1
    local term=$2
    local label=$3
    
    if [ -d "$dir" ]; then
        echo ""
        echo "📁 $label - Searching for: $term"
        echo "----------------------------------------"
        grep -r "$term" "$dir" \
            --exclude-dir=node_modules \
            --exclude-dir=build \
            --exclude-dir=dist \
            --exclude-dir=.git \
            --exclude-dir=coverage \
            --exclude-dir=.dart_tool \
            --exclude-dir=.flutter-plugins-dependencies \
            --exclude="*.log" \
            --exclude="*.lock" \
            --exclude="package-lock.json" \
            --exclude="pubspec.lock" \
            2>/dev/null || echo "   No matches found"
    else
        echo "❌ Directory $dir not found"
    fi
}

# Search terms
TERMS=("localhost" "3000\|3001" "http://" "graphql")
TERM_LABELS=("LOCALHOST" "PORTS (3000/3001)" "HTTP URLs" "GRAPHQL")

# Directories to search
DIRS=("web" "api" "shared" "mobile")
DIR_LABELS=("WEB APP" "API" "SHARED" "MOBILE")

# Search each term in each directory
for i in "${!TERMS[@]}"; do
    echo ""
    echo "🔎 SEARCHING FOR: ${TERM_LABELS[$i]}"
    echo "=================================================="
    
    for j in "${!DIRS[@]}"; do
        search_dir "${DIRS[$j]}" "${TERMS[$i]}" "${DIR_LABELS[$j]}"
    done
    
    echo ""
    echo "=================================================="
done

echo ""
echo "✅ SEARCH COMPLETE!"
echo ""
echo "🎯 WHAT TO LOOK FOR:"
echo "   • localhost references (need to change to production URL)"
echo "   • Hardcoded ports 3000/3001 (need environment variables)"
echo "   • HTTP URLs (should use HTTPS in production)"
echo "   • GraphQL endpoints (need to point to production)"