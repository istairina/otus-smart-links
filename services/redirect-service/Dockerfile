FROM node:22

WORKDIR /app

# Copy package files for workspace setup
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY services/redirect-service/package.json ./services/redirect-service/

# Install dependencies (this will link workspace packages)
# Ignore scripts to prevent postinstall from running before files are copied
RUN npm install --ignore-scripts

# Copy source files
COPY shared ./shared
COPY services/redirect-service ./services/redirect-service
COPY tsconfig.json ./

# Build shared types first, then the service
WORKDIR /app/shared
RUN npm run build

WORKDIR /app/services/redirect-service
RUN npm run build

WORKDIR /app/services/redirect-service

EXPOSE 3000

CMD ["node", "dist/server.js"]
