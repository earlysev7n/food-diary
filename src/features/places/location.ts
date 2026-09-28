// Purpose: Read the device location only after the user grants permission.

export type UserLocation = {
  latitude: number
  longitude: number
}

export function getCurrentLocation(): Promise<UserLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Location is not supported by this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
        })
      },
      (error) => {
        const messageByCode: Record<number, string> = {
          1: 'Location permission was denied.',
          2: 'Your location could not be determined.',
          3: 'Location lookup timed out.',
        }

        reject(
          new Error(
            messageByCode[error.code] ?? 'Unable to read your location.',
          ),
        )
      },
      {
        enableHighAccuracy: false,
        maximumAge: 300000,
        timeout: 10000,
      },
    )
  })
}
