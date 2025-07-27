# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Install system dependencies required by the application, like qpdf
RUN apt-get update && apt-get install -y qpdf && \
    # Clean up apt-get cache to reduce image size
    rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to leverage Docker's layer caching
COPY package*.json ./

# Install application dependencies using npm ci for deterministic builds, omitting dev dependencies
RUN npm ci --omit=dev

# Copy the rest of the application's source code
COPY . .

# The application will listen on the port provided by Railway's PORT env var.
# EXPOSE is for documentation and doesn't publish the port.
EXPOSE 3000

# Command to run the application
CMD ["node", "index.js"]
