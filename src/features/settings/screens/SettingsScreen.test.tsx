import { screen, userEvent, waitFor } from '@testing-library/react-native';

import { useSessionStore } from '@/core/auth';
import { renderWithProviders } from '@test/render';

import { SettingsScreen } from './SettingsScreen';

describe('SettingsScreen', () => {
  beforeEach(() => {
    useSessionStore.setState({
      status: 'signedIn',
      user: { id: 'u1', name: 'Test User', email: 'test@example.com' },
    });
  });

  it('renders settings sections and themes', async () => {
    await renderWithProviders(<SettingsScreen />);

    expect(screen.getByText('Appearance')).toBeOnTheScreen();
    expect(screen.getByTestId('theme-system')).toBeOnTheScreen();
    expect(screen.getByTestId('theme-light')).toBeOnTheScreen();
    expect(screen.getByTestId('theme-dark')).toBeOnTheScreen();
    expect(screen.getByText('About')).toBeOnTheScreen();
  });

  it('logs out when the sign out button is pressed', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<SettingsScreen />);

    const signOutButton = screen.getByTestId('sign-out');
    expect(signOutButton).toBeOnTheScreen();

    await user.press(signOutButton);

    await waitFor(() => {
      expect(useSessionStore.getState().status).toBe('signedOut');
      expect(useSessionStore.getState().user).toBeNull();
    });
  });

  it('hides sign out button when not signed in', async () => {
    useSessionStore.setState({ status: 'signedOut', user: null });
    await renderWithProviders(<SettingsScreen />);

    expect(screen.queryByTestId('sign-out')).toBeNull();
  });
});
