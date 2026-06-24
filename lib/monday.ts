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
