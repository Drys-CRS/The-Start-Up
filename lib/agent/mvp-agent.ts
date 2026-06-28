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
  createBoardLink,
  createItemInGroup,
  moveItemToGroup,
  setSimpleValue,
  setItemStatus,
  setLongText,
  findItemsByName,
  postUpdate,
  advanceScopeStage,
  addDashboardWidget,
  createStatusMoveAutomation,
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
    description: "After creating the board and its groups, call this ONCE to add a Status column, a Due Date column, a Build Notes column (long text), and a 'Completed Tasks' group at the bottom. Returns the column IDs you MUST use for every subsequent create_task, add_task_note, and complete_task call.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_id: { type: "STRING" },
      },
      required: ["board_id"],
    },
  },
  {
    name: "add_task_note",
    description: "Add or update the Build Notes field on any task — use this to capture design decisions, technical rationale, acceptance criteria, edge cases, completion details, or anything useful for handover documentation. Call it when creating tasks AND again when marking tasks complete.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_id:     { type: "STRING" },
        item_id:      { type: "STRING", description: "Item ID returned by create_task" },
        notes_col_id: { type: "STRING", description: "notes_col_id from initialize_board_columns" },
        note:         { type: "STRING", description: "The note to write — be specific. Include: what was built, key decisions made, any caveats or follow-up items." },
      },
      required: ["board_id", "item_id", "notes_col_id", "note"],
    },
  },
  {
    name: "create_group",
    description: "Create a group (section) inside a Monday.com board. ALWAYS pass relative_to = the ID returned by the previous create_group call so groups appear in the correct top-to-bottom order. Without it, each new group is inserted at the top and the order will be reversed.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_id:    { type: "STRING" },
        group_name:  { type: "STRING", description: "e.g. 'MVP — Phase 1 (Days 1–30)'" },
        relative_to: { type: "STRING", description: "Group ID of the group that should appear ABOVE this one. Pass the ID returned by the previous create_group call. Omit only for the very first group." },
      },
      required: ["board_id", "group_name"],
    },
  },
  {
    name: "create_board_link",
    description: "Create a bidirectional board_relation link between two boards — adds a connect column on BOTH boards pointing to each other. Use this instead of manually creating two separate board_relation columns.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_a_id:  { type: "STRING", description: "First board ID" },
        title_a:     { type: "STRING", description: "Column title on board A, e.g. 'Budget Items'" },
        board_b_id:  { type: "STRING", description: "Second board ID" },
        title_b:     { type: "STRING", description: "Column title on board B, e.g. 'Build Plan'" },
      },
      required: ["board_a_id", "title_a", "board_b_id", "title_b"],
    },
  },
  {
    name: "setup_dashboard_widgets",
    description: "Add a standard set of useful widgets to a dashboard after creating it — summary (task counts), chart (by priority), table (all tasks), and battery (completion %). Call this immediately after creating any dashboard.",
    parameters: {
      type: "OBJECT",
      properties: {
        dashboard_id: { type: "STRING", description: "Dashboard ID returned by create_project_board or create_budget_board" },
      },
      required: ["dashboard_id"],
    },
  },
  {
    name: "create_task",
    description: "Create a task item in a group with a due date, starting status, and build notes. Always pass status_col_id, date_col_id, notes_col_id (from initialize_board_columns), and a due_date in YYYY-MM-DD format based on which phase the task belongs to.",
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
        notes_col_id:  { type: "STRING", description: "notes_col_id from initialize_board_columns" },
        notes:         { type: "STRING", description: "Build notes for this task: what needs to be built, acceptance criteria, key technical decisions, dependencies, or anything useful for handover documentation." },
      },
      required: ["board_id", "group_id", "task_name", "priority", "category", "due_date", "status_col_id", "date_col_id", "notes_col_id"],
    },
  },
  {
    name: "complete_task",
    description: "Mark a task as Done, add a completion note to Build Notes, then move it to the Completed Tasks group. Use this for Planning group tasks after creating them, and for any task that is confirmed finished.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_id:            { type: "STRING" },
        item_id:             { type: "STRING" },
        completed_group_id:  { type: "STRING", description: "Completed Tasks group ID from initialize_board_columns" },
        status_col_id:       { type: "STRING", description: "Status column ID from initialize_board_columns" },
        notes_col_id:        { type: "STRING", description: "notes_col_id from initialize_board_columns" },
        completion_note:     { type: "STRING", description: "What was done / how it was completed — goes into Build Notes for handover context." },
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
    name: "post_claude_code_prompt",
    description: "Generate and post a ready-to-use Claude Code prompt as a Monday.com update on the scope lock item. This is the LAST step before advance_scope_stage. The prompt must be detailed enough that a developer can paste it into Claude Code and immediately start building the full application.",
    parameters: {
      type: "OBJECT",
      properties: {
        scope_lock_item_id: { type: "STRING" },
        prompt: {
          type: "STRING",
          description: `A complete Claude Code prompt covering:
1. Project name and one-paragraph description
2. Tech stack (framework, language, DB, hosting, auth)
3. Exact directory/file structure to scaffold
4. Environment variables required (name + purpose) — include AI API keys
5. Data models / schema (tables, fields, types)
6. API routes (method, path, what it does)
7. UI pages/components (route, purpose, key interactions)
8. Third-party integrations (how to connect each)
9. AI agents architecture — for each agent from the AI strategy:
   - File path where it lives (e.g. lib/agents/lead-enrichment.ts)
   - Trigger: what event fires it (webhook, cron, Monday.com automation, user action)
   - Step-by-step logic with real function names and API calls
   - Which AI model is called, with the exact system prompt template and expected output schema
   - How results are written back to Monday.com or the database (exact column IDs / API calls)
   - Error handling and retry strategy
   - Rate limiting and cost controls (max tokens, daily spend cap)
10. AI workflow logic — for each intelligent workflow, the exact conditional decision tree as pseudo-code
11. Ordered build steps — what to build first through last (core system before AI layer)
12. Definition of done for the MVP (core system) and AI layer separately

Write it in second-person imperative ("Build...", "Create...", "Set up...").
Be specific — include real field names, column types, endpoint paths, model IDs (claude-sonnet-4-6 for Claude), and example prompt templates.
No vague placeholders. End with: "Start by scaffolding the project and environment, build the core system first, then layer in the AI agents and workflows in order."`,
        },
      },
      required: ["scope_lock_item_id", "prompt"],
    },
  },
  {
    name: "post_ai_strategy",
    description: "Generate and post an AI growth strategy document as an update on the scope lock item. Call this BEFORE post_plan_summary (step 12 in the sequence). Analyse the client's business, goals, and bottleneck from the scope lock to produce a specific, actionable AI roadmap — not generic advice.",
    parameters: {
      type: "OBJECT",
      properties: {
        scope_lock_item_id: { type: "STRING" },
        strategy: {
          type: "STRING",
          description: `A detailed AI growth strategy tailored to THIS specific client. Structure it as:
## 🤖 AI Opportunity Summary
2–3 sentences on where AI creates the most value for this specific business and bottleneck.

## ⚡ MVP AI Features (Days 1–30)
AI features to include in the 30-day build — keep these practical and high-ROI. Examples: lead scoring formula column, auto-email draft trigger, smart routing rule. Be specific: name the field, the trigger, the output.

## 🤖 AI Agents to Build
For each agent: (1) Name and one-sentence purpose, (2) Trigger — what fires it, (3) Steps — what it does, (4) AI call — which model and what prompt/task, (5) Output — what it writes back to the system. Example: "Lead Enrichment Agent: Trigger = new Monday.com lead item created. Steps = call Clearbit Reveal API with lead email → extract company size, industry, tech stack → update Monday.com item fields. No AI model call needed — pure enrichment API. Output: populated Company Size, Industry, Stack columns on the item."

## 🔀 Intelligent Workflows
Decision tree workflows with AI at the decision points. Show the logic in plain text: "IF [condition] THEN [AI action] ELSE [other action]". Make them specific to this client's sales/ops process.

## 📊 Predictive Intelligence
1–2 specific forecasting or insight features: what data they analyse, what they predict, how the result is surfaced (Monday.com column, dashboard widget, weekly email digest, etc.).

## 🛠 AI Stack Recommendation
Specific models and APIs for this build:
- Text generation / drafting / reasoning: Claude claude-sonnet-4-6 (Anthropic)
- Any other models if needed and why
- Third-party enrichment/data APIs if relevant
- Cost estimate per month at expected usage volume

## 🗂 Monday.com AI Configuration
Specific monday.com AI features to enable: which boards, which columns, which AI functions (summarize, auto-fill, formula AI logic).

## 📅 Phase 2 AI Backlog
3–5 higher-complexity AI features for after the MVP — ordered by business impact.

## 📈 Expected Business Impact
Quantified projections where possible. Examples: "Lead response time: 2hr → 5min with follow-up agent", "Qualified pipeline visibility: +40% with scoring", "Manual data entry: eliminated for 80% of new leads with enrichment agent". Tie each impact to a specific feature.

Write for a business owner — clear outcomes, no jargon.`,
        },
      },
      required: ["scope_lock_item_id", "strategy"],
    },
  },
  {
    name: "post_monthly_estimate",
    description: "After all add_budget_item calls are done, call this ONCE to sum the monthly tool costs and post a monthly plan estimate to the scope lock. This generates the '?mtools=NNN' URL param the admin needs to add to the sign link so the client sees their monthly commitment before paying the deposit.",
    parameters: {
      type: "OBJECT",
      properties: {
        scope_lock_item_id: { type: "STRING" },
        tools_monthly_usd:  { type: "STRING", description: "Sum of all monthly tool costs in USD (as a number string, e.g. '127')" },
        breakdown:          { type: "STRING", description: "Bullet list of the main tool costs, e.g. '• Monday.com: $36/mo\\n• Vercel Pro: $20/mo\\n• SendGrid: $15/mo'" },
      },
      required: ["scope_lock_item_id", "tools_monthly_usd", "breakdown"],
    },
  },
  {
    name: "setup_board_automations",
    description: "Wire up standard Monday.com automations on a board. Always call this immediately after initialize_board_columns on EVERY board the agent creates (build plan board and budget board). Sets up: (1) When Status → Done, automatically move item to the Completed Tasks group. This means any team member who manually marks a task Done on the board will have it move automatically — not just items the agent completes.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_id:           { type: "STRING" },
        status_col_id:      { type: "STRING", description: "Status column ID from initialize_board_columns" },
        completed_group_id: { type: "STRING", description: "Completed Tasks group ID from initialize_board_columns" },
      },
      required: ["board_id", "status_col_id", "completed_group_id"],
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
      const [statusColId, dateColId, notesColId] = await Promise.all([
        addBoardColumn(args.board_id, "Status",      "status"),
        addBoardColumn(args.board_id, "Due Date",    "date"),
        addBoardColumn(args.board_id, "Build Notes", "long_text"),
      ]);
      const completedGroupId = await createGroup(args.board_id, "Completed Tasks");
      return { status_col_id: statusColId, date_col_id: dateColId, notes_col_id: notesColId, completed_group_id: completedGroupId };
    }

    case "create_group":
      return { group_id: await createGroup(args.board_id, args.group_name, args.relative_to) };

    case "create_board_link":
      return createBoardLink(args.board_a_id, args.title_a, args.board_b_id, args.title_b);

    case "setup_dashboard_widgets": {
      const kinds = ["summary", "chart", "table", "battery"];
      const ids: string[] = [];
      for (const kind of kinds) {
        const id = await addDashboardWidget(args.dashboard_id, kind).catch(() => "skipped");
        ids.push(id);
      }
      return { widgets_added: ids.filter(i => i !== "skipped").length, kinds };
    }

    case "create_task": {
      const colVals: Record<string, unknown> = {};
      if (args.date_col_id   && args.due_date) colVals[args.date_col_id]   = { date: args.due_date };
      if (args.status_col_id)                  colVals[args.status_col_id] = { label: "Working on it" };
      if (args.notes_col_id  && args.notes)    colVals[args.notes_col_id]  = { text: args.notes };
      const id = await createItemInGroup(args.board_id, args.group_id, args.task_name, colVals);
      return { item_id: id, task: args.task_name, priority: args.priority, category: args.category, due_date: args.due_date };
    }

    case "add_task_note": {
      await setLongText(args.board_id, args.item_id, args.notes_col_id, args.note);
      return { updated: true, item_id: args.item_id };
    }

    case "complete_task": {
      if (args.notes_col_id && args.completion_note) {
        await setLongText(args.board_id, args.item_id, args.notes_col_id, args.completion_note);
      }
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
        addBoardColumn(budgetBoardId, "Category",           "text"),
      ]);
      const infraGroupId  = await createGroup(budgetBoardId, "Platform & Infrastructure");
      const intGroupId    = await createGroup(budgetBoardId, "Integrations & APIs",       infraGroupId);
      const mondayGroupId = await createGroup(budgetBoardId, "monday.com Subscription",   intGroupId);
      const otherGroupId  = await createGroup(budgetBoardId, "Other Subscriptions",       mondayGroupId);
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
      if (args.category_col_id && args.category)      colVals[args.category_col_id] = args.category;
      const id = await createItemInGroup(args.board_id, args.group_id, args.tool_name, colVals);
      return { item_id: id, tool: args.tool_name, monthly: args.monthly_cost, annual: args.annual_cost };
    }

    case "post_monthly_estimate": {
      const rawToolsUsd  = parseInt(args.tools_monthly_usd, 10) || 0;
      // Apply 20% margin — client sees final price only, not the calculation
      const toolsUsd    = Math.ceil(rawToolsUsd * 1.2);
      const supportUsd  = 150;
      const totalUsd    = toolsUsd + supportUsd;
      const msg =
        `## 📅 Monthly Recurring Plan\n\n` +
        `| Line Item | Monthly (USD) |\n` +
        `|-----------|---------------|\n` +
        `| Tools & Subscriptions | $${toolsUsd}/mo |\n` +
        `| Ongoing Support | $${supportUsd}/mo |\n` +
        `| **Total** | **$${totalUsd}/mo** |\n\n` +
        `### Tool Breakdown (pre-margin)\n${args.breakdown}\n\n` +
        `---\n` +
        `**To surface this on the client's sign page**, append \`&mtools=${toolsUsd}\` to the sign link:\n` +
        `\`/sign?...&mtools=${toolsUsd}\`\n\n` +
        `The client will see an opt-in toggle showing $${toolsUsd}/mo tools + $${supportUsd}/mo support = $${totalUsd}/mo total.`;
      await postUpdate(args.scope_lock_item_id, msg);
      return { tools_monthly_usd: toolsUsd, support_monthly_usd: supportUsd, total_monthly_usd: totalUsd };
    }

    case "setup_board_automations": {
      const result = await createStatusMoveAutomation(
        args.board_id,
        args.status_col_id,
        args.completed_group_id,
      );
      return result;
    }

    case "mark_tracker_item_done": {
      const matches = await findItemsByName(BUILD_TRACKER_BOARD_ID, args.item_name_contains);
      for (const m of matches) {
        await setSimpleValue(BUILD_TRACKER_BOARD_ID, m.id, "color_mm4mbccy", "Done").catch(() => null);
        await setSimpleValue(BUILD_TRACKER_BOARD_ID, m.id, "color_mm4mmf9n", "Done").catch(() => null);
      }
      return { matched: matches.length };
    }

    case "post_ai_strategy":
      await postUpdate(args.scope_lock_item_id, args.strategy);
      return { posted: true };

    case "post_claude_code_prompt":
      await postUpdate(args.scope_lock_item_id, `## 🤖 Claude Code Prompt — Copy & Paste to Start Building\n\n${args.prompt}`);
      return { posted: true };

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
  const startDate       = addDays(today, 0);   // today
  const reqDeadline     = addDays(today, 3);   // requirements locked by day 3
  const mvpMidpoint     = addDays(today, 15);  // mid-sprint checkpoint
  const mvpDeadline     = addDays(today, 30);  // end of sprint
  const postMvpMid      = addDays(today, 45);  // post-MVP midpoint
  const postMvpDeadline = addDays(today, 60);  // post-MVP deadline
  const aiLayerStart    = addDays(today, 61);  // AI layer start
  const aiLayerDeadline = addDays(today, 90);  // AI layer deadline

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
- AI & Growth Agents tasks: spread due dates between ${aiLayerStart} and ${aiLayerDeadline}

