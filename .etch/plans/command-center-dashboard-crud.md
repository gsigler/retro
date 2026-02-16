# Plan: Command Center Dashboard with CRUD

## Overview

The app currently has a single `User` model, Google OAuth login, and a placeholder dashboard page. This plan builds out the command center — a single-page dashboard shell with card-grid sections for managing **Teams**, **Retros**, and **Action Items**, plus a stats overview.

The backend work adds Prisma models, NestJS modules with full CRUD endpoints, and scoped data access (users only see their own teams/retros/items). The frontend work replaces the placeholder dashboard with a tabbed command center layout, CRUD modals, and API integration. The retro board experience (columns, drag-and-drop, voting) is explicitly out of scope — retros here are just metadata records (title, date, status).

All new API routes are JWT-protected. All frontend routes remain under `ProtectedRoute`. The plan is ordered so that backend foundations land first, then frontend consumes them feature-by-feature.

---

## Feature 1: Database Schema & Prisma Setup

### Task 1.1: Add Team, Retro, and ActionItem Prisma models [completed]
**Complexity:** medium
**Files:** apps/api/prisma/schema.prisma
**Depends on:** —

Add the following models to the Prisma schema:

**Team**
- `id` (cuid, PK), `name` (String), `description` (String?), `createdAt`, `updatedAt`
- `ownerId` → relation to `User`
- `members` → one-to-many `TeamMember`
- `retros` → one-to-many `Retro`

**TeamMember**
- `id` (cuid, PK), `role` (enum: `OWNER`, `MEMBER`), `joinedAt`
- `userId` → relation to `User`
- `teamId` → relation to `Team`
- Unique constraint on `[teamId, userId]`

