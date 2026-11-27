import { storage } from '@/lib/storage';

/** Set once the onboarding has been seen (or the learner has signed in): signing out then lands on Login. */
const WELCOME_SEEN_KEY = 'welcome_seen_v1';

export function hasSeenWelcome(): boolean {
  return storage.getBoolean(WELCOME_SEEN_KEY) === true;
}

export function markWelcomeSeen() {
  storage.set(WELCOME_SEEN_KEY, true);
}
