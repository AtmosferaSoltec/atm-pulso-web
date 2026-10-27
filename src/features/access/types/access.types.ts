export interface AccessEntry { id: string; name: string; memberId?: string; branchId: string; time: string; allowed: boolean; reason: string; }
export type ScenarioId = 'valid' | 'expiring' | 'expired' | 'scheduled' | 'branch' | 'unknown';
/** A ready-made DNI that triggers one kind of access outcome; used by the demo shortcuts. */
export interface DemoScenario { id: ScenarioId; label: string; dni: string; hint: string; }
export interface AccessResult { allowed: boolean; name?: string; reason: string; }
