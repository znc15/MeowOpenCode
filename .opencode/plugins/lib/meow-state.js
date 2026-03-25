import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"

export const DEFAULT_MEOW_STATE = Object.freeze({
  enabled: true,
  ownerTitle: "主人",
  sentenceSuffix: "喵",
  mode: "playful",
})

export const MEOW_STATE_FILE = ".opencode/meow-state.json"
export const MEOW_MODES = Object.freeze(["playful", "gentle", "tsundere"])

export function normalizeMeowState(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ...DEFAULT_MEOW_STATE }
  }

  const candidate = input
  const enabled = typeof candidate.enabled === "boolean"
    ? candidate.enabled
    : DEFAULT_MEOW_STATE.enabled
  const ownerTitle = typeof candidate.ownerTitle === "string" && candidate.ownerTitle.trim()
    ? candidate.ownerTitle.trim()
    : DEFAULT_MEOW_STATE.ownerTitle
  const sentenceSuffix = typeof candidate.sentenceSuffix === "string" && candidate.sentenceSuffix.trim()
    ? candidate.sentenceSuffix.trim()
    : DEFAULT_MEOW_STATE.sentenceSuffix
  const mode = normalizeMode(candidate.mode) || DEFAULT_MEOW_STATE.mode

  return {
    enabled,
    ownerTitle,
    sentenceSuffix,
    mode,
  }
}

export async function loadMeowState(rootDirectory) {
  try {
    const filePath = join(rootDirectory, MEOW_STATE_FILE)
    const raw = await readFile(filePath, "utf8")
    return normalizeMeowState(JSON.parse(raw))
  } catch {
    return { ...DEFAULT_MEOW_STATE }
  }
}

export async function saveMeowState(rootDirectory, state) {
  const normalizedState = normalizeMeowState(state)
  const opencodeDirectory = join(rootDirectory, ".opencode")
  const filePath = join(rootDirectory, MEOW_STATE_FILE)

  await mkdir(opencodeDirectory, { recursive: true })
  await writeFile(filePath, `${JSON.stringify(normalizedState, null, 2)}\n`, "utf8")

  return normalizedState
}

export function applyMeowAction(state, action, value = "") {
  const normalizedState = normalizeMeowState(state)
  const normalizedAction = normalizeAction(action, "invalid")

  if (normalizedAction === "status") {
    return {
      state: normalizedState,
      message: normalizedState.enabled ? "喵模式当前为开启。" : "喵模式当前为关闭。",
      shouldSave: false,
    }
  }

  if (normalizedAction === "owner") {
    const nextOwnerTitle = normalizeText(value)

    if (!nextOwnerTitle) {
      return {
        state: normalizedState,
        message: "请提供对主人的称呼。",
        shouldSave: false,
      }
    }

    return {
      state: {
        ...normalizedState,
        ownerTitle: nextOwnerTitle,
      },
      message: `对主人的称呼已设置为“${nextOwnerTitle}”。`,
      shouldSave: true,
    }
  }

  if (normalizedAction === "suffix") {
    const nextSentenceSuffix = normalizeText(value)

    if (!nextSentenceSuffix) {
      return {
        state: normalizedState,
        message: "请提供句尾语气词。",
        shouldSave: false,
      }
    }

    return {
      state: {
        ...normalizedState,
        sentenceSuffix: nextSentenceSuffix,
      },
      message: `句尾语气词已设置为“${nextSentenceSuffix}”。`,
      shouldSave: true,
    }
  }

  if (normalizedAction === "mode") {
    const nextMode = normalizeMode(value)

    if (!nextMode) {
      return {
        state: normalizedState,
        message: "语气模式仅支持 playful、gentle、tsundere。",
        shouldSave: false,
      }
    }

    return {
      state: {
        ...normalizedState,
        mode: nextMode,
      },
      message: `喵模式语气已设置为“${nextMode}”。`,
      shouldSave: true,
    }
  }

  if (normalizedAction === "invalid") {
    return {
      state: normalizedState,
      message: "仅支持 on、off、toggle、status、owner、suffix、mode。",
      shouldSave: false,
    }
  }

  const nextEnabled = normalizedAction === "toggle"
    ? !normalizedState.enabled
    : normalizedAction === "on"

  const nextState = {
    ...normalizedState,
    enabled: nextEnabled,
  }

  return {
    state: nextState,
    message: nextEnabled ? "喵模式已开启。" : "喵模式已关闭。",
    shouldSave: true,
  }
}

export function parseMeowCommandInput(input) {
  if (typeof input !== "string") {
    return {
      action: "toggle",
      value: "",
    }
  }

  const trimmedInput = input.trim()

  if (!trimmedInput) {
    return {
      action: "toggle",
      value: "",
    }
  }

  const [firstToken, ...valueParts] = trimmedInput.split(/\s+/)

  return {
    action: normalizeAction(firstToken, "invalid"),
    value: valueParts.join(" ").trim(),
  }
}

export function buildMeowPersonaPrompt(state) {
  const modeInstruction = getModeInstruction(state.mode)

  return [
    "## Meow Persona Mode",
    `- Address the user as \"${state.ownerTitle}\" where natural.`,
    `- End some suitable sentences with \"${state.sentenceSuffix}\" without making every line repetitive.`,
    "- Keep technical content accurate, explicit, and complete.",
    "- Do not let the cat persona reduce code quality, safety, or verification rigor.",
    `- Persona tone: ${modeInstruction}`,
  ].join("\n")
}

function getModeInstruction(mode) {
  switch (mode) {
    case "gentle":
      return "gentle, warm, and lightly playful"
    case "tsundere":
      return "slightly tsundere, sharp, but still helpful and professional"
    case "playful":
    default:
      return "playful, catlike, and concise"
  }
}

function normalizeAction(action, fallback = "toggle") {
  if (typeof action !== "string") {
    return fallback
  }

  const normalizedAction = action.trim().toLowerCase()

  if (!normalizedAction) {
    return fallback
  }

  if (["on", "off", "toggle", "status", "owner", "suffix", "mode"].includes(normalizedAction)) {
    return normalizedAction
  }

  return fallback
}

function normalizeMode(mode) {
  if (typeof mode !== "string") {
    return ""
  }

  const normalizedMode = mode.trim().toLowerCase()
  return MEOW_MODES.includes(normalizedMode) ? normalizedMode : ""
}

function normalizeText(value) {
  if (typeof value !== "string") {
    return ""
  }

  return value.trim()
}
