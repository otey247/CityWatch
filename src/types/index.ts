// ─── Enums & Literals ────────────────────────────────────────────────────────

export type RunPhase = 'early' | 'mid' | 'late' | 'ended';
export type DifficultyLevel = 'easy' | 'normal' | 'hard';
export type RunOutcome = 'victory' | 'failure' | null;

export type EntityPhase = 'hidden' | 'recognized' | 'crisis';

export type IncidentType =
  | 'suspicious_disappearance'
  | 'violent_attack'
  | 'camera_outage'
  | 'emergency_call_spike'
  | 'false_alarm'
  | 'responder_delay'
  | 'transit_disruption'
  | 'public_panic_flare'
  | 'signal_spoofing';

export type IncidentStatus = 'active' | 'resolved' | 'expired' | 'escalated';

export type CommunicationActionType =
  | 'district_alert'
  | 'targeted_text'
  | 'responder_tip'
  | 'transit_notice'
  | 'building_alarm'
  | 'public_bulletin';

export type IncidentFeedFilter = 'all' | 'critical' | 'active' | 'resolved';

export type MapOverlayMode = 'panic' | 'trust' | 'incidents' | 'cameras' | 'responders';

export type TimeSpeed = 'paused' | 'slow' | 'normal' | 'fast';

export type ContextTab = 'district' | 'incident' | 'actions' | 'effects';

export type DistrictOutcomeHint = 'stable' | 'contested' | 'lost' | 'unknown';

// ─── District ────────────────────────────────────────────────────────────────

export interface District {
  id: string;
  name: string;
  adjacencyIds: string[];
  populationDensity: number; // 0-100
  panic: number;             // 0-100
  trust: number;             // 0-100
  policePresence: number;    // 0-100
  medicalLoad: number;       // 0-100
  infrastructureStability: number; // 0-100
  transitActivity: number;   // 0-100
  cameraCoverage: number;    // 0-100
  incidentCount: number;
  responderPressure: number; // 0-100
  threatSuspicion: number;   // 0-100
  // geometry for SVG map (rough polygon points as percentage coords)
  svgPoints: string;
  labelX: number;
  labelY: number;
}

// ─── Incident ────────────────────────────────────────────────────────────────

export interface Incident {
  id: string;
  type: IncidentType;
  districtId: string;
  severity: number;        // 1-5
  confidence: number;      // 0-100
  urgency: number;         // 0-100
  timestamp: number;       // elapsed seconds when created
  status: IncidentStatus;
  linkedIncidentIds: string[];
  suspectedCause: string;
  casualtiesEstimate: number;
  responderAssigned: boolean;
  description: string;
}

// ─── Evidence ────────────────────────────────────────────────────────────────

export interface EvidenceFragment {
  id: string;
  incidentId: string;
  source: string;
  content: string;
  confidence: number;
  timestamp: number;
}

// ─── Camera ──────────────────────────────────────────────────────────────────

export interface CameraState {
  id: string;
  districtId: string;
  online: boolean;
  feedCorrupted: boolean;
}

// ─── Communication ───────────────────────────────────────────────────────────

export interface CommunicationActionRecord {
  id: string;
  actionType: CommunicationActionType;
  targetScope: 'district' | 'city' | 'individual' | 'transit';
  targetDistrictId: string | null;
  targetRecipientId: string | null;
  urgency: 'low' | 'medium' | 'high';
  projectedCompliance: number;
  projectedTrustImpact: number;
  projectedPanicImpact: number;
  delaySeconds: number;
  sentAt: number;
  message: string;
}

export interface ActionImpactPreview {
  projectedCompliance: number;
  projectedTrustImpact: number;
  projectedPanicImpact: number;
  description: string;
}

// ─── Suggested Actions ───────────────────────────────────────────────────────

export interface SuggestedAction {
  actionType: CommunicationActionType;
  targetDistrictId: string | null;
  rationale: string;
  urgency: 'low' | 'medium' | 'high';
}

