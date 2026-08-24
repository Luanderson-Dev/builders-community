# Contexto de build: RAIZ do repositório
# Local:  docker build -f backend/Dockerfile .
# ---- build ----
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY backend/mvnw ./
COPY backend/.mvn .mvn
COPY backend/pom.xml ./
RUN ./mvnw -q -B dependency:go-offline
COPY backend/src ./src
RUN ./mvnw -q -B package -DskipTests

# ---- runtime ----
FROM eclipse-temurin:25-jre
WORKDIR /app
RUN useradd --system --create-home spring
COPY --from=build /app/target/*.jar app.jar
USER spring
EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70.0", "-jar", "app.jar"]
