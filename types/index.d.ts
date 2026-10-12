export type NoteColor = 'yellow' | 'green' | 'blue' | 'pink' | 'orange'

export type NoteStatus = 'todo' | 'doing' | 'done'

/** Only a yellow note (the task kind) reads `status`; absent, it is todo. */
export type Note = { id: string; text: string; color: NoteColor; createdAt: number; status?: NoteStatus }

declare module 'claude-code' {
  interface PluginState {
    nugget: {
      notes: Note[]
      /** The color the pane shows alone; null shows every note. */
      filter: NoteColor | null
      /** The note whose menu is open; null when none is. */
      picking: string | null
      /** Whether the done nuggets are unfolded below the open ones. */
      showDone: boolean
    }
  }
}
