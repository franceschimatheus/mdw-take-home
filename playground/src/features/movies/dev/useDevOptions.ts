import { useSyncExternalStore } from 'react';

import {
  DEFAULT_DEV_OPTIONS,
  devOptionsSchema,
  type DevOptionsType,
  devToolsEnabled,
} from '@/features/movies/dev/options';

const STORAGE_KEY = 'meadow:dev-options';

type DevOptionsStateType = [DevOptionsType, (next: DevOptionsType) => void];

// Picked once at module load, so production bundles drop the storage code.
export const useDevOptions: () => DevOptionsStateType = devToolsEnabled ? useStoredDevOptions : useDefaultDevOptions;

function useDefaultDevOptions(): DevOptionsStateType {
  return [DEFAULT_DEV_OPTIONS, () => {}];
}

// Remembered per browser so the chosen faults survive a reload. Storage can be
// unavailable (private mode, blocked site data), so every access is guarded.
// Kept in module state so a failed write still applies for this page view.
let stored: DevOptionsType | null = null;
const listeners = new Set<() => void>();

function readStored(): DevOptionsType {
  if (!stored) {
    stored = DEFAULT_DEV_OPTIONS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = devOptionsSchema.safeParse(raw ? JSON.parse(raw) : null);
      if (parsed.success) stored = parsed.data;
    } catch {
      // Keep the defaults.
    }
  }
  return stored;
}

function writeStored(next: DevOptionsType) {
  stored = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Still applies for this page view.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// The server render has no storage, so it (and hydration) uses the defaults.
const getServerSnapshot = () => DEFAULT_DEV_OPTIONS;

function useStoredDevOptions(): DevOptionsStateType {
  const options = useSyncExternalStore(subscribe, readStored, getServerSnapshot);
  return [options, writeStored];
}
