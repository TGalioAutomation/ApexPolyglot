/**
 * SLO targets (technical-architecture 21.2, production-operations). These are
 * constants the ops tooling and dashboards read; they document the contract,
 * not enforce at runtime.
 */
export interface Slo {
  name: string;
  target: string;
  window: string;
}

export const SLO_TARGETS: Slo[] = [
  { name: 'api_authenticated_availability', target: '99.9%', window: '30d' },
  { name: 'api_crud_latency_p95', target: '500ms', window: '30d' },
  { name: 'page_interaction_p95', target: '200ms', window: '30d' },
  { name: 'voice_turn_p95', target: '3.5s', window: '30d' },
  { name: 'crash_free_sessions', target: '99.5%', window: '30d' }
];

export const DEPLOYMENT_REGION = 'ap-southeast-1';
export const BACKUP_RPO_MINUTES = 5;
export const BACKUP_RTO_MINUTES = 60;
