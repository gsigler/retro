# Plan: Command Center Dashboard v1

## Overview

Build the "command center" — a single-page dashboard that serves as the authenticated user's home screen after login. The dashboard presents a card-grid layout with sections for the user's team, retros, action items, and summary stats. A user can own exactly one team (enforced by a unique constraint on `Team.ownerId`) but can be a member of any number of teams. If the user doesn't have a team yet, the dashboard shows an onboarding flow where they can either create a new team or join an existing one via invite code. Once they have a team, they can manage members and perform full CRUD on retros and action items.

The backend already has Teams and Retros API endpoints, but the Action Items module is missing despite the Prisma model being defined. The frontend dashboard is a stub. This plan covers: (0) enforcing single team ownership at the database level, (1) building the Action Items API, (2) adding a stats/summary endpoint, (3) building out the dashboard UI with all CRUD flows including team onboarding, and (4) wiring everything together with typed API client functions.

Retro board experience (columns, cards, voting) is explicitly out of scope — this plan covers only CRUD and the dashboard shell.

---

## Feature 0: Enforce Single Team Ownership

### Task 0.1: Add unique constraint on Team.ownerId and invite code support [pending]
**Complexity:** medium
**Files:** apps/api/prisma/schema.prisma, apps/api/src/teams/teams.service.ts, apps/api/src/teams/teams.service.spec.ts, apps/api/src/teams/teams.controller.ts, apps/api/src/teams/teams.controller.spec.ts, apps/api/src/teams/dto/join-team.dto.ts

**Dependencies:**
- Install `nanoid` in `@retro/api` (`npm install -w @retro/api nanoid`)

**Schema changes:**
- Add `@unique` to `Team.ownerId` so a user can own at most one team
- Add `inviteCode String @unique` to `Team` (no Prisma default — generated in service layer)
- Change `ActionItem.assigneeId` from `String` to `String?` (optional) — allows creating action items without an assignee

Generate a migration for all changes.

**Service changes:**
- Update `TeamsService.create()` to generate an invite code via `nanoid(10)` and include it in the `data` payload. Catch the unique violation on `ownerId` and throw `ConflictException` ("You already own a team").
- Add `TeamsService.joinByInviteCode(userId, inviteCode)` — looks up the team by invite code, verifies the user isn't already a member, adds them as a MEMBER. Throws `NotFoundException` for invalid codes, `ConflictException` if already a member.

**Controller changes:**
- Add `POST /teams/join` endpoint accepting `{ inviteCode: string }` body via `JoinTeamDto`

**Tests:** Cover duplicate-owner rejection, join happy path, invalid invite code, and already-a-member cases.

**Acceptance Criteria:**
- [ ] `Team.ownerId` has a `@unique` constraint in `schema.prisma`
- [ ] `Team.inviteCode` is generated via `nanoid(10)` in the service, unique in the schema
- [ ] `ActionItem.assigneeId` is optional (`String?`) in the schema
- [ ] Migration is generated and applies cleanly
- [ ] `TeamsService.create()` returns 409 if the user already owns a team
- [ ] `POST /teams/join` with a valid invite code adds the user as a MEMBER
- [ ] `POST /teams/join` returns 404 for invalid invite codes
- [ ] `POST /teams/join` returns 409 if the user is already a member of that team
- [ ] A user can still be a MEMBER of multiple teams (no constraint on `TeamMember.userId`)
- [ ] Existing tests still pass; new tests cover all join and duplicate-owner cases

---

## Feature 1: Action Items API

### Task 1.1: Scaffold Action Items module, service, and controller [pending]
**Complexity:** large
**Files:** apps/api/src/action-items/action-items.module.ts, apps/api/src/action-items/action-items.service.ts, apps/api/src/action-items/action-items.controller.ts, apps/api/src/action-items/dto/create-action-item.dto.ts, apps/api/src/action-items/dto/update-action-item.dto.ts, apps/api/src/action-items/dto/action-item-response.dto.ts, apps/api/src/app.module.ts

Follow existing patterns from the Retros and Teams modules. Action items are scoped to a retro, which is scoped to a team. The user must be a member of the retro's team to interact with its action items.

**Controller endpoints:**
- `POST /retros/:retroId/action-items` — create an action item (creator must be team member)
- `GET /retros/:retroId/action-items` — list action items for a retro (team member only)
- `GET /action-items/:id` — get single action item (team member only)
- `PATCH /action-items/:id` — update action item (title, description, status, assigneeId, dueDate). Status transitions: OPEN -> IN_PROGRESS -> DONE (no backwards movement, matching the retro pattern).
- `DELETE /action-items/:id` — delete action item (creator or team owner only)

