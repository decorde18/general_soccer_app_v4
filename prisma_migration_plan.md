# Architecture Migration Plan: Prisma & Zod

## Objective
Transition the backend architecture from manual `mysql2` queries to Prisma ORM, implement Zod for type-safe form validation, and create utility helpers to drastically speed up future development of Teams, Clubs, and Scheduling.

## Phase 1: Prisma Initialization & Safety Pull
*Goal: Connect Prisma without losing any existing Hostinger data.*
1. Install Prisma dependencies (`npm install -D prisma`, `npm install @prisma/client`).
2. Initialize Prisma (`npx prisma init`).
3. Connect your Hostinger Database URL to the `.env` file.
4. **Safety Step**: Run `npx prisma db pull`. Because you already have tables in Hostinger, we MUST pull them into code first. This reads your existing tables and generates the `schema.prisma` file so we have a perfectly synced starting point.
5. Setup the global `src/lib/prisma.ts` client instance.

## Phase 2: Zod Validation & Utility Boilerplate
*Goal: Set up the helper tools that will make building pages fast and safe.*
1. Install Zod (`npm install zod`).
2. Create `src/lib/utils/formHelpers.ts` to hold `injectOptions` and `attachCreatable` (this cleans up your massive page files).
3. Create a `src/lib/validations/` folder to hold Zod schemas. These will instantly parse `GenericForm` string data into proper DB types (numbers, booleans, dates) before hitting the server actions.

## Phase 3: Incremental Refactoring (One Entity at a Time)
*Goal: Swap the engine while the car is running. We do this table by table to prevent breaking the whole app.*
1. **Governing Bodies**: 
   - Update `governingBody-actions.ts` to use Prisma + Zod.
   - Update `getGoverningBodies` in `queries.ts`.
2. **Leagues**:
   - Update `league-actions.ts` to use Prisma + Zod.
   - Update `getLeagues` in `queries.ts`.
   - Implement the `injectOptions` helper in `leagues/page.tsx`.

## Phase 4: Full Code-First "Push" Workflow
*Goal: Now that we are stable, unlock the speed.*
1. Remove the old `mysql2` pool file (`src/lib/db.ts`).
2. For all new entities (Clubs, Teams, Players, Games), we will define them first in `schema.prisma`.
3. Run `npx prisma db push` to instantly generate the tables in Hostinger!
4. Prisma will auto-generate the TypeScript types, and we can build the UI in minutes.
