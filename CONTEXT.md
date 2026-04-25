# Project Context

> Single source of truth for the hackathon project. Every team member and AI tool must reference this file before writing any code.

## Project

- **Team Size:** 4–5
- **Problem:** _[TBD — filled when announced at event]_
- **Solution:** _[TBD — decided by team within 15 min of problem announcement]_

## Goals

- **Team alignment** — Same context, same tools, same conventions. Read all three `.md` files.
- **Quality** — Output should be understandable, deployable, and demo-ready. Not just "it runs."

---

## Tech Stack

| Layer       | Choice                                              | Note                                                         |
| ----------- | --------------------------------------------------- | ------------------------------------------------------------ |
| Runtime     | Node.js >= 20                                       | LTS, stable                                                  |
| Framework   | React 19 + TypeScript                               | Component splitting for parallel work                        |
| Build       | Vite                                                | Fast HMR, zero-config TS support                             |
| Styling     | Plain CSS + `DESIGN.md` tokens                      | Team picks a `DESIGN.md` from [getdesign.md](https://getdesign.md) during planning |
| AI          | Google Gemini API (`@google/generative-ai`)         | Event theme                                                  |
| AI Model    | `Claude Opus 4.6`                                   | Great |
| Deployment  | Vercel                                              | Static deploy — set API key usage cap in AI Studio           |
| Pkg Manager | **npm only** — do NOT use yarn or pnpm              | Prevents lockfile conflicts                                  |

---

## Context Files

Every team member must instruct their AI to read **all three files** at the start of each session:

| File          | Purpose                                               |
| ------------- | ----------------------------------------------------- |
| `CONTEXT.md`  | Project conventions, tech stack, rules, workflow       |
| `SKILL.md`    | AI behavioral guidelines — how the AI should think and code (Karpathy Guidelines) |
| `DESIGN.md`   | Visual design tokens — chosen collectively at event from [getdesign.md](https://getdesign.md) |
| `README.md`   | Setup instructions and event-day workflow (read once, not for AI) |

---

## Project Structure

```
src/
  components/        # One folder per component (ComponentName.tsx + ComponentName.css)
  lib/
    gemini.ts        # Gemini API wrapper — the ONLY way to call Gemini
  App.tsx            # Main app layout — SHARED FILE, do not edit without announcing
  App.css            # App-level styles
  main.tsx           # Entry point — DO NOT TOUCH
  index.css          # Global styles and CSS variables — SHARED FILE, populated after DESIGN.md is chosen
.env.example         # Template for local env vars
.env.local           # Your actual keys (gitignored, never committed)
CONTEXT.md           # This file
SKILL.md             # AI behavioral guidelines
DESIGN.md            # Visual design tokens (added during planning at event)
```

---

## How Gemini API Works

Calls Gemini directly from the browser using the SDK. API key is in `.env.local` as `VITE_GEMINI_API_KEY`.

All components call `askGemini()` from `src/lib/gemini.ts`. Never import `@google/generative-ai` directly in components.

---

## Rules

### DO

- Use **functional components** with hooks (`useState`, `useEffect`, etc.)
- Call Gemini through `askGemini()` in `src/lib/gemini.ts` — never import the SDK directly in components
- **One component per file.** File name matches component name: `Header.tsx` exports `<Header />`
- Each component has its own `.css` file
- Follow the CSS variables and tokens defined in `DESIGN.md`
- Commit often, small commits, descriptive messages
- `git pull` before every `git push`
- Announce in the group chat before editing any shared file

### DO NOT

- **Do NOT install new npm packages** without telling the team first
- **Do NOT modify shared files** (`App.tsx`, `main.tsx`, `lib/gemini.ts`, `index.css`, `CONTEXT.md`) without announcing
- **Do NOT use class components**
- **Do NOT use `any` type** unless you're stuck for more than 5 minutes — then use it and move on
- **Do NOT call the Gemini SDK directly** in components — always go through `src/lib/gemini.ts`
- **Do NOT push broken code** — run `npm run dev` and verify your changes render before pushing
- **Do NOT write unit tests** unless the team explicitly decides to — time is too limited

---

## Git Workflow

- **Repo owner:** _[Your name]_
- **Strategy:** Trunk-based (everyone pushes to `main`)
- **Conflict prevention:** Each person only edits files they own. If you need to change someone else's file, tell them.
- **Commit messages:** `[your-name] short description` (e.g., `[leee] add header component`)
- Before pushing: `git pull --rebase origin main` → fix conflicts if any → `git push`

---

## File Ownership

> Assigned after the problem is announced. Fill this table during planning.

| Member     | Owns                                             |
| ---------- | ------------------------------------------------ |
| _[You]_    | `App.tsx`, `CONTEXT.md`, `lib/`, configs          |
| _Member 2_ | _TBD_                                            |
| _Member 3_ | _TBD_                                            |
| _Member 4_ | _TBD_                                            |
| _Member 5_ | _TBD_                                            |

