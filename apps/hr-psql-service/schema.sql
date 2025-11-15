-- hr-ai-platform/schema.sql

-- Таблица кандидатов
CREATE TABLE candidates (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    experience TEXT,
    goals TEXT,
    skills JSONB,
    learning_progress JSONB
);

-- Таблица вакансий
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    department VARCHAR,
    level VARCHAR,
    description TEXT,
    required_skills JSONB,
    preferred_skills JSONB,
    status VARCHAR DEFAULT 'draft'
);

-- Таблица матчинга
CREATE TABLE matches (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER REFERENCES candidates(id) ON DELETE CASCADE,
    job_id INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
    match_score REAL,
    ai_explanation TEXT,
    recommendation_text TEXT,
    missing_skills JSONB
);

-- Индексы для производительности
CREATE INDEX idx_candidates_email ON candidates(email);
CREATE INDEX idx_jobs_title ON jobs(title);
CREATE INDEX idx_matches_candidate ON matches(candidate_id);
CREATE INDEX idx_matches_job ON matches(job_id);