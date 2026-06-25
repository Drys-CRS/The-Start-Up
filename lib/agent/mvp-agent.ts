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

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Board ID for the Build Tracker — set via env or falls back to Delivery board
const BUILD_TRACKER_BOARD_ID =
  process.env.MONDAY_BUILD_TRACKER_BOARD_ID || process.env.MONDAY_DELIVERY_BOARD_ID || "18419179069";

// ── Tool definitions ─────────────────────────────────────────────────────────

const TOOLS: Anthropic.Tool[] = [
  {
    name: "read_scope_lock",
    description:
      "Read all fields from a Scope Lock item in Monday.com. Returns the client name, goal, bottleneck, workflow, must-haves, and integrations.",
    input_schema: {
      type: "object" as const,
      properties: {
        item_id: { type: "string", description: "The Monday.com Scope Lock item ID" },
      },
      required: ["item_id"],
    },
  },
  {
    name: "list_boards",
    description: "List all boards in the Monday.com workspace. Use this to find existing relevant boards.",
    input_schema: { type: "object" as const, properties: {} },
  },
  {
    name: "create_project_board",
    description:
      "Create a new Monday.com board for this client's build. Name it '[ClientName] — Build Plan'.",
    input_schema: {
      type: "object" as const,
      properties: {
        board_name: { type: "string", description: "The board name, e.g. 'Acme Corp — Build Plan'" },
      },
      required: ["board_name"],
    },
  },
  {
    name: "create_group",
    description: "Create a group (section) inside a Monday.com board.",
    input_schema: {
      type: "object" as const,
      properties: {
        board_id: { type: "string", description: "The board ID to create the group in" },
        group_name: { type: "string", description: "The group name, e.g. 'MVP Tasks' or 'Requirements'" },
      },
      required: ["board_id", "group_name"],
    },
  },
  {
    name: "create_task",
    description:
      "Create a task item in a group. Use priority: P0 for MVP-critical, P1 for post-MVP, P2 for nice-to-have.",
    input_schema: {
      type: "object" as const,
      properties: {
        board_id:   { type: "string" },
        group_id:   { type: "string" },
        task_name:  { type: "string", description: "Concise, actionable task name" },
        priority:   { type: "string", enum: ["P0 — MVP", "P1 — Post-MVP", "P2 — Nice to Have"] },
        category:   { type: "string", enum: ["Frontend", "Backend", "Integration", "Infrastructure", "Design", "Testing", "Discovery"] },
        notes:      { type: "string", description: "Optional detail or acceptance criteria" },
      },
      required: ["board_id", "group_id", "task_name", "priority", "category"],
    },
  },
  {
    name: "mark_tracker_item_done",
    description:
      "Find an item by name on the Build Tracker board and mark it Done. Use after completing each planning phase.",
    input_schema: {
      type: "object" as const,
      properties: {
        item_name_contains: {
          type: "string",
          description: "Partial name to search for, e.g. 'MVP Planning' or 'Scope Analysis'",
        },
      },
      required: ["item_name_contains"],
    },
  },
  {
    name: "post_plan_summary",
    description:
      "Post the final MVP plan summary as an update on the Scope Lock item so the client and team can see it.",
    input_schema: {
      type: "object" as const,
      properties: {
        scope_lock_item_id: { type: "string" },
        summary: {
          type: "string",
          description: "Markdown-formatted summary of the MVP plan, requirements, and key decisions",
        },
      },
      required: ["scope_lock_item_id", "summary"],
    },
  },
  {
    name: "advance_scope_stage",
    description: "Advance the Scope Lock item's stage in Monday.com (e.g. to 'Planning' or 'Build Active').",
    input_schema: {
      type: "object" as const,
      properties: {
        scope_lock_item_id: { type: "string" },
        stage: { type: "string", description: "e.g. 'Planning', 'Build Active'" },
      },
      required: ["scope_lock_item_id", "stage"],
    },
  },
];

// ── Tool executor ─────────────────────────────────────────────────────────────

