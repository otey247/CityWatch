import type { EntityState, GameState } from '../types';

export function tickEntity(entity: EntityState, state: GameState, deltaSeconds: number): Partial<EntityState> {
  const { city, incidents } = state;
  const avgPanic = city.citywidePanic;
  const avgTrust = city.citywideTrust;
  const activeIncidents = incidents.activeIds.length;

  // Aggression rises with panic, trust falling, and low police presence
  const aggressionPush = (avgPanic / 100) * 0.05 * deltaSeconds;
  const aggressionDrag = (avgTrust / 100) * 0.02 * deltaSeconds;
  const newAggression = Math.max(0, Math.min(100, entity.aggression + aggressionPush - aggressionDrag));

  // Exposure risk increases with each incident resolved (entity seen)
  const resolvedCount = state.incidents.resolvedIds.length;
  const newExposureRisk = Math.min(100, resolvedCount * 8 + newAggression * 0.3);

  // Concealment falls with exposure and active incidents
  const newConcealment = Math.max(0, 100 - newExposureRisk - activeIncidents * 2);

  // Phase transitions
  let newPhase = entity.phase;
  if (entity.phase === 'hidden' && newExposureRisk >= 30) {
    newPhase = 'recognized';
  } else if (entity.phase === 'recognized' && newAggression >= 70) {
    newPhase = 'crisis';
  }

  return {
    phase: newPhase,
    aggression: newAggression,
    exposureRisk: newExposureRisk,
    concealment: newConcealment,
    influenceLevel: Math.min(100, newAggression * 0.5 + (100 - avgTrust) * 0.3),
  };
}
