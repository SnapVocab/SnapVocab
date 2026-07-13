import { Platform } from 'react-native';
import Env from '@/../env';

export function normalizeUrl(url: string): string {
  if (Env.EXPO_PUBLIC_APP_ENV === 'development' && Platform.OS === 'android') {
    return url.replace('localhost', '10.0.2.2');
  }
  return url;
}
