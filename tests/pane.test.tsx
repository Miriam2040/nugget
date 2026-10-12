import type { On } from 'claude-code'
import { expect, mock, test } from 'claude-code/testing'

const SURFACES = ['terminal', 'desktop'] as const

const PANE = {
  title: 'Nuggets',
  isFocused: true,
  bodyColumns: 48,
  placement: 'dock' as const,
  scroll: { offset: 0, bodyRows: 40 },
  view: {},
}

const engine = (on: On) => {
  mock.clock(on)
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('store.set', () => ({ value: undefined }))
}

for (const surface of SURFACES) {
  test(`${surface}: an empty pane invites the first nugget`, async ($, on) => {
    engine(on)
    const ui = await $.ui.mount({ plugin: 'nugget', surface, component: 'Pane', requestId: 'nuggets', props: PANE })

    expect(await ui.find({ text: /no gold yet/ })).toBeDefined()
  })

  test(`${surface}: a task walks to do → doing → done and folds away`, async ($, on) => {
    engine(on)
    await $.tool.call({ tool: 'mcp__nugget__save_nugget', text: 'rerun the lint', kind: 'task' })
    const ui = await $.ui.mount({ plugin: 'nugget', surface, component: 'Pane', requestId: 'nuggets', props: PANE })

    const status = (await ui.findAll({ type: 'Button' })).find(b => b.key?.startsWith('status-'))
    expect(status?.text).toContain('to do')

    await ui.press({ key: status!.key! })
    expect((await ui.find({ key: status!.key! }))?.text).toContain('doing')

    await ui.press({ key: status!.key! })
    expect(await ui.find({ text: /rerun the lint/ })).toBeUndefined()
    expect(await ui.find({ text: /1 done/ })).toBeDefined()

    await ui.press({ key: 'toggle-done' })
    expect(await ui.find({ text: /rerun the lint/ })).toBeDefined()
  })

  test(`${surface}: only tasks carry a status; a decision shows its kind alone`, async ($, on) => {
    engine(on)
    await $.tool.call({ tool: 'mcp__nugget__save_nugget', text: 'keep the flag', kind: 'decision' })
    const ui = await $.ui.mount({ plugin: 'nugget', surface, component: 'Pane', requestId: 'nuggets', props: PANE })

    const buttons = await ui.findAll({ type: 'Button' })
    expect(buttons.some(b => b.key?.startsWith('status-'))).toBe(false)
    expect(await ui.find({ text: 'decision' })).toBeDefined()
  })

  test(`${surface}: the filter appears with two kinds and narrows the cards`, async ($, on) => {
    engine(on)
    await $.tool.call({ tool: 'mcp__nugget__save_nugget', text: 'ship it', kind: 'decision' })
    await $.tool.call({ tool: 'mcp__nugget__save_nugget', text: 'why so slow?', kind: 'question' })
    const ui = await $.ui.mount({ plugin: 'nugget', surface, component: 'Pane', requestId: 'nuggets', props: PANE })

    await ui.press({ key: 'show-pink' })

    expect(await ui.find({ text: /why so slow/ })).toBeDefined()
    expect(await ui.find({ text: /ship it/ })).toBeUndefined()
  })

  test(`${surface}: reorder and drop act on the right card`, async ($, on) => {
    engine(on)
    await $.tool.call({ tool: 'mcp__nugget__save_nugget', text: 'first saved', kind: 'reference' })
    await $.tool.call({ tool: 'mcp__nugget__save_nugget', text: 'second saved', kind: 'reference' })
    const ui = await $.ui.mount({ plugin: 'nugget', surface, component: 'Pane', requestId: 'nuggets', props: PANE })
    const texts = async () =>
      (await ui.findAll({ type: 'Text' })).map(t => t.text).filter(t => t.endsWith(' saved'))

    expect(await texts()).toEqual(['second saved', 'first saved'])

    const down = (await ui.findAll({ type: 'Button' })).find(b => b.key?.startsWith('down-'))
    await ui.press({ key: down!.key! })
    expect(await texts()).toEqual(['first saved', 'second saved'])

    const more = (await ui.findAll({ type: 'Button' })).find(b => b.key?.startsWith('more-'))
    await ui.press({ key: more!.key! })
    const drop = (await ui.findAll({ type: 'Button' })).find(b => b.key?.startsWith('drop-'))
    await ui.press({ key: drop!.key! })
    expect(await texts()).toEqual(['second saved'])
  })
}
