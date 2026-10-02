import { memo } from 'react';
import type { ImageRequireSource, ImageStyle, StyleProp } from 'react-native';

import FastImage, {
  type ImageStyle as FastImageStyle,
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

/** Warms the cache before an image is shown (e.g. prefetch on press-in). */
export const preloadImages = (urls: readonly string[]): void => {
  if (urls.length > 0) FastImage.preload(urls.map(uri => ({ uri })));
};

/** Drops decoded images (memory) and, optionally, downloaded files (disk). */
export const clearImageCaches = async ({ disk = false }: { disk?: boolean } = {}) => {
  await FastImage.clearMemoryCache();
  if (disk) await FastImage.clearDiskCache();
};

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
      // FastImage's ImageStyle extends RN's `FlexStyle`, which no longer
      // resolves under RN 0.87's types, so width/height vanish from it. The
      // public prop uses RN's own ImageStyle; cast once at this boundary.
      style={style as StyleProp<FastImageStyle>}
      resizeMode={resizeMode}
      source={typeof source === 'string' ? { uri: source, priority, cache: 'immutable' } : source}
      accessible={accessibilityLabel !== null}
      accessibilityRole={accessibilityLabel === null ? 'none' : 'image'}
      accessibilityLabel={accessibilityLabel ?? undefined}
    />
  );
});
