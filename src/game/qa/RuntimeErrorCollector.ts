import type { QAFinding } from './ReleaseCandidateChecklist';

export type RuntimeErrorEvent = {
  id: string;
  source: 'console-error' | 'unhandled-rejection' | 'react-boundary' | 'validation' | 'cleanup' | 'phase';
  message: string;
  detail?: string;
  createdAt: string;
};

const events: RuntimeErrorEvent[] = [];
let installed = false;
let restoreConsole: (() => void) | undefined;

export function recordRuntimeError(event: Omit<RuntimeErrorEvent, 'id' | 'createdAt'>): RuntimeErrorEvent {
  const next: RuntimeErrorEvent = {
    ...event,
    id: `runtime_error_${events.length + 1}_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  events.unshift(next);
  events.splice(50);
  return next;
}

export function getRuntimeErrors(): RuntimeErrorEvent[] {
  return [...events];
}

export function clearRuntimeErrors(): void {
  events.length = 0;
}

export function installRuntimeErrorCollector(): () => void {
  if (installed) return () => undefined;
  installed = true;
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    recordRuntimeError({ source: 'console-error', message: args.map(String).join(' ') });
    originalError(...args);
  };
  restoreConsole = () => { console.error = originalError; };
  const onRejection = (event: PromiseRejectionEvent) => {
    recordRuntimeError({ source: 'unhandled-rejection', message: String(event.reason ?? 'Unhandled rejection') });
  };
  window.addEventListener?.('unhandledrejection', onRejection);
  return () => {
    restoreConsole?.();
    window.removeEventListener?.('unhandledrejection', onRejection);
    installed = false;
  };
}

export function runtimeErrorsToFindings(): QAFinding[] {
  return events.map((event) => ({
    id: event.id,
    severity: 'error',
    system: event.source,
    message: event.message,
    detail: event.detail,
  }));
}
