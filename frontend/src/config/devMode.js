const TRUE_LIKE_VALUES = new Set(['1', 'true', 'yes', 'on']);

export function isEnvFlagEnabled(value) {
  if (typeof value !== 'string') {
    return false;
  }

  return TRUE_LIKE_VALUES.has(value.trim().toLowerCase());
}

export const isDevModeEnabled = isEnvFlagEnabled(import.meta.env.VITE_DEV_MODE);
