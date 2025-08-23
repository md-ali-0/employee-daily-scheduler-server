# Use a lightweight Node.js image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json (or yarn.lock/pnpm-lock.yaml)
COPY package*.json ./

# Install dependencies
# Use --omit=dev to skip dev dependencies in production
RUN npm install --omit=dev

# Copy source code
COPY . .

# Generate Prisma client
# This needs to be done after copying all files and installing dependencies
# as it depends on the schema.prisma and @prisma/client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
