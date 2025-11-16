/**
 * Unit conversion utilities
 * All data is stored internally in metric units (km, liters)
 * These functions convert from user preferences to metric and back
 */

export function toKm(distance: number, unit: "KM" | "MILE"): number {
  if (unit === "KM") return distance;
  return distance * 1.609344;
}

export function fromKm(distanceKm: number, unit: "KM" | "MILE"): number {
  if (unit === "KM") return distanceKm;
  return distanceKm / 1.609344;
}

export function toLiters(volume: number, unit: "LITER" | "GALLON"): number {
  if (unit === "LITER") return volume;
  return volume * 3.785411784;
}

export function fromLiters(volumeL: number, unit: "LITER" | "GALLON"): number {
  if (unit === "LITER") return volumeL;
  return volumeL / 3.785411784;
}

/**
 * Calculate MPG from metric values (km and liters)
 */
export function mpgFromMetric(distanceKm: number, volumeL: number): number | null {
  if (distanceKm <= 0 || volumeL <= 0) return null;
  const miles = distanceKm / 1.609344;
  const gallons = volumeL / 3.785411784;
  return gallons > 0 ? miles / gallons : null;
}

/**
 * Calculate L/100km from distance in km and volume in liters
 */
export function calculateLPer100Km(distanceKm: number, volumeL: number): number | null {
  if (distanceKm <= 0 || volumeL <= 0) return null;
  return (volumeL / distanceKm) * 100;
}

/**
 * Convert economy value based on desired unit
 */
export function convertEconomy(
  economyLPer100Km: number,
  targetUnit: "L_PER_100KM" | "MPG"
): number {
  if (targetUnit === "L_PER_100KM") return economyLPer100Km;
  // Convert L/100km to MPG: MPG ≈ 235.214 / (L/100km)
  return 235.214 / economyLPer100Km;
}
