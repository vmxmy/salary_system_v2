# Stage 1: Build the React application
FROM node:18 AS builder

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock)
# Source path is relative to the build context (project root)
COPY frontend/salary-viewer/package*.json /app/

# Install dependencies
RUN npm install

# Copy the rest of the frontend application code
# Source path is relative to the build context (project root)
COPY frontend/salary-viewer/ /app/

# Build the application for production
RUN npm run build

# Stage 2: Serve the built application with Nginx
FROM nginx:stable-alpine

# Copy the build output from the builder stage
# The path inside the builder container (/app/dist) should still be correct
COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx config is now mounted via volume, no need to copy here

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 