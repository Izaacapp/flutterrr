#!/bin/bash
echo "LOCAL: "
curl -s http://localhost:3000/health && echo " ✅ API" || echo " ❌ API"
echo ""
echo "PRODUCTION: "
curl -s http://138.197.72.196:3000/health && echo " ✅ API" || echo " ❌ API"
