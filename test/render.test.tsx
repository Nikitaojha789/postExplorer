import { View } from 'react-native';

import { screen } from '@testing-library/react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';

import { renderWithProviders } from './render';

/** Any screen with a Gesture Handler 3 gesture must render in the harness. */
function Swipeable() {
  const pan = usePanGesture({});
  return (
    <GestureDetector gesture={pan}>
      <View testID="swipeable" />
    </GestureDetector>
  );
}

describe('renderWithProviders', () => {
  it('renders components that use Gesture Handler 3 gestures', async () => {
    await renderWithProviders(<Swipeable />);
    expect(screen.getByTestId('swipeable')).toBeOnTheScreen();
  });
});
