# Component Standardization & Architectural Integrity Todo

> Architectural quality guidelines and component standardization tasks — Cross-referenced with [todo.md](file:///c:/Users/decor/Development/general_soccer_app_v4/todo.md)

---

## Core Guidelines & Architectural Principles

- [x] **Always Maintain Todo Tracking**: Continuously update todo tracking documents to reflect completed work, verified fixes, and active priorities.
- [x] **Maximized Component Reuse**: Always consume existing design system components (`Card`, `Button`, `Modal`, `Select`, `Input`, `Checkbox`, `Dialog`, `LocationLink`, `ClubLink`) when building new features.
- [x] **Global CSS Tokens & Shared Styling**: Rely strictly on global CSS design tokens, utility classes, and shared layouts rather than ad-hoc custom styles.
- [x] **Optimize Existing Abstractions First**: Refactor and extend pre-existing queries, actions, and UI components before creating redundant single-purpose files.

---

## Step 23: Universal Entity Links & Modal System

- [x] **23.1 Universal Interactive Location Link & Modal Provider**
  - [x] Created `EntityModalProvider.tsx` mounted at root layout level to handle global entity modal triggers (`openLocationModal`).
  - [x] Created `LocationLink.tsx` component supporting compact/abbreviated names in dense tables and full names in expanded card views.
  - [x] Integrated `LocationLink` across team schedules, tournament schedules, match summary headers, and master score entry tables so clicking a location opens the interactive map modal everywhere.

- [ ] **23.2 Universal Interactive Club & Team Links & Detail Modals**
  - [x] Created `ClubLink.tsx` supporting short (abbreviated) vs long club names and logo badges.
  - [ ] Build `ClubDetailsModal.tsx` showing club overview, enrolled team seasons, primary venue, and staff contacts.
  - [ ] Integrate `ClubLink` and `TeamLink` across standings tables, leaderboards, match scoreboards, and roster views.

- [ ] **23.3 System-Wide Component & Style Consistency Audit**
  - [ ] Audit all remaining public and admin pages to ensure 100% usage of shared UI components (`Button`, `Card`, `Select`, `Input`, `Modal`) with zero unstyled native elements or ad-hoc modal triggers.
