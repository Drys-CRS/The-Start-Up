/**
 * MVP planning agent powered by Google Gemini Flash (free tier).
 * Uses the Gemini REST API directly — no extra SDK required.
 * Set GOOGLE_AI_API_KEY from https://ai.google.dev
 */

import {
  readScopeLock,
  listWorkspaceBoards,
  createBoard,
  createGroup,
  createItemInGroup,
  setSimpleValue,
  findItemsByName,
  postUpdate,
  advanceScopeStage,
} from "./monday-tools";

const GEMINI_URL = () =>
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GOOGLE_AI_API_KEY}`;

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
    name: "list_boards",
    description: "List all boards in the Monday.com workspace.",
    parameters: { type: "OBJECT", properties: {} },
  },
  {
    name: "create_project_board",
    description: "Create a new Monday.com board for this client, e.g. 'Acme Corp — Build Plan'.",
    parameters: {
      type: "OBJECT",
      properties: { board_name: { type: "STRING" } },
      required: ["board_name"],
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
    description: "Create a task item in a group. P0 = MVP critical, P1 = post-MVP, P2 = nice to have.",
    parameters: {
      type: "OBJECT",
      properties: {
        board_id:  { type: "STRING" },
        group_id:  { type: "STRING" },
        task_name: { type: "STRING", description: "Concise, actionable task — specific not vague" },
        priority:  { type: "STRING", description: "P0 — MVP, P1 — Post-MVP, or P2 — Nice to Have" },
        category:  { type: "STRING", description: "Frontend, Backend, Integration, Infrastructure, Design, Testing, or Discovery" },
        notes:     { type: "STRING", description: "Optional acceptance criteria or detail" },
      },
      required: ["board_id", "group_id", "task_name", "priority", "category"],
    },
  },
  {
    name: "mark_tracker_item_done",
    description: "Find an item on the Build Tracker by partial name and mark it Done.",
    parameters: {
      type: "OBJECT",
      properties: {
        item_name_contains: { type: "STRING" },
      },
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

    case "list_boards":
      return listWorkspaceBoards();

    case "create_project_board":
      return { board_id: await createBoard(args.board_name) };

    case "create_group":
      return { group_id: await createGroup(args.board_id, args.group_name) };

    case "create_task": {
      const id = await createItemInGroup(args.board_id, args.group_id, args.task_name);
      return { item_id: id, task: args.task_name, priority: args.priority, category: args.category };
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

async function callGemini(contents: GeminiContent[]): Promise<GeminiContent> {
  const res = await fetch(GEMINI_URL(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{
          text: `You are The Startup's project planning agent. You build structured MVP plans for client builds in Monday.com.

When given a scope lock item ID:
1. Call read_scope_lock to get the full scope data
2. Call list_boards to see what already exists
3. Call create_project_board to create "[ClientName] — Build Plan"
4. Create these groups in the board:
   - "Requirements" — all functional requirements from the scope
   - "MVP — Phase 1 (Days 1–30)" — every task needed to ship
   - "Post-MVP — Phase 2" — deferred P1/P2 items
   - "Planning" — create items here then mark them Done
5. Populate groups with specific, actionable tasks using create_task.
   Bad: "Build frontend". Good: "Build lead capture form with email validation and auto-assign logic".
   Set correct priority (P0/P1/P2) and category for every task.
6. Call mark_tracker_item_done for any matched tracker items.
7. Call post_plan_summary with a markdown summary: client goal, requirements list, MVP scope, post-MVP backlog, key technical decisions.
8. Call advance_scope_stage to move the scope lock to "Planning".

Cover everything: auth, data model, API routes, UI pages, integrations, deployment, testing.`,
        }],
      },
      contents,
      tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
      generationConfig: { temperature: 0.3 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const candidate = data.candidates?.[0];
  if (!candidate) throw new Error("No candidates in Gemini response");
  return candidate.content as GeminiContent;
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

  const log: string[] = [];
  let tasksCreated = 0;
  let boardId: string | undefined;

  const contents: GeminiContent[] = [
    {
      role: "user",
      parts: [{ text: `Process scope lock item ID: ${scopeLockItemId}. Build the full MVP plan in Monday.com.` }],
    },
  ];

  for (let turn = 0; turn < 40; turn++) {
    const modelContent = await callGemini(contents);
    contents.push(modelContent);

    const functionCalls = modelContent.parts.filter(
      (p): p is { functionCall: { name: string; args: Record<string, string> } } => "functionCall" in p,
    );

    // Collect any text the model emits
    for (const p of modelContent.parts) {
      if ("text" in p && p.text.trim()) log.push(p.text.trim());
    }

    if (functionCalls.length === 0) break;

    // Execute all tools and collect responses
    const responseParts: GeminiPart[] = [];
    for (const { functionCall } of functionCalls) {
      log.push(`→ ${functionCall.name}(${JSON.stringify(functionCall.args).slice(0, 120)})`);
      try {
        const result = await executeTool(functionCall.name, functionCall.args);

        if (functionCall.name === "create_project_board" && result && typeof result === "object") {
          boardId = (result as { board_id: string }).board_id;
        }
        if (functionCall.name === "create_task") tasksCreated++;

        log.push(`  ✓ ${JSON.stringify(result).slice(0, 180)}`);
        responseParts.push({ functionResponse: { name: functionCall.name, response: result } });
      } catch (err) {
        log.push(`  ✗ ${String(err)}`);
        responseParts.push({ functionResponse: { name: functionCall.name, response: { error: String(err) } } });
      }
    }

    contents.push({ role: "user", parts: responseParts });
  }

  const summaryLines = log.filter(l => !l.startsWith("→") && !l.startsWith("  "));
  return { boardId, tasksCreated, summary: summaryLines.join("\n") || "MVP plan created.", log };
}
