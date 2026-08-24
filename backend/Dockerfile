# ---- build ----
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY mvnw ./
COPY .mvn .mvn
COPY pom.xml ./
RUN ./mvnw -q -B dependency:go-offline
COPY src ./src
RUN ./mvnw -q -B package -DskipTests

# ---- runtime ----
FROM eclipse-temurin:25-jre
WORKDIR /app
RUN useradd --system --create-home spring
COPY --from=build /app/target/*.jar app.jar
USER spring
EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=70.0", "-jar", "app.jar"]
