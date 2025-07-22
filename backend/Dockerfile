FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Build TypeScript
RUN npm run build

# Create data directory
RUN mkdir -p /app/data

# Copy critical data files
COPY data/flightDurations.json /app/data/
COPY data/airports.json /app/data/

# Expose port
EXPOSE 3000

# NUCLEAR ENFORCEMENT: Health check that kills container on time handling violations
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e " \
    const http = require('http'); \
    http.get('http://localhost:3000/api/time-handling-integrity', (res) => { \
      if (res.statusCode !== 200) { \
        console.error('TIME HANDLING COMPROMISED - KILLING CONTAINER'); \
        process.exit(1); \
      } \
      res.on('data', (data) => { \
        const result = JSON.parse(data); \
        if (result.status !== 'SECURE') { \
          console.error('TIME HANDLING VIOLATIONS:', result.violations); \
          process.exit(1); \
        } \
      }); \
    }).on('error', () => process.exit(1)); \
  "

# Start application
CMD ["node", "dist/server.js"]