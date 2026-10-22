import { Redirect } from 'expo-router';

/**
 * Stable deep link of SRS_REMINDER (notification.md §2.3, backend route whitelist). The collection picker it
 * used to open is gone (learn_ui.md UI-LEARN-04): it now opens today's session across the whole library.
 */
export default function StudySelectRedirect() {
  return <Redirect href="/(app)/study/session" />;
}