REQUIRED SEQUENCE — follow this EXACTLY:
1. Call read_scope_lock to get the full scope data
2. Call list_workspaces to find "The Start Up" workspace ID
3. Call create_project_board with that workspace_id — name it "[ClientName] — Build Plan"
4. Create groups IN THIS ORDER — CRITICAL: pass relative_to = the group_id returned by the PREVIOUS create_group call so they appear top-to-bottom in the correct order. Without relative_to, Monday.com inserts each group at the top, reversing the order.
   a. "Requirements" (no relative_to — first group)
   b. "MVP — Phase 1 (Days 1–30)" (relative_to = Requirements group_id)
   c. "Post-MVP — Phase 2" (relative_to = MVP Phase 1 group_id)
   d. "AI & Growth Agents" (relative_to = Post-MVP Phase 2 group_id)
   e. "Planning" (relative_to = AI & Growth Agents group_id)
5. Call initialize_board_columns(board_id) — this creates the Status column, Due Date column, AND the Completed Tasks group at the bottom. SAVE all three IDs returned — you must pass them to every create_task and complete_task call.
5a. Immediately call setup_board_automations(board_id, status_col_id, completed_group_id) — this wires up the "Status → Done → move to Completed Tasks" automation so any team member who manually marks a task Done on the board will have it move automatically. Do NOT skip this step.
6. Populate groups with specific, actionable tasks via create_task. ALWAYS pass:
   - status_col_id, date_col_id, AND notes_col_id (all from step 5)
   - due_date in YYYY-MM-DD format based on the phase rules above
   - notes: a meaningful build note for EVERY task — capture what needs to be built, acceptance criteria, key technical decisions, dependencies, and anything useful for handover documentation. Bad note: "Build the UI". Good note: "Build lead capture form at /leads/new — fields: name, email, company, message. On submit POST to /api/leads, create Monday.com item in Sales Pipeline board, send confirmation email via SendGrid. Validation: all fields required, email format check."
   Bad task name: "Build frontend". Good: "Build lead capture form with email validation and webhook trigger".
   Assign correct priority (P0/P1/P2) and category (Frontend, Backend, Integration, Infrastructure, Design, Testing, Discovery, or AI / Agent) to every task.

   For the "AI & Growth Agents" group, create 8–12 tasks specific to THIS client's business and bottleneck. Cover:
   - AI AGENTS: Autonomous agents that handle repetitive work — tailor to what the client actually does. CRM examples: "Lead Enrichment Agent — on new lead creation, call Clearbit/Hunter API to auto-fill industry, company size, and tech stack; update Monday.com item"; "Follow-Up Drafting Agent — when a deal changes stage, call Claude API to generate a personalised next-step email draft and post it as a Monday.com update"; "Lead Scoring Agent — on new submission, compute a 0–100 score using weighted criteria (job title, company size, intent signals) and auto-route P0 leads to the senior rep". Invent equivalents for non-CRM scopes (booking system: availability agent; service business: proposal agent; e-commerce: cart recovery agent).
   - INTELLIGENT WORKFLOWS: Conditional automation chains with AI decision points — e.g. "If lead score > 70 → assign senior rep + draft intro email; if score < 30 → enrol in nurture sequence; if no reply in 3 days → AI generates follow-up nudge and triggers reminder".
   - PREDICTIVE INTELLIGENCE: Forecasting and insight tasks — deal velocity tracking, churn risk scoring, conversion probability, demand forecasting, or anomaly alerts. Pick the 1–2 most relevant for this business.
   - MONDAY.COM AI: Tasks to enable and configure Monday.com's native AI — "Enable AI Summarize on all board updates so team gets instant digests"; "Set up AI formula columns for auto-tagging and sentiment detection"; "Configure AI-generated status suggestions based on update content".
   - GROWTH FEATURES: 2–3 AI capabilities that directly accelerate this client's revenue or efficiency goal — derive these specifically from their bottleneck and stated goal in the scope lock. Examples: automated proposal generation, competitive intelligence monitoring, smart scheduling, personalised onboarding flows.
   - AI STACK INTEGRATION: "Set up Claude API (claude-sonnet-4-6) for all text generation, reasoning, and drafting tasks"; "Configure AI rate limiting, error handling, and cost controls"; "Add AI usage tracking to budget board".
   Assign category "AI / Agent" and priority P1 (core AI the business needs to function well) or P2 (advanced enhancements) to each task.

