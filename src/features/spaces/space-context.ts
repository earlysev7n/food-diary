import { createContext } from 'react'
import type { Space } from './types'

export type SpaceContextValue = {
  activeSpace: Space | null
  setActiveSpace: (space: Space | null) => void
}

export const SpaceContext = createContext<SpaceContextValue | undefined>(
  undefined,
)