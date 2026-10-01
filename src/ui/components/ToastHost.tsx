import { Pressable, View } from 'react-native';

import Animated, { FadeInUp, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { makeStyles } from '@/ui/theme';

import { Text } from './Text';
import { toast, useToastStore, type ToastType } from './toast';

/** Mount once at the app root, above navigation. */
export function ToastHost() {
  const toasts = useToastStore(state => state.toasts);
  const styles = useStyles();
  const { top } = useSafeAreaInsets();

  if (toasts.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={[styles.host, { top: top + 8 }]}>
      {toasts.map(item => (
        // Layout animations run on the UI thread — no JS-thread cost per frame.
        <Animated.View
          key={item.id}
          entering={FadeInUp}
          exiting={FadeOutUp}
          layout={LinearTransition}
        >
          <Pressable
            onPress={() => toast.dismiss(item.id)}
            accessibilityRole="alert"
            style={[styles.toast, styles[item.type satisfies ToastType]]}
          >
            <Text color="textInverse" variant="label">
              {item.message}
            </Text>
          </Pressable>
        </Animated.View>
      ))}
    </View>
  );
}

const useStyles = makeStyles(({ colors, radius, spacing }) => ({
  host: { position: 'absolute', start: spacing.lg, end: spacing.lg, gap: spacing.sm, zIndex: 1000 },
  toast: { borderRadius: radius.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  info: { backgroundColor: colors.text },
  success: { backgroundColor: colors.success },
  error: { backgroundColor: colors.danger },
}));
