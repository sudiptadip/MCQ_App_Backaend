/**
 * Simple wrapper for localStorage to handle JSON parsing and stringifying
 */
export const storage = {
  get: <T>(key: string): T | null => {
    try {
      const item = window.localStorage.getItem(key);
      if (key === "token" || key === "franchise_logo" || key === "franchise_name") {
        return item ? item as T : null
      }
      return item ? (JSON.parse(item) as T) : null;
    } catch (error) {
      console.error(`Error getting item ${key} from localStorage`, error);
      return null;
    }
  },

  set: (key: string, value: any): void => {
    try {
      const valueToStore = typeof value === "string" ? value : JSON.stringify(value);
      window.localStorage.setItem(key, valueToStore);
    } catch (error) {
      console.error(`Error setting item ${key} in localStorage`, error);
    }
  },

  remove: (key: string): void => {
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key} from localStorage`, error);
    }
  },

  clear: (): void => {
    try {
      window.localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage", error);
    }
  },
};
