/**
 * localStorage access that never throws. Browsers throw when storage is blocked (privacy
 * settings) or full, and an uncaught error in a React effect or handler takes the page down.
 */

export const readStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.warn(`Could not read "${key}" from storage:`, e);
    return null;
  }
};

/** Returns false if the value could not be stored. */
export const writeStorage = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.warn(`Could not write "${key}" to storage:`, e);
    return false;
  }
};

export const removeStorage = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.warn(`Could not remove "${key}" from storage:`, e);
  }
};
