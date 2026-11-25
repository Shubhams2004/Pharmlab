import { Dispatch, SetStateAction, useCallback, useState } from 'react';

const STORAGE_PREFIX = 'pharmlab_module_state_v1:';

function readStoredValue<T>(storageKey: string, initialValue: T): T {
  if (typeof window === 'undefined') return initialValue;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_PREFIX + storageKey);
    if (raw === null) return initialValue;
    return JSON.parse(raw) as T;
  } catch {
    return initialValue;
  }
}

export function usePersistedModuleState<T>(
  storageKey: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => readStoredValue(storageKey, initialValue));

  const setPersistedState: Dispatch<SetStateAction<T>> = useCallback(
    (valueOrUpdater) => {
      setState((prev) => {
        const next =
          typeof valueOrUpdater === 'function'
            ? (valueOrUpdater as (curr: T) => T)(prev)
            : valueOrUpdater;
        if (typeof window !== 'undefined') {
          try {
            window.sessionStorage.setItem(STORAGE_PREFIX + storageKey, JSON.stringify(next));
          } catch {
            // ignore storage quota errors
          }
        }
        return next;
      });
    },
    [storageKey]
  );

  return [state, setPersistedState];
}
