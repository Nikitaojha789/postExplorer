import { useState } from 'react';
import { Text } from 'react-native';

import { render, screen } from '@testing-library/react-native';

import { ErrorBoundary } from './ErrorBoundary';

function Boom(): never {
  throw new Error('boom');
}

// The fallback uses hooks — this must work (regression: calling it as a function broke hooks).
function Fallback({ error, reset }: { error: Error; reset: () => void }) {
  const [label] = useState(`Recovered from ${error.message}`);
  return (
    <Text onPress={reset} testID="fallback">
      {label}
    </Text>
  );
}

describe('ErrorBoundary', () => {
  beforeEach(() => jest.spyOn(console, 'error').mockImplementation(() => undefined));
  afterEach(() => jest.restoreAllMocks());

  it('renders a hook-using fallback and reports the error', async () => {
    const onError = jest.fn();
    await render(
      <ErrorBoundary fallback={Fallback} onError={onError}>
        <Boom />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Recovered from boom')).toBeOnTheScreen();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'boom' }),
      expect.anything(),
    );
  });

  it('renders children when nothing throws', async () => {
    await render(
      <ErrorBoundary fallback={Fallback}>
        <Text>fine</Text>
      </ErrorBoundary>,
    );
    expect(screen.getByText('fine')).toBeOnTheScreen();
  });
});
