import type { ComponentType } from 'react';

export const init = jest.fn();
export const captureException = jest.fn();
export const addBreadcrumb = jest.fn();
export const setUser = jest.fn();
export const wrap = <P extends object>(component: ComponentType<P>) => component;
export const reactNavigationIntegration = () => ({
  name: 'ReactNavigation',
  registerNavigationContainer: jest.fn(),
});
