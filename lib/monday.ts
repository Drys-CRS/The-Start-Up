// Monday.com write helper. Board + column IDs below are the LIVE boards
// already created in the account "Drystan Govender CM Multimedia".
const MONDAY_API = "https://api.monday.com/v2";
const TOKEN = process.env.MONDAY_API_TOKEN || "";

export const LEADS_BOARD_ID  = process.env.MONDAY_LEADS_BOARD_ID  || "18419179018";
export const SCOPE_BOARD_ID  = process.env.MONDAY_SCOPE_BOARD_ID  || "18419179036";
export const DELIVERY_BOARD_ID = process.env.MONDAY_DELIVERY_BOARD_ID || "18419179069";

// Inbound Leads board column IDs (board 18419179018)
export const LEADS = {
  email:     "email_mm4mhx5m",
  industry:  "text_mm4mt1wt",
  leads:     "numeric_mm4mpf6s",
  deal:      "numeric_mm4mc938",
  closeRate: "numeric_mm4m8qxc",
  response:  "text_mm4mfy32",
  leak:      "numeric_mm4mz4ef",
  currency:  "text_mm4mm5jq",
  source:    "text_mm4mznjj",
  captured:  "date_mm4myq95",
  stage:     "color_mm4m7tjx",
  followups: process.env.MONDAY_LEADS_FOLLOWUP_COL || "text_mm7669jr",
};

// Scope Locks board column IDs (board 18419179036)
export const SCOPE = {
  contact:      "text_mm4mfwqa",
  email:        "email_mm4m39b6",
  tier:         "color_mm4m39qp",
  currency:     "text_mm4mqx5",
  goal:         "long_text_mm4m7d3s",
  bottleneck:   "long_text_mm4m16ey",
  workflow:     "long_text_mm4mf7xx",
  musthaves:    "long_text_mm4mfsx2",
  integrations: "text_mm4mxw3w",
  startDate:    "date_mm4m76f7",
  stage:        "color_mm4m4qbe",
  submitted:    "date_mm4mqmp0",
  ref:          process.env.MONDAY_SCOPE_REF_COL || "text_mm5b6hh4",
  followups:    process.env.MONDAY_SCOPE_FOLLOWUP_COL || "text_mm76ve76",
};

// Delivery & Support board column IDs (board 18419179069)
export const DELIVERY = {
  contact:      "text_mm4m179r",
  email:        "email_mm4mpf2e",
  tier:         "color_mm4m1h63",
  phase:        "color_mm4mbccy",
  health:       "color_mm4mmf9n",
  buildStart:   "date_mm4mpvdz",
  shipDeadline: "date_mm4mgxt2",
  supportEnds:  "date_mm4mqvg2",
  value:        "numeric_mm4mahte",
  currency:     "text_mm4ms3rx",
  notes:        "long_text_mm4my2pw",
};

