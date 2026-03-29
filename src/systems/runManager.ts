import type { GameState, District, RunPhase, RunEndCondition } from '../types';

// Phase transitions (in seconds)
const PHASE_EARLY_END = 300;   // 5 minutes
const PHASE_MID_END = 900;     // 15 minutes
const MAX_RUN_DURATION = 1500; // 25 minutes

export function getRunPhase(elapsed: number): RunPhase {
  if (elapsed < PHASE_EARLY_END) return 'early';
  if (elapsed < PHASE_MID_END) return 'mid';
  if (elapsed < MAX_RUN_DURATION) return 'late';
  return 'ended';
}

export function getRunEndCondition(state: GameState): RunEndCondition | null {
  const { run, city, entity } = state;

  if (run.outcome !== null) {
    return { outcome: run.outcome, reason: 'Run already ended.' };
  }

  // Victory: entity phase crisis AND citywidePanic < 60 AND citywideIntegrity > 40
  if (entity.phase === 'crisis' && entity.exposureRisk >= 100) {
    return { outcome: 'victory', reason: 'Threat exposed and neutralized by responders.' };
  }

  // Failure: citywide panic or integrity collapse
  if (city.citywidePanic >= 95) {
    return { outcome: 'failure', reason: 'City descended into mass panic.' };
  }
  if (city.citywideIntegrity <= 5) {
    return { outcome: 'failure', reason: 'City infrastructure collapsed.' };
  }
  if (city.citywideTrust <= 5) {
    return { outcome: 'failure', reason: 'Public trust in emergency services collapsed.' };
  }

  // Too many districts lost
  const lostDistricts = Object.values(city.districtsById).filter(
    (d: District) => d.panic >= 95 && d.trust <= 10
  );
  if (lostDistricts.length >= 4) {
    return { outcome: 'failure', reason: 'Four or more districts fell to chaos.' };
  }

  // Time victory
  if (run.phase === 'ended') {
    const avgPanic =
      Object.values(city.districtsById).reduce((s, d) => s + d.panic, 0) /
      Object.values(city.districtsById).length;
    if (avgPanic < 60) {
      return { outcome: 'victory', reason: 'Threat contained before city collapse.' };
    }
    return { outcome: 'failure', reason: 'Time ran out and the city was destabilized.' };
  }

  return null;
}

export function computeCitywideStats(
  districtsById: Record<string, District>
): { trust: number; panic: number; integrity: number } {
  const districts = Object.values(districtsById);
  if (districts.length === 0) return { trust: 50, panic: 50, integrity: 50 };
  const avg = (key: keyof District) =>
    districts.reduce((s, d) => s + (d[key] as number), 0) / districts.length;
  return {
    trust: avg('trust'),
    panic: avg('panic'),
    integrity: avg('infrastructureStability'),
  };
}
