/**
 * Utility to convert location strings into lat/lng coordinates.
 * Contains preset coordinates for common Bangladesh locations with fallbacks.
 */

const KNOWN_LOCATIONS: Record<string, { lat: number; lng: number }> = {
  dhaka: { lat: 23.8103, lng: 90.4125 },
  sylhet: { lat: 24.8949, lng: 91.8687 },
  chittagong: { lat: 22.3569, lng: 91.7832 },
  chattogram: { lat: 22.3569, lng: 91.7832 },
  feni: { lat: 23.0159, lng: 91.3976 },
  sunamganj: { lat: 25.0658, lng: 91.395 },
  kurigram: { lat: 25.8054, lng: 89.6361 },
  khulna: { lat: 22.8456, lng: 89.5403 },
  coxsbazar: { lat: 21.4272, lng: 92.0058 },
  "cox's bazar": { lat: 21.4272, lng: 92.0058 },
  barisal: { lat: 22.701, lng: 90.3535 },
  rajshahi: { lat: 24.3636, lng: 88.6241 },
  rangpur: { lat: 25.7439, lng: 89.2752 },
  mymensingh: { lat: 24.7471, lng: 90.4203 },
  comilla: { lat: 23.4607, lng: 91.1809 },
  cumilla: { lat: 23.4607, lng: 91.1809 },
  bogura: { lat: 24.8481, lng: 89.373 },
  bogra: { lat: 24.8481, lng: 89.373 },
  noakhali: { lat: 22.8696, lng: 91.0993 },
};

export async function geocodeLocation(locationStr: string): Promise<{ lat: number; lng: number }> {
  if (!locationStr) {
    return { lat: 23.8103, lng: 90.4125 }; // Default Dhaka
  }

  const normalized = locationStr.toLowerCase();

  for (const [key, coords] of Object.entries(KNOWN_LOCATIONS)) {
    if (normalized.includes(key)) {
      // Add tiny jitter so markers in the same city don't completely overlap
      const jitterLat = (Math.random() - 0.5) * 0.03;
      const jitterLng = (Math.random() - 0.5) * 0.03;
      return {
        lat: Number((coords.lat + jitterLat).toFixed(4)),
        lng: Number((coords.lng + jitterLng).toFixed(4)),
      };
    }
  }

  // Fallback to fetch from OpenStreetMap Nominatim API if unknown location
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationStr)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'RescueLink/1.0' } });
    if (res.ok) {
      const data = (await res.json()) as Array<{ lat: string; lon: string }>;
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
        };
      }
    }
  } catch (err) {
    // Return default on network failure
  }

  return { lat: 23.8103, lng: 90.4125 };
}
