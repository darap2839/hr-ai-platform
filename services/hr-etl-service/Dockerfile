FROM eclipse-temurin:latest

WORKDIR /app

COPY build/libs/*.jar app.jar

EXPOSE 8080 8443
ENTRYPOINT ["java", "-Xms1g", "-Xmx1g", "-XX:+UseG1GC", "-XX:MaxGCPauseMillis=50", "-XX:+AlwaysPreTouch", "-XX:ActiveProcessorCount=2", "-jar", "app.jar"]