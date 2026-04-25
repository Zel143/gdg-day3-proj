# README

> Setup instructions and event-day workflow. Read this once when you join the repo.
>
> For project conventions and coding rules, read `CONTEXT.md`.

---

## Environment Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd <project-folder>

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Gemini API key

# 4. Start dev server
npm run dev
```

---

## AI Coding Setup

- **Tool:** Antigravity
- **Model:** Claude Opus 4.6 (Thinking)

### One-Time Setup: Auto-Load SKILL.md

So you don't have to reference `@SKILL.md` every conversation:

1. Open **Agent Manager** → **Settings** → **Customizations**
2. Find **Customize Global Skills** → **Skill Custom Paths**
3. Add the **absolute path** to your local repo folder (e.g., `d:\Documents\gdg`)
4. Antigravity will find `SKILL.md` by its frontmatter and load it as a skill automatically

Once set, `SKILL.md` guidelines apply to every conversation — no `@` needed.

### Per-Conversation Workflow

1. **Start each new conversation** with: `@CONTEXT.md @DESIGN.md [your request]`
   - SKILL.md is already loaded via the step above
2. **One task per conversation** — build one component, fix one bug. Don't reuse conversations across multiple tasks.
3. **After the AI generates code:** Read it before committing. If you can't explain what a line does, ask the AI to explain it.
4. **If the AI over-generates:** Delete the excess. It's cheaper to cut than to debug code you don't understand.

### If Output Quality Drops

**Start a new conversation** and re-attach `@CONTEXT.md @DESIGN.md`. Don't argue with the AI — a fresh context is faster.

---

## Hackathon Day Workflow

> **Actual coding window: 1:30 PM – 3:15 PM (1 hr 45 min total).** Plan accordingly.

### Phase 1: Kickoff (1:30 PM — first 10 min)
- Understand the problem as a team
- Decide on a solution concept (keep it simple — one core feature, done well)
- Pick a `DESIGN.md` from [getdesign.md](https://getdesign.md) — add it to the repo
- Assign file ownership in `CONTEXT.md`
- **DO NOT start coding until ownership is assigned**

### Phase 2: Build (1:40 PM – 2:45 PM — 65 min)
- Each person builds their assigned components
- Communicate blockers immediately — don't waste 10 min stuck
- Integrate components into `App.tsx` incrementally (owner announces before each merge)
- Populate `index.css` with CSS variables from the chosen `DESIGN.md`

### Phase 3: Polish + Deploy (2:45 PM – 3:15 PM — 30 min)
- **Stop adding features.** Seriously. Stop.
- Fix bugs, clean up UI, test the happy path end-to-end
- Deploy to Vercel
- Prepare a 2-min demo: what it does, how it uses Gemini, one live walkthrough

### Phase 4: Demo (4:10 PM)
- One person presents (decide who during Phase 1)
- Show the live deployed URL
- Keep it focused: problem → solution → live demo → done
