# Use official Node.js runtime
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy server code
COPY . .

# Create data directory for file-based storage
RUN mkdir -p /app/data

# Cloud Run sets PORT environment variable
ENV PORT=8080

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/', (res) => process.exit(res.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "index.js"]
