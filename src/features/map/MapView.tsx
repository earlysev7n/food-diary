// Purpose: Render the OpenStreetMap layer, saved place markers, and user location.

import { useEffect, useRef } from 'react'
import {
  AttributionControl,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
  type StyleSpecification,
} from 'maplibre-gl'
import type { Place } from '../places/types'
import { useUserLocation } from '../places/useUserLocation'

type MapViewProps = {
  places?: Place[]
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
  // Favorites use the warm app accent color.
  if (place.is_favorite) {
    return '#c75b32'
  }

  // Visited and wishlist places get different colors.
  return place.status === 'visited' ? '#367347' : '#d28b41'
}

export function MapView({ places = [] }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markersRef = useRef<Marker[]>([])
  const userMarkerRef = useRef<Marker | null>(null)
  const {
    location: userLocation,
    loading: locating,
    error: locationError,
    locate,
  } = useUserLocation()

  useEffect(() => {
    if (!mapContainer.current) {
      return
    }

    // Create the map once when the component mounts.
    const map = new MapLibreMap({
      container: mapContainer.current,
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

    return () => {
      // Remove the map and all related browser resources.
      map.remove()
      mapRef.current = null
    }
  }, [])

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
      return new Marker({ color: getMarkerColor(place) })
        .setLngLat([place.longitude, place.latitude])
        .setPopup(
          new Popup({ offset: 24 }).setText(
            `${place.name} — ${
              place.status === 'visited' ? 'Visited' : 'Want to try'
            }`,
          ),
        )
        .addTo(map)
    })

    return () => {
      // Clean up markers when the place list changes.
      markersRef.current.forEach((marker) => marker.remove())
      markersRef.current = []
    }
  }, [places])

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
    <div className="relative h-[32rem] w-full overflow-hidden rounded-[2rem] border border-[#eadfd6] shadow-sm">
      <div ref={mapContainer} className="h-full w-full" />

      <button
        type="button"
        onClick={() => void locate()}
        disabled={locating}
        className="absolute left-3 top-3 z-10 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-[#34251f] shadow disabled:opacity-60"
      >
        {locating ? 'Finding you…' : 'Refresh my location'}
      </button>

      {locationError && (
        <p className="absolute bottom-3 left-3 right-3 z-10 rounded-xl bg-white/95 px-3 py-2 text-xs text-[#ad3f2d] shadow">
          {locationError}
        </p>
      )}
    </div>
  )
}
