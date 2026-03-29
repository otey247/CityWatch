import { create } from 'zustand';
import type {
  GameState,
  OperationsUIState,
  AppScreen,
  District,
  DraftCommunication,
  KeyRunEvent,
} from '../types';
import { INITIAL_DISTRICTS, INITIAL_CAMERAS } from '../data/cityData';
import { getRunPhase, getRunEndCondition, computeCitywideStats } from '../systems/runManager';
import { tickCityState } from '../systems/cityState';
import { trySpawnIncident, escalateIncident } from '../systems/incidentEngine';
import { tickEntity } from '../systems/entitySystem';
import { buildActionRecord, computeCommEffect } from '../systems/communicationSystem';

// ─── Initial States ───────────────────────────────────────────────────────────

function makeInitialGameState(): GameState {
  const districtsById: Record<string, District> = {};
  const districtIds: string[] = [];
  for (const d of INITIAL_DISTRICTS) {
    districtsById[d.id] = { ...d };
    districtIds.push(d.id);
  }

  const cameraStatesById: Record<string, import('../types').CameraState> = {};
  for (const c of INITIAL_CAMERAS) {
    cameraStatesById[c.id] = { ...c };
  }

  const districtSuspicionById: Record<string, number> = {};
  for (const id of districtIds) districtSuspicionById[id] = 0;

  const policeLoadByDistrictId: Record<string, number> = {};
  const medicalLoadByDistrictId: Record<string, number> = {};
  const transitLoadByDistrictId: Record<string, number> = {};
  for (const id of districtIds) {
    policeLoadByDistrictId[id] = 20;
    medicalLoadByDistrictId[id] = 20;
    transitLoadByDistrictId[id] = 20;
  }

  const districtOutcomeHints: Record<string, import('../types').DistrictOutcomeHint> = {};
  for (const id of districtIds) districtOutcomeHints[id] = 'unknown';

  return {
    run: {
      runId: `run-${Date.now()}`,
      phase: 'early',
      elapsedSeconds: 0,
      seed: Math.random().toString(36).slice(2),
      difficulty: 'normal',
      outcome: null,
    },
    city: {
      districtIds,
      districtsById,
      citywideTrust: 74,
      citywidePanic: 10,
      citywideIntegrity: 80,
    },
    incidents: {
      activeIds: [],
      resolvedIds: [],
      incidentsById: {},
    },
    entity: {
      phase: 'hidden',
      concealment: 100,
      aggression: 5,
      exposureRisk: 0,
      influenceLevel: 5,
      recentActionIds: [],
    },
    intelligence: {
      cameraStatesById,
      evidenceByIncidentId: {},
      districtSuspicionById,
    },
    communications: {
      sentActionIds: [],
      pendingActionIds: [],
      actionsById: {},
    },
    responses: {
      policeLoadByDistrictId,
      medicalLoadByDistrictId,
      transitLoadByDistrictId,
    },
    summary: {
      keyEventIds: [],
      definingActionIds: [],
      districtOutcomeHints,
    },
  };
}

const INITIAL_UI_STATE: OperationsUIState = {
  selectedDistrictId: null,
  selectedIncidentId: null,
  activeContextTab: 'district',
  isCommunicationsDrawerOpen: false,
  isIncidentDetailDrawerOpen: false,
  activeCommunicationType: null,
  incidentFeedFilter: 'all',
  mapOverlayMode: 'incidents',
  timeSpeed: 'normal',
  hoveredDistrictId: null,
  hoveredIncidentId: null,
};

// ─── Store Interface ──────────────────────────────────────────────────────────

export interface CityWatchStore {
  // Current screen
  screen: AppScreen;
  setScreen: (screen: AppScreen) => void;

  // Game state
  game: GameState;

  // UI state
  ui: OperationsUIState;
  setUI: (patch: Partial<OperationsUIState>) => void;

  // Draft communication
  draft: DraftCommunication;
  setDraft: (patch: Partial<DraftCommunication>) => void;
  resetDraft: () => void;

  // Actions
  startRun: () => void;
  advanceTick: (deltaSeconds: number) => void;
  selectDistrict: (id: string | null) => void;
  selectIncident: (id: string | null) => void;
  sendCommunication: () => void;
  resolveIncident: (id: string) => void;
  setTimeSpeed: (speed: import('../types').TimeSpeed) => void;

  // Key events log (for summary)
  keyEvents: KeyRunEvent[];
  addKeyEvent: (event: KeyRunEvent) => void;
}

