import { DevSettings } from 'react-native';

import { getNetworkConditions, setNetworkConditions } from '@/core/api';
import { expireAccessTokenForTesting } from '@/core/auth';
import { isSimulatedOffline, setSimulatedOffline } from '@/core/network';
import { toast } from '@/ui';

const LATENCY_STEPS_MS = [0, 1_000, 3_000, 20_000] as const;
const FAILURE_RATE = 0.3;

/**
 * Dev-only Dev Menu entries (shake / Cmd+D / Cmd+M) for states simulators
 * can't easily produce. Strings are untranslated on purpose: dev tooling.
 */
export const registerDevMenu = (): void => {
  DevSettings.addMenuItem('Network: toggle offline', () => {
    const offline = !isSimulatedOffline();
    setSimulatedOffline(offline);
    toast.info(offline ? 'Simulating offline' : 'Back online');
  });

  DevSettings.addMenuItem('Network: cycle latency', () => {
    const { latencyMs } = getNetworkConditions();
    const index = LATENCY_STEPS_MS.findIndex(step => step === latencyMs);
    const next = LATENCY_STEPS_MS[(index + 1) % LATENCY_STEPS_MS.length] ?? 0;
    setNetworkConditions({ latencyMs: next });
    toast.info(`Added latency: ${next} ms`);
  });

  DevSettings.addMenuItem('Network: toggle 30% failures', () => {
    const failureRate = getNetworkConditions().failureRate > 0 ? 0 : FAILURE_RATE;
    setNetworkConditions({ failureRate });
    toast.info(`Request failure rate: ${failureRate * 100}%`);
  });

  DevSettings.addMenuItem('Auth: expire access token', () => {
    expireAccessTokenForTesting();
    toast.info('Access token expired: next request refreshes');
  });
};
