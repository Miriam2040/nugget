import { atom, read, update } from 'claude-code'
import type { EngineInterface, PluginOptions, Register } from 'claude-code'

import type { Note, NoteColor, NoteStatus } from '../types'

const PANE = 'nuggets'
const TITLE = 'Nuggets'
const STORE_KEY = 'notes'
const TOOL = 'save_nugget'

const COLORS: Record<NoteColor, string> = {
  yellow: '#f6d97a',
  green: '#a8e6a3',
  blue: '#a9c8f5',
  pink: '#f5b5d0',
  orange: '#f8c291',
}
const GOLD = '#f5c542'
const COLOR_NAMES = Object.keys(COLORS) as NoteColor[]

// The manifest's userConfig carries the same defaults; these cover a value
// cleared to an empty string, which would otherwise leave a color nameless.
const DEFAULT_LABELS: Record<NoteColor, string> = {
  yellow: 'Task',
  green: 'Decision',
  blue: 'Reference',
  pink: 'Question',
  orange: 'Problem',
}

// A decision or a reference is never "in progress", so status belongs to one
// kind alone: yellow, the task. The person may rename it; it stays the kind
// that carries a status.
const TASK: NoteColor = 'yellow'
const isTask = (note: Note) => note.color === TASK

const STATUSES: { status: NoteStatus; icon: string; label: string }[] = [
  { status: 'todo', icon: '○', label: 'To do' },
  { status: 'doing', icon: '◐', label: 'Doing' },
  { status: 'done', icon: '✓', label: 'Done' },
]

export const nextStatus = (status: NoteStatus | undefined): NoteStatus => {
  const i = STATUSES.findIndex(s => s.status === (status ?? 'todo'))
  return STATUSES[(i + 1) % STATUSES.length]?.status ?? 'todo'
}

const statusOf = (note: Note) => STATUSES.find(s => s.status === (note.status ?? 'todo')) ?? STATUSES[0]!

/**
 * Swaps the note with its neighbour among the `visible` ids (the cards on
 * screen), so a filter or the folded done list never makes a move land on a
 * card the person cannot see. Left out, every note is visible.
 */
export const move = (list: Note[], id: string, by: number, visible?: readonly string[]): Note[] => {
  const shown = visible ?? list.map(n => n.id)
  const neighbour = shown[shown.indexOf(id) + by]
  const from = list.findIndex(n => n.id === id)
  const to = list.findIndex(n => n.id === neighbour)
  if (shown.indexOf(id) < 0 || from < 0 || to < 0) return list
  const copy = [...list]
  ;[copy[from], copy[to]] = [copy[to]!, copy[from]!]
  return copy
}

const notes = atom({ plugin: 'nugget', key: 'notes' } as const, [])
const filter = atom({ plugin: 'nugget', key: 'filter' } as const, null)
const picking = atom({ plugin: 'nugget', key: 'picking' } as const, null)
const showDone = atom({ plugin: 'nugget', key: 'showDone' } as const, false)

const labelsFrom = (options: PluginOptions): Record<NoteColor, string> => {
  const labels = { ...DEFAULT_LABELS }
  for (const color of COLOR_NAMES) {
    const value = options[color]
    if (typeof value === 'string' && value.trim()) labels[color] = value.trim()
  }
  return labels
}

/**
 * Reads a leading color or meaning off `words` ("decision fix the flag",
 * "green fix the flag", "to do fix the flag"), longest name first so a
 * meaning of several words wins over a shorter one it starts with.
 */
export const parseKind = (
  words: string,
  labels: Record<NoteColor, string>,
): { color: NoteColor | undefined; rest: string } => {
  const text = words.trim()
  const names = COLOR_NAMES.flatMap(color => [
    { color, name: color },
    { color, name: labels[color] },
  ]).sort((a, b) => b.name.length - a.name.length)
  for (const { color, name } of names) {
    const head = text.slice(0, name.length)
    const after = text.slice(name.length)
    if (head.toLowerCase() === name.toLowerCase() && (after === '' || /^[\s,:]/.test(after))) {
      return { color, rest: after.replace(/^[\s,:]+/, '') }
    }
  }
  return { color: undefined, rest: text }
}

// $.state is the session's copy the pane redraws from; $.store is what survives
// to the next session, so every change writes both.
const change = async ($: EngineInterface, fn: (list: Note[]) => Note[]) => {
  await update($, notes, list => fn(list ?? []))
  await $.store.set(STORE_KEY, await read($, notes))
}

