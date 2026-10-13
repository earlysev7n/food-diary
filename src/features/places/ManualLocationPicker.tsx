// Purpose: Let users place a map pin when address geocoding cannot find a place.

import { useEffect, useRef } from 'react'
import {
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  type StyleSpecification,
} from 'maplibre-gl'

type Coordinates = {
  latitude: number
  longitude: number
}

type ManualLocationPickerProps = {
  center: [number, number]
  value: Coordinates | null
  onChange: (coordinates: Coordinates) => void
}

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

export function ManualLocationPicker({
  center,
  value,
  onChange,
}: ManualLocationPickerProps) {
  const centerLongitude = center[0]
  const centerLatitude = center[1]
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerRef = useRef<Marker | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const map = new MapLibreMap({
      container,
      style: openStreetMapStyle,
      center: [centerLongitude, centerLatitude],
      zoom: 15,
    })

    map.addControl(new NavigationControl(), 'top-right')
    map.on('click', (event) => {
      onChangeRef.current({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      })
    })

    mapRef.current = map

    const resizeObserver = new ResizeObserver(() => map.resize())
    resizeObserver.observe(container)

    return () => {
      resizeObserver.disconnect()
      markerRef.current?.remove()
      markerRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [centerLatitude, centerLongitude])

  useEffect(() => {
    const map = mapRef.current

    if (!map) {
      return
    }

    markerRef.current?.remove()
    markerRef.current = null

    if (value) {
      const selectedPoint: [number, number] = [
        value.longitude,
        value.latitude,
      ]

      markerRef.current = new Marker({ color: '#c75b32' })
        .setLngLat(selectedPoint)
        .addTo(map)

      // Bring an address result into view so the user can fine-tune the pin.
      map.flyTo({ center: selectedPoint, zoom: 16, essential: true })
    }
  }, [value])

  return (
    <div className="mt-4">
      <p className="text-sm font-medium text-[#59483f]">
        Map pin (tap to adjust)
      </p>
      <div
        ref={containerRef}
        className="mt-2 h-60 w-full overflow-hidden rounded-2xl border border-[#ddc9bb]"
      />
      <p className="mt-2 text-xs text-[#806f64]">
        {value
          ? `Pin selected at ${value.latitude.toFixed(5)}, ${value.longitude.toFixed(5)}`
          : 'Find an address above or tap the map to place the pin.'}
      </p>
    </div>
  )
}
