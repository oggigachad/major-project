# Project Changelog: EvalixAI

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.2.1] - 2026-09-21
### Added
- Created complete documentation suite in `/docs` adhering to the system specification tree.
- Cross-platform `npm run dev` script support for native Windows and macOS environments.
- Comprehensive SRS implementation gap analysis (`SRS_IMPLEMENTATION_GAP_ANALYSIS.md`).

### Fixed
- Fixed `npm run dev` WSL/bash dependency failure on Windows environments.

---

## [0.2.0] - 2026-09-18
### Added
- Complete Recruiter Cockpit Dashboard (`/dashboard`) built with Next.js 16 App Router and Tailwind CSS.
- Candidate table with real-time filtering, stage advancement, and multi-field sorting.
- Candidate detailed slide-out inspection drawer with radial score meters and resume viewer.
- FastAPI backend integration with MongoDB (Motor), Redis 7 sessions, Qdrant vector engine, and SeaweedFS S3.
- Bcrypt password hashing ($\ge 12$ rounds) and secure JWT single-use refresh token rotation with theft detection.
- Heuristic and vector-based candidate semantic resume screening pipeline.
- Docker Compose multi-service architecture for local development and deployment.

---

## [0.1.0] - 2026-09-01
### Added
- Initial project scaffold and core database schemas.
- Basic authentication and session management.