const add = async ($: EngineInterface, text: string, color: NoteColor) => {
  const note: Note = {
    id: `${await $.clock.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text: text.trim(),
    color,
    createdAt: await $.clock.now(),
    status: 'todo',
  }
  await change($, list => [note, ...list])
  // Not awaited: a pane opened unasked in a narrow terminal waits for room, and
  // awaiting that outlasts the hook's budget, so the note's save would be skipped.
  void $.ui.open({ id: PANE, title: TITLE })
}

export const register: Register = (on, options) => {
  const labels = labelsFrom(options)
  const legend = COLOR_NAMES.map(c => `${c} = ${labels[c]}`).join(', ')

  on('session.start', async ($, e, next) => {
    const saved = await $.store.get(STORE_KEY)
    await update($, notes, () => (Array.isArray(saved) ? (saved as Note[]) : []))

    await $.command.register({
      name: 'nugget',
      description: `Save the selected text (or text you type) as a nugget. ${legend}`,
      argumentHint: '[color or meaning] [text]',
    })
    await $.command.register({
      name: 'nuggets',
      description: 'Show your nuggets in a side pane, optionally only one color or meaning',
      argumentHint: '[color or meaning]',
    })
    await $.tool.register({
      name: TOOL,
      description:
        'Save a short piece of text as a nugget, a note the user keeps in a side pane. ' +
        'Use when the user asks to nugget, keep, pin or note something from the conversation ' +
        '("nugget that, as a decision"). Save the exact text they mean, verbatim and short. ' +
        `Each color has a meaning the user chose: ${legend}.`,
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string', description: 'The note text, verbatim' },
          kind: {
            type: 'string',
            description: `A color or its meaning (${legend}). Default ${labels.yellow}.`,
          },
        },
        required: ['text'],
      },
      isDeferred: false,
    })

    return next(e)
  })

  on('command.run', { command: 'nugget' }, async ($, e) => {
    const { color = 'yellow', rest } = parseKind(e.args, labels)
    const text = rest || (await $.ui.selection())?.text?.trim()
    if (!text) {
      return {
        text:
          'Nothing selected. Select text in an answer with the mouse (fullscreen layout), ' +
          `then run /nugget [color or meaning] — or type it: /nugget ${labels.green.toLowerCase()} use the new flag. ` +
          `Colors: ${legend}.`,
      }
    }
    await add($, text, color)

    return { text: `✦ saved as ${labels[color].toLowerCase()}` }
  })

  on('command.run', { command: 'nuggets' }, async ($, e) => {
    const { color } = parseKind(e.args, labels)
    await update($, filter, () => color ?? null)
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: color ? `Showing ${labels[color]} notes.` : 'Nuggets opened.' }
  })

  on('tool.call', { tool: 'mcp__nugget__save_nugget' }, async ($, e) => {
    // The tool's arguments ride on the event itself, beside `tool`, not under a key.
    const input = e as { text?: unknown; kind?: unknown }
    const text = typeof input.text === 'string' ? input.text.trim() : ''
    if (!text) return { deny: 'text is required' }
    const kind = typeof input.kind === 'string' ? input.kind : ''
    const color = parseKind(kind, labels).color ?? 'yellow'
    try {
      await add($, text, color)
    } catch (err) {
      return { deny: `Could not save the note: ${String(err)}` }
    }

    return { result: `✦ saved as ${labels[color].toLowerCase()}` }
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text, Button } = $.ui.resolve(e)
    const all = await read($, notes)
    const shown = await read($, filter)
    const open = await read($, picking)
    const isDoneOpen = await read($, showDone)

    if (all.length === 0) {
      return <Text dimColor>no gold yet — select text, then /nugget</Text>
    }

    const status = (n: Note) => (isTask(n) ? (n.status ?? 'todo') : undefined)
    const kinds = COLOR_NAMES.filter(color => all.some(n => n.color === color))
    const inView = shown ? all.filter(n => n.color === shown) : all
    const active = inView.filter(n => status(n) !== 'done')
    const done = inView.filter(n => status(n) === 'done')
    const todo = all.filter(n => status(n) === 'todo').length
    const doing = all.filter(n => status(n) === 'doing').length
    const activeIds = active.map(n => n.id)

    const setStatus = (id: string) =>
      change($, l => l.map(n => (n.id === id ? { ...n, status: nextStatus(n.status) } : n)))

    const menu = (note: Note) =>
      open === note.id && (
        <Box flexDirection="row" flexWrap="wrap" columnGap={2} marginLeft={2}>
          {COLOR_NAMES.filter(color => color !== note.color).map(color => (
            <Button
              key={`set-${note.id}-${color}`}
              plain
              onPress={async () => {
                await change($, l => l.map(n => (n.id === note.id ? { ...n, color } : n)))
                await update($, picking, () => null)
              }}
            >
              <Text color={COLORS[color]}>{labels[color].toLowerCase()}</Text>
            </Button>
          ))}
          <Button key={`copy-${note.id}`} plain onPress={press => void $.ui.copy({ text: note.text, surface: press.surface })}>
            <Text dimColor>copy</Text>
          </Button>
          <Button
            key={`drop-${note.id}`}
            plain
            onPress={async () => {
              await change($, l => l.filter(n => n.id !== note.id))
              await update($, picking, () => null)
            }}
          >
            <Text color={COLORS.pink}>drop</Text>
          </Button>
        </Box>
      )

    const toggleMenu = (id: string) => update($, picking, current => (current === id ? null : id))

    return (
      <Box flexDirection="column" gap={1}>
        <Box flexDirection="row">
          <Box flexGrow={1}>
            <Text color={GOLD} bold>✦ nuggets</Text>
          </Box>
          <Text dimColor>
            {todo} to do · {doing} doing
          </Text>
        </Box>

        {/* The filter earns its row only once there are two kinds to tell apart. */}
        {kinds.length > 1 && (
          <Box flexDirection="row" flexWrap="wrap" columnGap={2}>
            <Button key="show-all" plain onPress={() => update($, filter, () => null)}>
              <Text dimColor={shown !== null} underline={shown === null}>all</Text>
            </Button>
            {kinds.map(color => (
              <Button key={`show-${color}`} plain onPress={() => update($, filter, () => color)}>
                <Text color={COLORS[color]} dimColor={shown !== null && shown !== color} underline={shown === color}>
                  {labels[color].toLowerCase()}
                </Text>
              </Button>
            ))}
          </Box>
        )}

        {active.length === 0 && <Text dimColor>all mined ✓</Text>}

        {active.map((note, i) => {
          const state = statusOf(note)
          return (
            <Box key={note.id} flexDirection="column" borderStyle="round" borderColor={COLORS[note.color]} paddingX={1}>
              <Text>{note.text}</Text>
              <Box flexDirection="row" columnGap={2}>
                <Text color={COLORS[note.color]}>{labels[note.color].toLowerCase()}</Text>
                {isTask(note) && (
                  <Button key={`status-${note.id}`} onPress={() => setStatus(note.id)}>
                    <Text color={COLORS[note.color]}>
                      {state.icon} {state.label.toLowerCase()}
                    </Text>
                  </Button>
                )}
                <Box flexGrow={1} />
                {i > 0 && (
                  <Button key={`up-${note.id}`} plain onPress={() => change($, l => move(l, note.id, -1, activeIds))}>
                    <Text dimColor>↑</Text>
                  </Button>
                )}
                {i < active.length - 1 && (
                  <Button key={`down-${note.id}`} plain onPress={() => change($, l => move(l, note.id, 1, activeIds))}>
                    <Text dimColor>↓</Text>
                  </Button>
                )}
                <Button key={`more-${note.id}`} plain onPress={() => toggleMenu(note.id)}>
                  <Text dimColor>⋯</Text>
                </Button>
              </Box>
              {menu(note)}
            </Box>
          )
        })}

        {done.length > 0 && (
          <Box flexDirection="column">
            <Button key="toggle-done" plain onPress={() => update($, showDone, v => !v)}>
              <Text dimColor>
                {isDoneOpen ? '▾' : '▸'} ✓ {done.length} done
              </Text>
            </Button>
            {isDoneOpen &&
              done.map(note => (
                <Box key={note.id} flexDirection="column">
                  <Box flexDirection="row" columnGap={1}>
                    <Button key={`status-${note.id}`} plain onPress={() => setStatus(note.id)}>
                      <Text color={COLORS[note.color]} dimColor>✓</Text>
                    </Button>
                    <Box flexGrow={1}>
                      <Text dimColor strikethrough>{note.text}</Text>
                    </Box>
                    <Button key={`more-${note.id}`} plain onPress={() => toggleMenu(note.id)}>
                      <Text dimColor>⋯</Text>
                    </Button>
                  </Box>
                  {menu(note)}
                </Box>
              ))}
          </Box>
        )}
      </Box>
    )
  })
}
