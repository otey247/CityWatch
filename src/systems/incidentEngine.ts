import type { Incident, IncidentType, GameState, EntityPhase } from '../types';

let incidentCounter = 0;
export function nextIncidentId() {
  return `inc-${Date.now()}-${++incidentCounter}`;
}

interface SpawnParams {
  type: IncidentType;
  districtId: string;
  severity: number;
  confidence: number;
  urgency: number;
  suspectedCause: string;
  description: string;
  elapsed: number;
}

export function createIncident(params: SpawnParams): Incident {
  return {
    id: nextIncidentId(),
    type: params.type,
    districtId: params.districtId,
    severity: params.severity,
    confidence: params.confidence,
    urgency: params.urgency,
    timestamp: params.elapsed,
    status: 'active',
    linkedIncidentIds: [],
    suspectedCause: params.suspectedCause,
    casualtiesEstimate: params.severity > 3 ? params.severity - 2 : 0,
    responderAssigned: false,
    description: params.description,
  };
}

const INCIDENT_SCRIPTS: Record<
  EntityPhase,
  Array<{
    type: IncidentType;
    severity: number;
    confidence: number;
    suspectedCause: string;
    description: string;
    districtBias?: string[];
  }>
> = {
  hidden: [
    {
      type: 'suspicious_disappearance',
      severity: 2,
      confidence: 40,
      suspectedCause: 'Unknown',
      description: 'A resident was reported missing by neighbors. Last seen near the waterfront.',
    },
    {
      type: 'camera_outage',
      severity: 1,
      confidence: 80,
      suspectedCause: 'Possible vandalism',
      description: 'Security camera feed went dark. Maintenance crew unresponsive.',
      districtBias: ['oldport', 'riverside'],
    },
    {
      type: 'false_alarm',
      severity: 1,
      confidence: 90,
      suspectedCause: 'Sensor malfunction',
      description: 'Alarm triggered at commercial building. No intruder found on scene.',
    },
    {
      type: 'emergency_call_spike',
      severity: 2,
      confidence: 60,
      suspectedCause: 'Unconfirmed disturbance',
      description: 'Dispatch received 3 calls in 10 minutes from the same block.',
    },
  ],
  recognized: [
    {
      type: 'violent_attack',
      severity: 4,
      confidence: 65,
      suspectedCause: 'Unknown assailant',
      description: 'Victim found injured in an alleyway. Witnesses describe a shadowed figure.',
    },
    {
      type: 'signal_spoofing',
      severity: 3,
      confidence: 35,
      suspectedCause: 'Interference source unknown',
      description: 'Police band picked up false dispatch codes. Units redirected before correction.',
    },
    {
      type: 'responder_delay',
      severity: 3,
      confidence: 75,
      suspectedCause: 'Units diverted',
      description: 'Ambulance reported 14-minute delay responding to cardiac event.',
    },
    {
      type: 'transit_disruption',
      severity: 2,
      confidence: 70,
      suspectedCause: 'Unplanned stop',
      description: 'Bus line 7 halted mid-route. Driver reported a passenger with a weapon.',
    },
    {
      type: 'public_panic_flare',
      severity: 3,
      confidence: 80,
      suspectedCause: 'Rumors spreading',
      description: 'Crowd formed outside the hospital after rumors of multiple victims circulated.',
    },
  ],
  crisis: [
    {
      type: 'violent_attack',
      severity: 5,
      confidence: 90,
      suspectedCause: 'Identified threat',
      description: 'Multiple victims reported. Suspect believed to be in the district.',
    },
    {
      type: 'public_panic_flare',
      severity: 5,
      confidence: 95,
      suspectedCause: 'Mass civilian response to ongoing threat',
      description: 'Crowds fleeing district. Emergency services overwhelmed at two locations.',
    },
    {
      type: 'camera_outage',
      severity: 4,
      confidence: 70,
      suspectedCause: 'Deliberate sabotage',
      description: 'Four cameras disabled in rapid succession. Pattern consistent with evasion.',
    },
    {
      type: 'emergency_call_spike',
      severity: 5,
      confidence: 95,
      suspectedCause: 'Confirmed threat',
      description: 'Dispatch flooded. Operator estimates 20+ calls from single district in 5 minutes.',
    },
  ],
};

function pickWeightedDistrict(
  districtIds: string[],
  suspects: Record<string, number>,
  bias?: string[]
): string {
  if (bias && bias.length > 0) {
    const valid = bias.filter((id) => districtIds.includes(id));
    if (valid.length > 0) return valid[Math.floor(Math.random() * valid.length)];
  }
  // Weight by suspicion
  const weights = districtIds.map((id) => 1 + (suspects[id] ?? 0) / 20);
  const total = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * total;
  for (let i = 0; i < districtIds.length; i++) {
    r -= weights[i];
    if (r <= 0) return districtIds[i];
  }
  return districtIds[districtIds.length - 1];
}

export function trySpawnIncident(
  state: GameState,
  elapsed: number
): Incident | null {
  const { entity, city, incidents } = state;
  const activeCount = incidents.activeIds.length;

  // Spawn rate scales with entity phase
  const baseRate = entity.phase === 'hidden' ? 0.03 : entity.phase === 'recognized' ? 0.07 : 0.12;

  // Don't flood the feed
  if (activeCount >= 12) return null;

  if (Math.random() > baseRate) return null;

  const scripts = INCIDENT_SCRIPTS[entity.phase];
  const script = scripts[Math.floor(Math.random() * scripts.length)];
  const districtId = pickWeightedDistrict(
    city.districtIds,
    state.intelligence.districtSuspicionById,
    script.districtBias
  );

  return createIncident({
    type: script.type,
    districtId,
    severity: script.severity,
    confidence: script.confidence,
    urgency: Math.min(100, script.severity * 20),
    suspectedCause: script.suspectedCause,
    description: script.description,
    elapsed,
  });
}

// Escalate unresolved incidents
export function escalateIncident(incident: Incident, deltaSeconds: number): Partial<Incident> {
  if (incident.status !== 'active') return {};
  const ageSeconds = deltaSeconds;
  // Urgency rises over time if not resolved
  const newUrgency = Math.min(100, incident.urgency + ageSeconds * 0.05);
  return { urgency: newUrgency };
}
