# Plan: Add Loading States to Reduce Flash of Empty Content (#51)

## Overview

In production, the app has noticeable flashes of empty content while data loads. Various sections (dashboard, board, team dialog) transition abruptly from empty to loaded state. The app already has a `BlinkingCursor` component and a terminal aesthetic — we need to build on this with skeleton loaders that use terminal-themed block characters (`░░░░░░░░`) and ensure all loading states are consistent.

The approach: create a reusable `TerminalLoader` component that shows a terminal command prompt with animated dots, plus a `TerminalSkeleton` component that renders `░` block-character placeholder bars. Then systematically replace all bare loading states with these components, add skeleton placeholders that match the layout of loaded content (preventing layout shift), and add CSS transitions for smooth load-in.

## Tasks

### Task 1: Create TerminalLoader and TerminalSkeleton components [completed]
**Size:** M
**Files:** `apps/web/src/components/terminal/TerminalLoader.tsx`, `apps/web/src/components/terminal/TerminalSkeleton.tsx`, `apps/web/src/index.css`, `apps/web/src/components/terminal/TerminalLoader.test.tsx`, `apps/web/src/components/terminal/TerminalSkeleton.test.tsx`

Create two reusable loading primitives:

1. **`TerminalLoader`** — A full-screen or inline loading indicator showing:
   - A terminal prompt line: `$ <command>` (configurable)
   - An animated "Loading" with sequentially appearing dots (three dots that cycle: `Loading.` → `Loading..` → `Loading...` → `Loading.` using CSS animation)
   - A blinking cursor at the end
   - Props: `command?: string` (the terminal command to show), `inline?: boolean` (if true, no centering/full-screen), `message?: string` (default "Loading")

2. **`TerminalSkeleton`** — Block-character skeleton placeholders:
   - Renders lines of `░` characters at varying widths to simulate content
   - Props: `lines?: number` (default 3), `widths?: number[]` (percentage widths per line, e.g. `[80, 60, 40]`)
   - Uses theme colors with reduced opacity for the block characters
   - Subtle pulse animation on the skeleton lines

3. **CSS**: Add a `@keyframes terminal-dots` animation for the cycling dots and a `@keyframes skeleton-pulse` for the skeleton fade.

**Done when:**
- [x] `TerminalLoader` renders command prompt + animated dots + blinking cursor
- [x] `TerminalSkeleton` renders `░` block lines at specified widths
- [x] Both components use theme colors via `useTheme()`
- [x] Unit tests pass for both components
- [x] Verify: `npm run test:web` passes

### Task 2: Add loading skeletons to Dashboard page [completed]
**Size:** M
**Files:** `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/components/RetrosSection.tsx`
**After:** Task 1

Replace the current simple "Loading..." text on the dashboard with skeleton placeholders that match the loaded layout:

1. **DashboardPage**: When `isLoading`, show skeleton placeholders inside `TerminalFrame` wrappers that match the retros section and action items section layout. This prevents layout shift when content loads.

2. **RetrosSection**: Replace the current loading text with a `TerminalFrame` containing `TerminalSkeleton` lines that mimic retro cards (3 lines of varying width).

3. Add a CSS fade-in transition so content smoothly appears when loading completes.

**Done when:**
- [ ] Dashboard shows skeleton frames matching retros + action items layout during load
- [ ] RetrosSection shows skeleton inside TerminalFrame during load
- [ ] No layout shift when content loads — skeletons occupy same space as content
- [ ] Smooth fade-in transition from skeleton → loaded content
- [ ] Verify: Run `npm run dev:web`, observe no flash of empty content on dashboard

### Task 3: Add loading skeleton to Board page [completed]
**Size:** M
**Files:** `apps/web/src/pages/BoardPage.tsx`
**After:** Task 1

Replace the centered "Loading board..." text with a skeleton that matches the board layout:

1. Show a skeleton header bar (mimicking the board subheader with team name, date, etc.)
2. Show skeleton columns (3-4 vertical columns with `TerminalSkeleton` blocks inside, matching the board column layout)
3. Show a skeleton status bar at the bottom
4. Use the same fade-in transition as the dashboard

**Done when:**
- [ ] Board page shows skeleton columns + header during load instead of centered text
- [ ] Skeleton layout roughly matches actual board layout (prevents shift)
- [ ] Smooth transition to loaded board
- [ ] Verify: Navigate to a board page and observe smooth skeleton → content transition

### Task 4: Add loading skeleton to Team dialog + polish auth states [completed]
**Size:** S
**Files:** `apps/web/src/components/TeamSection.tsx`, `apps/web/src/components/ProtectedRoute.tsx`, `apps/web/src/pages/AuthCallbackPage.tsx`
**After:** Task 1

1. **TeamSection**: Replace the simple "Loading..." with skeleton lines matching team info + member list layout.
2. **ProtectedRoute**: Use `TerminalLoader` with command `retro session --verify` for consistency.
3. **AuthCallbackPage**: Use `TerminalLoader` with command `retro auth --callback`. Keep error state as-is.

**Done when:**
- [ ] Team dialog shows skeleton content during load
- [ ] ProtectedRoute and AuthCallbackPage use TerminalLoader
- [ ] All loading indicators are consistent across the app
- [ ] Verify: `npm run test:web` passes, `npm run build:web` succeeds

### Task 5: Final validation [completed]
**Size:** S
**Files:** Various
**After:** Task 4

Run the full validation suite and fix any issues.

**Done when:**
- [ ] `bash scripts/validate.sh` passes cleanly
- [ ] All loading indicators use consistent terminal theme
- [ ] No layout shifts on any page
- [ ] Verify: Full validation passes

---

## Context
- The app uses inline styles with `useTheme()` throughout — no Tailwind utility classes on custom components
- `BlinkingCursor` lives in `apps/web/src/components/board/TypingEffect.tsx`
- Terminal aesthetic uses JetBrains Mono font, CRT scanline effects, bracket-wrapped buttons
- Color theme has `green` for prompts, `textTertiary` for secondary text, `cursor` for blinking cursor
- Block characters for skeletons: `░` (U+2591 Light Shade) fits the terminal aesthetic
- CSS animations already exist: `terminal-blink`, `terminal-flicker`, `terminal-type`, `scanline`
- React Query is used for all data fetching with `isLoading` / `isPending` flags
- Terminal components in `apps/web/src/components/terminal/` — `TerminalFrame`, `TerminalButton`, `TerminalDialog`, `TerminalInput`, `TerminalSelect`
