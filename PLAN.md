# Plan: Retro Board Features — 8 GitHub Issues

## Overview

This plan implements 8 features that transform the retro board from a basic card submission tool into a full-featured retrospective platform. The features build on each other in a specific order to minimize rework and maximize incremental value.

**Implementation order rationale:**
1. **#33 Template dropdown** first — it's a simple UX improvement that changes the retro creation flow, which later features (like ice breaker) need to hook into.
2. **#48 Multi-team switching** second — it restructures dashboard navigation, which is foundational for everything else.
3. **#35 Ice breaker** third — it fills out the ICEBREAKER phase which is currently empty, completing the first phase of the retro flow.
4. **#39 Anonymous + reveal** fourth — it changes how cards work during RETROSPECT phase (visibility, authorship), which voting/merging/comments all depend on.
5. **#36 Voting** fifth — adds Vote model and card interactions, needed before merging (merged cards combine votes).
6. **#37 Card merging** sixth — extends the drag-and-drop system and card model, depends on voting being in place.
7. **#34 Timer** seventh — standalone WebSocket feature, no schema changes, can slot in anywhere but fits nicely here.
8. **#38 Comments** last — adds Comment model and a card detail view, benefits from all prior card features being stable.

---

## Tasks

### Task 1: Template dropdown in retro creation dialog (#33) [completed]
**Size:** M
**Files:** `apps/web/src/components/RetroFormDialog.tsx`, `apps/web/src/components/RetrosSection.tsx`, `apps/web/src/pages/BoardPage.tsx`, `apps/web/src/lib/api.ts`, `apps/api/src/retros/retros.service.ts`, `apps/api/src/retros/retros.controller.ts`, `apps/api/src/retros/dto/create-retro.dto.ts`, `apps/api/src/board/board.service.ts`

**Backend changes:**
- Add optional `templateId` field to `CreateRetroDto`
- In `RetrosService.create()`, if `templateId` is provided, call `BoardService.initBoard()` to auto-initialize the board after creating the retro
- Inject `BoardService` into `RetrosModule` (add `BoardModule` to imports or use `forwardRef`)