**DTOs:**
- `CreateActionItemDto`: `title` (required string), `description` (optional string), `assigneeId` (optional string), `dueDate` (optional ISO date string)
- `UpdateActionItemDto`: all fields optional, plus `status`
- `ActionItemResponse`: `id`, `title`, `description`, `status`, `dueDate`, `retroId`, `assignee` (id, name, avatarUrl), `createdBy` (id, name, avatarUrl), `createdAt`, `updatedAt` — use `static from()` factory

**Service:** Include team membership verification via the retro's teamId. Use Prisma `select` for nested user fields to avoid leaking `googleId`.

Register `ActionItemsModule` in `app.module.ts`.

**Acceptance Criteria:**
- [ ] `POST /retros/:retroId/action-items` creates an action item and returns `ActionItemResponse`
- [ ] `GET /retros/:retroId/action-items` returns action items for the retro
- [ ] `GET /action-items/:id` returns a single action item
- [ ] `PATCH /action-items/:id` updates fields; status transitions are validated (forward-only)
- [ ] `DELETE /action-items/:id` removes the item (creator or team owner only)
- [ ] Non-team-members receive 403 for all endpoints
- [ ] Module is registered in `app.module.ts`

### Task 1.2: Action Items unit tests [pending]
**Complexity:** medium
**Files:** apps/api/src/action-items/action-items.service.spec.ts, apps/api/src/action-items/action-items.controller.spec.ts
**Depends on:** Task 1.1

Write unit tests for the action items service and controller following the patterns in `retros.service.spec.ts` and `teams.controller.spec.ts`. Mock PrismaService. Cover:

- Creating an action item (happy path, non-member rejected)
- Listing action items for a retro
- Getting a single action item (found, not found, not a member)
- Updating an action item (valid status transition, invalid backwards transition, non-member)
- Deleting an action item (creator allowed, team owner allowed, random member rejected)

**Acceptance Criteria:**
- [ ] Service spec covers all CRUD operations and authorization checks
- [ ] Controller spec covers route handlers and proper delegation to service
- [ ] All tests pass via `npm run test:api`

---

## Feature 2: Dashboard Summary API

### Task 2.1: Add a dashboard summary endpoint [pending]
**Complexity:** medium
**Files:** apps/api/src/dashboard/dashboard.module.ts, apps/api/src/dashboard/dashboard.controller.ts, apps/api/src/dashboard/dashboard.service.ts, apps/api/src/dashboard/dto/dashboard-summary-response.dto.ts, apps/api/src/app.module.ts

Create a `GET /dashboard/summary` endpoint that returns aggregated stats for the authenticated user in a single request. This avoids the frontend making multiple API calls on load.

**Response shape (`DashboardSummaryResponse`):**
```
{
  memberCount: number                     // members on the user's owned team (0 if no owned team)
  retroCount: number
  openActionItemCount: number
  completedActionItemCount: number
  upcomingRetros: RetroResponse[]         // next 5 retros with status SCHEDULED, sorted by date
  recentActionItems: ActionItemResponse[] // 5 most recent action items assigned to user
}
```

Use Prisma aggregation queries. Scope retros and action items to all teams the user is a member of. `memberCount` is scoped to the user's owned team only (displayed in the stats row alongside the team section).

**Acceptance Criteria:**
- [ ] `GET /dashboard/summary` returns the summary DTO for the authenticated user
- [ ] `memberCount` reflects the user's owned team's member count (0 if none)
- [ ] `retroCount`, action item counts, and lists reflect all teams the user belongs to
- [ ] `upcomingRetros` returns at most 5 scheduled retros sorted by date ascending
- [ ] `recentActionItems` returns at most 5 action items assigned to the user, sorted by createdAt descending
- [ ] Unit tests cover the service and controller

---

## Feature 3: Frontend API Client

### Task 3.1: Build typed API client functions [pending]
**Complexity:** medium
**Files:** apps/web/src/lib/api.ts, apps/web/src/types/api.ts
**Depends on:** Task 1.1, Task 2.1

Extend the existing `api()` fetch wrapper to add typed functions for all backend endpoints. Create a `types/api.ts` file with TypeScript interfaces matching the backend response DTOs.

**Types to define:** `User`, `Team`, `TeamWithCounts`, `TeamDetail` (includes `inviteCode`), `TeamMember`, `Retro`, `RetroWithCounts`, `ActionItem`, `DashboardSummary`

