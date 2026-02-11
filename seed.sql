-- ============================================
-- COMPREHENSIVE SEED DATA
-- Inserts synthetic data across all 14 tables
-- ============================================

BEGIN;

-- ============================================
-- 1. DEPARTMENTS (8)
-- ============================================
INSERT INTO departments (id, name) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Engineering'),
  ('a0000000-0000-0000-0000-000000000002', 'Product'),
  ('a0000000-0000-0000-0000-000000000003', 'Design'),
  ('a0000000-0000-0000-0000-000000000004', 'Sales'),
  ('a0000000-0000-0000-0000-000000000005', 'Marketing'),
  ('a0000000-0000-0000-0000-000000000006', 'Operations'),
  ('a0000000-0000-0000-0000-000000000007', 'Finance'),
  ('a0000000-0000-0000-0000-000000000008', 'Human Resources')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 2. CV UPLOADERS (3)
-- ============================================
INSERT INTO cv_uploaders (id, name) VALUES
  ('b0000000-0000-0000-0000-000000000001', 'HR Admin'),
  ('b0000000-0000-0000-0000-000000000002', 'Recruitment Team'),
  ('b0000000-0000-0000-0000-000000000003', 'Hiring Manager');

-- ============================================
-- 3. JOB ORDERS (6) - mix of statuses, depts, levels
-- ============================================
INSERT INTO job_orders (id, jo_number, title, description, department_name, department_id, level, quantity, hired_count, employment_type, requestor_name, required_date, status, created_at) VALUES
  ('c0000000-0000-0000-0000-000000000001', 'JO-2026-001', 'Senior Full-Stack Developer',
   'We are looking for an experienced full-stack developer proficient in React, Node.js, and cloud services. The ideal candidate will lead feature development and mentor junior engineers.',
   'Engineering', 'a0000000-0000-0000-0000-000000000001', 'L3', 3, 1, 'full_time',
   'Maria Santos', '2026-03-15', 'open', NOW() - INTERVAL '30 days'),

  ('c0000000-0000-0000-0000-000000000002', 'JO-2026-002', 'Product Manager',
   'Seeking a product manager to own the roadmap for our AI recruitment platform. Must have experience with B2B SaaS products and agile methodologies.',
   'Product', 'a0000000-0000-0000-0000-000000000002', 'L4', 1, 0, 'full_time',
   'Jose Reyes', '2026-04-01', 'open', NOW() - INTERVAL '20 days'),

  ('c0000000-0000-0000-0000-000000000003', 'JO-2026-003', 'UX/UI Designer',
   'Looking for a creative UX/UI designer to redesign our candidate portal and improve the recruiter dashboard experience.',
   'Design', 'a0000000-0000-0000-0000-000000000003', 'L2', 2, 0, 'full_time',
   'Anna Cruz', '2026-03-01', 'pooling', NOW() - INTERVAL '45 days'),

  ('c0000000-0000-0000-0000-000000000004', 'JO-2026-004', 'DevOps Engineer',
   'We need a DevOps engineer to manage CI/CD pipelines, Kubernetes clusters, and cloud infrastructure on Azure.',
   'Engineering', 'a0000000-0000-0000-0000-000000000001', 'L3', 1, 0, 'full_time',
   'Carlos Tan', '2026-02-28', 'on_hold', NOW() - INTERVAL '60 days'),

  ('c0000000-0000-0000-0000-000000000005', 'JO-2025-010', 'Sales Executive',
   'Join our growing sales team to drive enterprise deals in the Southeast Asian market.',
   'Sales', 'a0000000-0000-0000-0000-000000000004', 'L2', 2, 2, 'full_time',
   'Rico Lim', '2025-12-15', 'closed', NOW() - INTERVAL '90 days'),

  ('c0000000-0000-0000-0000-000000000006', 'JO-2025-008', 'Marketing Intern',
   'Part-time marketing intern to support social media campaigns and content creation.',
   'Marketing', 'a0000000-0000-0000-0000-000000000005', 'L1', 3, 1, 'part_time',
   'Lisa Go', '2025-11-01', 'archived', NOW() - INTERVAL '120 days');

-- ============================================
-- 4. CANDIDATES (15) - mix of internal/external
-- ============================================
INSERT INTO candidates (id, full_name, email, phone, applicant_type, skills, positions_fit_for, years_of_experience, years_of_experience_text, educational_background, current_position, current_company, availability, preferred_work_setup, preferred_employment_type, expected_salary, earliest_start_date, linkedin, qualification_score, overall_summary, strengths, weaknesses, processing_status, notice_period, created_at) VALUES

-- Candidate 1: Strong senior dev
('d0000000-0000-0000-0000-000000000001', 'Juan Dela Cruz', 'juan.delacruz@email.com', '+63-917-111-0001',
 'external', ARRAY['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS'],
 ARRAY['Senior Full-Stack Developer', 'Tech Lead'], 8, '8 years',
 'BS Computer Science - UP Diliman', 'Senior Software Engineer', 'Accenture Philippines',
 'Immediate', 'Remote', 'full_time', 'PHP 120,000/month', '2026-03-01',
 'https://linkedin.com/in/juandelacruz', 92,
 'Highly experienced full-stack developer with strong cloud and database skills. Excellent communicator with leadership potential.',
 ARRAY['Strong technical skills', 'Leadership experience', 'Cloud architecture expertise'],
 ARRAY['Limited mobile development experience'], 'completed', '30 days', NOW() - INTERVAL '25 days'),

-- Candidate 2: Mid-level dev
('d0000000-0000-0000-0000-000000000002', 'Maria Garcia', 'maria.garcia@email.com', '+63-918-222-0002',
 'external', ARRAY['React', 'JavaScript', 'Python', 'Django', 'MySQL'],
 ARRAY['Full-Stack Developer', 'Frontend Developer'], 5, '5 years',
 'BS Information Technology - Ateneo de Manila', 'Software Developer', 'Globe Telecom',
 '2 weeks', 'Hybrid', 'full_time', 'PHP 90,000/month', '2026-03-15',
 'https://linkedin.com/in/mariagarcia', 78,
 'Solid mid-level developer with a good mix of frontend and backend skills. Shows initiative and good problem-solving abilities.',
 ARRAY['Quick learner', 'Strong problem-solving', 'Good team player'],
 ARRAY['Needs more experience with cloud services', 'Limited TypeScript knowledge'], 'completed', '15 days', NOW() - INTERVAL '22 days'),

-- Candidate 3: Internal candidate
('d0000000-0000-0000-0000-000000000003', 'Carlos Santos', 'carlos.santos@company.com', '+63-919-333-0003',
 'internal', ARRAY['React', 'TypeScript', 'Azure', 'C#', '.NET'],
 ARRAY['Senior Full-Stack Developer', 'DevOps Engineer'], 6, '6 years',
 'BS Computer Engineering - DLSU', 'Software Engineer II', 'Current Company',
 'Immediate', 'Onsite', 'full_time', 'PHP 100,000/month', '2026-02-15',
 'https://linkedin.com/in/carlossantos', 85,
 'Strong internal candidate with deep knowledge of our tech stack and culture. Ready for a senior role.',
 ARRAY['Deep company knowledge', 'Azure expertise', 'Strong .NET skills'],
 ARRAY['Could improve frontend design skills'], 'completed', 'Immediate', NOW() - INTERVAL '20 days'),