async function executeTool(
  name: string,
  input: Record<string, string>,
): Promise<unknown> {
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
      const itemId = await createItemInGroup(input.board_id, input.group_id, input.task_name);
      return { item_id: itemId, task: input.task_name, priority: input.priority, category: input.category };
    }

    case "mark_tracker_item_done": {
      const matches = await findItemsByName(BUILD_TRACKER_BOARD_ID, input.item_name_contains);
      const results = [];
      for (const m of matches) {
        // Try common status column IDs; setSimpleValue uses create_labels_if_missing
        await setSimpleValue(BUILD_TRACKER_BOARD_ID, m.id, "color_mm4mbccy", "Done").catch(() => null);
        await setSimpleValue(BUILD_TRACKER_BOARD_ID, m.id, "color_mm4mmf9n", "Done").catch(() => null);
        results.push({ id: m.id, name: m.name, marked: "Done" });
      }
      return { matched: results.length, items: results };
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

export async function runMvpAgent(scopeLockItemId: string): Promise<AgentResult> {
  const log: string[] = [];
  let tasksCreated = 0;
  let boardId: string | undefined;

  const systemPrompt = `You are The Startup's project planning agent. You build structured MVP plans for client builds.

When given a scope lock item ID you must:
1. Call read_scope_lock to get the client's full scope data
2. Call list_boards to see what boards already exist in Monday.com
3. Call create_project_board to create "[ClientName] — Build Plan"
4. Create these groups in order:
   - "Requirements" — all functional requirements extracted from the scope
   - "MVP — Phase 1 (Days 1–30)" — every task needed to ship the MVP
   - "Post-MVP — Phase 2" — P1/P2 items deferred after launch
   - "Planning" — your own planning checklist (create items here then mark them Done)
5. Populate each group with specific, actionable tasks using create_task.
   Tasks must be concrete dev items (not "build frontend" — instead "Build lead capture form with validation").
   Assign correct priority and category to every task.
6. Call mark_tracker_item_done for any matching items on the Build Tracker.
7. Call post_plan_summary with a clear markdown summary of:
   - Client goal
   - Core requirements (bullet list)
   - MVP scope (what ships in 30 days)
   - Post-MVP backlog
   - Key technical decisions
8. Call advance_scope_stage to move the scope lock to "Planning".

Be specific and technical. If the scope mentions Monday.com, Stripe, or specific integrations — create tasks for each one.
Cover: auth, data model, API routes, UI pages, integrations, deployment, and testing.`;

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Process scope lock item ID: ${scopeLockItemId}. Build the full MVP plan in Monday.com.`,
    },
  ];

  // Agent loop — max 40 turns to avoid runaway
  for (let turn = 0; turn < 40; turn++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: systemPrompt,
      tools: TOOLS,
      messages,
    });

    // Collect any text the agent outputs for the log
    for (const block of response.content) {
      if (block.type === "text" && block.text.trim()) {
        log.push(block.text.trim());
      }
    }

    // If no more tool calls, we're done
    if (response.stop_reason === "end_turn") break;

    // Execute all tool calls in this turn
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      log.push(`→ ${block.name}(${JSON.stringify(block.input).slice(0, 120)})`);

      let result: unknown;
      let isError = false;
      try {
        result = await executeTool(block.name, block.input as Record<string, string>);

        // Track board creation and task count
        if (block.name === "create_project_board" && result && typeof result === "object") {
          boardId = (result as { board_id: string }).board_id;
        }
        if (block.name === "create_task") tasksCreated++;

        log.push(`  ✓ ${JSON.stringify(result).slice(0, 200)}`);
      } catch (err) {
        result = { error: String(err) };
        isError = true;
        log.push(`  ✗ ${String(err)}`);
      }

      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
        is_error: isError,
      });
    }

    // Feed results back for next turn
    messages.push({ role: "assistant", content: response.content });
    messages.push({ role: "user", content: toolResults });
  }

  const summary = log.filter(l => !l.startsWith("→") && !l.startsWith("  ")).join("\n") || "MVP plan created.";
  return { boardId, tasksCreated, summary, log };
}
