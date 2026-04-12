// Geolocation helpers: postal code geocoding, user location, distance

const ONEMAP_URL = 'https://www.onemap.gov.sg/api/common/elastic/search'
const CACHE_KEY = 'clinicq_geocode_cache'

// Read cached postal code -> {lat, lng} entries from localStorage
function readCache() {
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

// Write a single postal code result into the localStorage cache
function writeCache(postalCode, coords) {
  try {
    const cache = readCache()
    cache[postalCode] = coords
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // ignore quota errors
  }
}

/**
 * Converts a Singapore postal code to {lat, lng} using the OneMap API.
 * Results are cached in localStorage so repeat lookups stay free.
 * @param {string} postalCode
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export async function geocodePostalCode(postalCode) {
  if (!postalCode) return null

  // Check cache first
  const cache = readCache()
  if (cache[postalCode]) return cache[postalCode]

  try {
    const url = `${ONEMAP_URL}?searchVal=${encodeURIComponent(postalCode)}&returnGeom=Y&getAddrDetails=N&pageNum=1`
    const res = await fetch(url)
    if (!res.ok) return null

    const data = await res.json()
    const first = data.results?.[0]
    if (!first?.LATITUDE || !first?.LONGITUDE) return null

    const coords = { lat: Number(first.LATITUDE), lng: Number(first.LONGITUDE) }
    writeCache(postalCode, coords)
    return coords
  } catch (err) {
    console.warn('[geo] geocodePostalCode failed:', err)
    return null
  }
}

/**
 * Asks the browser for the user's current location.
 * Resolves to null if permission is denied or geolocation is unsupported.
 * @returns {Promise<{lat: number, lng: number} | null>}
 */
export function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60000 }
    )
  })
}

/**
 * Great-circle distance between two lat/lng points in kilometers.
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number}
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
