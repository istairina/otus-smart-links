FROM node:22

WORKDIR /app

# Copy package files for workspace setup
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY services/db/package.json ./services/db/

# Install dependencies (this will link workspace packages)
# Ignore scripts to prevent postinstall from running before files are copied
RUN npm install --ignore-scripts

# Copy source files
COPY shared ./shared
COPY services/db ./services/db
COPY tsconfig.json ./

# Build shared types first, then the service
WORKDIR /app/shared
RUN npm run build

WORKDIR /app/services/db
RUN npm run build

WORKDIR /app/services/db

EXPOSE 5000

CMD ["node", "dist/server.js"]
