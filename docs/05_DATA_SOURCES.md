# Data Sources & Ingestion Specification: EvalixAI

## 1. Upstream Data Sources
EvalixAI ingests structured and unstructured data from multiple input streams:

1. **Candidate Resumes & CVs:**
   - **Formats:** PDF, Microsoft Word (`.docx`, `.doc`), Plain Text (`.txt`).
   - **Upload Method:** Client-direct S3 presigned PUT URLs (`/api/v1/uploads/presign`).
   - **Ingestion Pipeline:**
     1. Client uploads document directly to SeaweedFS / S3 bucket `resumes`.
     2. Backend event or webhook triggers text extraction worker.
     3. Extraction engine converts binary to plaintext via `pypdf` and `python-docx`.
2. **Job Descriptions & Role Requirements:**
   - Input through Recruiter Dashboard UI or ATS API connectors.
   - Tokenized into canonical skills, seniorities, and responsibilities.
3. **Assessment Banks & Question Libraries:**
   - Pre-seeded question banks covering Quantitative Aptitude, Logical Reasoning, System Design, and Frontend/Backend Engineering.
   - Dynamic question generation via LLM API according to job requirements.
4. **Candidate Proctoring Telemetry Streams:**
   - Real-time client browser telemetry: window focus, page visibility state, keyboard navigation patterns, clipboard interactions.

---

## 2. Ingestion Lifecycles & Validation
- **MIME Type Validation:** Magic number verification prevents executable renaming attacks (`application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`).
- **File Size Cap:** Enforced at reverse proxy and S3 presigned policy ($10\text{ MB}$ maximum).
- **Anti-Duplication:** SHA-256 fingerprinting on uploaded resume contents to detect duplicate submissions across multiple jobs.
