import type {
  GameState,
  OperationsUIState,
  Incident,
  District,
  DistrictVisualStatus,
  CitywideStatusSummary,
  SuggestedAction,
  ActionImpactPreview,
  DraftCommunication,
} from '../types';
import { getImpactPreview } from '../systems/communicationSystem';

export function getSortedIncidentFeed(
  state: GameState,
  filter: OperationsUIState['incidentFeedFilter']
): Incident[] {
  const all = state.incidents.activeIds
    .map((id) => state.incidents.incidentsById[id])
    .filter(Boolean);

  const filtered =
    filter === 'critical'
      ? all.filter((i) => i.severity >= 4)
      : filter === 'resolved'
      ? state.incidents.resolvedIds
          .map((id) => state.incidents.incidentsById[id])
          .filter(Boolean)
      : filter === 'active'
      ? all.filter((i) => i.status === 'active')
      : all;

  return filtered.sort((a, b) => b.urgency - a.urgency || b.severity - a.severity);
}

export function getCriticalIncidentCount(state: GameState): number {
  return state.incidents.activeIds.filter((id) => {
    const inc = state.incidents.incidentsById[id];
    return inc && inc.severity >= 4;
  }).length;
}

export function getOpenIncidentCount(state: GameState): number {
  return state.incidents.activeIds.length;
}

export function getSelectedDistrict(
  state: GameState,
  uiState: OperationsUIState
): District | null {
  if (!uiState.selectedDistrictId) return null;
  return state.city.districtsById[uiState.selectedDistrictId] ?? null;
}

export function getSelectedIncident(
  state: GameState,
  uiState: OperationsUIState
): Incident | null {
  if (!uiState.selectedIncidentId) return null;
  return state.incidents.incidentsById[uiState.selectedIncidentId] ?? null;
}

function panicColor(panic: number): string {
  if (panic < 25) return '#1a3a2a';
  if (panic < 50) return '#2d4a1e';
  if (panic < 70) return '#4a3000';
  if (panic < 85) return '#5c1a00';
  return '#7a0000';
}

export function getDistrictVisualStatus(
  state: GameState,
  districtId: string
): DistrictVisualStatus {
  const d = state.city.districtsById[districtId];
  if (!d) {
    return {
      districtId,
      panicLevel: 'calm',
      trustLevel: 'high',
      incidentMarkers: 0,
      color: '#1a3a2a',
    };
  }

  const panicLevel =
    d.panic >= 85 ? 'critical' : d.panic >= 65 ? 'volatile' : d.panic >= 40 ? 'tense' : 'calm';
  const trustLevel =
    d.trust >= 65 ? 'high' : d.trust >= 45 ? 'medium' : d.trust >= 25 ? 'low' : 'collapsed';
  const incidentMarkers = state.incidents.activeIds.filter(
    (id) => state.incidents.incidentsById[id]?.districtId === districtId
  ).length;

  return {
    districtId,
    panicLevel,
    trustLevel,
    incidentMarkers,
    color: panicColor(d.panic),
  };
}

export function getCitywideStatus(state: GameState): CitywideStatusSummary {
  return {
    trust: state.city.citywideTrust,
    panic: state.city.citywidePanic,
    integrity: state.city.citywideIntegrity,
    openIncidents: state.incidents.activeIds.length,
    criticalIncidents: getCriticalIncidentCount(state),
    phase: state.run.phase,
    entityPhase: state.entity.phase,
  };
}

export function getSuggestedActions(
  state: GameState,
  uiState: OperationsUIState
): SuggestedAction[] {
  const suggestions: SuggestedAction[] = [];
  const district = getSelectedDistrict(state, uiState);
  const incident = getSelectedIncident(state, uiState);

  if (incident) {
    if (incident.type === 'violent_attack' || incident.type === 'suspicious_disappearance') {
      suggestions.push({
        actionType: 'responder_tip',
        targetDistrictId: incident.districtId,
        rationale: 'Direct responders to the scene for rapid response.',
        urgency: 'high',
      });
    }
    if (incident.type === 'public_panic_flare' || incident.severity >= 4) {
      suggestions.push({
        actionType: 'district_alert',
        targetDistrictId: incident.districtId,
        rationale: 'Issue a formal alert to coordinate public response.',
        urgency: 'high',
      });
    }
    if (incident.type === 'transit_disruption') {
      suggestions.push({
        actionType: 'transit_notice',
        targetDistrictId: incident.districtId,
        rationale: 'Advise commuters to avoid disrupted transit routes.',
        urgency: 'medium',
      });
    }
  }

  if (district) {
    if (district.panic > 60 && suggestions.length < 3) {
      suggestions.push({
        actionType: 'targeted_text',
        targetDistrictId: district.id,
        rationale: 'Send targeted reassurance to at-risk residents.',
        urgency: 'medium',
      });
    }
    if (district.trust < 40 && suggestions.length < 3) {
      suggestions.push({
        actionType: 'public_bulletin',
        targetDistrictId: null,
        rationale: 'Publish a city-wide bulletin to rebuild credibility.',
        urgency: 'low',
      });
    }
  }

  return suggestions.slice(0, 3);
}

export function getCommunicationImpactPreview(
  state: GameState,
  draft: DraftCommunication
): ActionImpactPreview | null {
  return getImpactPreview(draft, state);
}

export function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