-- Candidate 4: Product manager
('d0000000-0000-0000-0000-000000000004', 'Ana Reyes', 'ana.reyes@email.com', '+63-920-444-0004',
 'external', ARRAY['Product Strategy', 'Agile', 'Jira', 'SQL', 'Data Analysis'],
 ARRAY['Product Manager', 'Product Owner'], 7, '7 years',
 'MBA - Asian Institute of Management', 'Product Manager', 'Grab Philippines',
 '1 month', 'Hybrid', 'full_time', 'PHP 150,000/month', '2026-04-01',
 'https://linkedin.com/in/anareyes', 88,
 'Experienced product manager with B2B SaaS background. Strong strategic thinking and data-driven decision making.',
 ARRAY['Strategic thinker', 'Data-driven', 'Excellent stakeholder management'],
 ARRAY['Limited technical depth in AI/ML'], 'completed', '30 days', NOW() - INTERVAL '18 days'),

-- Candidate 5: Designer
('d0000000-0000-0000-0000-000000000005', 'Miguel Torres', 'miguel.torres@email.com', '+63-921-555-0005',
 'external', ARRAY['Figma', 'Adobe XD', 'UI Design', 'User Research', 'Prototyping'],
 ARRAY['UX/UI Designer', 'Product Designer'], 4, '4 years',
 'BFA Visual Communication - UST', 'UI/UX Designer', 'Canva Philippines',
 '2 weeks', 'Remote', 'full_time', 'PHP 80,000/month', '2026-03-01',
 'https://linkedin.com/in/migueltorres', 82,
 'Creative designer with strong portfolio and user research skills. Passionate about accessible design.',
 ARRAY['Strong visual design', 'User research skills', 'Great portfolio'],
 ARRAY['Limited experience with design systems at scale'], 'completed', '15 days', NOW() - INTERVAL '40 days'),

-- Candidate 6: Junior dev
('d0000000-0000-0000-0000-000000000006', 'Patricia Lim', 'patricia.lim@email.com', '+63-922-666-0006',
 'external', ARRAY['JavaScript', 'HTML', 'CSS', 'React', 'Git'],
 ARRAY['Junior Developer', 'Frontend Developer'], 2, '2 years',
 'BS Computer Science - Mapua University', 'Junior Developer', 'Freelance',
 'Immediate', 'Onsite', 'full_time', 'PHP 45,000/month', '2026-02-20',
 'https://linkedin.com/in/patricialim', 55,
 'Junior developer with potential. Needs mentorship but shows eagerness to learn and grow.',
 ARRAY['Eager learner', 'Good fundamentals', 'Strong work ethic'],
 ARRAY['Limited professional experience', 'Needs mentorship', 'No backend experience'], 'completed', 'Immediate', NOW() - INTERVAL '35 days'),

-- Candidate 7: DevOps
('d0000000-0000-0000-0000-000000000007', 'Roberto Aquino', 'roberto.aquino@email.com', '+63-923-777-0007',
 'external', ARRAY['Kubernetes', 'Docker', 'Terraform', 'Azure', 'AWS', 'CI/CD'],
 ARRAY['DevOps Engineer', 'Cloud Engineer'], 6, '6 years',
 'BS Information Systems - UP Los Baños', 'DevOps Lead', 'Accenture Philippines',
 '1 month', 'Remote', 'full_time', 'PHP 130,000/month', '2026-04-01',
 'https://linkedin.com/in/robertoaquino', 90,
 'Highly skilled DevOps engineer with extensive cloud infrastructure and automation experience.',
 ARRAY['Deep cloud expertise', 'Strong automation skills', 'Security-conscious'],
 ARRAY['Limited development experience'], 'completed', '30 days', NOW() - INTERVAL '55 days'),

-- Candidate 8: Another designer
('d0000000-0000-0000-0000-000000000008', 'Sofia Mendoza', 'sofia.mendoza@email.com', '+63-924-888-0008',
 'internal', ARRAY['Figma', 'Sketch', 'CSS', 'Design Systems', 'Accessibility'],
 ARRAY['UX/UI Designer'], 3, '3 years',
 'BS Multimedia Arts - De La Salle-College of Saint Benilde', 'Junior Designer', 'Current Company',
 'Immediate', 'Hybrid', 'full_time', 'PHP 60,000/month', '2026-02-15',
 'https://linkedin.com/in/sofiamendoza', 70,
 'Promising internal designer with good design system knowledge. Would benefit from more UX research experience.',
 ARRAY['Design system expertise', 'Accessibility awareness', 'Team collaboration'],
 ARRAY['Needs more UX research experience', 'Limited motion design skills'], 'completed', 'Immediate', NOW() - INTERVAL '38 days'),

-- Candidate 9: Sales exec (hired)
('d0000000-0000-0000-0000-000000000009', 'David Villanueva', 'david.villa@email.com', '+63-925-999-0009',
 'external', ARRAY['Enterprise Sales', 'CRM', 'Salesforce', 'Negotiation', 'B2B'],
 ARRAY['Sales Executive', 'Account Manager'], 5, '5 years',
 'BS Business Administration - Ateneo de Manila', 'Sales Manager', 'Oracle Philippines',
 'Immediate', 'Onsite', 'full_time', 'PHP 100,000/month + commission', '2025-12-01',
 'https://linkedin.com/in/davidvilla', 87,
 'Top-performing sales professional with strong enterprise deal experience in SEA market.',
 ARRAY['Strong closing skills', 'Enterprise experience', 'CRM expertise'],
 ARRAY['Limited startup experience'], 'completed', '30 days', NOW() - INTERVAL '85 days'),

-- Candidate 10: Sales exec (hired)
('d0000000-0000-0000-0000-000000000010', 'Rachel Tan', 'rachel.tan@email.com', '+63-926-000-0010',
 'external', ARRAY['Inside Sales', 'Lead Generation', 'HubSpot', 'Cold Calling'],
 ARRAY['Sales Executive', 'SDR'], 3, '3 years',
 'BS Marketing - UP Diliman', 'Sales Development Rep', 'Salesforce Philippines',
 'Immediate', 'Hybrid', 'full_time', 'PHP 70,000/month + commission', '2025-11-15',
 'https://linkedin.com/in/racheltan', 75,
 'Energetic sales professional with strong lead generation track record.',
 ARRAY['Great communication', 'Persistent', 'CRM proficiency'],
 ARRAY['Limited enterprise deal experience', 'Needs mentorship on large accounts'], 'completed', '15 days', NOW() - INTERVAL '88 days'),

-- Candidate 11: Rejected candidate
('d0000000-0000-0000-0000-000000000011', 'Kevin Ong', 'kevin.ong@email.com', '+63-927-111-0011',
 'external', ARRAY['Java', 'Spring Boot', 'Microservices'],
 ARRAY['Backend Developer'], 3, '3 years',
 'BS IT - FEU Institute of Technology', 'Java Developer', 'IBM Philippines',
 '2 weeks', 'Remote', 'full_time', 'PHP 70,000/month', '2026-03-01',
 'https://linkedin.com/in/kevinong', 42,
 'Candidate has decent Java skills but lacks the React/Node.js experience required for the role.',
 ARRAY['Solid Java foundation'],
 ARRAY['No frontend experience', 'Limited cloud knowledge', 'Poor communication in interview'], 'completed', '15 days', NOW() - INTERVAL '28 days'),

