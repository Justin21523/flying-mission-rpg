type BufferedInput = { action: string; expiresAt: number };

const inputs: BufferedInput[] = [];

export function bufferInput(action: string, ttlMs = 180): void {
  inputs.push({ action, expiresAt: Date.now() + ttlMs });
}

export function consumeBufferedInput(action: string): boolean {
  const now = Date.now();
  for (let i = inputs.length - 1; i >= 0; i -= 1) {
    if (inputs[i].expiresAt < now) inputs.splice(i, 1);
  }
  const index = inputs.findIndex((input) => input.action === action);
  if (index < 0) return false;
  inputs.splice(index, 1);
  return true;
}

export function clearInputBuffer(): void {
  inputs.length = 0;
}
