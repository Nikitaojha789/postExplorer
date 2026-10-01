import { screen, userEvent, waitFor } from '@testing-library/react-native';

import { useSessionStore } from '@/core/auth';
import { AppError } from '@/core/errors';
import { renderWithProviders } from '@test/render';

import { SignInScreen } from './SignInScreen';
import { authApi } from '../api/authApi';

jest.mock('../api/authApi', () => ({ authApi: { signIn: jest.fn() } }));
const signIn = jest.mocked(authApi.signIn);

describe('SignInScreen', () => {
  beforeEach(() => {
    signIn.mockReset();
    useSessionStore.setState({ status: 'signedOut', user: null });
  });

  it('shows translated validation errors and does not submit invalid input', async () => {
    const user = userEvent.setup();
    await renderWithProviders(<SignInScreen />);

    await user.type(screen.getByTestId('sign-in-email'), 'not-an-email');
    await user.type(screen.getByTestId('sign-in-password'), 'short');
    await user.press(screen.getByTestId('sign-in-submit'));

    expect(await screen.findByText('Enter a valid email address')).toBeOnTheScreen();
    expect(screen.getByText('Must be at least 8 characters')).toBeOnTheScreen();
    expect(signIn).not.toHaveBeenCalled();
  });

  it('starts a session on success', async () => {
    signIn.mockResolvedValue({
      tokens: { accessToken: 'a', refreshToken: 'r' },
      user: { id: '1', name: 'Ada', email: 'ada@example.com' },
    });
    const user = userEvent.setup();
    await renderWithProviders(<SignInScreen />);

    await user.type(screen.getByTestId('sign-in-email'), 'ada@example.com');
    await user.type(screen.getByTestId('sign-in-password'), 'password123');
    await user.press(screen.getByTestId('sign-in-submit'));

    await waitFor(() => expect(useSessionStore.getState().status).toBe('signedIn'));
    expect(signIn).toHaveBeenCalledWith({ email: 'ada@example.com', password: 'password123' });
  });

  it('shows a credentials error on 401', async () => {
    signIn.mockRejectedValue(new AppError({ kind: 'unauthorized', status: 401, message: 'nope' }));
    const user = userEvent.setup();
    await renderWithProviders(<SignInScreen />);

    await user.type(screen.getByTestId('sign-in-email'), 'ada@example.com');
    await user.type(screen.getByTestId('sign-in-password'), 'password123');
    await user.press(screen.getByTestId('sign-in-submit'));

    expect(await screen.findByText('Incorrect email or password.')).toBeOnTheScreen();
    expect(useSessionStore.getState().status).toBe('signedOut');
  });
});
