import { tool } from "@opencode-ai/plugin"
import {
  applyMeowAction,
  buildMeowPersonaPrompt,
  loadMeowState,
  parseMeowCommandInput,
  saveMeowState,
} from "./lib/meow-state.js"

export const MeowPersonaPlugin = async ({ directory, worktree }) => {
  const rootDirectory = worktree || directory

  return {
    tool: {
      meowToggle: tool({
        description: "Toggle or configure the OpenCode meow persona state",
        args: {
          input: tool.schema
            .string()
            .default("toggle")
            .describe("Raw meow command input, for example: on, owner 主人, suffix 喵呜, mode gentle"),
        },
        async execute(args) {
          const currentState = await loadMeowState(rootDirectory)
          const command = parseMeowCommandInput(args.input)
          const result = applyMeowAction(currentState, command.action, command.value)

          if (result.shouldSave) {
            await saveMeowState(rootDirectory, result.state)
          }

          return result.message
        },
      }),
    },
    "tui.prompt.append": async (_input, output) => {
      const state = await loadMeowState(rootDirectory)

      if (!state.enabled) {
        return
      }

      const personaPrompt = buildMeowPersonaPrompt(state)
      output.prompt = output.prompt
        ? `${output.prompt}\n\n${personaPrompt}`
        : personaPrompt
    },
  }
}
