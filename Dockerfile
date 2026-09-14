# Etapa de build: resolve dependencias em uma camada separada para aproveitar o cache do Docker.
FROM eclipse-temurin:25-jdk AS build
WORKDIR /app

COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

COPY src src
RUN ./mvnw -B -q clean package -DskipTests

# Etapa de execucao: imagem enxuta, usuario sem privilegios.
FROM eclipse-temurin:25-jre
WORKDIR /app

RUN useradd --system --no-create-home --shell /usr/sbin/nologin app
COPY --from=build /app/target/*.jar app.jar
USER app

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