7. For every task you create in the "Planning" group: immediately call complete_task with a completion_note explaining what was planned/decided, then move it to Completed Tasks. For any other task you can confirm is done during the agent run, call complete_task the same way.
   Use add_task_note any time you need to append additional context to a task after it was created.
8. Call create_budget_board(client_name, workspace_id) — creates a "[ClientName] — Budget & Subscriptions" board in the same workspace. SAVE all returned IDs. After creating it, call create_board_link to connect the build plan board and budget board bidirectionally.
9. Call add_budget_item for EVERY tool, platform, or API the client will need to pay for ongoing after the build. Be thorough:
   - If Monday.com is used as the CRM/platform: add it to the "monday.com Subscription" group. Standard plan is ~$12/seat/month (3 seats min = $36/month, $432/year). Adjust if Pro features are needed.
   - Add hosting (e.g. Vercel Pro $20/month = $240/year, or similar based on stack)
   - Add domain registration (~$15–$20/year, $0/month)
   - Add any payment processor (Stripe: 2.9% + $0.30/transaction — note as "per-transaction fee" in notes, $0 monthly)
   - Add any third-party API subscriptions from the integrations list (e.g. OpenAI, Twilio, SendGrid, HubSpot, etc.)
   - Add any SaaS tools mentioned in the scope
   - The client is responsible for ALL of these costs — they are NOT included in The Startup's fee
