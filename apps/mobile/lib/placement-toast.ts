/** Minimal one-shot toast store shown on Home after a confirmed placement (SCKRL-305). */
type Listener = (message: string | null) => void;

let current: string | null = null;
const listeners = new Set<Listener>();

export function showPlacementToast(message: string): void {
  current = message;
  for (const listener of listeners) listener(current);
}

export function dismissPlacementToast(): void {
  current = null;
  for (const listener of listeners) listener(current);
}

export function subscribePlacementToast(listener: Listener): () => void {
  listeners.add(listener);
  listener(current);
  return () => listeners.delete(listener);
}
