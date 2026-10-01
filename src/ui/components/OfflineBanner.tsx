import { View } from 'react-native';

import { useTranslation } from 'react-i18next';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsOnline } from '@/core/network';
import { makeStyles } from '@/ui/theme';

import { Text } from './Text';

/**
 * Non-blocking connectivity pill. The app keeps working offline with cached
 * data — unlike replacing the whole navigator with a "No internet" screen,
 * which destroys navigation state on every network blip.
 */
export function OfflineBanner() {
  const isOnline = useIsOnline();
  const styles = useStyles();
  const { t } = useTranslation();
  const { bottom } = useSafeAreaInsets();

  if (isOnline) return null;
  return (
    <Animated.View
      entering={FadeIn}
      exiting={FadeOut}
      pointerEvents="none"
      style={[styles.host, { bottom: bottom + 72 }]}
    >
      <View
        style={styles.pill}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        testID="offline-banner"
      >
        <Text variant="caption" color="textInverse" align="center">
          {t('common.offline')}
        </Text>
      </View>
    </Animated.View>
  );
}

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  host: { position: 'absolute', start: 0, end: 0, alignItems: 'center' },
  pill: {
    backgroundColor: colors.text,
    borderRadius: radius.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
}));
