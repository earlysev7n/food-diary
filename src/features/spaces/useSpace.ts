import { useContext } from 'react'
import { SpaceContext } from './space-context'

export function useSpace() {
  const context = useContext(SpaceContext)

  if (!context) {
    throw new Error('useSpace must be used inside a SpaceProvider')
  }

  return context
}