-- Candidate 12: Tech interview stage
('d0000000-0000-0000-0000-000000000012', 'Isabella Cruz', 'isabella.cruz@email.com', '+63-928-222-0012',
 'external', ARRAY['React', 'Node.js', 'TypeScript', 'MongoDB', 'GraphQL'],
 ARRAY['Full-Stack Developer', 'Senior Developer'], 5, '5 years',
 'BS Computer Science - Ateneo de Manila', 'Full-Stack Developer', 'PayMaya',
 '1 month', 'Remote', 'full_time', 'PHP 110,000/month', '2026-03-15',
 'https://linkedin.com/in/isabellacruz', 83,
 'Strong full-stack candidate with modern tech stack experience. Good cultural fit potential.',
 ARRAY['Modern stack expertise', 'Clean code advocate', 'Open source contributor'],
 ARRAY['Limited PostgreSQL experience', 'No Azure experience'], 'completed', '30 days', NOW() - INTERVAL '15 days'),

-- Candidate 13: HR interview stage
('d0000000-0000-0000-0000-000000000013', 'Mark Tan', 'mark.tan@email.com', '+63-929-333-0013',
 'external', ARRAY['React', 'Vue.js', 'JavaScript', 'Tailwind CSS'],
 ARRAY['Frontend Developer', 'Full-Stack Developer'], 4, '4 years',
 'BS Information Systems - UST', 'Frontend Developer', 'Shopee Philippines',
 '2 weeks', 'Hybrid', 'full_time', 'PHP 85,000/month', '2026-03-01',
 'https://linkedin.com/in/marktan', 72,
 'Decent frontend developer with e-commerce background. Still being evaluated.',
 ARRAY['Strong frontend skills', 'E-commerce experience'],
 ARRAY['Limited backend knowledge', 'No cloud experience'], 'completed', '15 days', NOW() - INTERVAL '10 days'),

-- Candidate 14: Another PM candidate
('d0000000-0000-0000-0000-000000000014', 'Grace Lee', 'grace.lee@email.com', '+63-930-444-0014',
 'external', ARRAY['Product Management', 'Scrum', 'User Stories', 'Analytics', 'Roadmapping'],
 ARRAY['Product Manager'], 9, '9 years',
 'MS Computer Science - NUS Singapore', 'Senior Product Manager', 'Lazada Group',
 '2 months', 'Onsite', 'full_time', 'PHP 180,000/month', '2026-05-01',
 'https://linkedin.com/in/gracelee', 91,
 'Exceptional product leader with deep experience in marketplace platforms and AI-driven products.',
 ARRAY['Strategic vision', 'AI product experience', 'Cross-functional leadership'],
 ARRAY['Long notice period', 'High salary expectation'], 'completed', '60 days', NOW() - INTERVAL '12 days'),

-- Candidate 15: Marketing intern (hired)
('d0000000-0000-0000-0000-000000000015', 'Angela Sy', 'angela.sy@email.com', '+63-931-555-0015',
 'external', ARRAY['Social Media', 'Content Writing', 'Canva', 'SEO'],
 ARRAY['Marketing Intern', 'Content Creator'], 1, '1 year (internships)',
 'BS Marketing - Ateneo de Manila (graduating)', 'Marketing Intern', 'Previous Internship',
 'Immediate', 'Onsite', 'part_time', 'PHP 20,000/month', '2025-10-15',
 'https://linkedin.com/in/angelasy', 65,
 'Enthusiastic intern with good social media instincts. Performed well during trial period.',
 ARRAY['Creative', 'Social media savvy', 'Quick learner'],
 ARRAY['Still a student', 'No professional marketing tools experience'], 'completed', 'Immediate', NOW() - INTERVAL '115 days');

-- ============================================
-- 5. CANDIDATE EDUCATION (2-3 per candidate)
-- ============================================
INSERT INTO candidate_education (candidate_id, degree, institution, year) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'BS Computer Science', 'University of the Philippines Diliman', '2018'),
  ('d0000000-0000-0000-0000-000000000001', 'Full-Stack Web Development Certificate', 'Udemy Professional', '2020'),
  ('d0000000-0000-0000-0000-000000000002', 'BS Information Technology', 'Ateneo de Manila University', '2021'),
  ('d0000000-0000-0000-0000-000000000003', 'BS Computer Engineering', 'De La Salle University', '2020'),
  ('d0000000-0000-0000-0000-000000000003', 'Azure Solutions Architect Expert', 'Microsoft Certified', '2023'),
  ('d0000000-0000-0000-0000-000000000004', 'MBA', 'Asian Institute of Management', '2022'),
  ('d0000000-0000-0000-0000-000000000004', 'BS Business Administration', 'Ateneo de Manila University', '2019'),
  ('d0000000-0000-0000-0000-000000000005', 'BFA Visual Communication', 'University of Santo Tomas', '2022'),
  ('d0000000-0000-0000-0000-000000000006', 'BS Computer Science', 'Mapua University', '2024'),
  ('d0000000-0000-0000-0000-000000000007', 'BS Information Systems', 'UP Los Baños', '2020'),
  ('d0000000-0000-0000-0000-000000000008', 'BS Multimedia Arts', 'De La Salle-College of Saint Benilde', '2023'),
  ('d0000000-0000-0000-0000-000000000009', 'BS Business Administration', 'Ateneo de Manila University', '2021'),
  ('d0000000-0000-0000-0000-000000000010', 'BS Marketing', 'University of the Philippines Diliman', '2023'),
  ('d0000000-0000-0000-0000-000000000011', 'BS IT', 'FEU Institute of Technology', '2023'),
  ('d0000000-0000-0000-0000-000000000012', 'BS Computer Science', 'Ateneo de Manila University', '2021'),
  ('d0000000-0000-0000-0000-000000000013', 'BS Information Systems', 'University of Santo Tomas', '2022'),
  ('d0000000-0000-0000-0000-000000000014', 'MS Computer Science', 'National University of Singapore', '2019'),
  ('d0000000-0000-0000-0000-000000000014', 'BS Computer Science', 'Ateneo de Manila University', '2017'),
  ('d0000000-0000-0000-0000-000000000015', 'BS Marketing (ongoing)', 'Ateneo de Manila University', '2026');

-- ============================================
-- 6. CANDIDATE CERTIFICATIONS (0-2 per candidate)
-- ============================================
INSERT INTO candidate_certifications (candidate_id, name, issuer, year) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'AWS Solutions Architect Associate', 'Amazon Web Services', '2023'),
  ('d0000000-0000-0000-0000-000000000001', 'Professional Scrum Master I', 'Scrum.org', '2022'),
  ('d0000000-0000-0000-0000-000000000003', 'Azure Solutions Architect Expert', 'Microsoft', '2023'),
  ('d0000000-0000-0000-0000-000000000003', 'Certified Kubernetes Administrator', 'CNCF', '2024'),
  ('d0000000-0000-0000-0000-000000000004', 'Certified Scrum Product Owner', 'Scrum Alliance', '2021'),
  ('d0000000-0000-0000-0000-000000000007', 'Certified Kubernetes Administrator', 'CNCF', '2023'),
  ('d0000000-0000-0000-0000-000000000007', 'AWS DevOps Engineer Professional', 'Amazon Web Services', '2024'),
  ('d0000000-0000-0000-0000-000000000007', 'HashiCorp Certified Terraform Associate', 'HashiCorp', '2023'),
  ('d0000000-0000-0000-0000-000000000009', 'Salesforce Certified Sales Cloud Consultant', 'Salesforce', '2023'),
  ('d0000000-0000-0000-0000-000000000012', 'Meta Front-End Developer Professional Certificate', 'Meta', '2022'),
  ('d0000000-0000-0000-0000-000000000014', 'Pragmatic Marketing Certified', 'Pragmatic Institute', '2021');

