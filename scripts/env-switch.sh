#!/bin/bash

case "$1" in
  "dev"|"development")
    echo "🔧 Switching to DEVELOPMENT mode"
    export NODE_ENV=development
    export VITE_MODE=development
    echo "✅ Ready for local development"
    echo "   • Web: http://localhost:3001"  
    echo "   • API: http://localhost:3000"
    echo "   • GraphQL: http://localhost:3000/graphql"
    ;;
  "prod"|"production") 
    echo "🚀 Switching to PRODUCTION mode"
    export NODE_ENV=production
    export VITE_MODE=production
    echo "✅ Ready for production build"
    echo "   • Web: http://138.197.72.196:8080"
    echo "   • API: http://138.197.72.196:3000" 
    echo "   • GraphQL: http://138.197.72.196:3000/graphql"
    ;;
  *)
    echo "Usage: $0 {dev|prod}"
    echo "  dev  - Switch to development mode"
    echo "  prod - Switch to production mode"
    exit 1
    ;;
esac