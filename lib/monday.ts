// Monday.com write helper. Board + column IDs below are the LIVE boards
// already created in the account "Drystan Govender CM Multimedia".
const MONDAY_API = "https://api.monday.com/v2";
const TOKEN = process.env.MONDAY_API_TOKEN || "";

export const LEADS_BOARD_ID  = process.env.MONDAY_LEADS_BOARD_ID  || "18419179018";
export const SCOPE_BOARD_ID  = process.env.MONDAY_SCOPE_BOARD_ID  || "18419179036";
export const DELIVERY_BOARD_ID = process.env.MONDAY_DELIVERY_BOARD_ID || "18419179069";

// Inbound Leads board column IDs
export const LEADS = {
  email: "email_mm4kchdg",
  industry: "text_mm4ketbe",
  leads: "numeric_mm4kydt3",
  deal: "numeric_mm4kca9y",
  closeRate: "numeric_mm4ky33m",
  response: "text_mm4kx9n8",
  leak: "numeric_mm4kf7aj",
  currency: "text_mm4kkf6g",
  source: "text_mm4k5p76",
  captured: "date_mm4kv41m",
  stage: "color_mm4k3qba",
};

// Scope Locks board column IDs
export const SCOPE = {
  contact: "text_mm4kftgc",
  email: "email_mm4kvaf6",
  tier: "color_mm4k4ar2",
  currency: "text_mm4k3yz7",
  goal: "long_text_mm4ksggx",
  bottleneck: "long_text_mm4k3ms2",
  workflow: "long_text_mm4kvcz",
  musthaves: "long_text_mm4kjgs4",
  integrations: "text_mm4kcxq7",
  startDate: "date_mm4kzwb3",
  stage: "color_mm4kdfxk",
  submitted: "date_mm4k7h78",
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
