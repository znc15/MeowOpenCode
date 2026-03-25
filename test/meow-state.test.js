import test from "node:test"
import assert from "node:assert/strict"
import { mkdir, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

import {
  applyMeowAction,
  DEFAULT_MEOW_STATE,
  buildMeowPersonaPrompt,
  loadMeowState,
  normalizeMeowState,
  parseMeowCommandInput,
  saveMeowState,
} from "../.opencode/plugins/lib/meow-state.js"
import { MeowPersonaPlugin } from "../.opencode/plugins/meow-persona.js"

test("normalizeMeowState falls back to defaults for invalid input", () => {
  const result = normalizeMeowState(null)

  assert.deepEqual(result, DEFAULT_MEOW_STATE)
})

test("normalizeMeowState keeps valid overrides and defaults invalid fields", () => {
  const result = normalizeMeowState({
    enabled: true,
    ownerTitle: "  主人  ",
    sentenceSuffix: "  嗷  ",
    mode: "gentle",
  })

  assert.deepEqual(result, {
    enabled: true,
    ownerTitle: "主人",
    sentenceSuffix: "嗷",
    mode: "gentle",
  })
})

test("loadMeowState returns defaults when state file is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "meow-plugin-missing-"))

  const result = await loadMeowState(root)

  assert.deepEqual(result, DEFAULT_MEOW_STATE)
})

test("loadMeowState normalizes persisted state from project root", async () => {
  const root = await mkdtemp(join(tmpdir(), "meow-plugin-state-"))
  const opencodeDir = join(root, ".opencode")
  await mkdir(opencodeDir, { recursive: true })
  await writeFile(
    join(root, ".opencode", "meow-state.json"),
    JSON.stringify({
      enabled: true,
      ownerTitle: "主人大人",
      sentenceSuffix: "咪",
      mode: "tsundere",
    }),
    "utf8",
  )

  const result = await loadMeowState(root)

  assert.deepEqual(result, {
    enabled: true,
    ownerTitle: "主人大人",
    sentenceSuffix: "咪",
    mode: "tsundere",
  })
})

test("buildMeowPersonaPrompt renders the configured persona instructions", () => {
  const prompt = buildMeowPersonaPrompt({
    enabled: true,
    ownerTitle: "主人",
    sentenceSuffix: "喵",
    mode: "playful",
  })

  assert.match(prompt, /主人/)
  assert.match(prompt, /喵/)
  assert.match(prompt, /playful, catlike, and concise/)
})

test("applyMeowAction toggles state and reports enabled result", () => {
  const result = applyMeowAction(DEFAULT_MEOW_STATE, "toggle")

  assert.equal(result.state.enabled, true)
  assert.equal(result.message, "喵模式已开启。")
})

test("applyMeowAction supports status without modifying state", () => {
  const initialState = {
    ...DEFAULT_MEOW_STATE,
    enabled: true,
  }

  const result = applyMeowAction(initialState, "status")

  assert.deepEqual(result.state, initialState)
  assert.equal(result.message, "喵模式当前为开启。")
})

test("parseMeowCommandInput keeps the full value after the subcommand", () => {
  const result = parseMeowCommandInput("owner 最喜欢的主人")

  assert.deepEqual(result, {
    action: "owner",
    value: "最喜欢的主人",
  })
})

test("applyMeowAction updates owner title when owner action is provided", () => {
  const result = applyMeowAction(DEFAULT_MEOW_STATE, "owner", "小主人")

  assert.equal(result.state.ownerTitle, "小主人")
  assert.equal(result.message, "对主人的称呼已设置为“小主人”。")
})

test("applyMeowAction updates sentence suffix when suffix action is provided", () => {
  const result = applyMeowAction(DEFAULT_MEOW_STATE, "suffix", "喵呜")

  assert.equal(result.state.sentenceSuffix, "喵呜")
  assert.equal(result.message, "句尾语气词已设置为“喵呜”。")
})

