```mermaid
graph TD
    Web[hr-web-service] --> API[hr-api-service]
    API --> ETL[hr-etl-service]
    API --> Job[hr-job-service]
    API --> Matching[hr-matching-service]
    API --> Analytics[hr-analytics-service]

    ETL --> DB[hr-psql-service]
    Job --> DB
    Matching --> DB
    Analytics --> DB

    ETL --> Ontology[hr-ontology-service]
    Matching --> Ontology
