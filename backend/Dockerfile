FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose port 8000
EXPOSE 8000

# Command to run the application
CMD ["npm", "run", "dev"]