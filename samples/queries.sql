-- Посмотреть всех кандидатов
SELECT * FROM candidates;

-- Посмотреть матчи для кандидата с id=1
SELECT
    j.title,
    m.match_score,
    m.missing_skills
FROM matches m
JOIN jobs j ON m.job_id = j.id
WHERE m.candidate_id = 1;

-- Найти кандидатов с навыком "Python"
SELECT * FROM candidates
WHERE skills ? 'Python';