// ─── Run State ───────────────────────────────────────────────────────────────

export interface RunState {
  runId: string;
  phase: RunPhase;
  elapsedSeconds: number;
  seed: string;
  difficulty: DifficultyLevel;
  outcome: RunOutcome;
}

// ─── City State ──────────────────────────────────────────────────────────────

export interface CityState {
  districtIds: string[];
  districtsById: Record<string, District>;
  citywideTrust: number;
  citywidePanic: number;
  citywideIntegrity: number;
}

// ─── Incident State ──────────────────────────────────────────────────────────

export interface IncidentState {
  activeIds: string[];
  resolvedIds: string[];
  incidentsById: Record<string, Incident>;
}

// ─── Entity State ────────────────────────────────────────────────────────────

export interface EntityState {
  phase: EntityPhase;
  concealment: number;       // 0-100
  aggression: number;        // 0-100
  exposureRisk: number;      // 0-100
  influenceLevel: number;    // 0-100
  recentActionIds: string[];
}

// ─── Intelligence State ──────────────────────────────────────────────────────

export interface IntelligenceState {
  cameraStatesById: Record<string, CameraState>;
  evidenceByIncidentId: Record<string, EvidenceFragment[]>;
  districtSuspicionById: Record<string, number>;
}

// ─── Communications State ────────────────────────────────────────────────────

export interface CommunicationsState {
  sentActionIds: string[];
  pendingActionIds: string[];
  actionsById: Record<string, CommunicationActionRecord>;
}

// ─── Response State ──────────────────────────────────────────────────────────

export interface ResponseState {
  policeLoadByDistrictId: Record<string, number>;
  medicalLoadByDistrictId: Record<string, number>;
  transitLoadByDistrictId: Record<string, number>;
}

// ─── Summary State ───────────────────────────────────────────────────────────

export interface SummaryTrackingState {
  keyEventIds: string[];
  definingActionIds: string[];
  districtOutcomeHints: Record<string, DistrictOutcomeHint>;
}

// ─── Full Game State ─────────────────────────────────────────────────────────

export interface GameState {
  run: RunState;
  city: CityState;
  incidents: IncidentState;
  entity: EntityState;
  intelligence: IntelligenceState;
  communications: CommunicationsState;
  responses: ResponseState;
  summary: SummaryTrackingState;
}

// ─── UI State ────────────────────────────────────────────────────────────────

export interface OperationsUIState {
  selectedDistrictId: string | null;
  selectedIncidentId: string | null;
  activeContextTab: ContextTab;
  isCommunicationsDrawerOpen: boolean;
  isIncidentDetailDrawerOpen: boolean;
  activeCommunicationType: CommunicationActionType | null;
  incidentFeedFilter: IncidentFeedFilter;
  mapOverlayMode: MapOverlayMode;
  timeSpeed: TimeSpeed;
  hoveredDistrictId: string | null;
  hoveredIncidentId: string | null;
}

// ─── Derived / Visual ────────────────────────────────────────────────────────

export interface DistrictVisualStatus {
  districtId: string;
  panicLevel: 'calm' | 'tense' | 'volatile' | 'critical';
  trustLevel: 'high' | 'medium' | 'low' | 'collapsed';
  incidentMarkers: number;
  color: string;
}

export interface CitywideStatusSummary {
  trust: number;
  panic: number;
  integrity: number;
  openIncidents: number;
  criticalIncidents: number;
  phase: RunPhase;
  entityPhase: EntityPhase;
}

export interface RunEndCondition {
  outcome: 'victory' | 'failure';
  reason: string;
}

export interface KeyRunEvent {
  timestamp: number;
  description: string;
  type: 'incident' | 'action' | 'entity' | 'system';
  districtId: string | null;
}

export interface DraftCommunication {
  actionType: CommunicationActionType | null;
  targetDistrictId: string | null;
  urgency: 'low' | 'medium' | 'high';
  message: string;
}

export type AppScreen = 'briefing' | 'operations' | 'summary';
