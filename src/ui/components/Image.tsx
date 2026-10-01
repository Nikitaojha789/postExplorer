import { memo } from 'react';
import type { ImageRequireSource, StyleProp } from 'react-native';

import FastImage, {
  type ImageStyle,
  type Priority,
  type ResizeMode,
} from '@d11/react-native-fast-image';

export interface ImageProps {
  /** Remote URL or `require()`d asset. */
  source: string | ImageRequireSource;
  style: StyleProp<ImageStyle>;
  /** Required for meaningful images; pass `null` for decorative ones. */
  accessibilityLabel: string | null;
  resizeMode?: ResizeMode;
  priority?: Priority;
  testID?: string;
}

/**
 * Cached image (SDWebImage on iOS, Glide on Android) with memory + disk
 * caching. Always give it explicit dimensions via `style`, request
 * thumbnails sized for the slot (not originals) and keep list images small.
 */
export const Image = memo(function Image({
  source,
  style,
  accessibilityLabel,
  resizeMode = 'cover',
  priority = 'normal',
  testID,
}: ImageProps) {
  return (
    <FastImage
      testID={testID}
      style={style}
      resizeMode={resizeMode}
      source={typeof source === 'string' ? { uri: source, priority, cache: 'immutable' } : source}
      accessible={accessibilityLabel !== null}
      accessibilityRole={accessibilityLabel === null ? 'none' : 'image'}
      accessibilityLabel={accessibilityLabel ?? undefined}
    />
  );
});