-- ============================================
-- 7. CANDIDATE WORK EXPERIENCE (1-3 per candidate)
-- ============================================
INSERT INTO candidate_work_experience (candidate_id, company_name, job_title, duration, description, key_projects) VALUES
  ('d0000000-0000-0000-0000-000000000001', 'Accenture Philippines', 'Senior Software Engineer', '2022 - Present', 'Led a team of 5 developers building microservices for a banking client. Implemented CI/CD pipelines and mentored junior engineers.', '["Built real-time transaction monitoring system", "Migrated legacy monolith to microservices"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000001', 'Symbio Philippines', 'Software Engineer', '2019 - 2022', 'Developed full-stack web applications using React and Node.js for Australian clients.', '["E-commerce platform", "Customer portal redesign"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000002', 'Globe Telecom', 'Software Developer', '2021 - Present', 'Building internal tools and customer-facing applications using React and Python.', '["Customer self-service portal", "Internal ticketing system"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000003', 'Current Company', 'Software Engineer II', '2020 - Present', 'Full-stack development on the core platform using React, C#, and Azure services.', '["Azure migration project", "New reporting dashboard"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000004', 'Grab Philippines', 'Product Manager', '2023 - Present', 'Owns the driver experience product roadmap, managing a cross-functional team of 12.', '["Driver incentive redesign", "Real-time earnings dashboard"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000004', 'Shopee Philippines', 'Associate Product Manager', '2020 - 2023', 'Managed seller tools product line, driving a 40% increase in seller onboarding.', '["Seller center redesign", "Bulk upload tool"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000005', 'Canva Philippines', 'UI/UX Designer', '2022 - Present', 'Designing new templates and improving the editor experience for Canva users.', '["Template marketplace redesign", "Mobile editor improvements"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000006', 'Freelance', 'Junior Developer', '2024 - Present', 'Building websites and web applications for small businesses using React.', '["Restaurant ordering system", "Portfolio websites"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000007', 'Accenture Philippines', 'DevOps Lead', '2021 - Present', 'Leading DevOps practices for enterprise clients, managing Kubernetes clusters and CI/CD infrastructure.', '["Zero-downtime deployment pipeline", "Multi-cloud infrastructure"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000007', 'Trend Micro Philippines', 'Systems Engineer', '2019 - 2021', 'Managed cloud infrastructure and automated deployment processes.', '["AWS to Azure migration", "Automated security scanning"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000008', 'Current Company', 'Junior Designer', '2023 - Present', 'Contributing to the company design system and creating marketing materials.', '["Design system documentation", "Brand guidelines refresh"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000009', 'Oracle Philippines', 'Sales Manager', '2022 - Present', 'Managing enterprise accounts in the Philippine market, consistently exceeding quota by 120%.', '["Closed $2M enterprise deal", "Built partner channel program"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000010', 'Salesforce Philippines', 'Sales Development Rep', '2023 - Present', 'Generating qualified leads and managing the top of the sales funnel.', '["Increased qualified leads by 60%", "Implemented new outreach playbook"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000011', 'IBM Philippines', 'Java Developer', '2023 - Present', 'Backend development using Java Spring Boot for enterprise applications.', '["API gateway implementation", "Legacy system modernization"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000012', 'PayMaya', 'Full-Stack Developer', '2021 - Present', 'Building fintech applications using React, Node.js, and GraphQL.', '["Payment processing module", "Merchant dashboard"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000013', 'Shopee Philippines', 'Frontend Developer', '2022 - Present', 'Frontend development for e-commerce features using React and Vue.js.', '["Product listing redesign", "Checkout flow optimization"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000014', 'Lazada Group', 'Senior Product Manager', '2021 - Present', 'Leading product strategy for seller tools and marketplace intelligence.', '["AI-powered seller insights", "Cross-border commerce features"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000014', 'Grab Singapore', 'Product Manager', '2019 - 2021', 'Managed GrabFood merchant tools product line.', '["Merchant analytics dashboard", "Menu management system"]'::jsonb),
  ('d0000000-0000-0000-0000-000000000015', 'Previous Internship', 'Marketing Intern', '2025 (6 months)', 'Managed social media accounts and created content for brand campaigns.', '["Social media campaign with 1M reach", "Blog content series"]'::jsonb);