**API functions to add in `api.ts`:**
- `fetchDashboardSummary(token)`
- `fetchTeams(token)`, `fetchTeam(token, id)`, `createTeam(token, data)`, `updateTeam(token, id, data)`, `joinTeam(token, inviteCode)`
- `addTeamMember(token, teamId, email)`, `removeTeamMember(token, teamId, userId)`
- `fetchRetros(token, teamId)`, `createRetro(token, teamId, data)`, `updateRetro(token, id, data)`, `deleteRetro(token, id)`
- `fetchActionItems(token, retroId)`, `createActionItem(token, retroId, data)`, `updateActionItem(token, id, data)`, `deleteActionItem(token, id)`

Each function should call `api()` with the appropriate method, path, body, and `Authorization` header, then return the typed response.

**Acceptance Criteria:**
- [ ] All API response types are defined in `types/api.ts`
- [ ] All CRUD functions exist and are properly typed
- [ ] Functions pass the auth token as a Bearer header
- [ ] TypeScript compiles without errors

---

## Feature 4: Dashboard UI

### Task 4.0: Add UI primitives (Dialog, Select, Label) [pending]
**Complexity:** small
**Files:** apps/web/src/components/ui/dialog.tsx, apps/web/src/components/ui/select.tsx, apps/web/src/components/ui/label.tsx
**Depends on:** (none)

The frontend currently only has Button, Card, and Input components. The dashboard requires modals/dialogs (for all form flows), a select dropdown (for assignee picker in action items), and labels (for form fields). Add these as shadcn-style components using Radix UI primitives (already installed via `@radix-ui/react-slot`).

Install required Radix packages: `@radix-ui/react-dialog`, `@radix-ui/react-select`, `@radix-ui/react-label`.

Follow the existing component patterns in `components/ui/` (Tailwind styling, `cn()` utility, `forwardRef`).

**Acceptance Criteria:**
- [ ] `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose` components exist
- [ ] `Select`, `SelectTrigger`, `SelectContent`, `SelectItem`, `SelectValue` components exist
- [ ] `Label` component exists
- [ ] All components follow existing shadcn patterns
- [ ] TypeScript compiles without errors

### Task 4.1: Dashboard layout and stats cards [pending]
**Complexity:** medium
**Files:** apps/web/src/pages/DashboardPage.tsx, apps/web/src/components/StatsCard.tsx
**Depends on:** Task 3.1, Task 4.0

Replace the stub DashboardPage with the command center layout. Use a responsive grid (Tailwind CSS grid). The page should:

1. Fetch `GET /dashboard/summary` on mount using the auth token from `AuthContext`
2. Show a header row with 4 `StatsCard` components: Team Members count, Retros count, Open Action Items, Completed Action Items
3. Show a loading skeleton state while data loads
4. Show error state if the fetch fails
5. Keep the existing header with logout button

`StatsCard` is a small reusable component: icon (lucide-react), label, and count value, built on the existing shadcn `Card` component.

**Acceptance Criteria:**
- [ ] Dashboard fetches summary data on mount
- [ ] 4 stats cards display with correct counts
- [ ] Loading and error states are handled
- [ ] Layout is responsive (1 col on mobile, 2 on md, 4 on lg)
- [ ] Component renders without errors

### Task 4.2: Team section with member management [pending]
**Complexity:** large
**Files:** apps/web/src/components/TeamSection.tsx, apps/web/src/components/TeamFormDialog.tsx, apps/web/src/components/MemberList.tsx, apps/web/src/components/AddMemberDialog.tsx, apps/web/src/pages/DashboardPage.tsx
**Depends on:** Task 4.1

Add a "My Team" section below the stats row. This section has two states:

**No team (onboarding):** If the user is not a member of any team, show a welcome/onboarding card with two options:
1. **"Create Team"** — opens `TeamFormDialog` with fields for name and description. On submit, calls `POST /teams` which creates the team and makes the user the owner. After creation, the section transitions to the team management view.
2. **"Join a Team"** — shows an invite code input field. The user pastes an invite code shared by a team owner, and on submit calls `POST /teams/join`. On success, the section transitions to show the joined team.

**Has a team:** Display the user's team as a single card/panel showing team name, description, member count, and retro count. The team owner sees:
- An edit button that opens `TeamFormDialog` pre-filled (name and description fields)
- The team's invite code displayed with a copy-to-clipboard button, so the owner can share it with others

Below the team info, show a `MemberList` displaying all team members (name, avatar, role). The team owner sees:
- An "Add Member" button that opens `AddMemberDialog` (invite by email — directly adds the user if they have an account)
- A remove button next to each non-owner member

