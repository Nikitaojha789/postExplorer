import { createNavigationContainerRef } from '@react-navigation/native';

/**
 * For the rare navigation outside React (push-notification taps, global
 * handlers). Inside components, always use `useNavigation()`.
 */
export const navigationRef = createNavigationContainerRef();
