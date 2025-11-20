FROM node:22

WORKDIR /app

# Copy package files for workspace setup
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY services/rules-service/package.json ./services/rules-service/

# Install dependencies (this will link workspace packages)
# Ignore scripts to prevent postinstall from running before files are copied
RUN npm install --ignore-scripts

# Copy source files
COPY shared ./shared
COPY services/rules-service ./services/rules-service
COPY tsconfig.json ./

# Build shared types first, then the service
WORKDIR /app/shared
RUN npm run build

WORKDIR /app/services/rules-service
RUN npm run build

WORKDIR /app/services/rules-service

EXPOSE 4000

CMD ["node", "dist/server.js"]
