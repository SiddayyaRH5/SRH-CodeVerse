# syntax=docker/dockerfile:1
# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY settings.xml ./settings.xml
# Resolve dependencies into a BuildKit cache so source-only rebuilds do not
# repeatedly download from Maven Central (reduces HTTP 429 rate-limit failures).
# Maven is pointed at the trusted Google Maven Central mirror (see settings.xml)
# so dependency resolution does not hit Sonatype rate limits on Render's shared
# egress IP. Retry flags remain as a backstop for transient mirror failures.
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -ntp -s /app/settings.xml \
      -Daether.transport.http.retryHandler.count=6 \
      -Daether.transport.http.retryHandler.interval=3000 \
      dependency:go-offline -DskipTests
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn -B -ntp -s /app/settings.xml \
      -Daether.transport.http.retryHandler.count=6 \
      -Daether.transport.http.retryHandler.interval=3000 \
      clean package -DskipTests

# Run stage - JDK 21 + Python 3 + Node.js for reliable container execution
FROM eclipse-temurin:21-jdk
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/target/srh-codeverse-backend-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]