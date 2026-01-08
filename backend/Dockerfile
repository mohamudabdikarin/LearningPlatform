FROM eclipse-temurin:17-jdk-alpine

WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
COPY pom.xml .

# Make Maven wrapper executable
RUN chmod +x ./mvnw

# Download dependencies
RUN ./mvnw dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN ./mvnw clean package -DskipTests

# Expose port
EXPOSE $PORT

# Set environment
ENV SPRING_PROFILES_ACTIVE=prod

# Run the application
CMD java -Dserver.port=$PORT -jar target/e-learning-platform-0.0.1-SNAPSHOT.jar