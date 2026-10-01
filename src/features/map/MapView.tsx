// Purpose: Render the OpenStreetMap layer, saved place markers, and user location.

import { useEffect, useRef, useState } from 'react'
import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  type StyleSpecification,
} from 'maplibre-gl'
import type { Place } from '../places/types'
import type { PublicFoodSpot } from '../places/types'
import { useUserLocation } from '../places/useUserLocation'
import { getPublicFoodSpots } from './publicFoodService'

type MapViewProps = {
  places?: Place[]
  onPlaceAction?: (place: Place) => void
  onPublicFoodSpotAction?: (spot: PublicFoodSpot) => void
  className?: string
}

const INITIAL_CENTER: [number, number] = [122.5621, 10.7202]

const openStreetMapStyle: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm',
      type: 'raster',
      source: 'osm',
    },
  ],
}

function getMarkerColor(place: Place) {
  // Visited and wishlist places get different colors.
  return place.status === 'visited' ? '#367347' : '#d28b41'
}

function createPopupContent(input: {
  title: string
  subtitle: string
  actionLabel?: string
  onAction?: () => void
}) {
  const content = document.createElement('div')
  content.className = 'min-w-40'

  const title = document.createElement('p')
  title.className = 'font-semibold text-[#34251f]'
  title.textContent = input.title
  content.appendChild(title)

  const subtitle = document.createElement('p')
  subtitle.className = 'mt-1 text-xs text-[#806f64]'
  subtitle.textContent = input.subtitle
  content.appendChild(subtitle)

  if (input.actionLabel && input.onAction) {
    const action = document.createElement('button')
    action.type = 'button'
    action.className =
      'mt-3 rounded-lg bg-[#34251f] px-3 py-2 text-xs font-semibold text-white'
    action.textContent = input.actionLabel
    action.addEventListener('click', input.onAction)
    content.appendChild(action)
  }

  return content
}

