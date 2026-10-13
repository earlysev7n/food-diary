import {
  type PropsWithChildren,
  useEffect,
  useState,
} from 'react'
import { useAuth } from '../auth/useAuth'
import { SpaceContext } from './space-context'
import { getMySpaces } from './spaceService'
import type { Space } from './types'

const ACTIVE_SPACE_STORAGE_PREFIX = 'shared-food-diary:active-space:'

function getStorageKey(userId: string) {
  return `${ACTIVE_SPACE_STORAGE_PREFIX}${userId}`
}

function readStoredSpace(userId: string): Space | null {
  try {
    const storedValue = window.localStorage.getItem(getStorageKey(userId))

    if (!storedValue) {
      return null
    }

    const parsedValue: unknown = JSON.parse(storedValue)

    if (
      typeof parsedValue !== 'object' ||
      parsedValue === null ||
      !('id' in parsedValue) ||
      !('name' in parsedValue) ||
      typeof parsedValue.id !== 'string' ||
      typeof parsedValue.name !== 'string'
    ) {
      return null
    }

    return parsedValue as Space
  } catch {
    return null
  }
}

function storeActiveSpace(userId: string, space: Space | null) {
  try {
    if (space) {
      window.localStorage.setItem(
        getStorageKey(userId),
        JSON.stringify(space),
      )
    } else {
      window.localStorage.removeItem(getStorageKey(userId))
    }
  } catch {
    // Local storage can be unavailable in private browsing modes.
  }
}

export function SpaceProvider({ children }: PropsWithChildren) {
  const { session } = useAuth()
  const userId = session?.user.id ?? null
  const [activeSpace, setActiveSpaceState] = useState<Space | null>(null)

  function setActiveSpace(space: Space | null) {
    setActiveSpaceState(space)

    if (userId) {
      storeActiveSpace(userId, space)
    }
  }

  useEffect(() => {
    if (!userId) {
      setActiveSpaceState(null)
      return
    }

    let active = true
    const currentUserId = userId
    const cachedSpace = readStoredSpace(currentUserId)

    // Restore immediately so refreshes do not make the user reselect a Space.
    setActiveSpaceState(cachedSpace)

    async function validateCachedSpace() {
      try {
        const spaces = await getMySpaces()
        const savedSpace = cachedSpace
          ? spaces.find((space) => space.id === cachedSpace.id) ?? null
          : null

        if (!active) {
          return
        }

        setActiveSpaceState(savedSpace)

        if (!savedSpace) {
          storeActiveSpace(currentUserId, null)
        } else {
          storeActiveSpace(currentUserId, savedSpace)
        }
      } catch {
        // Keep the cached Space during a temporary network failure. Supabase
        // RLS still controls whether its private data can actually be read.
      }
    }

    void validateCachedSpace()

    return () => {
      active = false
    }
  }, [userId])

  return (
    <SpaceContext.Provider value={{ activeSpace, setActiveSpace }}>
      {children}
    </SpaceContext.Provider>
  )
}
