// Browser storage is intentionally isolated here. No component uses localStorage.
const KEY = "reality-rank:v1";
const BACKUP = `${KEY}:backup`;
// UI preference has its own key, so existing v1 progress requires no migration.
export const languageStorage = {
  read: () => localStorage.getItem("reality-rank:language"),
  write: (language: string) =>
    localStorage.setItem("reality-rank:language", language),
};
export const storage = {
  read: () => localStorage.getItem(KEY),
  readBackup: () => localStorage.getItem(BACKUP),
  write(value: string) {
    const previous = localStorage.getItem(KEY);
    if (previous) localStorage.setItem(BACKUP, previous);
    // setItem is atomic: quota failures leave the previous primary value intact.
    localStorage.setItem(KEY, value);
  },
  subscribe(callback: () => void) {
    const listener = (event: StorageEvent) => {
      if (event.key === KEY) callback();
    };
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  },
};
