import { memo } from 'react';
import type { DimensionValue, StyleProp, ViewStyle } from 'react-native';

import Animated, { useReducedMotion } from 'react-native-reanimated';

import { makeStyles, radius as radii, type Radius } from '@/ui/theme';

export interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  radius?: Radius;
  style?: StyleProp<ViewStyle>;
}

/**
 * Content-shaped loading placeholder: compose several to mirror the layout
 * that is loading (e.g. one per list row). The pulse is a Reanimated 4 CSS
 * animation, driven entirely on the UI thread — no JS work per frame and no
 * per-instance hooks, so a screenful of skeletons stays cheap.
 */
export const Skeleton = memo(function Skeleton({
  width = '100%',
  height = 16,
  radius = 'sm',
  style,
}: SkeletonProps) {
  const styles = useStyles();
  const reduceMotion = useReducedMotion();
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.block,
        { width, height, borderRadius: radii[radius] },
        !reduceMotion && pulse,
        style,
      ]}
    />
  );
});

const pulse = {
  animationName: { from: { opacity: 1 }, to: { opacity: 0.45 } },
  animationDuration: '850ms',
  animationIterationCount: 'infinite',
  animationDirection: 'alternate',
  animationTimingFunction: 'ease-in-out',
} as const;

const useStyles = makeStyles(({ colors }) => ({
  block: { backgroundColor: colors.surfaceSunken },
}));
