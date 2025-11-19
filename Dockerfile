# Dockerfile for Google Cloud Run Backend
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server code
COPY server ./server

# Expose port (Cloud Run uses PORT env variable)
EXPOSE 8080

# Environment variable for Cloud Run
ENV PORT=8080
ENV NODE_ENV=production

# Start the server
CMD ["node", "server/index.js"]