Note: There are two ways to add members — the owner can add someone directly by email (`POST /teams/:id/members`), or share the invite code for self-service joining (`POST /teams/join`). Both are intentional.

After any mutation (create team, edit team, add/remove member), refetch the team details and summary stats.

**Acceptance Criteria:**
- [ ] If the user has no team, an onboarding card with "Create Team" and "Join a Team" options is shown
- [ ] Creating a team transitions to the team management view
- [ ] Joining a team via invite code transitions to the team management view
- [ ] Invalid invite codes show an error message
- [ ] Team name, description, member count, and retro count are shown
- [ ] Team owner sees the invite code with a copy button
- [ ] Edit button (owner only) opens dialog to update name/description
- [ ] Member list displays all team members with name and avatar
- [ ] "Add Member" button (owner only) opens invite-by-email dialog
- [ ] Remove button (owner only) appears next to non-owner members
- [ ] Team details and stats refresh after mutations

### Task 4.3: Retros section with create/edit/delete [pending]
**Complexity:** large
**Files:** apps/web/src/components/RetroCard.tsx, apps/web/src/components/RetroFormDialog.tsx, apps/web/src/pages/DashboardPage.tsx
**Depends on:** Task 4.2

Add a "Retros" section. Load the user's owned team's retros automatically on mount (fetched via `GET /teams/:teamId/retros`). If the user doesn't own a team (only a member of others), show retros from the first team they belong to. Display retros in a card grid. Each `RetroCard` shows name, status badge (color-coded: SCHEDULED=blue, IN_PROGRESS=yellow, COMPLETED=green), date, and action item count.

`RetroFormDialog` handles create and edit. Fields: name (required), date (required). Status updates are handled via inline controls (a "Start" button to move SCHEDULED -> IN_PROGRESS, a "Complete" button for IN_PROGRESS -> COMPLETED).

Only the retro creator or team owner can edit/delete.

**Acceptance Criteria:**
- [ ] Retros for the user's team load automatically on mount
- [ ] Retros are shown in a card grid with status badges
- [ ] "New Retro" button opens the create dialog
- [ ] Status transition buttons appear on cards where valid
- [ ] Edit/delete available for creators and team owners
- [ ] Retros list and stats refresh after mutations

### Task 4.4: Action Items section with create/edit/delete [pending]
**Complexity:** large
**Files:** apps/web/src/components/ActionItemCard.tsx, apps/web/src/components/ActionItemFormDialog.tsx, apps/web/src/pages/DashboardPage.tsx
**Depends on:** Task 4.3

Add an "Action Items" section. When a user clicks on a retro card, the action items section populates with that retro's action items (fetched via `GET /retros/:retroId/action-items`). Display as a card list/grid. Each `ActionItemCard` shows title, description (truncated), status badge (OPEN=red, IN_PROGRESS=yellow, DONE=green), assignee avatar+name, and due date.

`ActionItemFormDialog` handles create and edit. Fields: title (required), description (optional), assignee (dropdown of team members), due date (optional).

Status transitions are handled via inline controls on the card (similar to retros).

**Acceptance Criteria:**
- [ ] Clicking a retro card loads and displays its action items
- [ ] Action items are shown in a card grid with status badges and assignee info
- [ ] "New Action Item" button opens the create dialog (only when a retro is selected)
- [ ] Status transition buttons appear on cards where valid
- [ ] Edit/delete available for creators and team owners
- [ ] Action items list and stats refresh after mutations

### Task 4.5: Dashboard UI tests [pending]
**Complexity:** medium
**Files:** apps/web/src/pages/DashboardPage.test.tsx, apps/web/src/components/StatsCard.test.tsx, apps/web/src/components/TeamSection.test.tsx
**Depends on:** Task 4.4

Write component tests for the dashboard using Vitest and React Testing Library. Mock the API client functions. Cover:

- DashboardPage renders stats cards with summary data
- DashboardPage shows loading state
- DashboardPage shows error state on fetch failure
- StatsCard renders icon, label, and count
- TeamSection renders onboarding state (create team / join team options)
- TeamSection renders team info and member list
- TeamSection shows edit/add member/remove member controls for owner only

**Acceptance Criteria:**
- [ ] Tests cover DashboardPage happy path, loading, and error states
- [ ] Tests cover StatsCard rendering
- [ ] Tests cover TeamSection onboarding (no team), owner view, and member view
- [ ] All tests pass via `npm run test:web`
