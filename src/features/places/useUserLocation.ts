// Purpose: Automatically request device location once per screen and expose a retry action.

import { useCallback, useEffect, useState } from 'react'
import { getCurrentLocation, type UserLocation } from './location'

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const locate = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // The browser prompts only when permission has not been decided yet.
      const currentLocation = await getCurrentLocation()
      setLocation(currentLocation)
      return currentLocation
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to use your location.',
      )
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Automatically try once when this screen opens.
    void locate()
  }, [locate])

  return {
    location,
    loading,
    error,
    locate,
  }
}
