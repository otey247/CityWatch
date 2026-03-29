import type { District, CityState } from '../types';

const SPILLOVER_FACTOR = 0.04;
const DECAY_RATE = 0.002;

// Natural drift each tick (called each simulated second)
export function tickDistrict(district: District, deltaSeconds: number): Partial<District> {
  const dt = deltaSeconds;
  // Panic slowly decays, trust slowly recovers
  const panicDelta = -DECAY_RATE * dt * (district.panic > 20 ? 1 : 0.2);
  const trustDelta = DECAY_RATE * dt * (district.trust < 80 ? 1 : 0.2);

  return {
    panic: Math.max(0, Math.min(100, district.panic + panicDelta)),
    trust: Math.max(0, Math.min(100, district.trust + trustDelta)),
  };
}

// Apply spillover from neighbors
export function applySpillover(
  districtId: string,
  districtsById: Record<string, District>,
  deltaSeconds: number
): Partial<District> {
  const district = districtsById[districtId];
  const neighbors = district.adjacencyIds
    .map((id) => districtsById[id])
    .filter(Boolean);

  if (neighbors.length === 0) return {};

  const avgNeighborPanic =
    neighbors.reduce((s, n) => s + n.panic, 0) / neighbors.length;
  const avgNeighborTrust =
    neighbors.reduce((s, n) => s + n.trust, 0) / neighbors.length;

  const panicSpill = (avgNeighborPanic - district.panic) * SPILLOVER_FACTOR * deltaSeconds * 0.1;
  const trustSpill = (avgNeighborTrust - district.trust) * SPILLOVER_FACTOR * deltaSeconds * 0.1;

  return {
    panic: Math.max(0, Math.min(100, district.panic + panicSpill)),
    trust: Math.max(0, Math.min(100, district.trust + trustSpill)),
  };
}

export function tickCityState(cityState: CityState, deltaSeconds: number): CityState {
  const updatedDistricts: Record<string, District> = {};

  for (const id of cityState.districtIds) {
    const district = cityState.districtsById[id];
    const naturalChange = tickDistrict(district, deltaSeconds);
    const spilloverChange = applySpillover(id, cityState.districtsById, deltaSeconds);

    updatedDistricts[id] = {
      ...district,
      ...naturalChange,
      panic: spilloverChange.panic ?? naturalChange.panic ?? district.panic,
      trust: spilloverChange.trust ?? naturalChange.trust ?? district.trust,
    };
  }

  // Recompute citywide averages
  const districts = Object.values(updatedDistricts);
  const avg = (key: keyof District) =>
    districts.reduce((s, d) => s + (d[key] as number), 0) / districts.length;

  return {
    ...cityState,
    districtsById: updatedDistricts,
    citywideTrust: avg('trust'),
    citywidePanic: avg('panic'),
    citywideIntegrity: avg('infrastructureStability'),
  };
}

export function applyPanicChange(
  district: District,
  delta: number
): Partial<District> {
  return { panic: Math.max(0, Math.min(100, district.panic + delta)) };
}

export function applyTrustChange(
  district: District,
  delta: number
): Partial<District> {
  return { trust: Math.max(0, Math.min(100, district.trust + delta)) };
}
