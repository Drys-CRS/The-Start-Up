/**
 * MVP planning agent powered by Gemini 2.5 Pro via REST API.
 * Requires GOOGLE_AI_API_KEY in environment.
 */

import {
  readScopeLock,
  listWorkspaces,
  listWorkspaceBoards,
  createBoard,
  addBoardColumn,
  createGroup,
  createItemInGroup,
  moveItemToGroup,
  setSimpleValue,
  setItemStatus,
  findItemsByName,
  postUpdate,
  advanceScopeStage,
} from "./monday-tools";

const GEMINI_URL = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

const BUILD_TRACKER_BOARD_ID =
  process.env.MONDAY_BUILD_TRACKER_BOARD_ID ||
  process.env.MONDAY_DELIVERY_BOARD_ID ||
  "18419179069";

// ── Tool declarations (Gemini format) ────────────────────────────────────────

const TOOL_DECLARATIONS = [
  {
    name: "read_scope_lock",
    description: "Read all fields from a Scope Lock item in Monday.com — client name, goal, bottleneck, workflow, must-haves, integrations.",
    parameters: {
      type: "OBJECT",
      properties: { item_id: { type: "STRING", description: "The Monday.com Scope Lock item ID" } },
      required: ["item_id"],
    },
  },
  {
    name: "list_workspaces",
    description: "List all Monday.com workspaces. Call this first to find 'The Start Up' workspace ID before creating a board.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "list_boards",
    description: "List all boards in the Monday.com account.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "create_project_board",
    description: "Create a new Monday.com board inside a specific workspace. Always call list_workspaces first to get the correct workspace_id for 'The Start Up'.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_name:   { type: "STRING", description: "e.g. 'Acme Corp — Build Plan'" },
        workspace_id: { type: "STRING", description: "ID of 'The Start Up' workspace from list_workspaces" },
      },
      required: ["board_name", "workspace_id"],
    },
  },
  {
    name: "initialize_board_columns",
    description: "After creating the board and its groups, call this ONCE to add a Status column, a Due Date column, and a 'Completed Tasks' group at the bottom. Returns the column IDs you MUST use for every subsequent create_task and complete_task call.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_id: { type: "STRING" },
      },
      required: ["board_id"],
    },
  },
  {
    name: "create_group",
    description: "Create a group (section) inside a Monday.com board.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_id:   { type: "STRING" },
        group_name: { type: "STRING", description: "e.g. 'MVP Tasks' or 'Requirements'" },
      },
      required: ["board_id", "group_name"],
    },
  },
  {
    name: "create_task",
    description: "Create a task item in a group with a due date and starting status. Always pass status_col_id, date_col_id (from initialize_board_columns), and a due_date in YYYY-MM-DD format based on which phase the task belongs to.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_id:      { type: "STRING" },
        group_id:      { type: "STRING" },
        task_name:     { type: "STRING", description: "Concise, actionable task name" },
        priority:      { type: "STRING", description: "P0 — MVP, P1 — Post-MVP, or P2 — Nice to Have" },
        category:      { type: "STRING", description: "Frontend, Backend, Integration, Infrastructure, Design, Testing, or Discovery" },
        due_date:      { type: "STRING", description: "Due date in YYYY-MM-DD format. Requirements: start+3 days. MVP Phase 1: spread across days 1-30. Post-MVP: days 31-60. Planning: today." },
        status_col_id: { type: "STRING", description: "Status column ID from initialize_board_columns" },
        date_col_id:   { type: "STRING", description: "Date column ID from initialize_board_columns" },
        notes:         { type: "STRING", description: "Optional acceptance criteria" },
      },
      required: ["board_id", "group_id", "task_name", "priority", "category", "due_date", "status_col_id", "date_col_id"],
    },
  },
  {
    name: "complete_task",
    description: "Mark a task as Done and move it to the Completed Tasks group. Use this for Planning group tasks after creating them, and for any task you confirm is already finished.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_id:            { type: "STRING" },
        item_id:             { type: "STRING" },
        completed_group_id:  { type: "STRING", description: "Completed Tasks group ID from initialize_board_columns" },
        status_col_id:       { type: "STRING", description: "Status column ID from initialize_board_columns" },
      },
      required: ["board_id", "item_id", "completed_group_id", "status_col_id"],
    },
  },
  {
    name: "create_budget_board",
    description: "Create a Budget & Subscriptions board in the same workspace as the build plan. Creates the board, adds Monthly Cost, Annual Cost, Category, and Notes columns, and creates groups for Platform, Integrations, and monday.com. Returns all IDs needed for add_budget_item calls.",
    parameters: {
      type: "OBJECT",
      properties: {
        client_name:  { type: "STRING", description: "Client name for the board title, e.g. 'Acme Corp'" },
        workspace_id: { type: "STRING", description: "Same workspace ID used for the build plan board" },
      },
      required: ["client_name", "workspace_id"],
    },
  },
  {
    name: "add_budget_item",
    description: "Add a tool or subscription row to the Budget board. Include any paid tool the client will need to maintain after the build — Monday.com subscription, hosting, domain, API fees, SaaS tools, etc.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_id:       { type: "STRING" },
        group_id:       { type: "STRING", description: "Group ID from create_budget_board result" },
        tool_name:      { type: "STRING", description: "Name of the tool or service" },
        monthly_cost:   { type: "STRING", description: "Estimated monthly cost as a number string, e.g. '29' or '0' if annual only" },
        annual_cost:    { type: "STRING", description: "Estimated annual cost as a number string, e.g. '348'. If monthly * 12 is a fair estimate, use that." },
        category:       { type: "STRING", description: "e.g. 'Platform', 'Integration', 'CRM', 'Payments', 'Communication', 'AI', 'Infrastructure'" },
        notes:          { type: "STRING", description: "Pricing plan, URL, or context — e.g. 'Monday.com Standard: $12/seat/month, min 3 seats'" },
        monthly_col_id: { type: "STRING", description: "monthly_col_id from create_budget_board" },
        annual_col_id:  { type: "STRING", description: "annual_col_id from create_budget_board" },
        notes_col_id:   { type: "STRING", description: "notes_col_id from create_budget_board" },
        category_col_id:{ type: "STRING", description: "category_col_id from create_budget_board" },
      },
      required: ["board_id", "group_id", "tool_name", "monthly_cost", "annual_cost", "monthly_col_id", "annual_col_id", "notes_col_id", "category_col_id"],
    },
  },
  {
    name: "mark_tracker_item_done",
    description: "Find an item on the Build Tracker board by partial name and mark it Done.",
    parameters: {
      type: "OBJECT",
      properties: { item_name_contains: { type: "STRING" } },
      required: ["item_name_contains"],
    },
  },
  {
    name: "post_plan_summary",
    description: "Post the MVP plan summary as an update on the Scope Lock item.",
    parameters: {
      type: "OBJECT",
      properties: {
        scope_lock_item_id: { type: "STRING" },
        summary: { type: "STRING", description: "Markdown summary of the full plan" },
      },
      required: ["scope_lock_item_id", "summary"],
    },
  },
  {
    name: "advance_scope_stage",
    description: "Advance the Scope Lock stage in Monday.com (e.g. 'Planning' or 'Build Active').",
    parameters: {
      type: "OBJECT",
      properties: {
        scope_lock_item_id: { type: "STRING" },
        stage: { type: "STRING" },
      },
      required: ["scope_lock_item_id", "stage"],
    },
  },
];

