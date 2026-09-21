# Microtasks & Implementation Roadmap: EvalixAI

## Sprint 1: Candidate Application Portal (`/apply/[jobId]`)
- [ ] Task 1.1: Build public job detail view with company overview and criteria list.
- [ ] Task 1.2: Implement resume drag-and-drop file uploader using S3 presigned PUT URL.
- [ ] Task 1.3: Wire applicant contact info form (name, email, phone, LinkedIn/GitHub URLs).
- [ ] Task 1.4: Backend async worker to parse resume text (`pypdf`, `python-docx`) upon upload.
- [ ] Task 1.5: Candidate confirmation receipt screen with generated assessment session link.

---

## Sprint 2: Browser-Proctored Assessment Room (`/assessment/[sessionId]`)
- [ ] Task 2.1: Implement server-synchronized countdown timer with local clock drift compensation.
- [ ] Task 2.2: Dynamic question card viewer supporting MCQ, multi-select, and text answers.
- [ ] Task 2.3: Anti-cheat event listeners for page visibility change, tab blur, and full-screen exits.
- [ ] Task 2.4: Real-time telemetry reporting endpoint (`POST /api/v1/assessments/{id}/telemetry`).
- [ ] Task 2.5: Auto-submission worker on countdown expiry.

---

## Sprint 3: AI Conversational Interview Room (`/interview/[sessionId]`)
- [ ] Task 3.1: Build WebRTC audio/video preview component with device permissions check.
- [ ] Task 3.2: Render AI interviewer avatar / question prompt container with per-question timer.
- [ ] Task 3.3: Web Speech API / Whisper real-time audio transcription pipeline.
- [ ] Task 3.4: LLM response grading engine evaluating clarity, depth, and role alignment.
- [ ] Task 3.5: Recruiter side-by-side synchronized interview transcript review UI.

---

## Sprint 4: Deep Analytics, Weight Sandbox & PDF/CSV Export
- [ ] Task 4.1: Implement interactive Weight Sandbox slider controls recalculating composite scores.
- [ ] Task 4.2: Candidate PDF summary report generator using `@react-pdf/renderer` or server-side headless Chrome.
- [ ] Task 4.3: Bulk CSV export for candidate pipeline leaderboards and audit events.
