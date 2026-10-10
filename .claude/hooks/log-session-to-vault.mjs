#!/usr/bin/env node
/**
 * Claude Code SessionEnd hook — logs a summary of the session (prompts asked,
 * files touched, tool calls made) into the CRS Obsidian vault as a note.
 *
 * Why: keeps a durable, searchable record of what Claude Code did in this repo
 * across every invocation (terminal or the VS Code extension — both go through
 * the same Claude Code hook system), without duplicating the full transcript.
 *
 * Never throws past its own process — a broken hook must not block Claude Code.
 * Never writes secret values — only prompt text, file paths, and tool names.
 */
import fs from "node:fs";
import path from "node:path";

const VAULT_PATH = process.env.CRS_VAULT_PATH || "D:\\Obsidian\\RetaliatorVault";
const SESSIONS_DIR = "Sessions";

function readStdin() {
  try {
    return fs.readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

function safeParseLines(text) {
  const out = [];
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      out.push(JSON.parse(trimmed));
    } catch {
      // skip malformed lines rather than failing the whole hook
    }
  }
  return out;
}

function extractText(content) {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((b) => b && b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("\n");
  }
  return "";
}

function summarizeTranscript(transcriptPath) {
  const prompts = [];
  const toolCalls = {};
  const filesTouched = new Set();
  let firstTs = null;
  let lastTs = null;

  let raw = "";
  try {
    raw = fs.readFileSync(transcriptPath, "utf8");
  } catch {
    return { prompts, toolCalls, filesTouched: [], firstTs, lastTs, readable: false };
  }

  for (const entry of safeParseLines(raw)) {
    if (entry.timestamp) {
      if (!firstTs) firstTs = entry.timestamp;
      lastTs = entry.timestamp;
    }
    const role = entry.type || entry.message?.role;
    const content = entry.message?.content;

    if (role === "user" && content) {
      const text = extractText(content).trim();
      // skip tool_result-only user turns (no real prompt text) and huge pastes
      if (text && !entry.toolUseResult) {
        prompts.push(text.length > 400 ? text.slice(0, 400) + " […]" : text);
      }
    }

    if (role === "assistant" && Array.isArray(content)) {
      for (const block of content) {
        if (block?.type === "tool_use" && block.name) {
          toolCalls[block.name] = (toolCalls[block.name] || 0) + 1;
          const fp = block.input?.file_path || block.input?.path || block.input?.notebook_path;
          if (fp && (block.name === "Edit" || block.name === "Write" || block.name === "NotebookEdit")) {
            filesTouched.add(fp);
          }
        }
      }
    }
  }

  return { prompts, toolCalls, filesTouched: [...filesTouched], firstTs, lastTs, readable: true };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function main() {
  const stdin = readStdin();
  let payload = {};
  try {
    payload = JSON.parse(stdin);
  } catch {
    // no valid payload — nothing to log
    process.exit(0);
  }

  const { transcript_path: transcriptPath, cwd, session_id: sessionId, reason } = payload;
  if (!transcriptPath) process.exit(0);

  const summary = summarizeTranscript(transcriptPath);
  if (!summary.readable || summary.prompts.length === 0) {
    // Nothing meaningful happened (e.g. session opened and immediately closed) — skip.
    process.exit(0);
  }

  const now = new Date();
  const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timeStr = `${pad(now.getHours())}${pad(now.getMinutes())}`;
  const project = cwd ? path.basename(cwd) : "unknown-project";
  const safeSessionId = (sessionId || "session").replace(/[^a-zA-Z0-9-]/g, "").slice(0, 8);

  const lines = [];
  lines.push("---");
  lines.push(`tags: [session, auto-logged, ${project}]`);
  lines.push(`date: ${dateStr}`);
  lines.push(`project: ${project}`);
  lines.push(`session_id: ${sessionId || "unknown"}`);
  lines.push(`end_reason: ${reason || "unknown"}`);
  lines.push("---");
  lines.push("");
  lines.push(`# Session — ${dateStr} ${pad(now.getHours())}:${pad(now.getMinutes())} — ${project}`);
  lines.push("");
  lines.push(`> Auto-logged by the \`log-session-to-vault\` Claude Code hook. Raw transcript (local, ephemeral): \`${transcriptPath}\``);
  lines.push("");
  lines.push("## Prompts asked");
  lines.push("");
  for (const p of summary.prompts) {
    lines.push(`- ${p.replace(/\n/g, " ")}`);
  }
  lines.push("");
  lines.push("## Files touched");
  lines.push("");
  if (summary.filesTouched.length) {
    for (const f of summary.filesTouched) lines.push(`- \`${f}\``);
  } else {
    lines.push("- (none — read-only or conversational session)");
  }
  lines.push("");
  lines.push("## Tool call counts");
  lines.push("");
  const toolEntries = Object.entries(summary.toolCalls).sort((a, b) => b[1] - a[1]);
  if (toolEntries.length) {
    for (const [name, count] of toolEntries) lines.push(`- ${name}: ${count}`);
  } else {
    lines.push("- (none)");
  }
  lines.push("");
  lines.push("## Notes");
  lines.push("");
  lines.push("<!-- freeform space — add your own summary/decisions here -->");
  lines.push("");

  const outDir = path.join(VAULT_PATH, SESSIONS_DIR);
  try {
    fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, `${dateStr}_${timeStr}_${project}_${safeSessionId}.md`);
    fs.writeFileSync(outFile, lines.join("\n"), "utf8");
  } catch (err) {
    // Never fail the hook over a write error — just exit quietly.
    // (Common cause: vault path doesn't exist on this machine — see CRS_VAULT_PATH.)
  }

  process.exit(0);
}

main();
