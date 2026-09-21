Skills & Rules
Core Principle
Do exactly what is asked. Nothing more, nothing less. No assumptions, no extra features.

Hardcoded Data — Strictly Prohibited
Never hardcode values that could change (API keys, URLs, ports, credentials, file paths, IDs, emails, usernames).
All configurable values MUST come from:
Environment variables (.env file)
Config files (e.g., config.json, settings.py, appsettings.json)
Constants files (only for truly fixed values)
Never invent or assume API endpoints, database names, credentials, or URLs — read them from config/env.
No magic numbers or magic strings — extract into named constants or config.
Never embed secrets, tokens, or passwords in source code.
Scope Discipline
Implement ONLY the requested feature/fix. No refactoring, renaming, or "improvements" unless explicitly asked.
Do not add extra files, folders, dependencies, or libraries unless required for the task.
Do not add comments, docstrings, or documentation unless asked.
Do not create README, tests, or example files unless requested.
If something seems wrong or incomplete in the request, ASK — don't silently "fix" or expand it.
Data & Logic Rules
No placeholder/fake/sample data unless explicitly requested.
No dummy values to "make it work" — if real data is unavailable, ask or read from the proper source.
Never silently fall back to default values — if a required value is missing, throw a clear error.
Do not skip or weaken validation/error handling to force code to run.
No silent catches (empty catch/except blocks).
File & Change Rules
Never delete or overwrite existing files without explicit instruction.
Keep diffs minimal — touch only the lines necessary for the task.
Follow the existing code style, naming conventions, structure, and patterns of the project.
Don't reformat or reorder untouched code.
Communication Rules
If the request is ambiguous, ask for clarification before writing code.
If a required value (API key, URL, path, etc.) is unknown, ask for it — never guess.
State what was changed and why. Nothing else.
Never claim something works unless it has been verified.
Final Checks (Before Completing Any Task)
 Zero hardcoded values introduced
 No changes outside the requested scope
 No new files/dependencies beyond what was needed
 No placeholder or fake data
 Existing functionality untouched
 Ambiguities were asked about, not assumed