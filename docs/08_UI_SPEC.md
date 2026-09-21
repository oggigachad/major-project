# User Interface (UI) Specification: EvalixAI

## 1. Design System & Style Guidelines
- **Typography:** Geist Sans / Inter for data legibility; Geist Mono for code artifacts and scores.
- **Color Palette:**
  - Background: Deep slate dark theme (`bg-[#0B0F17]`, `bg-card #111827`).
  - Primary Brand: Electric Indigo (`#6366F1`) and Teal / Cyan accents (`#06B6D4`).
  - Semantic Status:
    - Success: Emerald (`#10B981`)
    - Warning: Amber (`#F59E0B`)
    - Destructive: Crimson / Rose (`#F43F5E`)
- **Micro-Interactions:** Framer Motion spring physics for modals, side drawers, score radial bars, and pipeline drag-and-drop.

---

## 2. Recruiter Cockpit Interfaces
1. **Overview Dashboard (`/dashboard`):**
   - KPI metric stat tiles (Total Candidates, Active Requisitions, Avg Screening Time, Offer Acceptance).
   - High-priority candidate attention feed and recent audit events.
2. **Requisitions (`/dashboard/jobs`):**
   - Card grid with requisition status badges, applicant counts, and weight configuration sliders.
   - Job creation wizard with AI skill recommendation chips.
3. **Pipeline Board & Candidates Table (`/dashboard/candidates`):**
   - Kanban pipeline view with stage columns: `Applied` $\rightarrow$ `Screened` $\rightarrow$ `Assessment` $\rightarrow$ `Interview` $\rightarrow$ `Offer`.
   - Table view with multi-column sorting, facet filters, and search bar.
   - Slide-out candidate detail drawer with score radial rings, resume viewer, and interview transcript tabs.
4. **Interactive Weight Sandbox (`/dashboard/analytics`):**
   - Live interactive weight sliders (Resume, Assessment, Interview, Coding) updating candidate composite scores dynamically in real-time.

---

## 3. Candidate Experience Portal
1. **Application Page (`/apply/[jobId]`):**
   - Role description, requirements, and drag-and-drop resume upload zone.
2. **Assessment Room (`/assessment/[sessionId]`):**
   - Header with countdown timer, question pagination dots, and proctoring status pill.
   - Question canvas supporting single-choice, multiple-choice, and code editors.
3. **AI Mock Interview Room (`/interview/[sessionId]`):**
   - Two-pane interface: AI interviewer conversational prompt and candidate webcam feed.
   - Audio waveform visualizer and real-time speech transcription log.
