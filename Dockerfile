# Step 1: Use a Node.js base image
FROM node:18

# Step 2: Set the working directory inside the container
WORKDIR C:\_MyWork\Formacao\accounting-app-server

# Step 3: Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the application code
COPY . .

# Step 6: Expose the port that the API will run on
EXPOSE 3000

# Step 7: Command to run the application
CMD ["node", "index.js"]
