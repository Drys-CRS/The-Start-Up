/**
 * Monday.com tool implementations for the MVP planning agent.
 * Each function maps to a Claude tool call.
 */

const MONDAY_API = "https://api.monday.com/v2";

function headers() {
  return {
    Authorization: process.env.MONDAY_API_TOKEN || "",
    "Content-Type": "application/json",
    "API-Version": "2024-10",
  };
}

async function gql(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(MONDAY_API, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

// ── Scope Lock ──────────────────────────────────────────────────────────────

export async function readScopeLock(itemId: string) {
  const data = await gql(`query {
    items(ids: [${itemId}]) {
      name
      column_values { id text }
    }
  }`);
  const item = data.items[0];
  if (!item) throw new Error(`Scope lock item ${itemId} not found`);
  const cols: Record<string, string> = {};
  for (const cv of item.column_values) {
    if (cv.text) cols[cv.id] = cv.text;
  }
  return { name: item.name, columns: cols };
}

// ── Boards ──────────────────────────────────────────────────────────────────

export async function listWorkspaces(): Promise<{ id: string; name: string }[]> {
  const data = await gql(`query { workspaces { id name } }`);
  return data.workspaces;
}

export async function listWorkspaceBoards(): Promise<{ id: string; name: string }[]> {
  const data = await gql(`query { boards(limit: 50, order_by: created_at) { id name } }`);
  return data.boards;
}

export async function createBoard(name: string, workspaceId: string): Promise<string> {
  const data = await gql(
    `mutation { create_board(board_name: ${JSON.stringify(name)}, board_kind: public, workspace_id: ${workspaceId}) { id } }`,
  );
  return data.create_board.id;
}

// ── Columns ─────────────────────────────────────────────────────────────────

export async function addBoardColumn(boardId: string, title: string, columnType: string): Promise<string> {
  const data = await gql(
    // column_type is a GraphQL enum — must not be quoted
    `mutation { create_column(board_id: ${boardId}, title: ${JSON.stringify(title)}, column_type: ${columnType}) { id } }`,
  );
  return data.create_column.id;
}

// ── Groups ──────────────────────────────────────────────────────────────────

export async function createGroup(boardId: string, groupName: string, relativeTo?: string): Promise<string> {
  // relativeTo: ID of the group to position AFTER — ensures correct top-to-bottom order
  const posClause = relativeTo
    ? `, position_relative_method: after_at, relative_to: ${JSON.stringify(relativeTo)}`
    : "";
  const data = await gql(
    `mutation { create_group(board_id: ${boardId}, group_name: ${JSON.stringify(groupName)}${posClause}) { id } }`,
  );
  return data.create_group.id;
}

export async function moveItemToGroup(itemId: string, groupId: string): Promise<void> {
  await gql(
    `mutation { move_item_to_group(item_id: ${itemId}, group_id: ${JSON.stringify(groupId)}) { id } }`,
  );
}

// ── Bidirectional board link ─────────────────────────────────────────────────

export async function createBoardLink(
  boardAId: string, titleA: string,
  boardBId: string, titleB: string,
): Promise<{ colA: string; colB: string }> {
  const [dA, dB] = await Promise.all([
    gql(`mutation { create_column(board_id: ${boardAId}, title: ${JSON.stringify(titleA)}, column_type: board_relation, defaults: "{\\\"boardIds\\\": [${boardBId}]}") { id } }`),
    gql(`mutation { create_column(board_id: ${boardBId}, title: ${JSON.stringify(titleB)}, column_type: board_relation, defaults: "{\\\"boardIds\\\": [${boardAId}]}") { id } }`),
  ]);
  return { colA: dA.create_column.id, colB: dB.create_column.id };
}

// ── Dashboard widgets ────────────────────────────────────────────────────────

export async function addDashboardWidget(dashboardId: string, widgetKind: string): Promise<string> {
  const data = await gql(
    // widget_kind is a GraphQL enum — must not be quoted
    `mutation { create_widget(board_id: ${dashboardId}, widget_kind: ${widgetKind}) { id } }`,
  );
  return data.create_widget?.id ?? "ok";
}

// ── Items ───────────────────────────────────────────────────────────────────

export async function createItemInGroup(
  boardId: string,
  groupId: string,
  name: string,
  columnValues: Record<string, unknown> = {},
): Promise<string> {
  const data = await gql(
    `mutation ($boardId: ID!, $groupId: String!, $itemName: String!, $columnValues: JSON!) {
      create_item(board_id: $boardId, group_id: $groupId, item_name: $itemName, column_values: $columnValues) { id }
    }`,
    { boardId, groupId, itemName: name, columnValues: JSON.stringify(columnValues) },
  );
  return data.create_item.id;
}

export async function setItemStatus(
  boardId: string,
  itemId: string,
  columnId: string,
  label: string,
): Promise<void> {
  await gql(
    `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) { id }
    }`,
    { boardId, itemId, columnId, value: JSON.stringify({ label }) },
  );
}

export async function setSimpleValue(
  boardId: string,
  itemId: string,
  columnId: string,
  value: string,
): Promise<void> {
  await gql(
    `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) {
      change_simple_column_value(board_id: $boardId, item_id: $itemId,
        column_id: $columnId, value: $value, create_labels_if_missing: true) { id }
    }`,
    { boardId, itemId, columnId, value },
  );
}

export async function setLongText(
  boardId: string,
  itemId: string,
  columnId: string,
  text: string,
): Promise<void> {
  await gql(
    `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value(board_id: $boardId, item_id: $itemId, column_id: $columnId, value: $value) { id }
    }`,
    { boardId, itemId, columnId, value: JSON.stringify({ text }) },
  );
}

export async function findItemsByName(
  boardId: string,
  searchTerm: string,
): Promise<{ id: string; name: string; groupId: string }[]> {
  const data = await gql(
    `query { boards(ids: [${boardId}]) {
      items_page(limit: 100) { items { id name group { id } } }
    }}`,
  );
  const items = data.boards[0]?.items_page?.items ?? [];
  return items
    .filter((i: { name: string }) => i.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .map((i: { id: string; name: string; group: { id: string } }) => ({
      id: i.id, name: i.name, groupId: i.group.id,
    }));
}

// ── Updates / Comments ──────────────────────────────────────────────────────

export async function postUpdate(itemId: string, body: string): Promise<string> {
  const data = await gql(
    `mutation { create_update(item_id: ${itemId}, body: ${JSON.stringify(body)}) { id } }`,
  );
  return data.create_update.id;
}

// ── Scope Lock helpers ──────────────────────────────────────────────────────

export async function advanceScopeStage(
  scopeBoardId: string,
  itemId: string,
  stageLabel: string,
): Promise<void> {
  await gql(
    `mutation ($boardId: ID!, $itemId: ID!, $columnId: String!, $value: String!) {
      change_simple_column_value(board_id: $boardId, item_id: $itemId,
        column_id: $columnId, value: $value, create_labels_if_missing: true) { id }
    }`,
    { boardId: scopeBoardId, itemId, columnId: "color_mm4m4qbe", value: stageLabel },
  );
}
