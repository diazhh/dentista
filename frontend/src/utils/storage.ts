// Unique storage key prefix to avoid conflicts with other apps
const STORAGE_PREFIX = 'denticloud_';

// Migrate old localStorage keys to new prefixed keys (one-time migration)
const migrateOldStorage = () => {
  const oldKeys = ['accessToken', 'refreshToken', 'user'];
  let migrated = false;

  oldKeys.forEach(key => {
    const oldValue = localStorage.getItem(key);
    const newKey = `${STORAGE_PREFIX}${key}`;
    const newValue = localStorage.getItem(newKey);

    // Only migrate if old key exists and new key doesn't
    if (oldValue && !newValue) {
      localStorage.setItem(newKey, oldValue);
      localStorage.removeItem(key);
      migrated = true;
    }
  });

  if (migrated) {
    console.log('[DentiCloud] Migrated authentication data to isolated storage');
  }
};

// Run migration on module load
migrateOldStorage();

export const storage = {
  setItem: (key: string, value: string) => {
    localStorage.setItem(`${STORAGE_PREFIX}${key}`, value);
  },

  getItem: (key: string): string | null => {
    return localStorage.getItem(`${STORAGE_PREFIX}${key}`);
  },

  removeItem: (key: string) => {
    localStorage.removeItem(`${STORAGE_PREFIX}${key}`);
  },

  clear: () => {
    // Only clear DentiCloud items
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  },
};
