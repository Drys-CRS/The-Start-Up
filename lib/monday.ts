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
  const query = `mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
    create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) { id }
  }`;
  const res = await fetch(MONDAY_API, {
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
  const data = await res.json();
  if (data.errors) throw new Error(JSON.stringify(data.errors));
  return data.data?.create_item?.id as string;
}

export const today = () => new Date().toISOString().slice(0, 10);