-- ============================================
-- 8. CANDIDATE JOB APPLICATIONS (20)
-- Spread across pipeline stages
-- ============================================
INSERT INTO candidate_job_applications (id, candidate_id, job_order_id, pipeline_status, match_score, employment_type, applied_date, status_changed_date, created_at) VALUES

  -- JO-001 Senior Full-Stack Dev: 7 applications
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'hired', 92, 'full_time', NOW() - INTERVAL '25 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '25 days'),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'tech_interview', 78, 'full_time', NOW() - INTERVAL '22 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '22 days'),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001', 'offer', 85, 'full_time', NOW() - INTERVAL '20 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '20 days'),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'rejected', 55, 'full_time', NOW() - INTERVAL '35 days', NOW() - INTERVAL '25 days', NOW() - INTERVAL '35 days'),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000011', 'c0000000-0000-0000-0000-000000000001', 'rejected', 42, 'full_time', NOW() - INTERVAL '28 days', NOW() - INTERVAL '20 days', NOW() - INTERVAL '28 days'),
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000012', 'c0000000-0000-0000-0000-000000000001', 'tech_interview', 83, 'full_time', NOW() - INTERVAL '15 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '15 days'),
  ('e0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000013', 'c0000000-0000-0000-0000-000000000001', 'hr_interview', 72, 'full_time', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

  -- JO-002 Product Manager: 3 applications
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', 'c0000000-0000-0000-0000-000000000002', 'offer', 88, 'full_time', NOW() - INTERVAL '18 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '18 days'),
  ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000014', 'c0000000-0000-0000-0000-000000000002', 'tech_interview', 91, 'full_time', NOW() - INTERVAL '12 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '12 days'),

  -- JO-003 UX/UI Designer: 3 applications
  ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000003', 'tech_interview', 82, 'full_time', NOW() - INTERVAL '40 days', NOW() - INTERVAL '10 days', NOW() - INTERVAL '40 days'),
  ('e0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000008', 'c0000000-0000-0000-0000-000000000003', 'hr_interview', 70, 'full_time', NOW() - INTERVAL '38 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '38 days'),

  -- JO-004 DevOps Engineer: 2 applications
  ('e0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000007', 'c0000000-0000-0000-0000-000000000004', 'hr_interview', 90, 'full_time', NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days', NOW() - INTERVAL '55 days'),

  -- JO-005 Sales Exec (closed): 3 applications - all completed
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000009', 'c0000000-0000-0000-0000-000000000005', 'hired', 87, 'full_time', NOW() - INTERVAL '85 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '85 days'),
  ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000010', 'c0000000-0000-0000-0000-000000000005', 'hired', 75, 'full_time', NOW() - INTERVAL '88 days', NOW() - INTERVAL '62 days', NOW() - INTERVAL '88 days'),

  -- JO-006 Marketing Intern (archived): 2 applications
  ('e0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000015', 'c0000000-0000-0000-0000-000000000006', 'hired', 65, 'part_time', NOW() - INTERVAL '115 days', NOW() - INTERVAL '95 days', NOW() - INTERVAL '115 days');

-- Update tech_interview_result for applications past tech stage
UPDATE candidate_job_applications SET tech_interview_result = 'pass' WHERE id IN (
  'e0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000003',
  'e0000000-0000-0000-0000-000000000008', 'e0000000-0000-0000-0000-000000000013',
  'e0000000-0000-0000-0000-000000000014', 'e0000000-0000-0000-0000-000000000015'
);
UPDATE candidate_job_applications SET tech_interview_result = 'fail' WHERE id IN (
  'e0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000005'
);

-- ============================================
-- 9. HR INTERVIEWS (for applications past HR stage)
-- ============================================
INSERT INTO hr_interviews (application_id, candidate_id, interview_date, interviewer_name, interview_mode, availability, expected_salary, preferred_work_setup, notice_period, communication_rating, motivation_rating, cultural_fit_rating, professionalism_rating, strengths, concerns, verdict, verdict_rationale) VALUES

  -- Juan - hired (passed HR)
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '2026-01-20', 'Sarah Lim', 'Video Call', 'Immediate', 'PHP 120,000/month', 'Remote', '30 days', 5, 5, 4, 5, 'Excellent communication and deep technical knowledge. Very articulate about career goals.', 'Salary expectation is at the high end of our range.', 'pass', 'Strong candidate with excellent communication skills and clear career direction.'),

  -- Maria - tech interview (passed HR)
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', '2026-01-25', 'Sarah Lim', 'Video Call', '2 weeks', 'PHP 90,000/month', 'Hybrid', '15 days', 4, 4, 4, 4, 'Good communication, enthusiastic about the role. Shows genuine interest in our product.', 'Could be stronger on system design concepts.', 'pass', 'Solid candidate, recommend proceeding to technical interview.'),

  -- Carlos - offer (passed HR)
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', '2026-01-23', 'Sarah Lim', 'In-Person', 'Immediate', 'PHP 100,000/month', 'Onsite', 'Immediate', 5, 5, 5, 5, 'Internal candidate with deep company knowledge. Already proven culture fit.', 'None significant - internal transfer should be smooth.', 'pass', 'Highly recommended. Internal candidate with strong track record.'),

  -- Patricia - rejected at HR
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000006', '2026-01-10', 'Sarah Lim', 'Video Call', 'Immediate', 'PHP 45,000/month', 'Onsite', 'Immediate', 3, 4, 3, 3, 'Eager and enthusiastic.', 'Too junior for a senior role. Lacks required experience in TypeScript and cloud.', 'fail', 'Not suitable for senior role. Consider for junior positions if available.'),

  -- Kevin - rejected at HR
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000011', '2026-01-16', 'Sarah Lim', 'Video Call', '2 weeks', 'PHP 70,000/month', 'Remote', '15 days', 2, 3, 3, 3, 'Decent Java background.', 'Poor communication skills. Could not clearly explain past projects. Wrong tech stack for our needs.', 'fail', 'Not recommended. Communication issues and mismatched tech stack.'),

  -- Isabella - tech interview (passed HR)
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000012', '2026-02-01', 'Sarah Lim', 'Video Call', '1 month', 'PHP 110,000/month', 'Remote', '30 days', 4, 5, 4, 5, 'Very articulate and passionate about technology. Strong portfolio.', 'No PostgreSQL or Azure experience, but likely a quick learner.', 'pass', 'Recommend for technical interview. Strong communication and genuine passion.'),

  -- Ana - offer stage (passed HR for PM)
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', '2026-01-28', 'Mark Rivera', 'Video Call', '1 month', 'PHP 150,000/month', 'Hybrid', '30 days', 5, 5, 4, 5, 'Exceptional product thinking. Clear vision and strong data-driven approach.', 'High salary expectation.', 'pass', 'Top PM candidate. Highly recommended for next round.'),

  -- Grace - tech interview for PM
  ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000014', '2026-02-03', 'Mark Rivera', 'Video Call', '2 months', 'PHP 180,000/month', 'Onsite', '60 days', 5, 4, 4, 5, 'Impressive leadership experience. Deep marketplace knowledge.', 'Very long notice period (60 days). Highest salary range.', 'pass', 'Excellent candidate but long notice period is a concern. Proceed with technical.'),

  -- Miguel - tech interview (passed HR for Design)
  ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000005', '2026-01-08', 'Anna Cruz', 'In-Person', '2 weeks', 'PHP 80,000/month', 'Remote', '15 days', 4, 5, 5, 4, 'Creative and passionate about design. Excellent portfolio presentation.', 'Could be more structured in design process documentation.', 'pass', 'Strong designer with great portfolio. Recommend design challenge.'),

  -- David - hired (Sales)
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000009', '2025-11-20', 'Rico Lim', 'In-Person', 'Immediate', 'PHP 100,000 + commission', 'Onsite', '30 days', 5, 5, 5, 5, 'Outstanding sales presence. Great track record.', 'None.', 'pass', 'Exceptional candidate. Fast-track to offer.'),

  -- Rachel - hired (Sales)
  ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000010', '2025-11-18', 'Rico Lim', 'Video Call', 'Immediate', 'PHP 70,000 + commission', 'Hybrid', '15 days', 4, 5, 4, 4, 'Energetic and driven. Strong lead gen skills.', 'Needs development on enterprise sales.', 'pass', 'Good fit for SDR/junior sales role. Recommend.'),

  -- Angela - hired (Intern)
  ('e0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000015', '2025-10-10', 'Lisa Go', 'In-Person', 'Immediate', 'PHP 20,000/month', 'Onsite', 'Immediate', 4, 5, 5, 4, 'Very enthusiastic. Good social media instincts.', 'Still a student, limited availability during exams.', 'pass', 'Great intern candidate. Recommend immediate start.');

