import type { On } from 'claude-code'
import type { Engine } from 'claude-code/testing'
import { expect, mock, test } from 'claude-code/testing'

import { move, nextStatus } from '../hooks/register'
import type { Note } from '../types'

type Saved = { text: string; color: string }[]

// The kit stamps `origin` and `presentation` the way a typed command gets them;
// a test names only the command and what follows it.
const run = ($: Engine, command: string, args: string) =>
  $.command.run({ command, args } as Parameters<Engine['command']['run']>[0])

// Stands in for the engine beneath the plugin and keeps what it last stored.
const engine = (on: On) => {
  const store: { notes?: Saved } = {}
  mock.clock(on)
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('store.set', ($, e) => {
    if (e.key === 'notes') store.notes = e.value as Saved
    return { value: undefined }
  })
  return store
}

const pairs = (notes: Saved | undefined) => notes?.map(n => [n.text, n.color])

test('the agent tool saves a note under the meaning it names', async ($, on) => {
  const store = engine(on)

  await $.tool.call({ tool: 'mcp__nugget__save_nugget', text: 'ship it', kind: 'Decision' })

  expect(pairs(store.notes)).toEqual([['ship it', 'green']])
})

test('the agent tool takes a color name too, and an unknown kind falls back to yellow', async ($, on) => {
  const store = engine(on)

  await $.tool.call({ tool: 'mcp__nugget__save_nugget', text: 'a', kind: 'blue' })
  await $.tool.call({ tool: 'mcp__nugget__save_nugget', text: 'b', kind: 'purple' })

  expect(pairs(store.notes)).toEqual([['b', 'yellow'], ['a', 'blue']])
})

test('/nugget reads a leading meaning before the text', async ($, on) => {
  const store = engine(on)

  await run($, 'nugget', 'task rerun the lint')
  await run($, 'nugget', 'question: why 144 columns?')

  expect(pairs(store.notes)).toEqual([
    ['why 144 columns?', 'pink'],
    ['rerun the lint', 'yellow'],
  ])
})

test('a meaning the user renamed in settings is the one /nugget understands', { options: { green: 'Agreed' } }, async ($, on) => {
  const store = engine(on)

  await run($, 'nugget', 'agreed keep the flag')
  await run($, 'nugget', 'decision is now just text')

  expect(pairs(store.notes)).toEqual([
    ['decision is now just text', 'yellow'],
    ['keep the flag', 'green'],
  ])
})

test('/nuggets with a meaning opens the pane filtered to it', async ($, on) => {
  engine(on)

  const shown = await run($, 'nuggets', 'problem')

  expect(shown.text).toBe('Showing Problem notes.')
})

test('a new nugget starts as to do, and the status walks to do, in progress, done, to do', async ($, on) => {
  const store = engine(on)

  await $.tool.call({ tool: 'mcp__nugget__save_nugget', text: 'x' })

  expect((store.notes?.[0] as { status?: string })?.status).toBe('todo')
  expect([nextStatus(undefined), nextStatus('todo'), nextStatus('doing'), nextStatus('done')]).toEqual([
    'doing',
    'doing',
    'done',
    'todo',
  ])
})

test('moving a nugget swaps it with its neighbour and stops at the ends', () => {
  const list: Note[] = ['a', 'b', 'c'].map(id => ({ id, text: id, color: 'yellow', createdAt: 0 }))
  const ids = (l: Note[]) => l.map(n => n.id)

  expect(ids(move(list, 'b', -1))).toEqual(['b', 'a', 'c'])
  expect(ids(move(list, 'b', 1))).toEqual(['a', 'c', 'b'])
  expect(ids(move(list, 'a', -1))).toEqual(['a', 'b', 'c'])
  expect(ids(move(list, 'c', 1))).toEqual(['a', 'b', 'c'])
})

test('a move skips cards that are not on screen', () => {
  const list: Note[] = ['a', 'b', 'c'].map(id => ({ id, text: id, color: 'yellow', createdAt: 0 }))

  expect(move(list, 'a', 1, ['a', 'c']).map(n => n.id)).toEqual(['c', 'b', 'a'])
})

test('the saved message names the kind plainly', async ($, on) => {
  engine(on)

  const saved = await run($, 'nugget', 'decision ship it')

  expect(saved.text).toBe('✦ saved as decision')
})
