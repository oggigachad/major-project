# EvalixAI — Landing Page

The AI hiring pipeline for startups. A single-page Next.js 16 landing site with GSAP + anime.js + Framer Motion animations.

## Quick Start (npm)

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server
npm run dev

# 3. Open http://localhost:3000
```

## Scripts

| Command           | Description                                   |
| ----------------- | --------------------------------------------- |
| `npm run dev`     | Start the dev server on port 3000             |
| `npm run build`   | Production build                              |
| `npm run start`   | Run the production server                     |
| `npm run lint`    | Run ESLint                                    |

## Tech Stack

- **Framework:** Next.js 16 (App Router) + TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **Animations:** GSAP + ScrollTrigger, anime.js v4, Framer Motion
- **Icons:** Lucide React
- **Fonts:** Inter, Instrument Serif, JetBrains Mono (Google Fonts)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout + fonts + metadata
│   ├── page.tsx            # Assembles all landing sections
│   └── globals.css         # EvalixAI palette + animation utilities
└── components/
    └── landing/
        ├── navbar.tsx
        ├── hero.tsx
        ├── logos-marquee.tsx
        ├── feature-grid.tsx
        ├── how-it-works.tsx
        ├── horizontal-use-cases.tsx
        ├── manifesto.tsx
        ├── highlight-sections.tsx
        ├── sticky-stats.tsx
        ├── pipeline-funnel.tsx
        ├── security.tsx
        ├── final-cta.tsx
        ├── footer.tsx
        ├── scroll-progress.tsx
        ├── evalix-logo.tsx
        ├── use-gsap.ts          # Reusable GSAP hooks (reveal, split-text)
        └── use-count-up.ts      # anime.js count-up hook
```

## Requirements

- Node.js 18.18+ (Next.js 16 requirement)
- npm 9+

## Credits

Built by **Aakash Sarang** and **Manish Kumar Srivastav**
B.Tech, Computer Science & Engineering — Jagran Lakecity University
