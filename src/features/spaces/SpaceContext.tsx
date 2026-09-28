import {
  type PropsWithChildren,
  useEffect,
  useState,
} from 'react'
import { useAuth } from '../auth/useAuth'
import { SpaceContext } from './space-context'
import type { Space } from './types'

export function SpaceProvider({ children }: PropsWithChildren) {
  const { session } = useAuth()
  const [activeSpace, setActiveSpace] = useState<Space | null>(null)

  useEffect(() => {
    setActiveSpace(null)
  }, [session?.user.id])

  return (
    <SpaceContext.Provider value={{ activeSpace, setActiveSpace }}>
      {children}
    </SpaceContext.Provider>
  )
}