const INITIAL_DRAFT: DraftCommunication = {
  actionType: null,
  targetDistrictId: null,
  urgency: 'medium',
  message: '',
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useCityWatchStore = create<CityWatchStore>((set, get) => ({
  screen: 'briefing',
  setScreen: (screen) => set({ screen }),

  game: makeInitialGameState(),

  ui: { ...INITIAL_UI_STATE },
  setUI: (patch) => set((s) => ({ ui: { ...s.ui, ...patch } })),

  draft: { ...INITIAL_DRAFT },
  setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
  resetDraft: () => set({ draft: { ...INITIAL_DRAFT } }),

  keyEvents: [],
  addKeyEvent: (event) => set((s) => ({ keyEvents: [...s.keyEvents, event] })),

  startRun: () => {
    set({
      game: makeInitialGameState(),
      ui: { ...INITIAL_UI_STATE },
      draft: { ...INITIAL_DRAFT },
      keyEvents: [],
    });
  },

  setTimeSpeed: (speed) =>
    set((s) => ({ ui: { ...s.ui, timeSpeed: speed } })),

  selectDistrict: (id) =>
    set((s) => ({
      ui: {
        ...s.ui,
        selectedDistrictId: id,
        selectedIncidentId: null,
        activeContextTab: 'district',
      },
    })),

  selectIncident: (id) => {
    const game = get().game;
    const incident = id ? game.incidents.incidentsById[id] : null;
    set((s) => ({
      ui: {
        ...s.ui,
        selectedIncidentId: id,
        selectedDistrictId: incident?.districtId ?? s.ui.selectedDistrictId,
        activeContextTab: 'incident',
      },
    }));
  },

  resolveIncident: (id) =>
    set((s) => {
      const incident = s.game.incidents.incidentsById[id];
      if (!incident || incident.status !== 'active') return s;

      const updatedIncident = { ...incident, status: 'resolved' as const };
      const activeIds = s.game.incidents.activeIds.filter((i) => i !== id);
      const resolvedIds = [...s.game.incidents.resolvedIds, id];

      // Trust boost for resolving
      const district = s.game.city.districtsById[incident.districtId];
      const updatedDistrict = district
        ? { ...district, trust: Math.min(100, district.trust + 3), incidentCount: Math.max(0, district.incidentCount - 1) }
        : district;

      const updatedDistricts = updatedDistrict
        ? { ...s.game.city.districtsById, [incident.districtId]: updatedDistrict }
        : s.game.city.districtsById;

      const stats = computeCitywideStats(updatedDistricts);

      const outcomeHints = { ...s.game.summary.districtOutcomeHints };
      if (incident.severity >= 4) outcomeHints[incident.districtId] = 'contested';

      get().addKeyEvent({
        timestamp: s.game.run.elapsedSeconds,
        description: `Incident resolved in ${district?.name ?? incident.districtId}: ${incident.type.replace(/_/g, ' ')}`,
        type: 'incident',
        districtId: incident.districtId,
      });

      return {
        game: {
          ...s.game,
          incidents: {
            ...s.game.incidents,
            activeIds,
            resolvedIds,
            incidentsById: { ...s.game.incidents.incidentsById, [id]: updatedIncident },
          },
          city: {
            ...s.game.city,
            districtsById: updatedDistricts,
            ...stats,
          },
          summary: {
            ...s.game.summary,
            districtOutcomeHints: outcomeHints,
          },
        },
      };
    }),

  sendCommunication: () => {
    const { draft, game, addKeyEvent } = get();
    if (!draft.actionType) return;

    const record = buildActionRecord(draft, game, game.run.elapsedSeconds);
    const effect = computeCommEffect(
      record.actionType,
      record.targetDistrictId,
      record.urgency,
      game
    );

    set((s) => {
      const updatedCity = { ...s.game.city };
      if (record.targetDistrictId) {
        const district = updatedCity.districtsById[record.targetDistrictId];
        if (district) {
          const updated = {
            ...district,
            panic: Math.max(0, Math.min(100, district.panic + effect.panicDelta)),
            trust: Math.max(0, Math.min(100, district.trust + effect.trustDelta)),
            infrastructureStability: Math.max(
              0,
              Math.min(100, district.infrastructureStability + effect.infrastructureDelta)
            ),
          };
          updatedCity.districtsById = { ...updatedCity.districtsById, [record.targetDistrictId]: updated };
        }
      } else {
        // City-wide effect
        const updatedDistricts: Record<string, District> = {};
        for (const [id, d] of Object.entries(updatedCity.districtsById)) {
          updatedDistricts[id] = {
            ...d,
            panic: Math.max(0, Math.min(100, d.panic + effect.panicDelta)),
            trust: Math.max(0, Math.min(100, d.trust + effect.trustDelta)),
          };
        }
        updatedCity.districtsById = updatedDistricts;
      }
      const stats = computeCitywideStats(updatedCity.districtsById);

      const newComms = {
        ...s.game.communications,
        sentActionIds: [...s.game.communications.sentActionIds, record.id],
        actionsById: { ...s.game.communications.actionsById, [record.id]: record },
      };

      const newSummary = {
        ...s.game.summary,
        definingActionIds: [...s.game.summary.definingActionIds, record.id],
      };

      addKeyEvent({
        timestamp: s.game.run.elapsedSeconds,
        description: `Sent ${record.actionType.replace(/_/g, ' ')} to ${record.targetDistrictId ?? 'all districts'}`,
        type: 'action',
        districtId: record.targetDistrictId,
      });

      return {
        game: {
          ...s.game,
          city: { ...updatedCity, ...stats },
          communications: newComms,
          summary: newSummary,
        },
        ui: {
          ...s.ui,
          isCommunicationsDrawerOpen: false,
        },
        draft: { ...INITIAL_DRAFT },
      };
    });
  },

  advanceTick: (deltaSeconds) => {
    const state = get();
    if (state.game.run.outcome !== null) return;

    set((s) => {
      let game = { ...s.game };

      // 1. Advance time
      const newElapsed = game.run.elapsedSeconds + deltaSeconds;
      const newPhase = getRunPhase(newElapsed);

      game = {
        ...game,
        run: { ...game.run, elapsedSeconds: newElapsed, phase: newPhase },
      };

      // 2. Tick city
      const newCityState = tickCityState(game.city, deltaSeconds);
      game = { ...game, city: newCityState };

      // 3. Tick entity
      const entityUpdate = tickEntity(game.entity, game, deltaSeconds);
      const prevEntityPhase = game.entity.phase;
      game = { ...game, entity: { ...game.entity, ...entityUpdate } };

      // 4. Spawn incidents
      const newIncident = trySpawnIncident(game, newElapsed);
      if (newIncident) {
        const districtId = newIncident.districtId;
        const district = game.city.districtsById[districtId];
        // Incident increases panic and reduces trust slightly
        const panicBoost = newIncident.severity * 3;
        const trustDrop = newIncident.severity * 1.5;
        const updatedDistrict = district
          ? {
              ...district,
              panic: Math.min(100, district.panic + panicBoost),
              trust: Math.max(0, district.trust - trustDrop),
              incidentCount: district.incidentCount + 1,
              threatSuspicion: Math.min(100, district.threatSuspicion + newIncident.severity * 5),
            }
          : district;

        const updatedDistricts = updatedDistrict
          ? { ...game.city.districtsById, [districtId]: updatedDistrict }
          : game.city.districtsById;

        const stats = computeCitywideStats(updatedDistricts);

        game = {
          ...game,
          city: { ...game.city, districtsById: updatedDistricts, ...stats },
          incidents: {
            ...game.incidents,
            activeIds: [...game.incidents.activeIds, newIncident.id],
            incidentsById: { ...game.incidents.incidentsById, [newIncident.id]: newIncident },
          },
        };
      }

      // 5. Escalate existing incidents
      const updatedIncidentsById = { ...game.incidents.incidentsById };
      for (const id of game.incidents.activeIds) {
        const inc = updatedIncidentsById[id];
        if (inc) {
          const update = escalateIncident(inc, deltaSeconds);
          updatedIncidentsById[id] = { ...inc, ...update };
        }
      }
      game = { ...game, incidents: { ...game.incidents, incidentsById: updatedIncidentsById } };

      // 6. Entity phase change notification
      if (entityUpdate.phase && entityUpdate.phase !== prevEntityPhase) {
        const label =
          entityUpdate.phase === 'recognized'
            ? 'Threat pattern detected — entity recognized'
            : 'Entity in full crisis mode';
        s.addKeyEvent({ timestamp: newElapsed, description: label, type: 'entity', districtId: null });
      }

      // 7. Update suspicion map
      const newSuspicion = { ...game.intelligence.districtSuspicionById };
      for (const id of game.incidents.activeIds) {
        const inc = game.incidents.incidentsById[id];
        if (inc) {
          newSuspicion[inc.districtId] = Math.min(100, (newSuspicion[inc.districtId] ?? 0) + 1);
        }
      }
      game = {
        ...game,
        intelligence: { ...game.intelligence, districtSuspicionById: newSuspicion },
      };

      // 8. Check win/loss
      const endCondition = getRunEndCondition(game);
      if (endCondition) {
        game = {
          ...game,
          run: { ...game.run, outcome: endCondition.outcome, phase: 'ended' },
        };
        // Update district outcome hints
        const hints = { ...game.summary.districtOutcomeHints };
        for (const [id, district] of Object.entries(game.city.districtsById)) {
          if ((district as District).panic >= 70) hints[id] = 'lost';
          else if ((district as District).panic >= 40) hints[id] = 'contested';
          else hints[id] = 'stable';
        }
        game = { ...game, summary: { ...game.summary, districtOutcomeHints: hints } };

        s.addKeyEvent({
          timestamp: newElapsed,
          description: endCondition.reason,
          type: 'system',
          districtId: null,
        });
      }

      return { game };
    });

    // Navigate to summary after a delay if run ended
    setTimeout(() => {
      const newState = get();
      if (newState.game.run.outcome !== null && newState.screen === 'operations') {
        newState.setScreen('summary');
      }
    }, 2500);
  },
}));
