# Canon Framework

The **Canon Framework** is an AI-governed knowledge management system designed for multi-author consistency. It allows a team to build a unified narrative ("The Canon") where every entry is validated for technical logic and narrative coherence.

## Core Features

### 1. The Dual-Mode UI
The application supports two distinct "lenses" for viewing the project:
- **Technical View:** A professional systems-engineering perspective using terms like *Foundation, Protocol, and Friction*.
- **Revelation Mode:** A scriptural perspective that reveals the project's deeper vision using biblical stages (*Genesis, Leviticus, Lamentations, Gospels, Revelation*).

### 2. The Guardian AI (Dual Witness)
Powered by Google Gemini, the **Guardian** reviews every submission to ensure it aligns with the project's "Anchor" and "Lexicon." It provides a **Dual Witness** response:
- **The Audit:** A clinical, technical analysis of system logic.
- **The Testimony:** A poetic, scriptural synthesis of the work's significance.

### 3. The Golden Thread
Interactive relational mapping allows users to click on any "Resolution" (Gospel) to visually highlight the "Struggle" (Lamentation) it fulfills.

---

## Technical Stack

- **Runtime:** React 19 + TypeScript
- **Database:** Supabase (PostgreSQL + Real-time Sync)
- **AI Engine:** Google Gemini API
- **Styling:** CSS Variables + Dynamic Mode Switching

---

## Setup & Deployment

1. **Clone & Install:**
   ```bash
   git clone <repo-url>
   npm install
   ```

2. **Supabase Configuration:**
   - Link your project: `npx supabase link --project-ref <your-ref>`
   - Initialize the `canon_state` table in the Supabase SQL Editor (see `assets/plan.md` for schema).
   - Enable **Realtime** for the `canon_state` table in the Supabase dashboard.

3. **Environment Variables:**
   - Add your keys to `src/lib/supabase.ts` and `VITE_GEMINI_API_KEY` to your local environment.

4. **Start Development:**
   ```bash
   npm run dev
   ```

---

## Documentation
- `CONTEXT.md`: Project conventions and rules.
- `assets/STYLE_GUIDE.md`: Guidelines for writing for the Guardian AI.
- `assets/PROMPT_GUIDELINES.md`: Detailed logic of the AI's internal reasoning.
