# Use official Node.js runtime
FROM node:20-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server code
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Expose port (Cloud Run will set PORT env variable)
EXPOSE 8080

# Start server
CMD ["node", "index.js"]
