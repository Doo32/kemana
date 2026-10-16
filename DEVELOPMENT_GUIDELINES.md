# Development Guidelines - Kemana?

## Core Programming Principles
You must strictly follow these engineering principles to prevent code bloat and "AI Slop":

1. **DRY (Don't Repeat Yourself)**
   - Extract repetitive logic (like Currency Formatting, Date Handling, or Toast Alerts) into shared utility functions or custom React hooks inside `@/utils` or `@/hooks`.
   - Never duplicate the same API fetching logic across multiple components.

2. **KISS (Keep It Simple, Stupid)**
   - Write clean, readable component structures. Prefer small, single-responsibility UI components over monstrous, multi-hundred-line files.
   - Use built-in JavaScript/Next.js web features before installing new npm packages.

3. **YAGNI (You Ain't Gonna Need It)**
   - Stick strictly to the features defined in `PRD.md` and architecture endpoints in `ARCHITECTURE.md`.
   - Do NOT implement future predictions like "charts", "PDF exports", or "multi-currency support" unless explicitly requested by the user.

## Code Quality Rules
- All components must be responsive and mobile-first using Tailwind CSS.
- Ensure strict TypeScript typing; avoid using `any`.
- Keep the folder structure clean and aligned with Next.js App Router conventions.