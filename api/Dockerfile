# Docker Image which is used as foundation to create
# a custom Docker Image with this Dockerfile
FROM node:12-alpine

RUN npm i nodemon -g

# A directory within the virtualized Docker environment
# Becomes more relevant when using Docker Compose later
WORKDIR /usr/app

# Copies package.json and package-lock.json to Docker environment
COPY package*.json ./

# Installs all node packages
RUN npm install

# Copies everything over to Docker environment
COPY ./src ./src

# Uses port which is used by the actual application
EXPOSE 4000

# Finally runs the application
CMD [ "npm", "run", "server"]