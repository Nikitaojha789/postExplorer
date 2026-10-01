import { Platform } from 'react-native';

import DeviceInfo from 'react-native-device-info';

/** Static facts about this binary. Read once; none of these change at runtime. */
export const buildInfo = Object.freeze({
  version: DeviceInfo.getVersion(),
  buildNumber: DeviceInfo.getBuildNumber(),
  bundleId: DeviceInfo.getBundleId(),
  platform: Platform.OS,
  osVersion: String(Platform.Version),
  /** e.g. "1.4.0 (231)" — for About screens and support reports. */
  get label(): string {
    return `${this.version} (${this.buildNumber})`;
  },
});
