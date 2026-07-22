// src/app/api/[table]/route.ts
// Universal dynamic table API — handles all CRUD for any table or view.
// apiFetch() in @/app/api/fetcher.ts calls /api/{table} for every DB operation.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// ─── Allowlist ───────────────────────────────────────────────────────────────
// Only allow known tables & views to prevent SQL-injection via the table name.
const ALLOWED_TABLES = new Set([
  // Core tables
  "addresses",
  "age_groups",
  "clubs",
  "events",
  "event_types",
  "games",
  "games_overtimes",
  "game_events_discipline",
  "game_events_goals",
  "game_events_major",
  "game_events_penalties",
  "game_events_player_actions",
  "game_events_team",
  "game_league_nodes",
  "game_periods",
  "game_standings_inclusions",
  "game_subs",
  "governing_bodies",
  "league_nodes",
  "league_node_seasons",
  "leagues",
  "locations",
  "people",
  "player_games",
  "players",
  "positions",
  "seasons",
  "sublocations",
  "team_seasons",
  "team_staff",
  "teams",
  "users",
  "club_staff",
  // Views (read-only)
  "v_games",
  "v_players",
  "v_player_games",
  "v_player_game_stats_enhanced",
  "v_game_events_goals_complete",
  "v_game_events_discipline_complete",
  "v_game_events_penalties_complete",
]);

const READ_ONLY_TABLES = new Set([
  "v_games",
  "v_players",
  "v_player_games",
  "v_player_game_stats_enhanced",
  "v_game_events_goals_complete",
  "v_game_events_discipline_complete",
  "v_game_events_penalties_complete",
]);

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Safely escape an identifier (column / table name) for MySQL. */
function escapeIdentifier(name: string): string {
  return `\`${name.replace(/`/g, "``")}\``;
}

/** Return a 400 JSON response. */
function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

/** Return a 404 JSON response. */
function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/** Convert BigInt values to numbers so JSON.stringify doesn't throw. */
function serializeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[k] = typeof v === "bigint" ? Number(v) : v;
  }
  return out;
}

