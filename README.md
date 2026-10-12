# ✦ nugget

**Select any part of Claude's answer and keep it as a card.**

Long Claude Code sessions bury the bits you need later: a command, a decision, a
path, an open question. nugget keeps them in a side pane next to the
conversation, color-coded by what they mean to you.

![nugget demo: select part of Claude's answer, /nugget turns it into a decision card, Claude saves a task when asked, and the task moves from to do to doing to done](https://raw.githubusercontent.com/Miriam2040/nugget/media/nugget-demo.gif)

## Install

In Claude Code:

```
/plugin install nugget --marketplace Miriam2040/nugget
```

## Use

| You do | nugget does |
|---|---|
| Select text in an answer, then `/nugget` | Saves it as a task |
| `/nugget decision` (after selecting) | Saves it as a decision |
| `/nugget question why 144 columns?` | Saves the text you typed |
| Ask Claude: *"nugget that, as a decision"* | Claude saves it for you |
| `/nuggets` | Opens the pane |
| `/nuggets problem` | Opens it showing only problems |

On a card: `[○ to do]` moves a task to doing and then done; done tasks fold
away at the bottom. `↑ ↓` reorder, `⋯` changes the type, copies or drops it.

## Make the colors yours

Each color means what you name it. The defaults:

| Color | Means |
|---|---|
| 🟨 yellow | Task (the one kind with a to do / doing / done status) |
| 🟩 green | Decision |
| 🟦 blue | Reference |
| 🩷 pink | Question |
| 🟧 orange | Problem |

Rename them with `/plugin configure nugget@nugget` (or in `/config`). The
commands, the pane and what Claude understands from "nugget that" follow your
names.

## Requirements

- Claude Code 2.1.296 or newer. nugget is a mod, built on Claude Code's
  function-hooks API, which is early access and may change between releases.
- Reading your selection needs Claude Code's fullscreen layout. Without it,
  type the text (`/nugget task rerun lint`) or ask Claude to save it.

## What nugget reads, and where it goes

- **Reads:** the text you selected in an answer (when you run `/nugget`), the text
  you type after `/nugget`, or the text Claude passes to nugget's own
  `save_nugget` tool when you ask it to save something.
- **Stores:** those notes, on your machine, in Claude Code's plugin store under
  `~/.claude/plugins/store/`. They stay until you drop them.
- **Sends:** nothing over the network. The only thing that leaves the plugin is
  the `copy` action, which puts a note's text on your clipboard when you click it.
- **Tools:** nugget answers calls to its own `save_nugget` tool only; it never
  stands in for any other tool.

## The demo video

The demo is made with [Remotion](https://www.remotion.dev): `video/src/` describes every frame, so it can be re-rendered after a change. The rendered GIF lives on the `media` branch, so the plugin itself carries no media files.

```
cd video && npm install && npm run render   # out/nugget.mp4
```

## License

MIT
