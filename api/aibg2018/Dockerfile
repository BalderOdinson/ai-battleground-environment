# Docker Image which is used as foundation to create
# a custom Docker Image with this Dockerfile
FROM openjdk:8

# A directory within the virtualized Docker environment
# Becomes more relevant when using Docker Compose later
WORKDIR /usr/app

COPY . .

RUN mkdir games

# Uses port which is used by the actual application
EXPOSE 9080

# Finally runs the application
CMD [ "java", "-jar", "build.jar"]