// ─── Route context type ───────────────────────────────────────────────────────
interface RouteContext {
  params: Promise<{ table: string }>;
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req: Request, context: RouteContext) {
  const { table } = await context.params;

  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: `Table "${table}" not allowed` }, { status: 403 });
  }

  const url = new URL(req.url);
  const params = url.searchParams;
  const id = params.get("id");

  // ── GET by ID ──────────────────────────────────────────────────────────────
  if (id) {
    const sql = `SELECT * FROM \`${table}\` WHERE id = ? LIMIT 1`;
    const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql, Number(id));
    const row = rows[0];
    if (!row) return notFound();
    return NextResponse.json(serializeRow(row));
  }

  // ── GET with filters / sort / pagination ───────────────────────────────────
  const whereClauses: string[] = [];
  const bindings: unknown[] = [];

  const OPERATOR_MAP: Record<string, string> = {
    gt: ">",
    gte: ">=",
    lt: "<",
    lte: "<=",
    ne: "!=",
    like: "LIKE",
  };

  for (const [key, value] of params.entries()) {
    // Skip non-filter params
    if (["sortBy", "order", "limit", "offset", "_count", "groupBy", "aggregates"].includes(key)) continue;
    if (key.startsWith("having_")) continue;

    // IS NULL  e.g. sub_time_is_null=true
    if (key.endsWith("_is_null")) {
      const col = key.slice(0, -8); // strip "_is_null"
      whereClauses.push(`${escapeIdentifier(col)} IS NULL`);
      continue;
    }

    // IS NOT NULL  e.g. sub_time_is_not_null=true
    if (key.endsWith("_is_not_null")) {
      const col = key.slice(0, -12);
      whereClauses.push(`${escapeIdentifier(col)} IS NOT NULL`);
      continue;
    }

    // Operator suffixes  e.g. age_gt=18
    const opEntry = Object.entries(OPERATOR_MAP).find(([suffix]) => key.endsWith(`_${suffix}`));
    if (opEntry) {
      const [suffix, op] = opEntry;
      const col = key.slice(0, -(suffix.length + 1));
      whereClauses.push(`${escapeIdentifier(col)} ${op} ?`);
      bindings.push(isNaN(Number(value)) ? value : Number(value));
      continue;
    }

    // Plain equality
    whereClauses.push(`${escapeIdentifier(key)} = ?`);
    bindings.push(isNaN(Number(value)) || value === "" ? value : Number(value));
  }

  const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(" AND ")}` : "";

  // GROUP BY
  const groupByParam = params.get("groupBy");
  const groupBySQL = groupByParam
    ? `GROUP BY ${groupByParam.split(",").map(escapeIdentifier).join(", ")}`
    : "";

  // Aggregates
  let selectSQL = "*";
  const aggregatesParam = params.get("aggregates");
  if (aggregatesParam) {
    try {
      const aggs = JSON.parse(aggregatesParam) as Record<string, string>;
      const aggParts = Object.entries(aggs).map(([alias, expr]) => `${expr} AS ${escapeIdentifier(alias)}`);
      selectSQL = aggParts.join(", ");
      if (groupByParam) {
        selectSQL = `${groupByParam.split(",").map(escapeIdentifier).join(", ")}, ${selectSQL}`;
      }
    } catch {
      // ignore bad JSON
    }
  }

  // HAVING
  const havingClauses: string[] = [];
  const havingBindings: unknown[] = [];
  for (const [key, value] of params.entries()) {
    if (!key.startsWith("having_")) continue;
    const rest = key.slice(7); // strip "having_"
    const opEntry = Object.entries(OPERATOR_MAP).find(([suffix]) => rest.endsWith(`_${suffix}`));
    if (opEntry) {
      const [suffix, op] = opEntry;
      const col = rest.slice(0, -(suffix.length + 1));
      havingClauses.push(`${escapeIdentifier(col)} ${op} ?`);
      havingBindings.push(isNaN(Number(value)) ? value : Number(value));
    } else {
      havingClauses.push(`${escapeIdentifier(rest)} = ?`);
      havingBindings.push(isNaN(Number(value)) ? value : Number(value));
    }
  }
  const havingSQL = havingClauses.length ? `HAVING ${havingClauses.join(" AND ")}` : "";

  // COUNT
  if (params.get("_count") === "true") {
    const countSql = `SELECT COUNT(*) as total FROM \`${table}\` ${whereSQL}`;
    const result = await prisma.$queryRawUnsafe<{ total: bigint | number }[]>(countSql, ...bindings);
    const total = typeof result[0].total === "bigint" ? Number(result[0].total) : result[0].total;
    return NextResponse.json({ total });
  }

  // ORDER BY
  const sortByParam = params.get("sortBy");
  const orderParam = params.get("order");
  let orderSQL = "";
  if (sortByParam) {
    const cols = sortByParam.split(",");
    const orders = orderParam ? orderParam.split(",") : [];
    const parts = cols.map((col, i) => {
      const dir = (orders[i] || "asc").toUpperCase() === "DESC" ? "DESC" : "ASC";
      return `${escapeIdentifier(col)} ${dir}`;
    });
    orderSQL = `ORDER BY ${parts.join(", ")}`;
  }

  // LIMIT / OFFSET
  const limitParam = params.get("limit");
  const offsetParam = params.get("offset");
  const limitSQL = limitParam ? `LIMIT ${parseInt(limitParam, 10)}` : "";
  const offsetSQL = offsetParam ? `OFFSET ${parseInt(offsetParam, 10)}` : "";

  const sql = `SELECT ${selectSQL} FROM \`${table}\` ${whereSQL} ${groupBySQL} ${havingSQL} ${orderSQL} ${limitSQL} ${offsetSQL}`.trim();

  const allBindings = [...bindings, ...havingBindings];
  const rows = await prisma.$queryRawUnsafe<Record<string, unknown>[]>(sql, ...allBindings);
  return NextResponse.json(rows.map(serializeRow));
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: Request, context: RouteContext) {
  const { table } = await context.params;

  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: `Table "${table}" not allowed` }, { status: 403 });
  }
  if (READ_ONLY_TABLES.has(table)) {
    return NextResponse.json({ error: `Table "${table}" is read-only` }, { status: 405 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const cols = Object.keys(body);
  if (cols.length === 0) return badRequest("No data provided");

  const colSQL = cols.map(escapeIdentifier).join(", ");
  const placeholders = cols.map(() => "?").join(", ");
  const values = cols.map((c) => body[c]);

  const sql = `INSERT INTO \`${table}\` (${colSQL}) VALUES (${placeholders})`;
  const result = await prisma.$executeRawUnsafe(sql, ...values);

  // Fetch the newly created row by last insert ID
  const [insertedRow] = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `SELECT LAST_INSERT_ID() as id`
  );
  const newId = insertedRow?.id;

  if (!newId) {
    return NextResponse.json({ success: true, rowsAffected: result });
  }

  return NextResponse.json({ success: true, id: newId });
}

// ─── PUT ─────────────────────────────────────────────────────────────────────
export async function PUT(req: Request, context: RouteContext) {
  const { table } = await context.params;

  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: `Table "${table}" not allowed` }, { status: 403 });
  }
  if (READ_ONLY_TABLES.has(table)) {
    return NextResponse.json({ error: `Table "${table}" is read-only` }, { status: 405 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Missing id parameter");

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const cols = Object.keys(body);
  if (cols.length === 0) return badRequest("No data provided");

  const setSQL = cols.map((c) => `${escapeIdentifier(c)} = ?`).join(", ");
  const values = [...cols.map((c) => body[c]), Number(id)];

  const sql = `UPDATE \`${table}\` SET ${setSQL} WHERE id = ?`;
  await prisma.$executeRawUnsafe(sql, ...values);

  return NextResponse.json({ success: true, id: Number(id) });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(req: Request, context: RouteContext) {
  return PUT(req, context);
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: Request, context: RouteContext) {
  const { table } = await context.params;

  if (!ALLOWED_TABLES.has(table)) {
    return NextResponse.json({ error: `Table "${table}" not allowed` }, { status: 403 });
  }
  if (READ_ONLY_TABLES.has(table)) {
    return NextResponse.json({ error: `Table "${table}" is read-only` }, { status: 405 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return badRequest("Missing id parameter");

  const sql = `DELETE FROM \`${table}\` WHERE id = ?`;
  await prisma.$executeRawUnsafe(sql, Number(id));

  return NextResponse.json({ success: true });
}