export async function createItem(
  boardId: string,
  itemName: string,
  columnValues: Record<string, unknown>
): Promise<string> {
  if (!TOKEN) throw new Error("MONDAY_API_TOKEN is not set in environment variables");

  const query = `mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
    create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) { id }
  }`;

  let res: Response;
  try {
    res = await fetch(MONDAY_API, {
      method: "POST",
      headers: {
        Authorization: TOKEN,
        "Content-Type": "application/json",
        "API-Version": "2024-10",
      },
      body: JSON.stringify({
        query,
        variables: { boardId, itemName, columnValues: JSON.stringify(columnValues) },
      }),
    });
  } catch (networkErr) {
    throw new Error(`Network error reaching Monday.com: ${String(networkErr)}`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(`Monday.com HTTP ${res.status}: ${JSON.stringify(data)}`);
  if (data.errors) throw new Error(`Monday.com API error: ${JSON.stringify(data.errors)}`);
  if (!data.data?.create_item?.id) throw new Error(`Monday.com returned no item ID: ${JSON.stringify(data)}`);
  return data.data.create_item.id as string;
}

export const today = () => new Date().toISOString().slice(0, 10);

// Set any simple (text/status/label) column value — creates the label if missing.
export async function setSimpleColumn(
  boardId: string,
  itemId: string,
  columnId: string,
  value: string,
): Promise<string> {
  const query = `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) {
    change_simple_column_value(board_id: $boardId, item_id: $itemId,
      column_id: $columnId, value: $value, create_labels_if_missing: true) { id }
  }`;
  const res = await fetch(MONDAY_API, {
    method: "POST",
    headers: { Authorization: TOKEN, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({ query, variables: { boardId, itemId, columnId, value } }),
  });
  const data = await res.json();
  if (data.errors) throw new Error(JSON.stringify(data.errors));
  return data.data.change_simple_column_value.id;
}

// Post a plain-text update on a Monday.com item.
export async function addUpdateToItem(itemId: string, body: string): Promise<string | null> {
  if (!TOKEN) return null;
  const res = await fetch(MONDAY_API, {
    method: "POST",
    headers: { Authorization: TOKEN, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({
      query: `mutation { create_update(item_id: ${itemId}, body: ${JSON.stringify(body)}) { id } }`,
    }),
  }).catch(() => null);
  const json = await res?.json().catch(() => null);
  return json?.data?.create_update?.id ?? null;
}

// Change the stage/status column value on a scope-lock item. Creates the label when
// the board lacks it: "Signed" isn't one of the Scope Locks board's original labels,
// and without this the update was silently rejected.
export async function changeItemStage(
  itemId: string,
  label: string,
  boardId = SCOPE_BOARD_ID,
  columnId = SCOPE.stage,
): Promise<void> {
  if (!TOKEN) return;
  await setSimpleColumn(boardId, itemId, columnId, label).catch(e => console.error("changeItemStage failed", itemId, label, e));
}

// Attach a file to a Monday.com item by creating an update then uploading to it.
export async function addFileToItem(
  itemId: string,
  fileBuffer: Buffer,
  filename: string,
  updateBody = "Proposal PDF generated and sent to client.",
): Promise<void> {
  if (!TOKEN) return;

  // 1 — create an update on the item
  const updateRes = await fetch(MONDAY_API, {
    method: "POST",
    headers: { Authorization: TOKEN, "Content-Type": "application/json", "API-Version": "2024-10" },
    body: JSON.stringify({
      query: `mutation { create_update(item_id: ${itemId}, body: ${JSON.stringify(updateBody)}) { id } }`,
    }),
  }).catch(() => null);
  const updateJson = await updateRes?.json().catch(() => null);
  const updateId = updateJson?.data?.create_update?.id;
  if (!updateId) return;

  // 2 — upload file to that update (multipart, no explicit Content-Type header)
  const form = new FormData();
  form.append(
    "query",
    `mutation ($file: File!) { add_file_to_update(update_id: ${updateId}, file: $file) { id } }`,
  );
  form.append(
    "variables[file]",
    new Blob([fileBuffer], { type: "application/pdf" }),
    filename,
  );
  await fetch("https://api.monday.com/v2/file", {
    method: "POST",
    headers: { Authorization: TOKEN, "API-Version": "2024-10" },
    body: form,
  }).catch(() => null);
}

export type ScopeStatus = {
  itemId: string;
  name: string;
  stageLabel: string;
  email: string;
  ref: string;
  tierLabel: string;
};

// Look up a Scope Lock by its customer-facing ref number.
// Returns the item's stage + stored email so the caller can verify identity.
// Returns null if not found, on any error, or if the token is missing.
export async function getScopeStatus(ref: string): Promise<ScopeStatus | null> {
  if (!TOKEN || !ref) return null;

  const query = `query ($boardId: ID!, $colId: String!, $ref: String!) {
    items_page_by_column_values(
      board_id: $boardId, limit: 1,
      columns: [{ column_id: $colId, column_values: [$ref] }]
    ) {
      items {
        id
        name
        column_values(ids: ["${SCOPE.stage}", "${SCOPE.email}", "${SCOPE.ref}", "${SCOPE.tier}"]) {
          id
          text
        }
      }
    }
  }`;

  let res: Response;
  try {
    res = await fetch(MONDAY_API, {
      method: "POST",
      headers: { Authorization: TOKEN, "Content-Type": "application/json", "API-Version": "2024-10" },
      body: JSON.stringify({
        query,
        variables: { boardId: SCOPE_BOARD_ID, colId: SCOPE.ref, ref },
      }),
    });
  } catch {
    return null;
  }

  const data = await res.json().catch(() => null);
  const item = data?.data?.items_page_by_column_values?.items?.[0];
  if (!item) return null;

  const cols: Array<{ id: string; text: string | null }> = item.column_values || [];
  const byId = (id: string) => cols.find(c => c.id === id)?.text || "";

  return {
    itemId: String(item.id),
    name: item.name || "",
    stageLabel: byId(SCOPE.stage),
    email: byId(SCOPE.email),
    ref: byId(SCOPE.ref),
    tierLabel: byId(SCOPE.tier),
  };
}

// Read the stored ref, email, tier, and stage for a Scope Lock by its Monday item id.
// Used by the Stripe webhook (which only knows the item id) and resolveScopeLock. Best-effort — null on error.
export async function getScopeById(
  itemId: string,
): Promise<{ ref: string; email: string; tierLabel: string; stageLabel: string } | null> {
  if (!TOKEN || !itemId) return null;
  const query = `query ($ids: [ID!]) {
    items(ids: $ids) {
      column_values(ids: ["${SCOPE.ref}", "${SCOPE.email}", "${SCOPE.tier}", "${SCOPE.stage}"]) { id text }
    }
  }`;
  let res: Response;
  try {
    res = await fetch(MONDAY_API, {
      method: "POST",
      headers: { Authorization: TOKEN, "Content-Type": "application/json", "API-Version": "2024-10" },
      body: JSON.stringify({ query, variables: { ids: [itemId] } }),
    });
  } catch {
    return null;
  }
  const data = await res.json().catch(() => null);
  const cols: Array<{ id: string; text: string | null }> = data?.data?.items?.[0]?.column_values || [];
  if (!cols.length) return null;
  const byId = (id: string) => cols.find(c => c.id === id)?.text || "";
  return { ref: byId(SCOPE.ref), email: byId(SCOPE.email), tierLabel: byId(SCOPE.tier), stageLabel: byId(SCOPE.stage) };
}

export type VerifiedScopeLock = {
  itemId: string;
  ref: string;
  email: string;
  tierLabel: string;
  stageLabel: string;
};

// Resolve a Scope Lock from identifiers a customer supplied (sign link, checkout)
// and confirm they own it. Looks up by Monday item id when given, since items created
// before the Ref No column existed have a blank ref, otherwise by ref. Either way the
// stored email must match. Returns null on any mismatch or lookup failure; callers
// should answer with a generic "not found".
export async function resolveScopeLock(opts: {
  ref?: unknown;
  item?: unknown;
  email?: unknown;
}): Promise<VerifiedScopeLock | null> {
  const ref = typeof opts.ref === "string" ? opts.ref.trim() : "";
  const item = typeof opts.item === "string" || typeof opts.item === "number" ? String(opts.item).trim() : "";
  const email = typeof opts.email === "string" ? opts.email.trim().toLowerCase() : "";
  if (!email) return null;

  let record: VerifiedScopeLock | null = null;
  if (/^\d+$/.test(item)) {
    const r = await getScopeById(item);
    if (r) record = { itemId: item, ...r };
  } else if (ref) {
    const r = await getScopeStatus(ref);
    if (r) record = { itemId: r.itemId, ref: r.ref, email: r.email, tierLabel: r.tierLabel, stageLabel: r.stageLabel };
  }

  if (!record || record.email.trim().toLowerCase() !== email) return null;
  return record;
}

export type BoardItem = {
  id: string;
  name: string;
  createdAt: string;
  texts: Record<string, string>; // column id → display text
  values: Record<string, string>; // column id → raw JSON value
};

// Every item on a board with the requested columns, following items_page cursors.
// Capped at maxPages × 200 items so a runaway board can't stall the caller. Throws
// on API errors so a scheduled job fails loudly instead of silently doing nothing.
export async function listBoardItems(boardId: string, columnIds: string[], maxPages = 10): Promise<BoardItem[]> {
  if (!TOKEN) return [];
  const fields = "cursor items { id name created_at column_values(ids: $cols) { id text value } }";
  const firstQuery = `query ($boardId: ID!, $cols: [String!]) { boards(ids: [$boardId]) { items_page(limit: 200) { ${fields} } } }`;
  const nextQuery = `query ($cursor: String!, $cols: [String!]) { next_items_page(limit: 200, cursor: $cursor) { ${fields} } }`;

  const items: BoardItem[] = [];
  let cursor: string | null = null;
  for (let page = 0; page < maxPages; page++) {
    const res = await fetch(MONDAY_API, {
      method: "POST",
      headers: { Authorization: TOKEN, "Content-Type": "application/json", "API-Version": "2024-10" },
      body: JSON.stringify(
        page === 0
          ? { query: firstQuery, variables: { boardId, cols: columnIds } }
          : { query: nextQuery, variables: { cursor, cols: columnIds } },
      ),
    });
    const data = await res.json();
    if (!res.ok || data.errors) throw new Error(`Monday.com API error: ${JSON.stringify(data.errors || data)}`);

    const pageData = page === 0 ? data.data?.boards?.[0]?.items_page : data.data?.next_items_page;
    for (const it of pageData?.items || []) {
      const texts: Record<string, string> = {};
      const values: Record<string, string> = {};
      for (const c of it.column_values || []) {
        texts[c.id] = c.text || "";
        values[c.id] = c.value || "";
      }
      items.push({ id: String(it.id), name: it.name || "", createdAt: it.created_at || "", texts, values });
    }
    cursor = pageData?.cursor || null;
    if (!cursor) break;
  }
  return items;
}

// Read a few columns of any item, plus the id of the board it lives on. Null on error.
export async function getItemColumns(
  itemId: string,
  columnIds: string[],
): Promise<{ boardId: string; texts: Record<string, string> } | null> {
  if (!TOKEN || !itemId) return null;
  try {
    const res = await fetch(MONDAY_API, {
      method: "POST",
      headers: { Authorization: TOKEN, "Content-Type": "application/json", "API-Version": "2024-10" },
      body: JSON.stringify({
        query: `query ($ids: [ID!], $cols: [String!]) { items(ids: $ids) { board { id } column_values(ids: $cols) { id text } } }`,
        variables: { ids: [itemId], cols: columnIds },
      }),
    });
    const data = await res.json();
    const item = data?.data?.items?.[0];
    if (!item) return null;
    const texts: Record<string, string> = {};
    for (const c of item.column_values || []) texts[c.id] = c.text || "";
    return { boardId: String(item.board?.id || ""), texts };
  } catch {
    return null;
  }
}
