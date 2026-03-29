import { useCityWatchStore } from '../../store/gameStore';
import {
  getCommunicationImpactPreview,
  getSelectedDistrict,
  getSelectedIncident,
  getSuggestedActions,
} from '../../store/selectors';
import { COMM_TYPE_LABELS, INCIDENT_TYPE_LABELS } from '../../data/cityData';
import type { CommunicationActionType } from '../../types';

const FALLBACK_ACTIONS: CommunicationActionType[] = [
  'district_alert',
  'targeted_text',
  'responder_tip',
  'transit_notice',
  'building_alarm',
  'public_bulletin',
];

function getFeedStatus(online: boolean, corrupted: boolean) {
  if (!online) return { label: 'Null', note: 'Signal route invalid', className: 'badge-muted' };
  if (corrupted) return { label: 'Corrupted', note: 'Feed integrity compromised', className: 'badge-critical' };
  return { label: 'Live', note: 'Archive substitution unconfirmed', className: 'badge-ok' };
}

export default function ContextPanel() {
  const game = useCityWatchStore((s) => s.game);
  const ui = useCityWatchStore((s) => s.ui);
  const draft = useCityWatchStore((s) => s.draft);
  const setDraft = useCityWatchStore((s) => s.setDraft);
  const setUI = useCityWatchStore((s) => s.setUI);
  const resolveIncident = useCityWatchStore((s) => s.resolveIncident);

  const selectedDistrict = getSelectedDistrict(game, ui) ?? (ui.selectedIncidentId ? game.city.districtsById[game.incidents.incidentsById[ui.selectedIncidentId]?.districtId] : null);
  const selectedIncident = getSelectedIncident(game, ui);
  const suggestions = getSuggestedActions(game, ui);
  const cameras = Object.values(game.intelligence.cameraStatesById).filter((camera) =>
    selectedDistrict ? camera.districtId === selectedDistrict.id : true
  );
  const activeCamera = cameras[0] ?? Object.values(game.intelligence.cameraStatesById)[0];
  const feedStatus = activeCamera ? getFeedStatus(activeCamera.online, activeCamera.feedCorrupted) : getFeedStatus(false, false);
  const attachments = [
    selectedIncident ? `FEEDGRAB_${selectedIncident.id.slice(-4).toUpperCase()}` : null,
    activeCamera ? `${activeCamera.id.toUpperCase()}_ROUTE` : null,
    selectedDistrict ? `${selectedDistrict.id.toUpperCase()}_FIELD_NOTES` : null,
  ].filter(Boolean) as string[];

  const forecastDraft =
    draft.actionType || selectedDistrict
      ? {
          ...draft,
          actionType: draft.actionType ?? suggestions[0]?.actionType ?? FALLBACK_ACTIONS[0],
          targetDistrictId: draft.targetDistrictId ?? selectedDistrict?.id ?? null,
        }
      : null;
  const forecast = forecastDraft ? getCommunicationImpactPreview(game, forecastDraft) : null;

  const availableActions = suggestions.length > 0 ? suggestions : FALLBACK_ACTIONS.map((actionType) => ({
    actionType,
    targetDistrictId: selectedDistrict?.id ?? null,
    urgency: 'medium' as const,
    rationale: 'Manual protocol available for sector review.',
  }));

  return (
    <div className="panel" style={{ display: 'grid', gridTemplateRows: '1.2fr 1fr', height: '100%', minWidth: 0, overflow: 'hidden' }}>
      <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div className="panel-header">
          <span>Live Visual Attachments</span>
          <span className={`badge ${feedStatus.className}`}>{feedStatus.label}</span>
        </div>

        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
          <div className="metadata-row">
            <span>Camera Route: {activeCamera?.id.toUpperCase() ?? 'NO SOURCE'}</span>
            <span>Sector: {selectedDistrict?.name ?? 'Awaiting sector review'}</span>
            <span>Review Status: {selectedIncident ? 'Incident linked' : 'Idle'}</span>
          </div>

          <div className="monitor-well" style={{ flex: 1, minHeight: 208, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: '#cabf9f', letterSpacing: '0.08em' }}>
              <span>VISUAL ATTACHMENT 03</span>
              <span>{feedStatus.note.toUpperCase()}</span>
            </div>

            <div style={{
              flex: 1,
              margin: '10px 0',
              border: '1px solid rgba(202,191,159,0.22)',
              position: 'relative',
              background:
                'radial-gradient(circle at center, rgba(196,184,158,0.1), transparent 52%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 38%), #14110d',
              overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.06), transparent 22%), repeating-linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 1px, transparent 1px, transparent 4px)',
                opacity: 0.9,
              }} />

              <div style={{
                position: 'absolute',
                inset: '14% 16%',
                border: '1px solid rgba(202,191,159,0.28)',
                display: 'grid',
                gridTemplateRows: '1fr auto',
                alignItems: 'center',
                justifyItems: 'center',
                color: '#e7dec7',
                textAlign: 'center',
                padding: 16,
              }}>
                <div>
                  <div style={{ fontSize: 13, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>
                    {selectedDistrict ? `${selectedDistrict.name} Corridor Feed` : 'Routed Surveillance Waiting'}
                  </div>
                  <div style={{ fontSize: 42, lineHeight: 1 }}>{feedStatus.label === 'Null' ? '∅' : feedStatus.label === 'Corrupted' ? '▓' : '◫'}</div>
                  <div style={{ marginTop: 12, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {selectedIncident ? (INCIDENT_TYPE_LABELS[selectedIncident.type] ?? selectedIncident.type).toUpperCase() : 'NO INCIDENT FRAME SELECTED'}
                  </div>
                </div>

                <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: '#d0c2a6' }}>
                  <span>TS {String(Math.floor(game.run.elapsedSeconds / 60)).padStart(2, '0')}:{String(Math.floor(game.run.elapsedSeconds % 60)).padStart(2, '0')}</span>
                  <span style={{ textAlign: 'right' }}>Q {activeCamera?.feedCorrupted ? 'LOW' : 'STABLE'}</span>
                </div>
              </div>
            </div>

            <div className="metadata-row" style={{ justifyContent: 'space-between' }}>
              <span>Timestamp: {String(Math.floor(game.run.elapsedSeconds / 60)).padStart(2, '0')}:{String(Math.floor(game.run.elapsedSeconds % 60)).padStart(2, '0')}</span>
              <span>Archive Tag: {selectedDistrict?.id.toUpperCase() ?? 'UNSET'}-03</span>
              <span>Feed Quality: {feedStatus.label}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div className="control-plate">
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 8 }}>
                Source Selector
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cameras.length === 0 ? (
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>No routed cameras for this sector.</div>
                ) : (
                  cameras.map((camera) => {
                    const status = getFeedStatus(camera.online, camera.feedCorrupted);
                    return (
                      <div key={camera.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 11, color: 'var(--text-primary)' }}>
                        <span>{camera.id.toUpperCase()}</span>
                        <span className={`badge ${status.className}`}>{status.label}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="control-plate">
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 8 }}>
                Attachment Tray
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
                {attachments.length === 0 ? (
                  <span>No linked evidence references.</span>
                ) : (
                  attachments.map((attachment) => <span key={attachment}>{attachment}</span>)
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ display: 'flex', flexDirection: 'column', borderTop: '2px solid var(--border)', minHeight: 0 }}>
        <div className="panel-header">
          <span>Authorization Panel</span>
          <span style={{ color: 'var(--text-secondary)' }}>{selectedDistrict?.name ?? 'No target sector'}</span>
        </div>

        <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0, overflowY: 'auto' }}>
          <div className="paper-card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#5e503b' }}>
                  Action Review Form
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, marginTop: 3 }}>
                  {selectedDistrict?.name ?? 'Awaiting sector assignment'}
                </div>
              </div>
              <span className="stamp" style={{ color: selectedIncident?.severity && selectedIncident.severity >= 4 ? 'var(--text-critical)' : '#5d513c' }}>
                {selectedIncident ? 'Under Review' : 'Pending'}
              </span>
            </div>

            <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 11 }}>
              <div>
                <div style={{ color: '#6b5d47', textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.12em' }}>Target Sector</div>
                <div>{selectedDistrict?.id.toUpperCase() ?? 'UNASSIGNED'}</div>
              </div>
              <div>
                <div style={{ color: '#6b5d47', textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.12em' }}>Linked Incident</div>
                <div>{selectedIncident ? INCIDENT_TYPE_LABELS[selectedIncident.type] : 'None linked'}</div>
              </div>
              <div>
                <div style={{ color: '#6b5d47', textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.12em' }}>Exposure Risk</div>
                <div>{Math.round(game.entity.exposureRisk)}%</div>
              </div>
              <div>
                <div style={{ color: '#6b5d47', textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.12em' }}>Projected Compliance</div>
                <div>{forecast ? `~${forecast.projectedCompliance}%` : 'Awaiting protocol'}</div>
              </div>
            </div>

            {forecast && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(42,36,25,0.35)', fontSize: 11, lineHeight: 1.5 }}>
                <div style={{ color: '#6b5d47', textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.12em', marginBottom: 4 }}>
                  Forecast
                </div>
                <div>{forecast.description}</div>
                <div style={{ display: 'flex', gap: 10, marginTop: 6, fontFamily: 'var(--font-mono)' }}>
                  <span>TR {forecast.projectedTrustImpact >= 0 ? '+' : ''}{forecast.projectedTrustImpact}</span>
                  <span>PN {forecast.projectedPanicImpact >= 0 ? '+' : ''}{forecast.projectedPanicImpact}</span>
                </div>
              </div>
            )}
          </div>

          <div className="control-plate">
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 8 }}>
              Protocol Actions
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {availableActions.slice(0, 4).map((action) => (
                <button
                  key={`${action.actionType}-${action.targetDistrictId ?? 'city'}`}
                  className={`btn ${draft.actionType === action.actionType ? 'btn-primary' : ''}`}
                  onClick={() => {
                    setDraft({
                      actionType: action.actionType,
                      targetDistrictId: action.targetDistrictId,
                      urgency: action.urgency,
                    });
                    setUI({ isCommunicationsDrawerOpen: true });
                  }}
                >
                  {COMM_TYPE_LABELS[action.actionType]}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: selectedIncident?.status === 'active' ? '1fr 1fr' : '1fr', gap: 8 }}>
            {selectedIncident?.status === 'active' && (
              <button className="btn" onClick={() => resolveIncident(selectedIncident.id)}>
                Process Incident
              </button>
            )}
            <button
              className="btn btn-primary"
              onClick={() => setUI({ isCommunicationsDrawerOpen: true })}
            >
              Open Command Drawer
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
