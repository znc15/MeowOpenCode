# OpenCode Meow Plugin

给 OpenCode 加一个会叫“主人”、会说“喵”、还能随时开关和改风格的项目级插件。

## 它能做什么

- `/meow on`：开启喵化人格
- `/meow off`：关闭喵化人格
- `/meow status`：查看当前状态
- `/meow owner 主人大人`：修改称呼
- `/meow suffix 喵呜`：修改句尾语气词
- `/meow mode playful|gentle|tsundere`：切换语气风格

启用后，插件会在当前项目里自动注入 persona prompt，让 OpenCode 在保持技术输出准确的前提下，带一点“喵 / 主人”的风格。

---

## 30 秒上手

把仓库内容放进你的项目根目录，然后安装依赖：

```bash
npm install
```

再进入 `.opencode/` 安装插件依赖：

```bash
npm install
```

启动 OpenCode 后，直接输入：

```text
/meow owner 主人大人
/meow suffix 喵呜
/meow mode gentle
/meow on
```

---

## 命令速查

```text
/meow
/meow toggle
/meow on
/meow off
/meow status
/meow owner 小主人
/meow suffix 喵呜
/meow mode playful
/meow mode gentle
/meow mode tsundere
```

说明：

- `/meow` 与 `/meow toggle` 等价
- `owner / suffix / mode` 只改配置，**不会自动开启**
- 要真正开始注入人格 prompt，仍然需要执行 `/meow on`

---