curl -sSf http://localhost:3000/health || exit 1
curl -sSf http://localhost:3000/api/v1/status || exit 1