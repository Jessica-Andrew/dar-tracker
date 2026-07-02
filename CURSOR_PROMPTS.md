# Cursor prompts — UI polish phase

Prompts to drive the UI polish work. Copy the relevant one into Cursor's
chat, and let it modify the file directly. After each task, run
`npm run dev` and eyeball against `design/day-view-reference.png`.

Two rules that hold across every prompt:
- Cursor should read `DESIGN_TOKENS.md` before making any styling decision.
- If a value isn't in the tokens, Cursor should propose adding it — never
  hard-code a hex, spacing, or duration inline.

---

## 3.1 — Polish DayView to match the reference

Read `design/day-view-reference.png`, `DESIGN_TOKENS.md`, and
`src/components/DayView.tsx`. Compare the current implementation to the
reference and update it to match.

Pay specific attention to:
- The kicker + serif title ratio ("DAILY RECORD" / "Today's harvest")
- The hero numeral position and size relative to the sun illustration
- Task row spacing, divider weights, and how the seed markers sit
  vertically-centered with the description
- The `+ plant a task` link at the bottom — should feel understated,
  not competing with the hero

Do not touch the data logic (`useDayTasks`, add/edit/delete). Only visual
and layout changes. If you need a token that doesn't exist yet, add it
to both `tokens.css` and `tailwind.config.ts` before using it.

---

## 3.2 — Polish EmptyDay

Read `src/components/EmptyDay.tsx` and `DESIGN_TOKENS.md`. The current
implementation has the right structure but the field illustration is
minimal and the vertical rhythm could be tighter.

Improve:
- The field illustration — three furrows are there, but consider adding
  slight variation in the seed dot positions so they feel scattered
  rather than aligned
- The `+ plant your first task` button should get the same visual
  weight as it does on the sign-in screen (same primary variant)
- Ensure the time-of-day greeting still works — "a quiet morning"
  before noon, "afternoon" 12–5, "evening" after

Do not remove the illustration or replace the greeting logic. Only
polish what's there.

---

## 3.3 — Polish AuthGate

Read `src/components/AuthGate.tsx`, `DESIGN_TOKENS.md`, and the sign-in
design as it appears in the conversation history / reference. The
current implementation is close, but check:

- The sun illustration placement (top-right, 74px)
- The clay blob bottom-left has the right size and opacity
- The GitHub button uses `variant="primary"` with the terracotta shadow
- Error state renders in Fraunces italic when sign-in fails
- The footer disclosure text isn't visually competing with the CTA

Do not add alternate auth methods. GitHub-only is the design.

---

## 3.4 — Polish TaskForm modal

Read `src/components/TaskForm.tsx` and confirm the modal:

- Enters with the `animate-card-in` animation
- Uses the underline `Input` style, not boxed
- Field labels are Fraunces italic, "optional" hints are Space Grotesk regular
- On edit, the title reads "Tend to *this row*" and "uproot" appears at
  the right edge of the action row
- On new, the title reads "Plant a *task*" and no "uproot" is shown
- Cmd/Ctrl+Enter should save (add a keydown handler on the modal)
- Escape closes without saving (Radix Dialog handles this by default —
  confirm it works)

If the description field is empty, the save button should be disabled
but not visually hostile — reduced opacity is enough.

---

## 3.5 — Polish ClockifyImportPanel

Read `src/components/ClockifyImportPanel.tsx` and refine:

- Loading state: replace the plain "gathering entries…" text with the
  same italic message but paired with a subtle breathing pulse
  (opacity oscillating between 0.5 and 1 on a 1.2s cycle) — no spinner
- The checkbox is custom (already in place) — verify it matches the
  small terracotta square with white checkmark from the design
- The "merge as one" button is `variant="outline"`, "plant selected" is
  `variant="primary"` — hierarchy should be clear
- On error, show a soft warning card with the error message and a
  "try again" button — no red alert banner

Do not add a CSV paste fallback. The secure proxy pattern doesn't need
one; if the proxy fails, that's a real bug worth fixing, not a UX
escape hatch.

---

## 3.6 — Motion pass

Read `DESIGN_TOKENS.md` (specifically the Motion section) and audit the
whole app for motion consistency. For each animated element, verify:

- Timing uses one of the four token durations (quick/base/medium/slow)
- Easing uses `ease-spring` for reactive/entering elements,
  `ease-standard` for utility fades
- New tasks appear with `animate-task-in`
- The hero numeral does the `tickle` animation when the total changes
  (i.e., after adding, editing, or deleting a task)
- Modals use `animate-card-in`
- `prefers-reduced-motion` is respected — this should work automatically
  via the token overrides, but manually test with the OS setting on

If any animation isn't defined in `tailwind.config.ts`, add it there
first rather than as inline CSS.

---

## 3.7 — Mobile responsive check

Use browser dev tools to check iPad (768px), iPhone (390px), and
iPhone SE (375px) viewports. Verify:

- DayView header wraps sensibly — the DateChip should not push the title
  off-screen
- The three-column grid in TaskForm (`grid-cols-[1fr_74px_74px]`)
  should stack on narrow viewports; adjust the media query breakpoint
  in the component if needed
- Modals shouldn't touch the viewport edges — keep at least 16px of
  breathing room
- The Slack preview `pre` element wraps long descriptions
- Buttons remain tappable (44px minimum height)

Do not introduce a "mobile mode" or separate components. Same design,
same code, just responsive Tailwind classes.

---

## After 3.1–3.7

Do one full pass yourself as a user:
1. Sign out, sign in fresh
2. Log a full day (5–8 tasks with links, blockers, next steps)
3. Import from Clockify, merge some entries
4. Copy the Slack report and paste it into a text editor — read it
   with fresh eyes as if you were on the receiving end
5. Repeat on iPad and iPhone (using Vercel preview URL from the deployed
   branch if it's up)

The bugs and rough edges you find here are Phase 5 material — write
them down, don't fix them mid-pass.