test("applyMeowAction updates persona mode when mode action is valid", () => {
  const result = applyMeowAction(DEFAULT_MEOW_STATE, "mode", "gentle")

  assert.equal(result.state.mode, "gentle")
  assert.equal(result.message, "喵模式语气已设置为“gentle”。")
})

test("applyMeowAction rejects invalid mode values without changing state", () => {
  const result = applyMeowAction(DEFAULT_MEOW_STATE, "mode", "chaos")

  assert.deepEqual(result.state, DEFAULT_MEOW_STATE)
  assert.equal(result.message, "语气模式仅支持 playful、gentle、tsundere。")
})

test("saveMeowState persists normalized meow state to the project file", async () => {
  const root = await mkdtemp(join(tmpdir(), "meow-plugin-save-"))

  await saveMeowState(root, {
    enabled: true,
    ownerTitle: "主人大人",
    sentenceSuffix: "咪",
    mode: "gentle",
  })

  const result = await loadMeowState(root)

  assert.deepEqual(result, {
    enabled: true,
    ownerTitle: "主人大人",
    sentenceSuffix: "咪",
    mode: "gentle",
  })
})

test("MeowPersonaPlugin exposes meowToggle and persists tool-driven state changes", async () => {
  const root = await mkdtemp(join(tmpdir(), "meow-plugin-tool-"))
  const plugin = await MeowPersonaPlugin({ directory: root, worktree: root })

  assert.equal(typeof plugin.tool.meowToggle.execute, "function")

  const enableMessage = await plugin.tool.meowToggle.execute({ input: "on" })
  const enabledState = await loadMeowState(root)
  const statusMessage = await plugin.tool.meowToggle.execute({ input: "status" })

  assert.equal(enableMessage, "喵模式已开启。")
  assert.equal(enabledState.enabled, true)
  assert.equal(statusMessage, "喵模式当前为开启。")
})

test("MeowPersonaPlugin persists owner and mode configuration from raw command input", async () => {
  const root = await mkdtemp(join(tmpdir(), "meow-plugin-config-"))
  const plugin = await MeowPersonaPlugin({ directory: root, worktree: root })

  const ownerMessage = await plugin.tool.meowToggle.execute({ input: "owner 小主人" })
  const modeMessage = await plugin.tool.meowToggle.execute({ input: "mode gentle" })
  const enableMessage = await plugin.tool.meowToggle.execute({ input: "on" })
  const configuredState = await loadMeowState(root)
  const output = { prompt: "Base prompt" }

  await plugin["tui.prompt.append"]({}, output)

  assert.equal(ownerMessage, "对主人的称呼已设置为“小主人”。")
  assert.equal(modeMessage, "喵模式语气已设置为“gentle”。")
  assert.equal(enableMessage, "喵模式已开启。")
  assert.equal(configuredState.ownerTitle, "小主人")
  assert.equal(configuredState.mode, "gentle")
  assert.match(output.prompt, /小主人/)
  assert.match(output.prompt, /gentle, warm, and lightly playful/)
})

test("MeowPersonaPlugin appends persona prompt only when enabled", async () => {
  const root = await mkdtemp(join(tmpdir(), "meow-plugin-prompt-"))
  const plugin = await MeowPersonaPlugin({ directory: root, worktree: root })
  const disabledOutput = { prompt: "Base prompt" }

  await plugin["tui.prompt.append"]({}, disabledOutput)

  assert.equal(disabledOutput.prompt, "Base prompt")

  await saveMeowState(root, {
    ...DEFAULT_MEOW_STATE,
    enabled: true,
  })

  const enabledOutput = { prompt: "Base prompt" }
  await plugin["tui.prompt.append"]({}, enabledOutput)

  assert.match(enabledOutput.prompt, /Base prompt/)
  assert.match(enabledOutput.prompt, /## Meow Persona Mode/)
  assert.match(enabledOutput.prompt, /主人/)
})
