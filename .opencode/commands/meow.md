---
description: Toggle or configure the meow persona plugin state
---
Use the custom OpenCode tool `meowToggle` exactly once for this command.

Argument mapping:

- `$1 = on`
- `$1 = off`
- `$1 = toggle`
- `$1 = status`
- `$1 = owner`, `$2+ = owner title`
- `$1 = suffix`, `$2+ = sentence suffix`
- `$1 = mode`, `$2 = playful|gentle|tsundere`
- empty `$1` should behave like `toggle`

Execution rules:

1. Call `meowToggle` with `input` equal to `$ARGUMENTS`.
2. If `$ARGUMENTS` is empty, call `meowToggle` with `input: "toggle"`.
3. Do not edit `.opencode/meow-state.json` manually.
4. Do not modify any file.
5. Return only the exact tool result as one short Chinese sentence.

Expected outputs:

- enabled => `喵模式已开启。`
- disabled => `喵模式已关闭。`
- status true => `喵模式当前为开启。`
- status false => `喵模式当前为关闭。`
- owner => `对主人的称呼已设置为“...”。`
- suffix => `句尾语气词已设置为“...”。`
- mode => `喵模式语气已设置为“playful|gentle|tsundere”。`
