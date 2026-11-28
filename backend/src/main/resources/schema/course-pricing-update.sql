-- Approved Phase 27 course pricing for LOCAL/TEST databases only.
-- NEVER run against Aiven or any production database.
-- Idempotent: safe to re-run; matches by exact existing slug, never inserts or deletes courses.
-- The application seeder applies the same values to newly created local/test rows.

-- PAID courses (approved four only)
UPDATE courses SET course_type = 'PAID', price = 299.00, currency = 'INR' WHERE slug = 'java-foundations';
UPDATE courses SET course_type = 'PAID', price = 349.00, currency = 'INR' WHERE slug = 'dsa-essentials';
UPDATE courses SET course_type = 'PAID', price = 399.00, currency = 'INR' WHERE slug = 'spring-boot-backend';
UPDATE courses SET course_type = 'PAID', price = 449.00, currency = 'INR' WHERE slug = 'fullstack-projects';

-- FREE courses (in-code catalog)
UPDATE courses SET course_type = 'FREE', price = 0.00, currency = 'INR' WHERE slug IN (
  'sql-mastery', 'react-frontend', 'job-preparation'
);

-- FREE courses (JSON catalog)
UPDATE courses SET course_type = 'FREE', price = 0.00, currency = 'INR' WHERE slug IN (
  'java-programming', 'python-programming', 'javascript', 'html-css', 'react-js',
  'sql-mysql', 'spring-boot', 'data-structures-algorithms', 'git-github',
  'full-stack-web-development'
);