10. Call post_monthly_estimate — sum ALL monthly costs from the budget items you added and post to the scope lock. This generates the sign-link snippet the admin needs so the client sees their monthly commitment before paying the deposit.
11. Call mark_tracker_item_done for any matched Build Tracker items.
12. Call post_ai_strategy — analyse the scope lock and generate a specific AI growth strategy for THIS business. Cover: which AI agents to build and exactly what they do, intelligent workflow designs with decision trees, predictive intelligence opportunities, recommended AI stack (specific models and APIs), Monday.com AI configuration, phase 2 AI backlog, and quantified expected business impact. Be specific to this client's goals and bottleneck — no generic advice.
13. Call post_plan_summary with a markdown summary: client goal, requirements, MVP scope, post-MVP backlog, AI & growth agent roadmap, timeline overview, and a subscription cost summary from the budget board.
14. Call post_claude_code_prompt — generate a complete, developer-ready Claude Code prompt the client can copy and paste to start building. It must include: project description, exact tech stack, directory structure, environment variables, data models, API routes, UI pages, integrations, ordered build steps, MVP definition of done, AND (11) AI agent architecture — for each AI agent identified in the AI strategy, describe what triggers it, what it does step by step, which AI model/API it calls (with example request/response), how it writes back to Monday.com or the app, and error handling; (12) AI workflow decision trees in plain text showing the conditional logic; (13) AI cost controls (rate limiting, token budgets, fallback behaviour). Write it so a developer can paste it into Claude Code with zero extra context and start immediately.
15. Call advance_scope_stage to move the scope lock to "Planning".

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