**Frontend changes:**
- Add a `templateId` field to `RetroFormDialog` — use `TerminalSelect` with the 4 template options hardcoded (they're static, no need to fetch)
- Update `RetroFormDialog.onSubmit` signature to include `templateId`
- In `RetrosSection.handleCreateRetro()`, pass `templateId` to `createRetro()` API call
- Update `createRetro()` in `lib/api.ts` to accept and send `templateId`
- In `BoardPage`, when board is already initialized (columns exist), skip the `TemplatePicker` step entirely (already works)
- Remove the standalone `TemplatePicker` component and its import from `BoardPage` — the uninitialized state should show a message like "No template selected" with a link back, or better yet, this state should no longer be reachable since templates are chosen at creation time
- Keep `TemplatePicker.tsx` file but mark it as deprecated, or remove it if no other code references it

**Done when:**
- [x] Template dropdown appears in RetroFormDialog when creating a retro
- [x] Creating a retro with a template auto-initializes the board
- [x] Opening the board goes straight to the initialized board (no template picker step)
- [x] All 4 templates are available in the dropdown
- [x] Verify: create a retro, select a template, navigate to board — columns appear immediately

---

### Task 2: Multi-team support with team switching (#48) [pending]
**Size:** L
**Files:** `apps/web/src/contexts/TeamContext.tsx` (new), `apps/web/src/pages/DashboardPage.tsx`, `apps/web/src/components/RetrosSection.tsx`, `apps/web/src/components/ActionItemsSection.tsx`, `apps/web/src/App.tsx`

**Frontend changes:**
- Create a `TeamContext` that stores the active team ID:
  - Read from `localStorage` key `retro_active_team` on mount
  - If stored team isn't in user's teams list, fall back to first team
  - Expose `activeTeamId`, `setActiveTeamId`, and the full `teams` list
- Add a team switcher dropdown to the dashboard subheader bar (replace the current static team name display):
  - Use `TerminalSelect` or a custom dropdown showing team name + role (Owner/Member)
  - Include a "Create Team" option at the bottom
  - Switching teams updates `activeTeamId` in context + localStorage
- Scope `RetrosSection` to use `activeTeamId` instead of hardcoded `teams?.find(t => t.ownerId === userId) ?? teams?.[0]`
- Scope `ActionItemsSection` to filter by active team's retros
- Update `DashboardPage` status bar to show active team stats instead of aggregate
- Persist active team in localStorage; restore on page load
- Handle edge case: active team deleted or user removed — reset to first available team or trigger onboarding

**Done when:**
- [x] Team switcher dropdown is visible in dashboard header
- [x] Switching teams updates retros and action items displayed
- [x] Active team persists across page refreshes (localStorage)
- [x] "Create Team" option accessible from the switcher
- [x] Verify: create 2 teams, switch between them, see different retros for each

---

### Task 3: Ice breaker question (#35) [pending]
**Size:** M
**Files:** `apps/web/src/components/board/IceBreaker.tsx` (new), `apps/web/src/pages/BoardPage.tsx`, `apps/web/src/lib/icebreakers.ts` (new)

**Frontend-only feature** (no backend changes needed — ice breaker is a lightweight warm-up, not persisted):
- Create `lib/icebreakers.ts` with a curated list of 30-50 ice breaker questions (e.g., "What's a skill you'd love to learn?", "What's the best thing that happened this sprint?")
- Create `IceBreaker` component that:
  - Shows a random question from the list (seeded by retroId for consistency across clients)
  - Has a "shuffle" button to pick a new random question (facilitator only)
  - Styled as a `TerminalFrame` with a distinctive color (e.g., cyan/purple)
  - Shows during `ICEBREAKER` phase only
- In `BoardPage` `BoardContent`, render `IceBreaker` above the columns when `state.phase === 'ICEBREAKER'`
- The ice breaker disappears when the facilitator advances to RETROSPECT phase

**Done when:**
- [x] Ice breaker question displays during ICEBREAKER phase
- [x] Question is consistent across all clients viewing the same retro (seeded random)
- [x] Facilitator can shuffle to a new question
- [x] Ice breaker disappears when phase advances to RETROSPECT
- [x] Verify: open board in ICEBREAKER phase, see a question, advance phase, question disappears

---

### Task 4: Anonymous card submission with reveal (#39) [completed]
**Size:** L
**Files:** `apps/api/prisma/schema.prisma`, `apps/api/src/board/board.service.ts`, `apps/api/src/board/board.controller.ts`, `apps/api/src/board/board.gateway.ts`, `apps/api/src/board/dto/card-response.dto.ts`, `apps/web/src/components/board/BoardProvider.tsx`, `apps/web/src/components/board/BoardCard.tsx`, `apps/web/src/components/board/BoardColumn.tsx`, `apps/web/src/components/board/AddCardForm.tsx`, `apps/web/src/types/api.ts`

**Approach:** Use the retro's `phase` field for visibility control rather than a separate `revealed` boolean. During `RETROSPECT` phase, cards are only visible to their author. When the facilitator advances to `GROUP_VOTE`, all cards become visible (this is the "reveal" moment). This maps cleanly to the existing 4-phase flow.

**Backend changes:**
- Modify `BoardService.getBoard()` to accept the requesting `userId` AND the retro's current `phase`:
  - During `ICEBREAKER`/`RETROSPECT`: filter cards to only return `where: { authorId: userId }` (each user sees only their own cards)
  - During `GROUP_VOTE`/`DISCUSS_ACTION`: return all cards (revealed)
- Modify `BoardGateway.emitCardCreated()` — instead of broadcasting to everyone, only emit to the card author's socket. Add a helper to find the author's socket(s) in the room
  - Alternative: broadcast to everyone but let the frontend filter. Simpler but leaks data. Prefer server-side filtering
- Add a `board:revealed` event emitted when phase changes to `GROUP_VOTE` — include all cards so clients can populate the full board
- In `CardResponse.from()`, add ability to mask author info: when in anonymous mode, set author to `{ id: 'anonymous', name: 'Anonymous' }`
- Add `anonymous` boolean field to `Retro` model (default `true`) for future configurability

**Frontend changes:**
- Update `Card` type in `api.ts` to include optional `anonymous` flag
- In `BoardCard`, when card is anonymous (during GROUP_VOTE/DISCUSS_ACTION and retro is anonymous), show "Anonymous" instead of author name
- In `BoardProvider`, listen for `board:revealed` event — replace columns with full revealed data
- During RETROSPECT phase, show a visual indicator: "Cards are anonymous — only you can see yours"
- Update `AddCardForm` to show "Your card will be anonymous" hint

**Done when:**
- [x] During RETROSPECT, users only see their own cards
- [x] Advancing to GROUP_VOTE reveals all cards to everyone
- [x] Author names show as "Anonymous" on other people's cards
- [x] Real-time: new cards during RETROSPECT only appear for the author
- [x] Verify: open board in 2 browser tabs as different users, add cards in RETROSPECT — each only sees their own; advance phase — both see all cards

---

### Task 5: Voting on cards (#36) [completed]
**Size:** L
**Files:** `apps/api/prisma/schema.prisma`, `apps/api/src/board/board.service.ts`, `apps/api/src/board/board.controller.ts`, `apps/api/src/board/board.gateway.ts`, `apps/api/src/board/dto/vote-card.dto.ts` (new), `apps/api/src/board/dto/card-response.dto.ts`, `apps/web/src/components/board/BoardCard.tsx`, `apps/web/src/components/board/BoardProvider.tsx`, `apps/web/src/lib/api.ts`, `apps/web/src/types/api.ts`

**Backend changes:**
- Add `Vote` model to Prisma schema:
  ```
  model Vote {
    id      String @id @default(cuid())
    cardId  String
    userId  String
    retroId String
    card    Card   @relation(fields: [cardId], references: [id], onDelete: Cascade)
    user    User   @relation(fields: [userId], references: [id], onDelete: Cascade)
    retro   Retro  @relation(fields: [retroId], references: [id], onDelete: Cascade)
    @@index([cardId])
    @@index([retroId, userId])
  }
  ```
  - Add `votes Vote[]` relation to Card, User, and Retro models
  - Add `maxVotesPerUser` field to Retro model (default 5)
- Add endpoints:
  - `POST /retros/:retroId/board/cards/:cardId/vote` — add a vote (check max vote limit per retro)
  - `DELETE /retros/:retroId/board/cards/:cardId/vote` — remove one vote
- Add WebSocket events: `card:voted`, `card:unvoted` — broadcast vote count + voter info
- Include vote counts in `CardResponse` and board queries: `_count: { select: { votes: true } }`
- Include current user's votes in board response so the UI can show which cards they've voted on
- Voting only allowed during `GROUP_VOTE` phase

**Frontend changes:**
- Update `Card` type to include `voteCount: number` and `myVotes: number`
- Add vote button to `BoardCard` — shows vote count, highlighted if user has voted
  - Click to add vote, click again to remove (or show +/- buttons)
  - Disabled outside GROUP_VOTE phase
- Add remaining votes indicator in status bar or phase stepper: "3/5 votes remaining"
- Add `BoardProvider` reducer actions: `CARD_VOTED`, `CARD_UNVOTED`
- Add sort-by-votes toggle on column headers (or auto-sort during DISCUSS_ACTION phase)
- Add `voteCard()` and `unvoteCard()` to `lib/api.ts`

**Done when:**
- [x] Users can vote on cards during GROUP_VOTE phase
- [x] Vote counts display on cards in real-time
- [x] Users can remove their votes
- [x] Vote limit enforced (default 5 per retro)
- [x] Remaining votes shown to user
- [x] Verify: vote on cards, see count update, hit limit, remove vote, see count decrease

---

### Task 6: Card combining/merging (#37) [pending]
**Size:** L
**Files:** `apps/api/prisma/schema.prisma`, `apps/api/src/board/board.service.ts`, `apps/api/src/board/board.controller.ts`, `apps/api/src/board/board.gateway.ts`, `apps/api/src/board/dto/merge-cards.dto.ts` (new), `apps/api/src/board/dto/card-response.dto.ts`, `apps/web/src/components/board/BoardCard.tsx`, `apps/web/src/components/board/BoardColumn.tsx`, `apps/web/src/components/board/BoardProvider.tsx`, `apps/web/src/pages/BoardPage.tsx`, `apps/web/src/lib/api.ts`, `apps/web/src/types/api.ts`

**Backend changes:**
- Add `parentCardId` field to `Card` model (optional self-reference):
  ```
  parentCardId String?
  parentCard   Card?   @relation("CardGroup", fields: [parentCardId], references: [id], onDelete: SetNull)
  children     Card[]  @relation("CardGroup")
  ```
- Add endpoints:
  - `POST /retros/:retroId/board/cards/merge` — body: `{ parentCardId, childCardIds }` — sets `parentCardId` on child cards, moves them to same column
  - `POST /retros/:retroId/board/cards/:cardId/unmerge` — clears `parentCardId` on all children of this card
- Include children in card queries: `include: { children: { include: { author: ... } } }`
- Add WebSocket events: `cards:merged`, `cards:unmerged`
- Merging aggregates votes: merged group shows combined vote count
- Only allowed during GROUP_VOTE phase

**Frontend changes:**
- Update `Card` type to include `parentCardId: string | null` and `children: Card[]`
- Modify drag-and-drop in `BoardPage`:
  - During GROUP_VOTE, detect card-on-card drops (not just card-in-column)
  - If a card is dropped directly on another card, trigger merge API call
- Update `BoardCard` to show grouped state:
  - If card has children, show a count badge: "+2 cards"
  - Expandable: click to show/hide children cards
  - Show an "unmerge" button on grouped cards
- In `BoardColumn`, filter out child cards (they render inside their parent's `BoardCard`)
- Add `BoardProvider` reducer actions: `CARDS_MERGED`, `CARDS_UNMERGED`
- Add `mergeCards()` and `unmergeCard()` to `lib/api.ts`

**Done when:**
- [x] Dragging a card onto another card merges them
- [x] Merged cards show a count badge and are expandable
- [x] Unmerge splits cards back apart
- [x] Votes are aggregated for merged groups
- [x] Verify: merge 2 cards, see group badge, expand to see both, unmerge, cards separate

---

### Task 7: Timer feature (#34) [pending]
**Size:** M
**Files:** `apps/api/src/board/board.gateway.ts`, `apps/web/src/components/board/Timer.tsx` (new), `apps/web/src/components/board/BoardProvider.tsx`, `apps/web/src/pages/BoardPage.tsx`

**WebSocket-only feature** — no database changes. Timer state lives in the gateway's memory.

**Backend changes:**
- Add in-memory timer state to `BoardGateway`: `Map<string, TimerState>` where key is retroId
  - `TimerState`: `{ duration: number, remaining: number, running: boolean, startedAt: number | null }`
- Add `@SubscribeMessage` handlers:
  - `timer:start` — facilitator starts/resumes timer with `{ retroId, duration? }`. If duration provided, reset timer. Start interval that broadcasts `timer:tick` every second
  - `timer:pause` — pause the timer, clear interval
  - `timer:reset` — reset to original duration, clear interval
- Broadcast events:
  - `timer:sync` — sent on join (current timer state), on start, pause, reset
  - `timer:tick` — sent every second with remaining time (or let clients compute locally from startedAt + duration)
- Verify facilitator role before allowing start/pause/reset
- Clean up timer state when retro room is empty (all clients left)

**Frontend changes:**
- Create `Timer` component:
  - Display: `MM:SS` countdown in terminal style
  - Controls (facilitator only): preset buttons (5m, 10m, 15m), custom input, start/pause/reset
  - Visual states: running (green), paused (yellow), expired (red, flash)
  - Compact display: fits in the status bar or phase stepper area
- Add timer state to `BoardProvider`:
  - `timer: { duration: number, remaining: number, running: boolean } | null`
  - Listen for `timer:sync` and `timer:tick` events
  - Add `TIMER_SYNC` reducer action
- Place `Timer` component in the board header area (next to active users) or in the stepper bar
- All participants see the same timer countdown

**Done when:**
- [x] Facilitator can set timer duration and start it
- [x] All participants see the countdown in real-time
- [x] Facilitator can pause and reset
- [x] Visual indication when time expires
- [x] Verify: start timer on one tab, see it count down on another tab, pause/reset works

---

### Task 8: Comments on cards (#38) [pending]
**Size:** L
**Files:** `apps/api/prisma/schema.prisma`, `apps/api/src/board/board.service.ts`, `apps/api/src/board/board.controller.ts`, `apps/api/src/board/board.gateway.ts`, `apps/api/src/board/dto/create-comment.dto.ts` (new), `apps/api/src/board/dto/comment-response.dto.ts` (new), `apps/web/src/components/board/BoardCard.tsx`, `apps/web/src/components/board/CommentThread.tsx` (new), `apps/web/src/components/board/BoardProvider.tsx`, `apps/web/src/lib/api.ts`, `apps/web/src/types/api.ts`

**Backend changes:**
- Add `Comment` model to Prisma schema:
  ```
  model Comment {
    id        String   @id @default(cuid())
    content   String
    cardId    String
    authorId  String
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
    card      Card     @relation(fields: [cardId], references: [id], onDelete: Cascade)
    author    User     @relation(fields: [authorId], references: [id])
    @@index([cardId])
  }
  ```
  - Add `comments Comment[]` relation to Card and User models
- Add endpoints:
  - `GET /retros/:retroId/board/cards/:cardId/comments` — list comments for a card
  - `POST /retros/:retroId/board/cards/:cardId/comments` — create comment
  - `PATCH /retros/:retroId/board/cards/:cardId/comments/:commentId` — edit own comment
  - `DELETE /retros/:retroId/board/cards/:cardId/comments/:commentId` — delete own comment
- Add WebSocket events: `comment:created`, `comment:updated`, `comment:deleted`
- Include comment count in card queries: `_count: { select: { comments: true } }`
- Comments allowed during GROUP_VOTE and DISCUSS_ACTION phases

**Frontend changes:**
- Update `Card` type to include `commentCount: number`
- Add comment icon + count to `BoardCard` (next to vote button)
- Create `CommentThread` component:
  - Opens as a slide-out panel or expandable section when clicking the comment icon
  - Shows list of comments with author name, timestamp, content
  - Add comment form at the bottom (textarea + submit)
  - Edit/delete buttons on own comments
  - Real-time updates via WebSocket
- Add `BoardProvider` reducer actions: `COMMENT_CREATED`, `COMMENT_UPDATED`, `COMMENT_DELETED` — update comment counts on cards
- Add API functions: `fetchComments()`, `createComment()`, `updateComment()`, `deleteComment()`

**Done when:**
- [x] Comment icon with count shows on each card
- [x] Clicking opens a comment thread
- [x] Users can add, edit, and delete their own comments
- [x] Comments show author and timestamp
- [x] Comments sync in real-time via WebSocket
- [x] Verify: add a comment, see it appear on another tab, edit it, delete it

---

## Context

**Key architectural decisions:**
- Anonymous reveal uses existing phase system (RETROSPECT = hidden, GROUP_VOTE = revealed) rather than a separate boolean — simpler, fewer state transitions
- Timer is purely in-memory/WebSocket — no database, avoids schema complexity for ephemeral state
- Ice breaker is frontend-only with seeded randomness — simple, no backend needed
- Card merging uses self-referential `parentCardId` (Option A from the issue) — simpler than a separate CardGroup model
- Voting allows multiple votes per card per user (strong feelings) with a per-retro total limit

**Important file paths:**
- Prisma schema: `apps/api/prisma/schema.prisma`
- Board service: `apps/api/src/board/board.service.ts`
- Board gateway (WebSocket): `apps/api/src/board/board.gateway.ts`
- Board reducer (frontend state): `apps/web/src/components/board/BoardProvider.tsx`
- API client: `apps/web/src/lib/api.ts`
- Types: `apps/web/src/types/api.ts`
- Terminal UI components: `apps/web/src/components/terminal/`

**Codebase patterns to follow:**
- ESM: all relative imports use `.js` extensions in backend
- DTOs: response DTOs with static `from()` factories
- Prettier: singleQuote, trailingComma "all", no semicolons
- WebSocket: broadcast to `retro:{retroId}` rooms via gateway emit helpers
- Frontend: TanStack Query for fetching, reducer in BoardProvider for real-time state
- Authorization: `assertRetroAccess()` in board service, `assertFacilitator()` in retros service
