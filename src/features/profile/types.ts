/** Mirrors the backend profile/settings API (UserController, BF-04, MH-PROFILE-01..03). */

export type ThemePreference = 'LIGHT' | 'DARK' | 'SYSTEM';

export type UserSettings = {
  /** "HH:mm:ss" local time of the review reminder; null when off. */
  srsReminderAt: string | null;
  pushEnabled: boolean;
};

/**
 * Partial update: a missing field keeps the stored value, so the reminder is
 * switched off with `srsReminderCleared` rather than a null time.
 */
export type UpdateUserSettings = {
  srsReminderAt?: string;
  srsReminderCleared?: boolean;
  pushEnabled?: boolean;
};

export type UpdateProfile = {
  firstName?: string;
  lastName?: string;
  bio?: string;
};

export type ChangePassword = {
  currentPassword: string;
  newPassword: string;
};