-- ============================================
-- 10. TECH INTERVIEWS (for applications past tech stage)
-- ============================================
INSERT INTO tech_interviews (application_id, candidate_id, interview_date, interviewer_name, interview_mode, technical_knowledge_rating, problem_solving_rating, code_quality_rating, system_design_rating, coding_challenge_score, coding_challenge_notes, technical_strengths, areas_for_improvement, verdict, verdict_rationale) VALUES

  -- Juan - hired (passed tech)
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '2026-01-25', 'Alex Reyes', 'Video Call', 5, 5, 4, 4, 90, 'Completed all challenges efficiently. Clean code with good test coverage.', 'Deep React and Node.js expertise. Excellent understanding of database optimization and API design.', 'Could improve system design documentation skills.', 'pass', 'Excellent technical performance. Strong hire recommendation.'),

  -- Maria - in tech interview (pending)
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', '2026-02-08', 'Alex Reyes', 'Video Call', 3, 4, 3, 3, 70, 'Completed basic challenges well. Struggled with optimization problem.', 'Good React skills and clean code style.', 'Needs improvement in system design and database optimization. Limited TypeScript fluency.', 'pending', 'Awaiting panel review. Mixed signals on senior-level readiness.'),

  -- Carlos - offer (passed tech)
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', '2026-01-28', 'Alex Reyes', 'In-Person', 4, 4, 5, 4, 85, 'Very clean code. Strong understanding of our codebase.', 'Excellent C# and Azure skills. Already familiar with our architecture.', 'Frontend design patterns could be stronger.', 'pass', 'Strong internal candidate. Recommended for offer.'),

  -- Isabella - in tech interview (pending)
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000012', '2026-02-09', 'Alex Reyes', 'Video Call', 4, 4, 4, 3, 80, 'Good performance on coding challenges. Creative solutions.', 'Strong React and GraphQL skills. Good problem decomposition.', 'No PostgreSQL experience. System design at mid-level.', 'pending', 'Promising candidate. Awaiting final scoring.'),

  -- Ana - passed tech for PM (case study presentation)
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', '2026-02-03', 'Jose Reyes', 'Video Call', 4, 5, NULL, NULL, 88, 'Excellent case study presentation. Data-driven approach with clear metrics.', 'Strong analytical thinking. Excellent use of data to drive decisions.', 'Could be more technical in AI/ML product requirements.', 'pass', 'Outstanding PM candidate. Recommend offer.'),

  -- Grace - in tech for PM (pending)
  ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000014', '2026-02-07', 'Jose Reyes', 'Video Call', 5, 5, NULL, NULL, 92, 'Exceptional case study. Deep marketplace and AI product knowledge.', 'World-class product thinking. Strategic depth is impressive.', 'Very high salary expectation. Long notice period.', 'pending', 'Exceptional candidate but compensation and timing are concerns.'),

  -- Miguel - in tech for Design (pending)
  ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000005', '2026-02-01', 'Anna Cruz', 'In-Person', 4, 4, 4, NULL, 82, 'Strong portfolio review. Good design challenge output.', 'Excellent visual design and prototyping. Good user research methodology.', 'Design system at scale experience is limited.', 'pending', 'Strong designer. Awaiting final portfolio review.'),

  -- David - passed tech (Sales role-play)
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000009', '2025-11-28', 'Rico Lim', 'In-Person', 5, 5, NULL, NULL, 95, 'Exceptional sales role-play. Handled objections masterfully.', 'Outstanding closing technique and objection handling.', 'None significant for this role.', 'pass', 'Top performer. Immediate offer recommended.'),

  -- Rachel - passed tech (Sales role-play)
  ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000010', '2025-11-25', 'Rico Lim', 'Video Call', 4, 4, NULL, NULL, 78, 'Good role-play performance. Enthusiastic approach.', 'Strong lead generation instincts. Persistent.', 'Needs coaching on enterprise-level sales conversations.', 'pass', 'Good hire for SDR role. Growth potential.'),

  -- Angela - passed tech (Marketing task)
  ('e0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000015', '2025-10-18', 'Lisa Go', 'In-Person', 3, 4, NULL, NULL, 75, 'Good social media strategy presentation. Creative content samples.', 'Creative instincts. Good social media understanding.', 'Limited experience with marketing analytics tools.', 'pass', 'Good intern. Recommended for part-time role.');

-- ============================================
-- 11. OFFERS (for applications at offer/hired stage)
-- ============================================
INSERT INTO offers (application_id, candidate_id, offer_date, offer_amount, position, start_date, status, remarks) VALUES

  -- Juan - hired, accepted
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', '2026-01-30', 'PHP 115,000/month', 'Senior Full-Stack Developer', '2026-03-01', 'accepted', 'Negotiated down from PHP 120K. Candidate accepted within 2 days.'),

  -- Carlos - offer pending
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', '2026-02-09', 'PHP 105,000/month', 'Senior Full-Stack Developer', '2026-02-15', 'pending', 'Internal transfer offer. Awaiting candidate response.'),

  -- Ana - offer pending
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', '2026-02-08', 'PHP 140,000/month', 'Product Manager', '2026-04-01', 'pending', 'Negotiated from PHP 150K. Candidate requested time to decide.'),

  -- David - hired, accepted
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000009', '2025-12-02', 'PHP 95,000/month + 10% commission', 'Sales Executive', '2025-12-15', 'accepted', 'Fast-tracked offer. Candidate started immediately.'),

  -- Rachel - hired, accepted
  ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000010', '2025-12-01', 'PHP 65,000/month + 8% commission', 'Sales Development Representative', '2025-12-10', 'accepted', 'Candidate excited about the opportunity. Quick acceptance.'),

  -- Angela - hired, accepted
  ('e0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000015', '2025-10-22', 'PHP 18,000/month', 'Marketing Intern', '2025-11-01', 'accepted', 'Part-time schedule around university classes.');

