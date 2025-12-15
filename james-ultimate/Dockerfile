# James Ultimate - Docker Image
# Optimized for Rancher and SUSE Linux

FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Production image
FROM node:18-alpine

WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    dumb-init \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S james && \
    adduser -S james -u 1001 -G james

# Copy from builder
COPY --from=builder --chown=james:james /app/node_modules ./node_modules
COPY --from=builder --chown=james:james /app/src ./src
COPY --from=builder --chown=james:james /app/public ./public
COPY --from=builder --chown=james:james /app/package.json ./

# Create config directory
RUN mkdir -p /app/config && chown james:james /app/config

# Switch to non-root user
USER james

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the server
CMD ["node", "src/server.js"]