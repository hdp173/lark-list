# Build Stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package files and install dependencies (utilize Docker cache layer)
COPY package*.json ./
RUN npm install --legacy-peer-deps && \
    npm rebuild @rollup/rollup-linux-x64-musl

# Copy source code and build
COPY . .
RUN npm run build

# Serve Stage (Nginx)
FROM nginx:alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
