import { View } from 'react-native';

const FastImage = Object.assign((props: object) => <View {...props} />, {
  resizeMode: { contain: 'contain', cover: 'cover', stretch: 'stretch', center: 'center' },
  priority: { low: 'low', normal: 'normal', high: 'high' },
  cacheControl: { immutable: 'immutable', web: 'web', cacheOnly: 'cacheOnly' },
  preload: jest.fn(),
  clearMemoryCache: jest.fn(),
  clearDiskCache: jest.fn(),
});

export default FastImage;
