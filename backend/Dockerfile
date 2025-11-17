# Build Stage
FROM node:18-alpine AS development
WORKDIR /usr/src/app

# Configure npm (uncomment if network is unstable)
# RUN npm config set registry https://registry.npmmirror.com

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code and build
COPY . .
RUN npm run build

# Production Stage
FROM node:18-alpine AS production
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}
WORKDIR /usr/src/app

# Configure npm
# RUN npm config set registry https://registry.nppmirror.com

# Install production dependencies only
COPY package*.json ./
RUN npm install --only=production --legacy-peer-deps

# Copy build artifacts
COPY --from=development /usr/src/app/dist ./dist

CMD ["node", "dist/main"]