**Retro**
- `id` (cuid, PK), `name` (String), `status` (enum: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`), `date` (DateTime), `createdAt`, `updatedAt`
- `teamId` → relation to `Team`
- `createdById` → relation to `User`
- `actionItems` → one-to-many `ActionItem`

**ActionItem**
- `id` (cuid, PK), `title` (String), `description` (String?), `status` (enum: `OPEN`, `IN_PROGRESS`, `DONE`), `dueDate` (DateTime?), `createdAt`, `updatedAt`
- `retroId` → relation to `Retro`
- `assigneeId` → relation to `User`
- `createdById` → relation to `User`

Update the `User` model to include reverse relations: `ownedTeams`, `teamMemberships`, `createdRetros`, `assignedActionItems`, `createdActionItems`.

**Acceptance Criteria:**
- [x] Schema compiles with `npx prisma validate`
- [x] Enums `TeamRole`, `RetroStatus`, `ActionItemStatus` are defined
- [x] All relations have explicit foreign keys and `onDelete` behavior defined

### Task 1.2: Generate and apply Prisma migration [completed]
**Complexity:** small
**Files:** apps/api/prisma/migrations/\*
**Depends on:** Task 1.1

Run `npm run db:migrate:dev` with migration name `add-teams-retros-actions` and regenerate the Prisma client.

**Acceptance Criteria:**
- [x] Migration file is created and applies cleanly to a fresh database
- [x] `npm run db:generate` succeeds
- [x] PrismaService can be injected and access all new models

---

## Feature 2: Teams API

### Task 2.1: Scaffold Teams NestJS module with CRUD endpoints [completed]
**Complexity:** medium
**Files:** apps/api/src/teams/teams.module.ts, apps/api/src/teams/teams.controller.ts, apps/api/src/teams/teams.service.ts, apps/api/src/teams/dto/create-team.dto.ts, apps/api/src/teams/dto/update-team.dto.ts, apps/api/src/app.module.ts
**Depends on:** Task 1.2

Create a `TeamsModule` with controller and service. All routes require `JwtAuthGuard`. The service uses `PrismaService` for data access, scoped to the authenticated user.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/teams` | Create team (caller becomes OWNER) |
| GET | `/teams` | List teams where user is a member |
| GET | `/teams/:id` | Get team detail (members, retro count) |
| PATCH | `/teams/:id` | Update team (owner only) |
| DELETE | `/teams/:id` | Delete team (owner only) |
| POST | `/teams/:id/members` | Add member by email |
| DELETE | `/teams/:id/members/:userId` | Remove member (owner only) |

DTOs should use `class-validator` decorators. Register `TeamsModule` in `AppModule`.

**Acceptance Criteria:**
- [x] All 7 endpoints return correct status codes (201, 200, 204)
- [x] Non-members cannot access a team's resources (403)
- [x] Only team owners can update/delete teams and manage members
- [x] Creating a team automatically adds the creator as OWNER member

### Task 2.2: Add Teams unit tests [completed]
**Complexity:** medium
**Files:** apps/api/src/teams/teams.service.spec.ts, apps/api/src/teams/teams.controller.spec.ts
**Depends on:** Task 2.1

Write unit tests for `TeamsService` and `TeamsController`. Mock `PrismaService`. Cover: create, list, get, update, delete, add/remove member, authorization (owner-only actions), and not-found cases.

**Acceptance Criteria:**
- [ ] `npm run test:api` passes with all new tests green
- [x] Service tests cover happy path + error cases for each method
- [x] Controller tests verify guard usage and response shapes

---

## Feature 3: Retros API

### Task 3.1: Scaffold Retros NestJS module with CRUD endpoints [completed]
**Complexity:** medium
**Files:** apps/api/src/retros/retros.module.ts, apps/api/src/retros/retros.controller.ts, apps/api/src/retros/retros.service.ts, apps/api/src/retros/dto/create-retro.dto.ts, apps/api/src/retros/dto/update-retro.dto.ts, apps/api/src/app.module.ts
**Depends on:** Task 1.2

Create a `RetrosModule`. All routes require `JwtAuthGuard`. Retros are scoped to a team — user must be a member of the team to access its retros.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/teams/:teamId/retros` | Create retro for a team |
| GET | `/teams/:teamId/retros` | List retros for a team |
| GET | `/retros/:id` | Get retro detail |
| PATCH | `/retros/:id` | Update retro (name, status, date) |
| DELETE | `/retros/:id` | Delete retro (team owner only) |

**Acceptance Criteria:**
- [x] Retros are scoped to teams; non-team-members get 403
- [x] Creating a retro sets `createdById` to the authenticated user
- [x] Status transitions are validated (e.g., COMPLETED retros cannot go back to SCHEDULED)
- [x] Module registered in AppModule

### Task 3.2: Add Retros unit tests [completed]
**Complexity:** medium
**Files:** apps/api/src/retros/retros.service.spec.ts, apps/api/src/retros/retros.controller.spec.ts
**Depends on:** Task 3.1

**Acceptance Criteria:**
- [ ] `npm run test:api` passes with all new tests green
- [x] Tests cover authorization (team membership check), CRUD, and status validation

---

## Feature 4: Action Items API

### Task 4.1: Scaffold ActionItems NestJS module with CRUD endpoints [pending]
**Complexity:** medium
**Files:** apps/api/src/action-items/action-items.module.ts, apps/api/src/action-items/action-items.controller.ts, apps/api/src/action-items/action-items.service.ts, apps/api/src/action-items/dto/create-action-item.dto.ts, apps/api/src/action-items/dto/update-action-item.dto.ts, apps/api/src/app.module.ts
**Depends on:** Task 1.2

Create an `ActionItemsModule`. All routes require `JwtAuthGuard`.

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | `/retros/:retroId/action-items` | Create action item |
| GET | `/retros/:retroId/action-items` | List action items for a retro |
| GET | `/action-items/mine` | List all action items assigned to current user (across teams) |
| PATCH | `/action-items/:id` | Update action item (title, description, status, assignee, dueDate) |
| DELETE | `/action-items/:id` | Delete action item |

**Acceptance Criteria:**
- [ ] Action items are scoped through retro → team membership
- [ ] `/action-items/mine` returns items across all teams the user belongs to
- [ ] Assignee must be a member of the retro's team
- [ ] Module registered in AppModule

### Task 4.2: Add ActionItems unit tests [pending]
**Complexity:** medium
**Files:** apps/api/src/action-items/action-items.service.spec.ts, apps/api/src/action-items/action-items.controller.spec.ts
**Depends on:** Task 4.1

**Acceptance Criteria:**
- [ ] `npm run test:api` passes with all new tests green
- [ ] Tests cover cross-team assignment validation and `/mine` endpoint

---

## Feature 5: Dashboard Stats API

### Task 5.1: Add stats endpoint to aggregate dashboard data [pending]
**Complexity:** small
**Files:** apps/api/src/stats/stats.module.ts, apps/api/src/stats/stats.controller.ts, apps/api/src/stats/stats.service.ts, apps/api/src/app.module.ts
**Depends on:** Task 2.1, Task 3.1, Task 4.1

Create a `StatsModule` with a single endpoint that returns aggregated counts for the authenticated user's dashboard.

**Endpoint:**
| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats/dashboard` | Aggregated dashboard stats |

**Response shape:**
```json
{
  "teamCount": 3,
  "retroCount": 12,
  "actionItemCounts": { "open": 5, "inProgress": 2, "done": 8 },
  "upcomingRetros": [ { "id": "...", "name": "...", "date": "...", "teamName": "..." } ]
}
```

**Acceptance Criteria:**
- [ ] Stats are scoped to the authenticated user's teams
- [ ] `upcomingRetros` returns at most 5 retros with status SCHEDULED, ordered by date ascending
- [ ] Endpoint returns in a single DB round-trip where possible (use Prisma aggregates)

### Task 5.2: Add Stats unit tests [pending]
**Complexity:** small
**Files:** apps/api/src/stats/stats.service.spec.ts, apps/api/src/stats/stats.controller.spec.ts
**Depends on:** Task 5.1

**Acceptance Criteria:**
- [ ] `npm run test:api` passes with all new tests green

---

## Feature 6: Frontend API Client

### Task 6.1: Build typed API client functions for all CRUD endpoints [pending]
**Complexity:** medium
**Files:** apps/web/src/lib/api.ts, apps/web/src/types/index.ts
**Depends on:** Task 2.1, Task 3.1, Task 4.1, Task 5.1

Extend the existing `api()` utility in `lib/api.ts` with typed wrapper functions for every backend endpoint. Create a shared `types/index.ts` with TypeScript interfaces matching the API response shapes (`Team`, `TeamMember`, `Retro`, `ActionItem`, `DashboardStats`).

Functions to add:
- `fetchTeams()`, `fetchTeam(id)`, `createTeam(data)`, `updateTeam(id, data)`, `deleteTeam(id)`, `addTeamMember(teamId, email)`, `removeTeamMember(teamId, userId)`
- `fetchRetros(teamId)`, `fetchRetro(id)`, `createRetro(teamId, data)`, `updateRetro(id, data)`, `deleteRetro(id)`
- `fetchActionItems(retroId)`, `fetchMyActionItems()`, `createActionItem(retroId, data)`, `updateActionItem(id, data)`, `deleteActionItem(id)`
- `fetchDashboardStats()`

All functions should attach the JWT token from localStorage, parse JSON responses, and throw on non-OK status.

**Acceptance Criteria:**
- [ ] All functions are fully typed with request/response interfaces
- [ ] Auth header is automatically included from stored token
- [ ] Error responses throw with status code and message

---

## Feature 7: Dashboard Shell & UI Components

### Task 7.1: Install additional shadcn/ui components [pending]
**Complexity:** small
**Files:** apps/web/src/components/ui/\*
**Depends on:** —

Add shadcn/ui components needed for the command center: `dialog`, `table`, `badge`, `tabs`, `dropdown-menu`, `select`, `textarea`, `label`, `separator`, `avatar`, `skeleton`.

**Acceptance Criteria:**
- [ ] All components are installed and importable
- [ ] No build errors after installation

### Task 7.2: Build command center dashboard layout with tab navigation [pending]
**Complexity:** medium
**Files:** apps/web/src/pages/DashboardPage.tsx, apps/web/src/pages/DashboardPage.test.tsx, apps/web/src/components/DashboardHeader.tsx, apps/web/src/components/StatsOverview.tsx, apps/web/src/components/StatsOverview.test.tsx
**Depends on:** Task 7.1, Task 6.1

Replace the placeholder `DashboardPage` with a command center layout:

1. **DashboardHeader** — user avatar, name, logout button (reuse existing logout logic from AuthContext)
2. **StatsOverview** — 4 stat cards in a grid (Teams, Retros, Open Items, Completed Items) using data from `fetchDashboardStats()`
3. **Tab navigation** — tabs for "Teams", "Retros", "Action Items" below the stats; each tab renders the corresponding list component (built in subsequent tasks)
4. Show skeleton loaders while data is loading

The page should call `fetchDashboardStats()` on mount and display the stats cards. Tab content will initially render placeholder text until the list components are built.

**Acceptance Criteria:**
- [ ] Dashboard loads and displays stats from the API
- [ ] Tab navigation switches between Teams / Retros / Action Items sections
- [ ] Skeleton loading states display while API calls are in flight
- [ ] Logout button works and redirects to landing page
- [ ] Tests cover rendering, tab switching, and loading states

---

## Feature 8: Teams UI

### Task 8.1: Build Teams list and CRUD components [pending]
**Complexity:** large
**Files:** apps/web/src/components/teams/TeamList.tsx, apps/web/src/components/teams/TeamList.test.tsx, apps/web/src/components/teams/TeamCard.tsx, apps/web/src/components/teams/CreateTeamDialog.tsx, apps/web/src/components/teams/EditTeamDialog.tsx, apps/web/src/components/teams/ManageMembersDialog.tsx
**Depends on:** Task 7.2

Build the Teams tab content:

1. **TeamList** — grid of `TeamCard` components with a "Create Team" button
2. **TeamCard** — displays team name, description, member count, retro count; dropdown menu with Edit/Delete for owners
3. **CreateTeamDialog** — modal form with name (required) and description (optional); calls `createTeam()`
4. **EditTeamDialog** — same form pre-filled; calls `updateTeam()`
5. **ManageMembersDialog** — lists current members, input to add by email, remove button per member; calls `addTeamMember()` / `removeTeamMember()`

Wire into the Teams tab in `DashboardPage`.

**Acceptance Criteria:**
- [ ] Teams display as cards in a responsive grid
- [ ] Create, edit, delete flows work end-to-end with the API
- [ ] Member management dialog allows adding by email and removing
- [ ] Optimistic UI updates or refetch after mutations
- [ ] Tests cover list rendering, create flow, and empty state

---

## Feature 9: Retros UI

### Task 9.1: Build Retros list and CRUD components [pending]
**Complexity:** large
**Files:** apps/web/src/components/retros/RetroList.tsx, apps/web/src/components/retros/RetroList.test.tsx, apps/web/src/components/retros/RetroCard.tsx, apps/web/src/components/retros/CreateRetroDialog.tsx, apps/web/src/components/retros/EditRetroDialog.tsx
**Depends on:** Task 7.2

Build the Retros tab content:

1. **RetroList** — shows retros grouped or filtered by team; "Create Retro" button opens a dialog
2. **RetroCard** — displays retro name, date, status badge (color-coded), team name, action item count
3. **CreateRetroDialog** — form with team selector, name, date; calls `createRetro()`
4. **EditRetroDialog** — update name, date, status; calls `updateRetro()`

Wire into the Retros tab in `DashboardPage`.

**Acceptance Criteria:**
- [ ] Retros display as cards with status badges
- [ ] Team filter/grouping works
- [ ] Create and edit flows work end-to-end
- [ ] Empty state displays when no retros exist
- [ ] Tests cover list rendering, create flow, and filtering

---

## Feature 10: Action Items UI

### Task 10.1: Build Action Items list and CRUD components [pending]
**Complexity:** large
**Files:** apps/web/src/components/action-items/ActionItemList.tsx, apps/web/src/components/action-items/ActionItemList.test.tsx, apps/web/src/components/action-items/ActionItemRow.tsx, apps/web/src/components/action-items/CreateActionItemDialog.tsx, apps/web/src/components/action-items/EditActionItemDialog.tsx
**Depends on:** Task 7.2

Build the Action Items tab content:

1. **ActionItemList** — table view of action items assigned to current user (`fetchMyActionItems()`); columns: title, retro name, team, status, assignee, due date; "Create" button
2. **ActionItemRow** — inline status toggle (checkbox for DONE), click to edit
3. **CreateActionItemDialog** — form with title, description, assignee selector (team members), due date; requires selecting a retro context
4. **EditActionItemDialog** — update all fields; calls `updateActionItem()`

Wire into the Action Items tab in `DashboardPage`.

**Acceptance Criteria:**
- [ ] Action items display in a table with sortable columns
- [ ] Quick status toggle works (click to mark done/reopen)
- [ ] Create and edit dialogs work end-to-end
- [ ] Items show their parent retro and team context
- [ ] Tests cover list rendering, status toggle, and empty state

---

## Feature 11: Integration & Validation

### Task 11.1: End-to-end validation and polish [pending]
**Complexity:** medium
**Files:** apps/web/src/pages/DashboardPage.tsx, apps/web/src/pages/DashboardPage.test.tsx
**Depends on:** Task 8.1, Task 9.1, Task 10.1

Final integration pass:

1. Run `bash scripts/validate.sh` — fix any lint, format, type, or test errors
2. Verify dashboard stats refresh when data changes (create a team → stat count updates)
3. Add empty states for each tab when no data exists (friendly message + CTA button)
4. Ensure responsive layout works at mobile breakpoints (stack cards, collapse table)
5. Verify all API error states are handled (show toast or inline error messages)

**Acceptance Criteria:**
- [ ] `bash scripts/validate.sh` passes cleanly
- [ ] All existing tests continue to pass
- [ ] Empty states guide users to create their first team/retro
- [ ] API errors display user-friendly messages
- [ ] Dashboard is usable at 375px viewport width
