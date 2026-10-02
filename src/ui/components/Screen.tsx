import type { ReactNode } from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

import { KeyboardAvoidingView, KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { makeStyles, useTheme } from '@/ui/theme';

export interface ScreenProps {
  children: ReactNode;
  /**
   * `fixed`: plain view (use for screens whose body is a virtualized list).
   * `scroll`: keyboard-aware scroll view (forms, short content).
   */
  preset?: 'fixed' | 'scroll';
  /**
   * `fixed` preset only: shrink the content above the keyboard, so a list
   * under a search field can scroll its last item into view. Works on iOS
   * and Android, below headers and above tab bars.
   */
  avoidKeyboard?: boolean;
  /** Safe-area edges to pad. Native-stack headers already handle `top`. */
  edges?: readonly Edge[];
  padded?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/**
 * Screen container: background, safe-area padding and keyboard handling.
 * Never wrap a FlashList in the `scroll` preset — nesting a virtualized list
 * in a ScrollView disables virtualization. A list screen with a text input
 * (search, chat composer) uses `preset="fixed"` + `avoidKeyboard` instead.
 */
export function Screen({
  children,
  preset = 'fixed',
  avoidKeyboard = false,
  edges = [],
  padded = true,
  contentStyle,
  testID,
}: ScreenProps) {
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const { spacing } = useTheme();
  // Each edge = base padding + safe-area inset. Longhand props are computed
  // explicitly: in RN a longhand (paddingLeft: 0) silently overrides the
  // `padding` shorthand regardless of order.
  const base = padded ? spacing.lg : 0;
  const edgePadding: ViewStyle = {
    paddingTop: base + (edges.includes('top') ? insets.top : 0),
    paddingBottom: base + (edges.includes('bottom') ? insets.bottom : 0),
    paddingLeft: base + (edges.includes('left') ? insets.left : 0),
    paddingRight: base + (edges.includes('right') ? insets.right : 0),
  };

  if (preset === 'scroll') {
    return (
      <KeyboardAwareScrollView
        testID={testID}
        style={styles.root}
        contentContainerStyle={[edgePadding, contentStyle]}
        keyboardShouldPersistTaps="handled"
        bottomOffset={16}
      >
        {children}
      </KeyboardAwareScrollView>
    );
  }

  if (avoidKeyboard) {
    return (
      <KeyboardAvoidingView testID={testID} behavior="padding" automaticOffset style={styles.root}>
        <View style={[styles.fill, edgePadding, contentStyle]}>{children}</View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View testID={testID} style={[styles.root, edgePadding, contentStyle]}>
      {children}
    </View>
  );
}

const useStyles = makeStyles(({ colors }) => ({
  root: { flex: 1, backgroundColor: colors.background },
  fill: { flex: 1 },
}));