// ── Tool executor ─────────────────────────────────────────────────────────────

async function executeTool(name: string, args: Record<string, string>): Promise<unknown> {
  switch (name) {
    case "read_scope_lock":
      return readScopeLock(args.item_id);

    case "list_workspaces":
      return listWorkspaces();

    case "list_boards":
      return listWorkspaceBoards();

    case "create_project_board":
      return { board_id: await createBoard(args.board_name, args.workspace_id) };

    case "initialize_board_columns": {
      const [statusColId, dateColId, completedGroupId] = await Promise.all([
        addBoardColumn(args.board_id, "Status",   "status"),
        addBoardColumn(args.board_id, "Due Date", "date"),
        createGroup(args.board_id, "Completed Tasks"),
      ]);
      return { status_col_id: statusColId, date_col_id: dateColId, completed_group_id: completedGroupId };
    }

    case "create_group":
      return { group_id: await createGroup(args.board_id, args.group_name) };

    case "create_task": {
      const colVals: Record<string, unknown> = {};
      if (args.date_col_id && args.due_date) colVals[args.date_col_id]   = { date: args.due_date };
      if (args.status_col_id)                colVals[args.status_col_id] = { label: "Working on it" };
      const id = await createItemInGroup(args.board_id, args.group_id, args.task_name, colVals);
      return { item_id: id, task: args.task_name, priority: args.priority, category: args.category, due_date: args.due_date };
    }

    case "complete_task": {
      // Set status to Done then move to Completed Tasks group
      if (args.status_col_id) {
        await setItemStatus(args.board_id, args.item_id, args.status_col_id, "Done");
      }
      await moveItemToGroup(args.item_id, args.completed_group_id);
      return { done: true, moved_to: args.completed_group_id };
    }

    case "create_budget_board": {
      const budgetBoardId = await createBoard(`${args.client_name} — Budget & Subscriptions`, args.workspace_id);
      const [monthlyCid, annualCid, notesCid, categoryCid] = await Promise.all([
        addBoardColumn(budgetBoardId, "Monthly Cost (USD)", "numbers"),
        addBoardColumn(budgetBoardId, "Annual Cost (USD)",  "numbers"),
        addBoardColumn(budgetBoardId, "Notes / Plan",       "text"),
        addBoardColumn(budgetBoardId, "Category",           "status"),
      ]);
      const [infraGroupId, intGroupId, mondayGroupId, otherGroupId] = await Promise.all([
        createGroup(budgetBoardId, "Platform & Infrastructure"),
        createGroup(budgetBoardId, "Integrations & APIs"),
        createGroup(budgetBoardId, "monday.com Subscription"),
        createGroup(budgetBoardId, "Other Subscriptions"),
      ]);
      return {
        board_id: budgetBoardId,
        monthly_col_id:  monthlyCid,
        annual_col_id:   annualCid,
        notes_col_id:    notesCid,
        category_col_id: categoryCid,
        groups: {
          platform:    infraGroupId,
          integrations: intGroupId,
          monday:      mondayGroupId,
          other:       otherGroupId,
        },
      };
    }

    case "add_budget_item": {
      const colVals: Record<string, unknown> = {};
      if (args.monthly_col_id  && args.monthly_cost)  colVals[args.monthly_col_id]  = args.monthly_cost;
      if (args.annual_col_id   && args.annual_cost)   colVals[args.annual_col_id]   = args.annual_cost;
      if (args.notes_col_id    && args.notes)         colVals[args.notes_col_id]    = args.notes;
      if (args.category_col_id && args.category)      colVals[args.category_col_id] = { label: args.category };
      const id = await createItemInGroup(args.board_id, args.group_id, args.tool_name, colVals);
      return { item_id: id, tool: args.tool_name, monthly: args.monthly_cost, annual: args.annual_cost };
    }

    case "mark_tracker_item_done": {
      const matches = await findItemsByName(BUILD_TRACKER_BOARD_ID, args.item_name_contains);
      for (const m of matches) {
        await setSimpleValue(BUILD_TRACKER_BOARD_ID, m.id, "color_mm4mbccy", "Done").catch(() => null);
        await setSimpleValue(BUILD_TRACKER_BOARD_ID, m.id, "color_mm4mmf9n", "Done").catch(() => null);
      }
      return { matched: matches.length };
    }

    case "post_plan_summary":
      await postUpdate(args.scope_lock_item_id, args.summary);
      return { posted: true };

    case "advance_scope_stage":
      await advanceScopeStage(
        process.env.MONDAY_SCOPE_BOARD_ID || "18419179036",
        args.scope_lock_item_id,
        args.stage,
      );
      return { stage: args.stage };

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── Gemini REST call ──────────────────────────────────────────────────────────

type GeminiPart =
  | { text: string }
  | { functionCall: { name: string; args: Record<string, string> } }
  | { functionResponse: { name: string; response: unknown } };

type GeminiContent = { role: string; parts: GeminiPart[] };

async function callGemini(contents: GeminiContent[], systemText: string): Promise<GeminiContent> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: systemText }] },
    contents,
    tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
    generationConfig: { temperature: 0.3 },
  });

  const RETRYABLE = new Set([429, 500, 502, 503, 504]);
  let delay = 8000;

  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch(GEMINI_URL(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (RETRYABLE.has(res.status)) {
      const errText = await res.text();
      if (attempt === 7) throw new Error(`Gemini API error ${res.status} after retries: ${errText}`);
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(delay * 2, 60_000);
      continue;
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Gemini API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const candidate = data.candidates?.[0];
    if (!candidate) throw new Error("No candidates in Gemini response");
    return candidate.content as GeminiContent;
  }

  throw new Error("Gemini API unavailable after 8 attempts");
}

// ── Date helpers ──────────────────────────────────────────────────────────────

function addDays(base: Date, days: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ── Agent loop ────────────────────────────────────────────────────────────────

export type AgentResult = {
  boardId?: string;
  tasksCreated: number;
  summary: string;
  log: string[];
};

export async function runMvpAgent(scopeLockItemId: string): Promise<AgentResult> {
  if (!process.env.GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY is not set");

  const today = new Date();
  const startDate      = addDays(today, 0);   // today
  const reqDeadline    = addDays(today, 3);   // requirements locked by day 3
  const mvpMidpoint    = addDays(today, 15);  // mid-sprint checkpoint
  const mvpDeadline    = addDays(today, 30);  // end of sprint
  const postMvpMid     = addDays(today, 45);  // post-MVP midpoint
  const postMvpDeadline = addDays(today, 60); // post-MVP deadline

  const SYSTEM = `You are The Startup's project planning agent. You build structured MVP plans for client builds in Monday.com.

Today's date is ${startDate}. Use this to calculate all due dates.

PHASE DUE DATE RULES (always assign a due date to every task):
- Requirements group tasks: due ${reqDeadline} (day 3)
- Planning group tasks: due ${startDate} (today — mark them Done after creating)
- MVP Phase 1 tasks: spread due dates between ${startDate} and ${mvpDeadline}
  - Early tasks (setup, architecture, data model): ${addDays(today, 5)} – ${addDays(today, 8)}
  - Core feature tasks: ${addDays(today, 9)} – ${addDays(today, 20)}
  - Integration and final tasks: ${addDays(today, 21)} – ${addDays(today, 28)}
  - Testing and deployment: ${addDays(today, 29)} – ${mvpDeadline}
- Post-MVP Phase 2 tasks: spread due dates between ${addDays(today, 31)} and ${postMvpDeadline}

REQUIRED SEQUENCE — follow this EXACTLY:
1. Call read_scope_lock to get the full scope data
2. Call list_workspaces to find "The Start Up" workspace ID
3. Call create_project_board with that workspace_id — name it "[ClientName] — Build Plan"
4. Create groups IN THIS ORDER (do not create Completed Tasks manually — it is created by initialize_board_columns):
   a. "Requirements"
   b. "MVP — Phase 1 (Days 1–30)"
   c. "Post-MVP — Phase 2"
   d. "Planning"
5. Call initialize_board_columns(board_id) — this creates the Status column, Due Date column, AND the Completed Tasks group at the bottom. SAVE all three IDs returned — you must pass them to every create_task and complete_task call.
6. Populate groups with specific, actionable tasks via create_task. ALWAYS pass:
   - status_col_id and date_col_id (from step 5)
   - due_date in YYYY-MM-DD format based on the phase rules above
   Bad task name: "Build frontend". Good: "Build lead capture form with email validation and webhook trigger".
   Assign correct priority (P0/P1/P2) and category to every task.
7. For every task you create in the "Planning" group: immediately call complete_task to mark it Done and move it to Completed Tasks.
8. Call create_budget_board(client_name, workspace_id) — creates a "[ClientName] — Budget & Subscriptions" board in the same workspace. SAVE all returned IDs.
9. Call add_budget_item for EVERY tool, platform, or API the client will need to pay for ongoing after the build. Be thorough:
   - If Monday.com is used as the CRM/platform: add it to the "monday.com Subscription" group. Standard plan is ~$12/seat/month (3 seats min = $36/month, $432/year). Adjust if Pro features are needed.
   - Add hosting (e.g. Vercel Pro $20/month = $240/year, or similar based on stack)
   - Add domain registration (~$15–$20/year, $0/month)
   - Add any payment processor (Stripe: 2.9% + $0.30/transaction — note as "per-transaction fee" in notes, $0 monthly)
   - Add any third-party API subscriptions from the integrations list (e.g. OpenAI, Twilio, SendGrid, HubSpot, etc.)
   - Add any SaaS tools mentioned in the scope
   - The client is responsible for ALL of these costs — they are NOT included in The Startup's fee
10. Call mark_tracker_item_done for any matched Build Tracker items.
11. Call post_plan_summary with a markdown summary: client goal, requirements, MVP scope, post-MVP backlog, timeline overview, and a subscription cost summary from the budget board.
12. Call advance_scope_stage to move the scope lock to "Planning".

Cover all layers: auth, data model, API routes, UI pages, integrations, deployment, testing, documentation.`;

  const log: string[] = [];
  let tasksCreated = 0;
  let boardId: string | undefined;

  const contents: GeminiContent[] = [
    {
      role: "user",
      parts: [{ text: `Process scope lock item ID: ${scopeLockItemId}. Build the full MVP plan in Monday.com. Today is ${startDate}.` }],
    },
  ];

  for (let turn = 0; turn < 60; turn++) {
    const modelContent = await callGemini(contents, SYSTEM);
    contents.push(modelContent);

    const functionCalls = modelContent.parts.filter(
      (p): p is { functionCall: { name: string; args: Record<string, string> } } => "functionCall" in p,
    );

    for (const p of modelContent.parts) {
      if ("text" in p && p.text.trim()) log.push(p.text.trim());
    }

    if (functionCalls.length === 0) break;

    const responseParts: GeminiPart[] = [];
    for (const { functionCall } of functionCalls) {
      log.push(`→ ${functionCall.name}(${JSON.stringify(functionCall.args).slice(0, 140)})`);
      try {
        const result = await executeTool(functionCall.name, functionCall.args);
        if (functionCall.name === "create_project_board" && result && typeof result === "object")
          boardId = (result as { board_id: string }).board_id;
        if (functionCall.name === "create_task") tasksCreated++;
        log.push(`  ✓ ${JSON.stringify(result).slice(0, 200)}`);
        const safeResult = Array.isArray(result) ? { items: result } : (result ?? {});
        responseParts.push({ functionResponse: { name: functionCall.name, response: safeResult } });
      } catch (err) {
        log.push(`  ✗ ${String(err)}`);
        responseParts.push({ functionResponse: { name: functionCall.name, response: { error: String(err) } } });
      }
    }

    contents.push({ role: "user", parts: responseParts });
  }

  const summary = log.filter(l => !l.startsWith("→") && !l.startsWith("  ")).join("\n") || "MVP plan created.";
  return { boardId, tasksCreated, summary, log };
}
