import { loadFont as loadInter } from '@remotion/google-fonts/Inter'
import { loadFont as loadMono } from '@remotion/google-fonts/JetBrainsMono'

export const SANS = loadInter('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }).fontFamily
export const MONO = loadMono('normal', { weights: ['400', '600', '700'], subsets: ['latin'] }).fontFamily

// One palette for the whole film: Catppuccin Mocha for the terminal, the
// plugin's own pastels for the nugget kinds, gold for the brand.
export const C = {
  stage: '#0b0c16',
  window: '#1e1e2e',
  chrome: '#11111b',
  line: 'rgba(205, 214, 244, 0.10)',
  text: '#cdd6f4',
  dim: '#7f849c',
  chip: '#313244',
  selection: 'rgba(137, 180, 250, 0.38)',
  gold: '#f5c542',
  task: '#f6d97a',
  decision: '#a8e6a3',
  question: '#f5b5d0',
  reference: '#a9c8f5',
}

export const FPS = 30
