-- hr-ai-platform/seed.sql
INSERT INTO candidates (name, email, experience, goals, skills, learning_progress)
VALUES (
    'Алексей',
    'alex@example.com',
    '2 года Python-разработчиком',
    'Стать DevOps-инженером',
    '["Python", "Django", "SQL"]',
    '{}'
);

INSERT INTO jobs (title, department, level, description, required_skills, status)
VALUES (
    'Middle DevOps Engineer',
    'Infrastructure',
    'Middle',
    'Ищем инженера для автоматизации деплоя...',
    '["Docker", "Kubernetes", "AWS"]',
    'published'
);