export function MapView({
  places = [],
  onPlaceAction,
  onPublicFoodSpotAction,
  className = 'h-[32rem]',
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const publicMarkersRef = useRef<Marker[]>([])
  const userMarkerRef = useRef<Marker | null>(null)
  const [publicFoodSpots, setPublicFoodSpots] = useState<PublicFoodSpot[]>([])
  const [publicFoodLoading, setPublicFoodLoading] = useState(false)
  const [publicFoodError, setPublicFoodError] = useState<string | null>(null)
  const {
    location: userLocation,
    loading: locating,
    error: locationError,
    locate,
  } = useUserLocation()

  useEffect(() => {
    const container = mapContainer.current

    if (!container) {
      return
    }

    // Create the map once when the component mounts.
    const map = new MapLibreMap({
      container,
      style: openStreetMapStyle,
      center: INITIAL_CENTER,
      zoom: 13,
    })

    map.addControl(new NavigationControl(), 'top-right')
    map.addControl(
      new AttributionControl({
        compact: true,
        customAttribution: '© OpenStreetMap contributors',
      }),
      'bottom-right',
    )

    mapRef.current = map

    const resizeObserver = new ResizeObserver(() => {
      map.resize()
    })
    resizeObserver.observe(container)

    return () => {
      // Remove the map and all related browser resources.
      resizeObserver.disconnect()
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    const mapInstance = map

    let mounted = true
    let requestId = 0
    let requestTimer: number | null = null
    let requestController: AbortController | null = null

    async function loadPublicFoodSpots() {
      if (mapInstance.getZoom() < 11) {
        requestController?.abort()
        requestController = null
        if (mounted) {
          setPublicFoodSpots([])
          setPublicFoodLoading(false)
          setPublicFoodError(null)
        }
        return
      }

      const bounds = mapInstance.getBounds()
      const currentRequestId = requestId + 1
      requestId = currentRequestId
      requestController?.abort()
      const controller = new AbortController()
      requestController = controller

      setPublicFoodLoading(true)
      setPublicFoodError(null)

      try {
        const spots = await getPublicFoodSpots(
          {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest(),
          },
          mapInstance.getZoom(),
          controller.signal,
        )

        if (mounted && currentRequestId === requestId) {
          setPublicFoodSpots(spots)
        }
      } catch (caughtError) {
        if (
          mounted &&
          currentRequestId === requestId &&
          !controller.signal.aborted
        ) {
          setPublicFoodError(
            caughtError instanceof Error
              ? caughtError.message
              : 'Unable to load public food spots.',
          )
        }
      } finally {
        if (mounted && currentRequestId === requestId) {
          setPublicFoodLoading(false)
        }
      }
    }

    function schedulePublicFoodLoad() {
      if (requestTimer !== null) {
        window.clearTimeout(requestTimer)
      }

      requestTimer = window.setTimeout(() => {
        void loadPublicFoodSpots()
      }, 350)
    }

    function handleMapLoad() {
      void loadPublicFoodSpots()
    }

    map.on('load', handleMapLoad)
    map.on('moveend', schedulePublicFoodLoad)

    return () => {
      mounted = false
      map.off('load', handleMapLoad)
      map.off('moveend', schedulePublicFoodLoad)
      requestController?.abort()

      if (requestTimer !== null) {
        window.clearTimeout(requestTimer)
      }
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    publicMarkersRef.current.forEach((marker) => marker.remove())
    publicMarkersRef.current = publicFoodSpots.map((spot) => {
      const popup = new Popup({ offset: 24 }).setDOMContent(
        createPopupContent({
          title: spot.name,
          subtitle: [spot.category, spot.address]
            .filter(Boolean)
            .join(' · '),
          actionLabel: 'Add to my Space',
          onAction: onPublicFoodSpotAction
            ? () => onPublicFoodSpotAction(spot)
            : undefined,
        }),
      )

      return new Marker({ color: '#64748b' })
        .setLngLat([spot.longitude, spot.latitude])
        .setPopup(popup)
        .addTo(map)
    })

    return () => {
      publicMarkersRef.current.forEach((marker) => marker.remove())
      publicMarkersRef.current = []
    }
  }, [publicFoodSpots, onPublicFoodSpotAction])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    // Remove old markers before drawing the latest place list.
    markersRef.current.forEach((marker) => marker.remove())
    markersRef.current = []

    markersRef.current = places.map((place) => {
      // Add one marker for each saved place.
      const isVisited = place.status === 'visited'
      const popup = new Popup({ offset: 24 }).setDOMContent(
        createPopupContent({
          title: place.name,
          subtitle: isVisited ? 'Visited in your Space' : 'Want to try',
          actionLabel: isVisited ? 'Open Diary' : 'Log a visit',
          onAction: onPlaceAction
            ? () => onPlaceAction(place)
            : undefined,
        }),
      )

      return new Marker({ color: getMarkerColor(place) })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(popup)
        .addTo(map)
    })

    return () => {
      // Clean up markers when the place list changes.
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
    }
  }, [places, onPlaceAction])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    // Replace the previous blue "you are here" marker.
    userMarkerRef.current?.remove()
    userMarkerRef.current = null

    if (!userLocation) {
      return
    }

    userMarkerRef.current = new Marker({ color: '#2563eb' })
      .setLngLat([userLocation.longitude, userLocation.latitude])
      .setPopup(new Popup({ offset: 24 }).setText('You are here'))
      .addTo(map)

    // Move the map to the detected position.
    map.flyTo({
      center: [userLocation.longitude, userLocation.latitude],
      zoom: 15,
    })

    return () => {
      userMarkerRef.current?.remove()
      userMarkerRef.current = null
    }
  }, [userLocation])

  return (
    <div
      className={`relative w-full overflow-hidden rounded-[2rem] border border-[#eadfd6] shadow-sm ${className}`}
    >
      <div ref={mapContainer} className="h-full w-full" />

      <button
        type="button"
        onClick={() => void locate()}
        disabled={locating}
        className="absolute left-3 top-3 z-10 max-w-[calc(100%-6rem)] truncate rounded-xl bg-white px-3 py-2 text-xs font-semibold text-[#34251f] shadow disabled:opacity-60 sm:text-sm"
      >
        {locating ? 'Finding you…' : 'Refresh my location'}
      </button>

      {locationError && (
        <p className="absolute bottom-3 left-3 right-3 z-10 rounded-xl bg-white/95 px-3 py-2 text-xs text-[#ad3f2d] shadow">
          {locationError}
        </p>
      )}

      {publicFoodLoading && (
        <p className="absolute right-3 top-3 z-10 rounded-xl bg-white/95 px-3 py-2 text-xs text-[#59483f] shadow">
          Loading nearby food spots…
        </p>
      )}

      {publicFoodError && (
        <p className="absolute bottom-3 left-3 right-3 z-10 rounded-xl bg-white/95 px-3 py-2 text-xs text-[#ad3f2d] shadow">
          {publicFoodError}
        </p>
      )}
    </div>
  )
}
