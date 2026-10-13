// Purpose: Automatically request device location once per screen and expose a retry action.

import { useCallback, useEffect, useState } from 'react'
import { getCurrentLocation, type UserLocation } from './location'

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(false)
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
    let mounted = true

    async function loadPreviouslyGrantedLocation() {
      // Do not trigger a permission prompt on page load. If the browser
      // already granted access, reading the location is silent.
      if (!navigator.permissions?.query) {
        return
      }

      try {
        const permission = await navigator.permissions.query({
          name: 'geolocation',
        })

        if (mounted && permission.state === 'granted') {
          void locate()
        }
      } catch {
        // Some browsers do not expose geolocation permission state. In that
        // case, wait for the user to press Refresh my location.
      }
    }

    void loadPreviouslyGrantedLocation()

    return () => {
      mounted = false
    }
  }, [locate])

  return {
    location,
    loading,
    error,
    locate,
  }
}
