# Exist AI Recruiter — Non-Technical Documentation

> **Audience**: End users, HR team, marketing, onboarding managers
> **Last updated**: February 2026

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [User Manual](#2-user-manual)
   - [Dashboard & Job Orders](#21-dashboard--job-orders)
   - [Uploading CVs](#22-uploading-cvs)
   - [Managing Candidates Through the Pipeline](#23-managing-candidates-through-the-pipeline)
   - [Using the AI Assistant](#24-using-the-ai-assistant)
   - [Analytics & Reporting](#25-analytics--reporting)
3. [Frequently Asked Questions (FAQ)](#3-frequently-asked-questions-faq)
4. [Marketing Brief](#4-marketing-brief)
5. [Internal Onboarding](#5-internal-onboarding)

---

## 1. Product Overview

### What is Exist AI Recruiter?

Exist AI Recruiter is an **AI-powered Applicant Tracking System (ATS)** built by Exist Software Labs. It streamlines the entire hiring pipeline — from creating job requisitions and uploading resumes, to AI-driven candidate matching, structured interviews, offers, and talent pooling.

Unlike traditional ATS tools that require manual screening and sorting, Exist AI Recruiter uses **artificial intelligence** to automatically parse resumes, extract key information, score candidates against job requirements, and provide an intelligent chatbot assistant to help HR teams make faster, data-driven hiring decisions.

### Key Benefits

| Benefit | Description |
|---------|-------------|
| **AI-Powered Matching** | Candidates are automatically scored (0–100) against job requirements using vector embeddings and AI analysis |
| **Zero Manual Data Entry** | Upload a PDF or DOCX resume → the AI extracts name, skills, experience, education, salary expectations, and more |
| **Visual Pipeline Management** | Kanban board and table views let you track every candidate through HR Interview → Tech Interview → Offer → Hired |
| **Built-in Interview Forms** | Structured HR and technical interview forms with ratings and verdicts that automatically advance candidates |
| **AI Chatbot Assistant** | Ask natural-language questions like "Who are the best candidates for Data Engineer?" and get instant, sourced answers |
| **Talent Pool** | Park promising candidates for future roles — no more lost resumes |
| **Comprehensive Analytics** | Dashboard with 20+ charts covering funnel conversion, time-to-hire, department breakdowns, interview stats, and trends |
| **Activity Audit Trail** | Full history of every action — who moved whom, when, and why |

### Who Is It For?

- **HR Recruiters**: Daily pipeline management, candidate screening, interview coordination
- **Hiring Managers**: Review matched candidates, track progress on their requisitions
- **HR Leadership**: Analytics, reporting, workforce planning
- **Recruitment Operations**: Process optimization, bottleneck identification

---

## 2. User Manual

### 2.1 Dashboard & Job Orders

The Dashboard is the main hub where you manage job orders and their candidates.

#### Creating a Job Order

1. Click the **Create JO** icon in the sidebar (the document with a plus sign)
2. A form appears with an **auto-generated JO number** (e.g., JO-2026-001)
3. Fill in the required fields:
   - **Position Title** — the role you're hiring for
   - **Requestor Name** — who requested this hire
   - **Department** — select from existing departments or create a new one
   - **Job Description** — rich text editor for detailed requirements
   - **Level** — L1 (Entry) through L5 (Lead)
   - **Employment Type** — Full Time, Part Time, or Contract
   - **Quantity** — how many positions to fill
   - **Required Date** — when you need the role filled
4. Optionally check which **job posting sites** to list on (LinkedIn, Indeed, JobStreet)
5. Click **Create Job Order**

[Screenshot: Create JO form with fields filled in and department dropdown open]

#### Viewing the Dashboard

1. Click the **Job Orders** icon in the sidebar (briefcase icon)
2. The left panel shows all job orders grouped by status:
   - **Open** (green) — actively hiring
   - **On Hold** (blue) — paused
   - **Pooling** (amber) — collecting candidates for future use
3. Click any job order to see its details and candidates in the right panel
4. Use the **Department** dropdown and **Aging** filter to narrow down the list

[Screenshot: Dashboard with left panel showing JO list and right panel showing a selected JO with candidates]

#### Switching Between Kanban and Table View

- **Kanban View**: Visual board with columns for each pipeline stage (HR Interview, Tech Interview, Offer, Hired, Rejected). Great for a quick visual overview.
- **Table View**: Detailed sortable list grouped by status, showing scores, experience, salary, aging indicators, and quick action buttons.

Toggle between views using the view switcher at the top of the candidates section.

[Screenshot: Kanban board showing candidate cards across pipeline stages]
[Screenshot: Table view showing grouped candidates with action buttons]

#### Managing Job Order Status

From the Job Order Detail panel, you can:
- **Edit** — modify title, description, or other details
- **Put On Hold** — temporarily pause hiring
- **Set to Pooling** — switch to talent pool collection mode
- **Archive** — close and archive the job order
- **Delete** — permanently remove (use with caution)

---

### 2.2 Uploading CVs

The Upload page is where you submit candidate resumes for AI processing.

#### Step-by-Step

1. Click the **Upload CV** icon in the sidebar (upload arrow icon)
2. Enter the **Uploader Name** — your name or the name of whoever is submitting these resumes (autocomplete remembers previous names)
3. Set the **Default Applicant Type**:
   - **External** — candidates from outside the company
   - **Internal** — existing Exist employees applying for a new role
4. **Drag and drop** PDF or DOCX files onto the upload area, or click to browse
5. For each uploaded file, you can customize:
   - **Applicant Type** — override the default (Internal/External) per file
   - **Applying For** — select a specific Job Order, or choose **"Let AI Decide"** to have the AI match the best JO
   - For **internal** applicants: set approval dates, current department, and transfer reason
6. Click **Vectorize Documents**
7. Wait for processing — the AI will:
   - Parse each resume and extract structured data
   - Store the original file in Google Drive
   - Generate vector embeddings for matching
   - Score the candidate against job requirements
   - Create the candidate profile in the system
8. When processing completes, a **notification banner** will appear prompting you to refresh

[Screenshot: Upload page with multiple files, one set to "Let AI Decide" and another assigned to a specific JO]
[Screenshot: Files being processed with a progress indicator]

#### What Happens Behind the Scenes

When you click "Vectorize Documents", the system:
1. Sends each file to the AI processing pipeline (n8n workflow)
2. The AI reads the resume text, identifies key information, and structures it
3. The candidate is matched against all open job orders using vector similarity
4. A match score (0–100) is calculated for each relevant job order
5. The candidate appears in the Dashboard under the best-matching JO

> **Tip**: If the AI assigns a candidate to the wrong job order, you can always manually reassign them via the Talent Pool feature.

---

### 2.3 Managing Candidates Through the Pipeline

Every candidate progresses through a structured hiring pipeline:

```
HR Interview → Tech Interview → Offer → Hired
                                         ↓
                                      Rejected (at any stage)
                                         ↓
                                    Talent Pool (for future consideration)
```

#### Viewing a Candidate Profile

1. From the Dashboard, click on any candidate's name or card
2. A detailed profile opens with these tabs:

| Tab | What It Shows |
|-----|-----|
| **Profile** | AI-generated summary, strengths & weaknesses, skills, work history, education, certifications, salary expectations |
| **CV** | Embedded preview of the original uploaded resume |
| **History** | Timeline of this candidate's applications across all job orders |
| **HR Form** | Structured HR interview form with ratings |
| **Tech Form** | Structured technical interview form with ratings |
| **Offer** | Offer details (amount, position, start date, status) |

[Screenshot: Candidate profile showing AI summary, match score ring, strengths and weaknesses in two columns]

#### Understanding the Match Score

The **Match Score** is displayed as a colored ring next to each candidate's name:
- **Green (75–100)**: Strong match — meets most or all requirements
- **Amber (50–74)**: Decent match — meets some requirements, may have gaps
- **Red (0–49)**: Weak match — significant gaps in requirements

This score is generated by the AI based on how well the candidate's skills, experience, and qualifications align with the job order's requirements.

#### Conducting an HR Interview

1. Open the candidate profile → click the **HR Form** tab (or the "Open HR Form" button)
2. Fill in the interview details:
   - **Interview Date, Interviewer, Mode** (Face-to-face, Video, Phone)
   - **Candidate logistics**: notice period, salary expectation, earliest start date, work setup preference
   - **Ratings** (1–5 stars): Communication, Cultural Fit, Engagement, Professionalism
   - **Strengths and Concerns** (free text)
3. Set the **Verdict**:
   - **Pass** → candidate automatically moves to **Tech Interview** stage
   - **Fail** → candidate moves to **Rejected**
   - **Conditional** or **Pending** → candidate stays in current stage
4. Add a **Verdict Rationale** explaining the decision
5. Click **Save**

[Screenshot: HR Interview form with ratings filled in and verdict dropdown showing "Pass"]

#### Conducting a Technical Interview

1. Open the candidate profile → click the **Tech Form** tab
2. Fill in:
   - **Technical Knowledge Rating** (1–5)
   - **Problem Solving Rating** (1–5)
   - **Code Quality Rating** (1–5)
   - **System Design Rating** (1–5)
   - **Coding Challenge Score** and notes
   - **Technical Strengths** and **Areas for Improvement**
3. Set the **Verdict**:
   - **Pass** → moves to **Offer** stage
   - **Fail** → moves to **Rejected**
4. Click **Save**

[Screenshot: Tech Interview form showing star ratings and the average score calculation]

#### Making an Offer

1. Open the candidate profile → click the **Offer** tab
2. Fill in:
   - **Offer Date**
   - **Offer Amount**
   - **Position Title**
   - **Start Date**
   - **Remarks**
3. Set the **Status**:
   - **Pending** — offer sent, waiting for response
   - **Accepted** → candidate automatically moves to **Hired** and the JO's filled count increases
   - **Rejected** — candidate declined
   - **Withdrawn** — company withdrew the offer
   - **Expired** — offer expired without response
4. Click **Save**

[Screenshot: Offer form with amount, position, and status set to "Accepted"]

#### Sending Emails

From the candidate's row in the table or profile view, click the **Email** button to open the email composer. Enter the subject and message, then send — the email is routed through the system's email webhook.

#### Moving to Talent Pool

If a candidate isn't right for this role but might be valuable later:
1. Click **Move to Pool** on their row or profile
2. Select a reason (JO Filled, Budget Constraints, Not Ready Now, etc.)
3. Add optional notes
4. The candidate moves to the **Talent Pool** for future consideration

#### Re-activating from Talent Pool

1. Navigate to **Talent Pool** in the sidebar
2. Find the candidate and click **Move to Active JO**
3. Select which job order and starting pipeline stage
4. The candidate re-enters the active pipeline

[Screenshot: Talent Pool page showing candidates with disposition badges and "Move to Active JO" button]

---

### 2.4 Using the AI Assistant

The AI Assistant (nicknamed **"Gab"**) is a chatbot powered by artificial intelligence. It can search through all candidate profiles and job requirements to answer your questions.

#### How to Use It

1. Click the **AI Assistant** icon in the sidebar (robot icon)
2. Type a question in the chat box and press Enter
3. The AI responds in real-time with streaming text

#### Example Questions

| What You Can Ask | Example |
|------------------|---------|
| Find candidates | "Who are the best candidates for the Data Engineer position?" |
| Compare candidates | "Compare Keith Mallare and John Doe for the L3 Developer role" |
| Skill search | "Which candidates have Power BI and SQL experience?" |
| Resume summary | "Summarize the qualifications of candidate Maria Santos" |
| Job requirements | "What skills are needed for JO-2026-003?" |
| Gap analysis | "What skills does candidate X lack for the Senior Engineer role?" |

[Screenshot: AI Assistant showing a question about Data Engineer candidates with a formatted response including a comparison table]

#### Tips

- Be specific in your questions for better results
- The AI can format responses with tables, bullet points, and bold text
- Each browser has its own chat session — conversations are saved automatically
- Click **Clear Chat** to start a fresh conversation

---

### 2.5 Analytics & Reporting

The Analytics page provides visual dashboards covering every aspect of your recruitment operations.

#### Accessing Analytics

1. Click the **Analytics** icon in the sidebar (bar chart icon)
2. Use the filters at the top to narrow by **Department**, **Level**, or **Time Range**

#### Available Reports

| Section | What It Shows |
|---------|---------------|
| **KPI Cards** | Hired This Month, Total Hired, Avg Time-to-Hire, Active Jobs, Active Pipeline, Total Applications, Unique Candidates, Average Score |
| **Recruitment Funnel** | Conversion rates from Applied → HR → Tech → Offer → Hired, with drop-off percentages |
| **Pipeline Distribution** | Pie chart of candidates across pipeline stages |
| **Time-to-Fill** | Average days per stage, department turnaround times, per-JO fill times |
| **Pipeline Aging** | How long candidates sit in each stage (color-coded: green/amber/red) |
| **Department Breakdown** | Hires, rejections, and active pipelines by department |
| **Candidate Source & Quality** | Internal vs. External split, score distributions, work setup preference breakdown |
| **Interview Analytics** | Monthly interview volume (HR vs. Tech), verdict breakdowns (pie charts) |
| **Offer Analytics** | Acceptance/rejection/pending rates |
| **Monthly Trends** | Applications and hires over time (line chart) |
| **Job Order Fill Rate** | Table showing fill progress per position with aging indicators |

[Screenshot: Analytics dashboard showing the KPI cards row and the recruitment funnel visualization]
[Screenshot: Time-to-Fill section with bar chart and department turnaround comparison]

#### Other Views

- **Candidates Page** — a cross-job-order table of all candidates with sorting, filtering, and drawer-style profile access
- **Archive Page** — view and manage archived/closed job orders (unarchive or delete)
- **History Page** — full activity audit trail with 7 filterable sections covering every system action
- **Pooled Job Orders** — view JOs in pooling status with their available pooled candidates

---

## 3. Frequently Asked Questions (FAQ)

### Setup & Access

**Q: How do I access the system?**
A: Open the provided URL in your web browser (Google Chrome recommended). No login is required — access is controlled by your network/VPN. Contact the IT team if you can't reach the URL.

**Q: Does it work on mobile?**
A: The system is designed for desktop browsers. While it may work on tablets, the best experience is on a desktop or laptop screen.

**Q: Can multiple people use it at the same time?**
A: Yes. Multiple users can access the system simultaneously. Each user has independent chat sessions. All data is shared through the central database.

---

### CV Upload & Processing

**Q: What file formats are supported for CV upload?**
A: PDF (.pdf) and Microsoft Word (.docx) files. Maximum file size is 10 MB per file.

**Q: How long does CV processing take?**
A: Typically 30 seconds to 2 minutes per CV, depending on length and complexity. A notification will appear when processing is complete.

**Q: What if the AI assigns a candidate to the wrong job order?**
A: You can move the candidate to the Talent Pool and then re-activate them into the correct job order at any pipeline stage.

**Q: What does "Let AI Decide" do during upload?**
A: Instead of manually selecting a job order, the AI analyzes the resume and automatically matches it to the most relevant open job order based on skills, experience, and requirements.

**Q: Where are the original CVs stored?**
A: The original files are uploaded to Google Drive. You can view or download them from the candidate's **CV** tab.

---

### Pipeline & Candidates

**Q: How is the match score calculated?**
A: The AI converts both the resume and job description into vector embeddings, then calculates similarity. It also evaluates specific qualifications, experience level, certifications, and skill alignment. The result is a 0–100 score.

**Q: What happens when I mark an HR interview as "Pass"?**
A: The candidate automatically moves from the HR Interview stage to the Tech Interview stage. A timeline entry is created. The same auto-advance happens for Tech Interview (Pass → Offer) and Offer (Accepted → Hired).

**Q: Can I move a candidate backward in the pipeline?**
A: The standard flow is forward-only (HR → Tech → Offer → Hired). To reconsider a rejected candidate, move them to the Talent Pool and re-activate them.

**Q: What is the Talent Pool?**
A: A holding area for promising candidates who aren't right for their current job order. You can pool candidates with a reason (budget constraints, JO filled, etc.) and re-activate them later for any open position.

**Q: What does "Aging" mean?**
A: Aging shows how many days a candidate has been in their current pipeline stage. Colors indicate urgency: green (≤5 days), orange (6–10 days), red (>10 days). For job orders, it shows how long the JO has been open.

---

### AI Assistant

**Q: What can I ask the AI chatbot?**
A: Anything related to candidates and job orders — skill searches, candidate comparisons, resume summaries, qualification gap analysis, job requirement queries, and more. It searches through all candidate and JO data.

**Q: Are AI responses always accurate?**
A: The AI bases its responses on actual data from the system. However, always verify critical decisions. If data is insufficient, the AI will tell you explicitly.

**Q: Can colleagues see my chat conversations?**
A: No. Chat sessions are stored in your browser only. Other users have their own independent sessions.

---

### Common Errors

**Q: I uploaded CVs but candidates aren't appearing.**
A: Wait for the notification banner, then refresh. If candidates still don't appear after 5 minutes, the processing webhook may have failed — contact the IT team to check the n8n workflow status.

**Q: The page shows "Database connection failed."**
A: The backend server may have lost connection to the database. Contact the IT team to check the server health.

**Q: I can't send emails to candidates.**
A: Email sending requires the n8n email webhook to be active. Contact the IT team to verify the webhook status.

---

## 4. Marketing Brief

### Product Positioning

**Exist AI Recruiter** is an enterprise-grade AI-powered Applicant Tracking System purpose-built for organizations that want to eliminate manual resume screening, reduce time-to-hire, and make data-driven recruitment decisions.

### Tagline Options

- "AI-Powered Hiring, Human-Driven Decisions"
- "From Resume to Hire — Powered by AI"
- "Smarter Recruitment Starts Here"

### Target Users

| Segment | Pain Points We Solve |
|---------|---------------------|
| **Mid-size companies (100–1,000 employees)** | Manual resume screening, inconsistent interview processes, lost candidate data |
| **HR teams with 3+ recruiters** | Pipeline visibility, candidate handoff between stages, reporting |
| **Tech companies** | Technical interview tracking, skills-based matching, internal mobility |
| **Companies with high hiring volume** | Batch CV processing, AI matching at scale, automated pipeline advancement |

### Competitive Advantages

| Feature | Exist AI Recruiter | Traditional ATS (BambooHR, Workday) | Basic Tools (Spreadsheets) |
|---------|:------------------:|:-----------------------------------:|:--------------------------:|
| AI resume parsing | ✅ Automatic | ⚠️ Limited/extra cost | ❌ Manual |
| AI candidate matching | ✅ Vector similarity scoring | ❌ Keyword matching | ❌ None |
| Structured interview forms | ✅ Built-in HR + Tech | ⚠️ Varies | ❌ None |
| Visual Kanban pipeline | ✅ Yes | ⚠️ Some | ❌ None |
| AI chatbot assistant | ✅ RAG-powered | ❌ None | ❌ None |
| Analytics dashboard | ✅ 20+ charts | ⚠️ Basic | ❌ None |
| Talent pool management | ✅ Yes | ⚠️ Limited | ❌ None |
| Internal vs. external tracking | ✅ Built-in | ❌ Usually not | ❌ Manual |
| Self-hosted / data control | ✅ Docker deployable | ❌ SaaS only | ✅ Local |

### Key Differentiators

1. **AI-First Architecture**: Not a traditional ATS with AI bolted on — AI is the foundation. Every candidate is vectorized and matched automatically.
2. **Conversational Intelligence**: The AI chatbot can answer natural-language questions about your entire candidate pool, something no traditional ATS offers.
3. **Self-Hosted Control**: Deploy on your own infrastructure. Your data never leaves your servers (except for AI processing through your own n8n instance).
4. **End-to-End Pipeline**: From requisition to hire in one system — no need for separate interview scheduling tools or spreadsheet trackers.
5. **Internal Mobility**: Built-in support for internal applicants with specific fields for transfer dates, departments, and approval tracking.

---

## 5. Internal Onboarding

### Demo Script (15 minutes)

Use this script when demonstrating the system to new team members or stakeholders.

---

**[2 min] Introduction**

> "This is Exist AI Recruiter, our AI-powered applicant tracking system. It handles the full hiring pipeline — from creating a job requisition to making an offer. What makes it unique is that AI does the heavy lifting: it reads resumes, scores candidates, and even has a chatbot you can ask questions to."

---

**[3 min] Creating a Job Order**

> "Let's start by creating a job order. I'll navigate to Create JO..."

1. Show the auto-generated JO number
2. Fill in a sample position (e.g., "Data Engineer")
3. Demonstrate the department selector and rich text job description
4. Click Create and show it appearing in the Dashboard

[Screenshot: Create JO form filled with sample data]

---

**[4 min] Uploading CVs & AI Processing**

> "Now I'll upload some resumes. Watch how the AI processes them..."

1. Go to Upload CV page
2. Drag-and-drop 2–3 sample PDFs
3. Show the "Let AI Decide" option
4. Click Vectorize Documents
5. Wait for processing, then show the notification

> "The AI extracted all the information — name, skills, experience, education — and automatically scored each candidate against our job orders."

[Screenshot: Upload page with files queued for processing]

---

**[3 min] Dashboard & Kanban Pipeline**

> "Here's where the magic happens. Our Kanban board shows every candidate by stage..."

1. Open the Dashboard, select the job order
2. Show Kanban view with candidates in different columns
3. Click a candidate to show the profile with AI summary, strengths, weaknesses
4. Highlight the Match Score ring

[Screenshot: Kanban board with a candidate modal open showing the AI-generated profile]

---

**[2 min] AI Assistant**

> "And here's my favorite feature — the AI chatbot. Let me ask it a question..."

1. Navigate to AI Assistant
2. Type: "Who are the best candidates for Data Engineer?"
3. Show the streaming response with formatted output

[Screenshot: AI chatbot responding with a candidate comparison table]

---

**[1 min] Analytics**

> "Finally, the Analytics dashboard gives leadership visibility into the entire recruitment funnel..."

1. Show KPI cards and the recruitment funnel
2. Highlight time-to-hire and department breakdowns

[Screenshot: Analytics page with KPI cards and funnel chart]

---

### Terminology Glossary

| Term | Definition |
|------|-----------|
| **ATS** | Applicant Tracking System — software for managing the hiring process |
| **JO (Job Order)** | A job requisition; an open position that needs to be filled |
| **JO Number** | Auto-generated identifier in the format JO-YYYY-NNN (e.g., JO-2026-001) |
| **Pipeline** | The sequence of stages a candidate goes through: HR Interview → Tech Interview → Offer → Hired |
| **Pipeline Status** | A candidate's current stage in the hiring process |
| **Match Score** | AI-generated 0–100 number indicating how well a candidate matches a job order |
| **Vectorize** | The AI process of converting a resume into numerical embeddings for similarity matching |
| **Kanban Board** | A visual board with columns for each pipeline stage; candidates appear as cards |
| **Verdict** | The outcome of an interview: Pass, Fail, Conditional, or Pending |
| **Talent Pool** | A holding area for candidates who are promising but not hired for the current role |
| **Disposition** | A pooled candidate's status: Available, Not Suitable, On Hold, Activated, or Archived |
| **Aging** | The number of days since a JO was created or since a candidate entered their current stage |
| **Level** | Position seniority ranging from L1 (Entry) to L5 (Lead) |
| **Internal Candidate** | An existing Exist employee applying for a different role within the company |
| **External Candidate** | A candidate from outside the company |
| **Requestor** | The person who submitted the job order request (e.g., a hiring manager) |
| **Uploader** | The person who uploaded CVs into the system |
| **n8n** | The workflow automation platform that powers the AI processing behind the scenes |
| **RAG** | Retrieval-Augmented Generation — the AI technique used by the chatbot to search data before answering |
| **Webhook** | A URL that one system calls to send data to another system |
| **Embedding** | A numerical representation of text used for AI similarity comparisons |
