# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn clean package -DskipTests

# Run stage - JDK 21 + Python 3 + Node.js for reliable container execution
FROM eclipse-temurin:21-jdk
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends `
    python3 `
    nodejs `
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/srh-codeverse-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]