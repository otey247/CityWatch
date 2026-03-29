import type {
  CommunicationActionRecord,
  CommunicationActionType,
  ActionImpactPreview,
  GameState,
  DraftCommunication,
} from '../types';

let commCounter = 0;
export function nextCommId() {
  return `comm-${Date.now()}-${++commCounter}`;
}

interface CommEffect {
  panicDelta: number;
  trustDelta: number;
  infrastructureDelta: number;
}

export function computeCommEffect(
  actionType: CommunicationActionType,
  targetDistrictId: string | null,
  urgency: 'low' | 'medium' | 'high',
  state: GameState
): CommEffect {
  const district = targetDistrictId ? state.city.districtsById[targetDistrictId] : null;
  const trustMultiplier = district ? district.trust / 100 : state.city.citywideTrust / 100;
  const panicLevel = district ? district.panic : state.city.citywidePanic;

  switch (actionType) {
    case 'district_alert':
      return {
        panicDelta: urgency === 'high' ? 8 : urgency === 'medium' ? 4 : 2,
        trustDelta: trustMultiplier > 0.6 ? 3 : -2,
        infrastructureDelta: 0,
      };
    case 'targeted_text':
      return {
        panicDelta: 1,
        trustDelta: 2,
        infrastructureDelta: 0,
      };
    case 'responder_tip':
      return {
        panicDelta: -3,
        trustDelta: 5,
        infrastructureDelta: 2,
      };
    case 'transit_notice':
      return {
        panicDelta: urgency === 'high' ? 6 : 3,
        trustDelta: 1,
        infrastructureDelta: -2,
      };
    case 'building_alarm':
      return {
        panicDelta: 10,
        trustDelta: -5,
        infrastructureDelta: 0,
      };
    case 'public_bulletin':
      return {
        panicDelta: panicLevel > 50 ? 12 : 5,
        trustDelta: panicLevel > 50 ? -8 : 2,
        infrastructureDelta: 0,
      };
    default:
      return { panicDelta: 0, trustDelta: 0, infrastructureDelta: 0 };
  }
}

export function getImpactPreview(
  draft: DraftCommunication,
  state: GameState
): ActionImpactPreview | null {
  if (!draft.actionType) return null;
  const effect = computeCommEffect(
    draft.actionType,
    draft.targetDistrictId,
    draft.urgency,
    state
  );
  const district = draft.targetDistrictId
    ? state.city.districtsById[draft.targetDistrictId]
    : null;
  const trust = district?.trust ?? state.city.citywideTrust;

  return {
    projectedCompliance: Math.round(trust * 0.8 + 20),
    projectedTrustImpact: effect.trustDelta,
    projectedPanicImpact: effect.panicDelta,
    description: getEffectDescription(draft.actionType, effect),
  };
}

function getEffectDescription(type: CommunicationActionType, effect: CommEffect): string {
  const parts: string[] = [];
  if (effect.panicDelta > 0) parts.push(`+${effect.panicDelta} panic`);
  if (effect.panicDelta < 0) parts.push(`${effect.panicDelta} panic`);
  if (effect.trustDelta > 0) parts.push(`+${effect.trustDelta} trust`);
  if (effect.trustDelta < 0) parts.push(`${effect.trustDelta} trust`);
  if (effect.infrastructureDelta !== 0)
    parts.push(`${effect.infrastructureDelta > 0 ? '+' : ''}${effect.infrastructureDelta} infra`);

  const base: Record<CommunicationActionType, string> = {
    district_alert: 'Alerts district residents to potential threat.',
    targeted_text: 'Sends personal safety update to individual.',
    responder_tip: 'Tips responders to suspected activity.',
    transit_notice: 'Issues transit advisory for the area.',
    building_alarm: 'Triggers emergency evacuation alarm.',
    public_bulletin: 'Broadcasts city-wide public warning.',
  };

  return `${base[type]} Effects: ${parts.join(', ') || 'minimal'}.`;
}

export function buildActionRecord(
  draft: DraftCommunication,
  state: GameState,
  elapsed: number
): CommunicationActionRecord {
  const effect = draft.actionType
    ? computeCommEffect(draft.actionType, draft.targetDistrictId, draft.urgency, state)
    : { panicDelta: 0, trustDelta: 0, infrastructureDelta: 0 };

  const district = draft.targetDistrictId
    ? state.city.districtsById[draft.targetDistrictId]
    : null;
  const trust = district?.trust ?? state.city.citywideTrust;

  return {
    id: nextCommId(),
    actionType: draft.actionType ?? 'district_alert',
    targetScope: draft.targetDistrictId ? 'district' : 'city',
    targetDistrictId: draft.targetDistrictId,
    targetRecipientId: null,
    urgency: draft.urgency,
    projectedCompliance: Math.round(trust * 0.8 + 20),
    projectedTrustImpact: effect.trustDelta,
    projectedPanicImpact: effect.panicDelta,
    delaySeconds: draft.urgency === 'high' ? 0 : draft.urgency === 'medium' ? 5 : 10,
    sentAt: elapsed,
    message: draft.message,
  };
}
