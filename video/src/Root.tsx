import React from 'react'
import { Composition } from 'remotion'

import { Nugget } from './Nugget'
import { FPS } from './theme'

export const Root: React.FC = () => (
  <Composition id="Nugget" component={Nugget} durationInFrames={650} fps={FPS} width={1920} height={1080} />
)
