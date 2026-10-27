/** What the screen shows after a check or a day pass sale. */
export interface AccessResult {
  allowed: boolean;
  name?: string;
  reason: string;
}
