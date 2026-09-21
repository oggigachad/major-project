# Product Requirements Document (PRD): EvalixAI

## 1. Product Overview
EvalixAI is an intelligent recruitment automation suite designed to remove human bias, accelerate time-to-hire by 75%, and provide verified candidate skill validation for fast-growing startups and enterprises.

---

## 2. Target Personas
1. **Hiring Managers & Recruiters:**
   - Create job requisitions and configure screening criteria.
   - Monitor live candidate pipelines and inspect detailed candidate audit cards.
   - Adjust weighted composite ranking algorithms dynamically.
   - Export structured candidate dossiers (PDF/CSV) and make hiring decisions.
2. **Candidates / Job Applicants:**
   - Browse job requisitions and submit applications with resume drag-and-drop.
   - Complete timed, browser-proctored technical assessments.
   - Participate in conversational AI mock interviews via webcam and microphone.
   - Receive transparent developmental feedback and progress status.

---

## 3. Core Functional Pillars
1. **Module 1: Resume Intake & Semantic Screening (FR-1)**
   - Upload PDF/DOCX resumes (up to 10MB) to S3-compatible storage.
   - Extract biographical data, work history, education, and skills.
   - Dense vector embedding calculation via Qdrant for semantic matching against Job Descriptions.
   - Compute matching score (0–100%), identify matched and missing skills.
2. **Module 2: Automated Aptitude & Technical Screening (FR-2)**
   - Dynamic assessment generation covering MCQs, multi-select, and short code/analytical questions.
   - Server-side countdown timers, question randomization, and anti-cheating browser telemetry.
   - Real-time logging of tab switches, full-screen departures, and copy-paste events.
3. **Module 3: AI Conversational Interview Engine (FR-3)**
   - Adaptive question prompts generated based on candidate's specific resume and role criteria.
   - Multi-modal response capture: WebRTC audio/video and real-time speech-to-text transcription.
   - AI evaluation across role alignment, communication clarity, problem-solving, and technical depth.
4. **Module 4: Sandboxed Coding Tasks (FR-4)**
   - Execution environment for live code evaluation across multiple languages (Python, JS/TS, Go).
   - Automated unit test runner measuring correctness, runtime latency, and memory complexity.
5. **Module 5: Weighted Ranking & Candidate Intelligence (FR-5)**
   - Configurable weight sandbox formula:
     $$\text{Composite Score} = (w_r \times \text{Resume}) + (w_a \times \text{Assessment}) + (w_i \times \text{Interview}) + (w_c \times \text{Coding})$$
   - Real-time leaderboard, percentile distribution, and PDF/CSV reporting.
6. **Module 6: Multi-Tenant Recruiter Workspace & Governance (FR-6 & FR-7)**
   - Organization accounts, role-based access control (Admin, Recruiter, Reviewer).
   - Enterprise security: Bcrypt, JWT auth, session management, and brute-force rate limits.