-- ============================================
-- 12. CANDIDATE TIMELINE (status transitions)
-- ============================================
INSERT INTO candidate_timeline (application_id, candidate_id, from_status, to_status, changed_date, duration_days, notes) VALUES

  -- Juan's journey: hr -> tech -> offer -> hired
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', NULL, 'hr_interview', NOW() - INTERVAL '25 days', 0, 'Application received'),
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'hr_interview', 'tech_interview', NOW() - INTERVAL '20 days', 5, 'Passed HR interview with flying colors'),
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'tech_interview', 'offer', NOW() - INTERVAL '15 days', 5, 'Excellent tech interview performance'),
  ('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'offer', 'hired', NOW() - INTERVAL '3 days', 12, 'Offer accepted. Starting March 1.'),

  -- Maria: hr -> tech (in progress)
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', NULL, 'hr_interview', NOW() - INTERVAL '22 days', 0, 'Application received'),
  ('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000002', 'hr_interview', 'tech_interview', NOW() - INTERVAL '15 days', 7, 'Passed HR. Scheduled for tech interview.'),

  -- Carlos: hr -> tech -> offer
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', NULL, 'hr_interview', NOW() - INTERVAL '20 days', 0, 'Internal candidate application'),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'hr_interview', 'tech_interview', NOW() - INTERVAL '15 days', 5, 'Passed HR. Internal fast-track.'),
  ('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000003', 'tech_interview', 'offer', NOW() - INTERVAL '8 days', 7, 'Strong tech interview. Offer extended.'),

  -- Patricia: hr -> rejected
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000006', NULL, 'hr_interview', NOW() - INTERVAL '35 days', 0, 'Application received'),
  ('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000006', 'hr_interview', 'rejected', NOW() - INTERVAL '25 days', 10, 'Too junior for senior role. Consider for future junior openings.'),

  -- Kevin: hr -> rejected
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000011', NULL, 'hr_interview', NOW() - INTERVAL '28 days', 0, 'Application received'),
  ('e0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000011', 'hr_interview', 'rejected', NOW() - INTERVAL '20 days', 8, 'Communication issues and tech stack mismatch.'),

  -- Isabella: hr -> tech
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000012', NULL, 'hr_interview', NOW() - INTERVAL '15 days', 0, 'Application received'),
  ('e0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000012', 'hr_interview', 'tech_interview', NOW() - INTERVAL '8 days', 7, 'Passed HR interview. Strong communication.'),

  -- Ana: hr -> tech -> offer
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', NULL, 'hr_interview', NOW() - INTERVAL '18 days', 0, 'Application received'),
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', 'hr_interview', 'tech_interview', NOW() - INTERVAL '12 days', 6, 'Excellent HR interview'),
  ('e0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000004', 'tech_interview', 'offer', NOW() - INTERVAL '5 days', 7, 'Outstanding case study. Offer extended.'),

  -- Grace: hr -> tech
  ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000014', NULL, 'hr_interview', NOW() - INTERVAL '12 days', 0, 'Application received'),
  ('e0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000014', 'hr_interview', 'tech_interview', NOW() - INTERVAL '7 days', 5, 'Impressive HR interview. Proceeding to case study.'),

  -- Miguel: hr -> tech
  ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000005', NULL, 'hr_interview', NOW() - INTERVAL '40 days', 0, 'Application received'),
  ('e0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000005', 'hr_interview', 'tech_interview', NOW() - INTERVAL '30 days', 10, 'Good HR interview. Design challenge assigned.'),

  -- David: hr -> tech -> offer -> hired
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000009', NULL, 'hr_interview', NOW() - INTERVAL '85 days', 0, 'Application received'),
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000009', 'hr_interview', 'tech_interview', NOW() - INTERVAL '78 days', 7, 'Strong HR interview'),
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000009', 'tech_interview', 'offer', NOW() - INTERVAL '70 days', 8, 'Excellent role-play'),
  ('e0000000-0000-0000-0000-000000000013', 'd0000000-0000-0000-0000-000000000009', 'offer', 'hired', NOW() - INTERVAL '60 days', 10, 'Offer accepted'),

  -- Rachel: hr -> tech -> offer -> hired
  ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000010', NULL, 'hr_interview', NOW() - INTERVAL '88 days', 0, 'Application received'),
  ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000010', 'hr_interview', 'tech_interview', NOW() - INTERVAL '80 days', 8, 'Passed HR'),
  ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000010', 'tech_interview', 'offer', NOW() - INTERVAL '72 days', 8, 'Good role-play'),
  ('e0000000-0000-0000-0000-000000000014', 'd0000000-0000-0000-0000-000000000010', 'offer', 'hired', NOW() - INTERVAL '62 days', 10, 'Accepted quickly'),

  -- Angela: hr -> tech -> offer -> hired
  ('e0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000015', NULL, 'hr_interview', NOW() - INTERVAL '115 days', 0, 'Intern application received'),
  ('e0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000015', 'hr_interview', 'tech_interview', NOW() - INTERVAL '108 days', 7, 'Passed HR'),
  ('e0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000015', 'tech_interview', 'offer', NOW() - INTERVAL '100 days', 8, 'Good marketing task'),
  ('e0000000-0000-0000-0000-000000000015', 'd0000000-0000-0000-0000-000000000015', 'offer', 'hired', NOW() - INTERVAL '95 days', 5, 'Started as intern');

-- ============================================
-- 13. APPLICATION HISTORY (past applications)
-- ============================================
INSERT INTO application_history (candidate_id, job_order_id, jo_number, jo_title, applied_date, furthest_stage, outcome, historical_notes) VALUES
  ('d0000000-0000-0000-0000-000000000001', NULL, 'JO-2025-005', 'Backend Developer', '2025-06-15', 'tech_interview', 'Withdrew', 'Candidate withdrew after receiving counter-offer from current employer.'),
  ('d0000000-0000-0000-0000-000000000002', NULL, 'JO-2025-007', 'Junior Frontend Developer', '2025-08-20', 'offer', 'Rejected offer', 'Candidate declined offer due to salary expectations.'),
  ('d0000000-0000-0000-0000-000000000004', NULL, 'JO-2025-003', 'Associate Product Manager', '2025-04-10', 'hr_interview', 'Not selected', 'Did not proceed past HR. Overqualified for associate role.'),
  ('d0000000-0000-0000-0000-000000000007', NULL, 'JO-2025-009', 'Cloud Engineer', '2025-09-01', 'offer', 'Rejected offer', 'Better competing offer. Noted for future senior DevOps roles.'),
  ('d0000000-0000-0000-0000-000000000012', NULL, 'JO-2025-006', 'React Developer', '2025-07-12', 'tech_interview', 'Not selected', 'Good candidate but position was filled by an internal transfer.');

-- ============================================
-- 14. ACTIVITY LOG (40 entries over last 30 days)
-- ============================================
INSERT INTO activity_log (activity_type, entity_type, entity_id, performed_by_name, action_date, details) VALUES

  -- Job order activities
  ('jo_created', 'job_order', 'c0000000-0000-0000-0000-000000000001', 'Maria Santos', NOW() - INTERVAL '30 days', '{"jo_number": "JO-2026-001", "title": "Senior Full-Stack Developer", "department": "Engineering"}'::jsonb),
  ('jo_created', 'job_order', 'c0000000-0000-0000-0000-000000000002', 'Jose Reyes', NOW() - INTERVAL '20 days', '{"jo_number": "JO-2026-002", "title": "Product Manager", "department": "Product"}'::jsonb),
  ('jo_edited', 'job_order', 'c0000000-0000-0000-0000-000000000001', 'Maria Santos', NOW() - INTERVAL '28 days', '{"field": "description", "action": "Updated job description with more details"}'::jsonb),
  ('jo_edited', 'job_order', 'c0000000-0000-0000-0000-000000000004', 'Carlos Tan', NOW() - INTERVAL '15 days', '{"field": "status", "from": "open", "to": "on_hold", "reason": "Budget review"}'::jsonb),
  ('jo_archived', 'job_order', 'c0000000-0000-0000-0000-000000000006', 'Lisa Go', NOW() - INTERVAL '10 days', '{"jo_number": "JO-2025-008", "title": "Marketing Intern", "reason": "Position filled"}'::jsonb),

  -- CV upload activities
  ('cv_uploaded', 'candidate', 'd0000000-0000-0000-0000-000000000001', 'HR Admin', NOW() - INTERVAL '25 days', '{"candidate_name": "Juan Dela Cruz", "filename": "JuanDelaCruz_CV.pdf"}'::jsonb),
  ('cv_uploaded', 'candidate', 'd0000000-0000-0000-0000-000000000002', 'HR Admin', NOW() - INTERVAL '22 days', '{"candidate_name": "Maria Garcia", "filename": "MariaGarcia_CV.pdf"}'::jsonb),
  ('cv_uploaded', 'candidate', 'd0000000-0000-0000-0000-000000000004', 'Recruitment Team', NOW() - INTERVAL '18 days', '{"candidate_name": "Ana Reyes", "filename": "AnaReyes_CV.pdf"}'::jsonb),
  ('cv_uploaded', 'candidate', 'd0000000-0000-0000-0000-000000000012', 'HR Admin', NOW() - INTERVAL '15 days', '{"candidate_name": "Isabella Cruz", "filename": "IsabellaCruz_CV.pdf"}'::jsonb),
  ('cv_uploaded', 'candidate', 'd0000000-0000-0000-0000-000000000013', 'Recruitment Team', NOW() - INTERVAL '10 days', '{"candidate_name": "Mark Tan", "filename": "MarkTan_CV.pdf"}'::jsonb),
  ('cv_uploaded', 'candidate', 'd0000000-0000-0000-0000-000000000014', 'HR Admin', NOW() - INTERVAL '12 days', '{"candidate_name": "Grace Lee", "filename": "GraceLee_CV.pdf"}'::jsonb),

  -- Pipeline moved activities
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000001', 'Sarah Lim', NOW() - INTERVAL '20 days', '{"candidate_name": "Juan Dela Cruz", "from": "hr_interview", "to": "tech_interview", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000001', 'Alex Reyes', NOW() - INTERVAL '15 days', '{"candidate_name": "Juan Dela Cruz", "from": "tech_interview", "to": "offer", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000001', 'Maria Santos', NOW() - INTERVAL '3 days', '{"candidate_name": "Juan Dela Cruz", "from": "offer", "to": "hired", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000002', 'Sarah Lim', NOW() - INTERVAL '15 days', '{"candidate_name": "Maria Garcia", "from": "hr_interview", "to": "tech_interview", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000003', 'Sarah Lim', NOW() - INTERVAL '15 days', '{"candidate_name": "Carlos Santos", "from": "hr_interview", "to": "tech_interview", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000003', 'Alex Reyes', NOW() - INTERVAL '8 days', '{"candidate_name": "Carlos Santos", "from": "tech_interview", "to": "offer", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000004', 'Sarah Lim', NOW() - INTERVAL '25 days', '{"candidate_name": "Patricia Lim", "from": "hr_interview", "to": "rejected", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000005', 'Sarah Lim', NOW() - INTERVAL '20 days', '{"candidate_name": "Kevin Ong", "from": "hr_interview", "to": "rejected", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000006', 'Sarah Lim', NOW() - INTERVAL '8 days', '{"candidate_name": "Isabella Cruz", "from": "hr_interview", "to": "tech_interview", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000008', 'Mark Rivera', NOW() - INTERVAL '12 days', '{"candidate_name": "Ana Reyes", "from": "hr_interview", "to": "tech_interview", "jo_title": "Product Manager"}'::jsonb),
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000008', 'Jose Reyes', NOW() - INTERVAL '5 days', '{"candidate_name": "Ana Reyes", "from": "tech_interview", "to": "offer", "jo_title": "Product Manager"}'::jsonb),
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000009', 'Mark Rivera', NOW() - INTERVAL '7 days', '{"candidate_name": "Grace Lee", "from": "hr_interview", "to": "tech_interview", "jo_title": "Product Manager"}'::jsonb),
  ('pipeline_moved', 'application', 'e0000000-0000-0000-0000-000000000010', 'Anna Cruz', NOW() - INTERVAL '30 days', '{"candidate_name": "Miguel Torres", "from": "hr_interview", "to": "tech_interview", "jo_title": "UX/UI Designer"}'::jsonb),

  -- HR interview activities
  ('hr_interview_saved', 'hr_interview', 'e0000000-0000-0000-0000-000000000001', 'Sarah Lim', NOW() - INTERVAL '20 days', '{"candidate_name": "Juan Dela Cruz", "verdict": "pass", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('hr_interview_saved', 'hr_interview', 'e0000000-0000-0000-0000-000000000002', 'Sarah Lim', NOW() - INTERVAL '17 days', '{"candidate_name": "Maria Garcia", "verdict": "pass", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('hr_interview_saved', 'hr_interview', 'e0000000-0000-0000-0000-000000000003', 'Sarah Lim', NOW() - INTERVAL '17 days', '{"candidate_name": "Carlos Santos", "verdict": "pass", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('hr_interview_saved', 'hr_interview', 'e0000000-0000-0000-0000-000000000004', 'Sarah Lim', NOW() - INTERVAL '25 days', '{"candidate_name": "Patricia Lim", "verdict": "fail", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('hr_interview_saved', 'hr_interview', 'e0000000-0000-0000-0000-000000000005', 'Sarah Lim', NOW() - INTERVAL '20 days', '{"candidate_name": "Kevin Ong", "verdict": "fail", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('hr_interview_saved', 'hr_interview', 'e0000000-0000-0000-0000-000000000006', 'Sarah Lim', NOW() - INTERVAL '10 days', '{"candidate_name": "Isabella Cruz", "verdict": "pass", "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('hr_interview_saved', 'hr_interview', 'e0000000-0000-0000-0000-000000000008', 'Mark Rivera', NOW() - INTERVAL '14 days', '{"candidate_name": "Ana Reyes", "verdict": "pass", "jo_title": "Product Manager"}'::jsonb),
  ('hr_interview_saved', 'hr_interview', 'e0000000-0000-0000-0000-000000000009', 'Mark Rivera', NOW() - INTERVAL '9 days', '{"candidate_name": "Grace Lee", "verdict": "pass", "jo_title": "Product Manager"}'::jsonb),

  -- Tech interview activities
  ('tech_interview_saved', 'tech_interview', 'e0000000-0000-0000-0000-000000000001', 'Alex Reyes', NOW() - INTERVAL '16 days', '{"candidate_name": "Juan Dela Cruz", "verdict": "pass", "score": 90, "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('tech_interview_saved', 'tech_interview', 'e0000000-0000-0000-0000-000000000003', 'Alex Reyes', NOW() - INTERVAL '10 days', '{"candidate_name": "Carlos Santos", "verdict": "pass", "score": 85, "jo_title": "Senior Full-Stack Developer"}'::jsonb),
  ('tech_interview_saved', 'tech_interview', 'e0000000-0000-0000-0000-000000000008', 'Jose Reyes', NOW() - INTERVAL '7 days', '{"candidate_name": "Ana Reyes", "verdict": "pass", "score": 88, "jo_title": "Product Manager"}'::jsonb),

  -- Offer activities
  ('offer_created', 'offer', 'e0000000-0000-0000-0000-000000000001', 'Maria Santos', NOW() - INTERVAL '13 days', '{"candidate_name": "Juan Dela Cruz", "amount": "PHP 115,000/month", "position": "Senior Full-Stack Developer"}'::jsonb),
  ('offer_created', 'offer', 'e0000000-0000-0000-0000-000000000003', 'Maria Santos', NOW() - INTERVAL '2 days', '{"candidate_name": "Carlos Santos", "amount": "PHP 105,000/month", "position": "Senior Full-Stack Developer"}'::jsonb),
  ('offer_created', 'offer', 'e0000000-0000-0000-0000-000000000008', 'Jose Reyes', NOW() - INTERVAL '3 days', '{"candidate_name": "Ana Reyes", "amount": "PHP 140,000/month", "position": "Product Manager"}'::jsonb),

  -- Misc activities
  ('jo_edited', 'job_order', 'c0000000-0000-0000-0000-000000000001', 'Maria Santos', NOW() - INTERVAL '5 days', '{"field": "hired_count", "from": 0, "to": 1, "hired_candidate": "Juan Dela Cruz"}'::jsonb),
  ('jo_closed', 'job_order', 'c0000000-0000-0000-0000-000000000005', 'Rico Lim', NOW() - INTERVAL '58 days', '{"jo_number": "JO-2025-010", "title": "Sales Executive", "reason": "All positions filled"}'::jsonb);

COMMIT;
