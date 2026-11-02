import type { AppState } from "@/types";
import { storage } from "@/storage/storage";
import { parseState } from "@/storage/schema";
import { initialState } from "@/services/defaultState";
export interface AppRepository {
  loadState(): Promise<AppState>;
  saveState(state: AppState): Promise<AppState>;
  resetState(): Promise<AppState>;
  exportState(state: AppState): string;
  importState(text: string): AppState;
}
export const appRepository: AppRepository = {
  async loadState() {
    const raw = storage.read();
    return raw ? parseState(JSON.parse(raw)) : initialState();
  },
  async saveState(state) {
    const existing = storage.read();
    if (
      existing &&
      parseState(JSON.parse(existing)).revision !== state.revision
    )
      throw new Error(
        "Data changed in another tab. Reload before trying again.",
      );
    const next = parseState({ ...state, revision: state.revision + 1 });
    storage.write(JSON.stringify(next));
    return next;
  },
  async resetState() {
    const next = initialState();
    const current = storage.read();
    if (current) {
      try {
        next.revision = parseState(JSON.parse(current)).revision + 1;
      } catch {
        next.revision = 1;
      }
    }
    storage.write(JSON.stringify(next));
    return next;
  },
  exportState(state) {
    return JSON.stringify(state, null, 2);
  },
  importState(text) {
    if (text.length > 20_000_000)
      throw new Error("This backup is too large (20 MB maximum).");
    return parseState(JSON.parse(text));
  },
};
export async function restoreBackup(): Promise<AppState> {
  const raw = storage.readBackup();
  if (!raw) throw new Error("No backup is available.");
  const state = parseState(JSON.parse(raw));
  storage.write(JSON.stringify(state));
  return state;
}
export function subscribeState(callback: () => void) {
  return storage.subscribe(callback);
}
