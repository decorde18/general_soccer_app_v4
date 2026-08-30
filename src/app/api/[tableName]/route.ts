// src/app/api/[table]/route.ts
// Universal dynamic table API — handles all CRUD for any table or view.
// apiFetch() in @/app/api/fetcher.ts calls /api/{table} for every DB operation.

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Ensure BigInt JSON serialization works seamlessly for all responses
if (typeof BigInt !== "undefined" && !(BigInt.prototype as any).toJSON) {
  (BigInt.prototype as any).toJSON = function (this: bigint) {
    return Number(this);
  };
}

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
  "player_relationships",
  "player_teams",
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

const TABLE_ID_COLUMNS: Record<string, string> = {
  v_games: "game_id",
  v_players: "player_id",
  v_player_games: "player_game_id",
  v_player_game_stats_enhanced: "player_game_id",
  v_game_events_goals_complete: "id",
  v_game_events_discipline_complete: "id",
  v_game_events_penalties_complete: "id",
};

const READ_ONLY_TABLES = new Set([
  "v_games",
  "v_players",
  "v_player_games",
  "v_player_game_stats_enhanced",
  "v_game_events_goals_complete",
  "v_game_events_discipline_complete",
  "v_game_events_penalties_complete",
]);

const TABLE_ENUM_VALIDATIONS: Record<string, Record<string, string[]>> = {
  game_events_discipline: {
    card_type: ["yellow", "red", "yellow_red"],
  },
  game_events_team: {
    event_type: ["foul", "corner", "offside", "throw_in", "goal_kick", "free_kick"],
  },
  game_events_penalties: {
    outcome: ["goal", "saved", "missed", "hit_post"],
  },
  game_events_major: {
    event_type: ["goal", "card", "penalty", "substitution", "stoppage", "period_end"],
  },
  game_events_player_actions: {
    event_type: ["shot", "shot_on_target", "shot_blocked", "save"],
  },
  event_types: {
    category: ["training", "social", "team", "other"],
  },
};

function validateEnumFields(table: string, body: Record<string, unknown>, isPost = false): string | null {
  const tableValidations = TABLE_ENUM_VALIDATIONS[table];
  if (!tableValidations) return null;

  for (const [col, allowedValues] of Object.entries(tableValidations)) {
    if (col in body || isPost) {
      const val = body[col];
      if (typeof val !== "string" || !allowedValues.includes(val)) {
        return `Invalid or missing value for field "${col}" on table "${table}". Must be one of: ${allowedValues.join(", ")}`;
      }
    }
  }
  return null;
}

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
  params: Promise<{ tableName: string }>;
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req: Request, context: RouteContext) {
  try {
    const { tableName } = await context.params;
    const table = tableName;

    if (!ALLOWED_TABLES.has(table)) {
      return NextResponse.json({ error: `Table "${table}" not allowed` }, { status: 403 });
    }

    const url = new URL(req.url);
    const params = url.searchParams;
    const id = params.get("id");
    const primaryIdCol = TABLE_ID_COLUMNS[table] || "id";

    // ── GET by ID ──────────────────────────────────────────────────────────────
    if (id) {
      const sql = `SELECT * FROM \`${table}\` WHERE \`${primaryIdCol}\` = ? LIMIT 1`;
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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[GET /${context}] DB error:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: Request, context: RouteContext) {
  const { tableName } = await context.params;
  const table = tableName;

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

  const enumError = validateEnumFields(table, body, true);
  if (enumError) return badRequest(enumError);

  const colSQL = cols.map(escapeIdentifier).join(", ");
  const placeholders = cols.map(() => "?").join(", ");
  const values = cols.map((c) => body[c]);

  const sql = `INSERT INTO \`${table}\` (${colSQL}) VALUES (${placeholders})`;

  try {
    const result = await prisma.$executeRawUnsafe(sql, ...values);

    // Fetch the newly created row by last insert ID
    const [insertedRow] = await prisma.$queryRawUnsafe<{ id: number | bigint }[]>(
      `SELECT LAST_INSERT_ID() as id`
    );
    const rawId = insertedRow?.id;
    const newId = rawId !== undefined && rawId !== null ? Number(rawId) : 0;

    if (!newId) {
      return NextResponse.json({ success: true, rowsAffected: result });
    }

    return NextResponse.json({ success: true, id: newId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // MySQL duplicate-entry error code 1062
    const isDuplicate = msg.includes("1062") || msg.toLowerCase().includes("duplicate");
    if (isDuplicate) {
      return NextResponse.json(
        { error: `Duplicate entry for table "${table}": ${msg}` },
        { status: 409 }
      );
    }
    console.error(`[POST /${table}] DB error:`, msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── PUT ─────────────────────────────────────────────────────────────────────
export async function PUT(req: Request, context: RouteContext) {
  const { tableName } = await context.params;
  const table = tableName;

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

  const enumError = validateEnumFields(table, body, false);
  if (enumError) return badRequest(enumError);

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
  const { tableName } = await context.params;
  const table = tableName;

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
