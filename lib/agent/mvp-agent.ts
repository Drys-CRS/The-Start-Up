/**
 * MVP planning agent powered by Claude claude-sonnet-4-6 via Anthropic SDK.
 * Requires ANTHROPIC_API_KEY in environment.
 */

import Anthropic from "@anthropic-ai/sdk";
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

const BUILD_TRACKER_BOARD_ID =
  process.env.MONDAY_BUILD_TRACKER_BOARD_ID ||
  process.env.MONDAY_DELIVERY_BOARD_ID ||
  "18419179069";

// ── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "read_scope_lock",
    description: "Read all fields from a Scope Lock item in Monday.com — client name, goal, bottleneck, workflow, must-haves, integrations.",
    input_schema: {
      type: "object" as const,
      properties: { item_id: { type: "string", description: "The Monday.com Scope Lock item ID" } },
      required: ["item_id"],
    },
  },
  {
    name: "list_boards",
    description: "List all boards in the Monday.com workspace.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "create_project_board",
    description: "Create a new Monday.com board for this client, e.g. 'Acme Corp — Build Plan'.",
    input_schema: {
      type: "object" as const,
      properties: { board_name: { type: "string" } },
      required: ["board_name"],
    },
  },
  {
    name: "create_group",
    description: "Create a group (section) inside a Monday.com board.",
    input_schema: {
      type: "object" as const,
      properties: {
        board_id:   { type: "string" },
        group_name: { type: "string", description: "e.g. 'MVP Tasks' or 'Requirements'" },
      },
      required: ["board_id", "group_name"],
    },
  },
  {
    name: "create_task",
    description: "Create a task item in a group. P0 = MVP critical, P1 = post-MVP, P2 = nice to have.",
    input_schema: {
      type: "object" as const,
      properties: {
        board_id:  { type: "string" },
        group_id:  { type: "string" },
        task_name: { type: "string", description: "Concise, actionable task — specific not vague" },
        priority:  { type: "string", enum: ["P0 — MVP", "P1 — Post-MVP", "P2 — Nice to Have"] },
        category:  { type: "string", enum: ["Frontend", "Backend", "Integration", "Infrastructure", "Design", "Testing", "Discovery"] },
        notes:     { type: "string", description: "Optional acceptance criteria or detail" },
      },
      required: ["board_id", "group_id", "task_name", "priority", "category"],
    },
  },
  {
    name: "mark_tracker_item_done",
    description: "Find an item on the Build Tracker by partial name and mark it Done.",
    input_schema: {
      type: "object" as const,
      properties: {
        item_name_contains: { type: "string" },
      },
      required: ["item_name_contains"],
    },
  },
  {
    name: "post_plan_summary",
    description: "Post the MVP plan summary as an update on the Scope Lock item.",
    input_schema: {
      type: "object" as const,
      properties: {
        scope_lock_item_id: { type: "string" },
        summary: { type: "string", description: "Markdown summary of the full plan" },
      },
      required: ["scope_lock_item_id", "summary"],
    },
  },
  {
    name: "advance_scope_stage",
    description: "Advance the Scope Lock stage in Monday.com (e.g. 'Planning' or 'Build Active').",
    input_schema: {
      type: "object" as const,
      properties: {
        scope_lock_item_id: { type: "string" },
        stage: { type: "string" },
      },
      required: ["scope_lock_item_id", "stage"],
    },
  },
];

// ── Tool executor ─────────────────────────────────────────────────────────────

async function executeTool(name: string, input: Record<string, string>): Promise<unknown> {
  switch (name) {
    case "read_scope_lock":
      return readScopeLock(input.item_id);
    case "list_boards":
      return listWorkspaceBoards();
    case "create_project_board":
      return { board_id: await createBoard(input.board_name) };
    case "create_group":
      return { group_id: await createGroup(input.board_id, input.group_name) };
    case "create_task": {
      const id = await createItemInGroup(input.board_id, input.group_id, input.task_name);
      return { item_id: id, task: input.task_name, priority: input.priority, category: input.category };
    }
    case "mark_tracker_item_done": {
      const matches = await findItemsByName(BUILD_TRACKER_BOARD_ID, input.item_name_contains);
      for (const m of matches) {
        await setSimpleValue(BUILD_TRACKER_BOARD_ID, m.id, "color_mm4mbccy", "Done").catch(() => null);
        await setSimpleValue(BUILD_TRACKER_BOARD_ID, m.id, "color_mm4mmf9n", "Done").catch(() => null);
      }
      return { matched: matches.length };
    }
    case "post_plan_summary":
      await postUpdate(input.scope_lock_item_id, input.summary);
      return { posted: true };
    case "advance_scope_stage":
      await advanceScopeStage(
        process.env.MONDAY_SCOPE_BOARD_ID || "18419179036",
        input.scope_lock_item_id,
        input.stage,
      );
      return { stage: input.stage };
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

// ── Agent loop ────────────────────────────────────────────────────────────────

export type AgentResult = {
  boardId?: string;
  tasksCreated: number;
  summary: string;
  log: string[];
};

const SYSTEM = `You are The Startup's project planning agent. You build structured MVP plans for client builds in Monday.com.

When given a scope lock item ID:
1. Call read_scope_lock to get the full scope data
2. Call list_boards to see what already exists
3. Call create_project_board to create "[ClientName] — Build Plan"
4. Create these groups in order:
   - "Requirements" — all functional requirements extracted from the scope
   - "MVP — Phase 1 (Days 1–30)" — every task needed to ship the MVP
   - "Post-MVP — Phase 2" — P1/P2 items deferred after launch
   - "Planning" — your own checklist; create items here and mark them Done
5. Populate each group with specific, actionable tasks via create_task.
   Bad: "Build frontend". Good: "Build lead capture form with email validation and auto-assign logic".
   Assign correct priority (P0/P1/P2) and category to every task.
6. Call mark_tracker_item_done for any matching tracker items.
7. Call post_plan_summary with a clear markdown summary: client goal, requirements list, MVP scope, post-MVP backlog, key technical decisions.
8. Call advance_scope_stage to move the scope lock to "Planning".

Cover everything: auth, data model, API routes, UI pages, integrations, deployment, testing.`;

export async function runMvpAgent(scopeLockItemId: string): Promise<AgentResult> {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const log: string[] = [];
  let tasksCreated = 0;
  let boardId: string | undefined;

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: `Process scope lock item ID: ${scopeLockItemId}. Build the full MVP plan in Monday.com.` },
  ];

  for (let turn = 0; turn < 40; turn++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: SYSTEM,
      tools: TOOLS,
      messages,
    });

    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) log.push(block.text.trim());
    }

    if (response.stop_reason === "end_turn") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      log.push(`→ ${block.name}(${JSON.stringify(block.input).slice(0, 120)})`);
      let result: unknown;
      let isError = false;
      try {
        result = await executeTool(block.name, block.input as Record<string, string>);
        if (block.name === "create_project_board" && result && typeof result === "object")
          boardId = (result as { board_id: string }).board_id;
        if (block.name === "create_task") tasksCreated++;
        log.push(`  ✓ ${JSON.stringify(result).slice(0, 180)}`);
      } catch (err) {
        result = { error: String(err) };
        isError = true;
        log.push(`  ✗ ${String(err)}`);
      }
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: JSON.stringify(result), is_error: isError });
    }

    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }

  const summary = log.filter(l => !l.startsWith("→") && !l.startsWith("  ")).join("\n") || "MVP plan created.";
  return { boardId, tasksCreated, summary, log };
}
