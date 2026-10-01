import { useMutation } from '@tanstack/react-query';

import { analytics } from '@/core/analytics';
import { startSession } from '@/core/auth';
import { toAppError } from '@/core/errors';

import { authApi, type SignInRequest } from '../api/authApi';

export const useSignIn = () =>
  useMutation({
    mutationFn: async (credentials: SignInRequest) => {
      const { tokens, user } = await authApi.signIn(credentials);
      // Navigation reacts to the session state change; never navigate manually here.
      await startSession(tokens, user);
    },
    onSuccess: () => analytics.track('sign_in_succeeded', { method: 'password' }),
    onError: error => analytics.track('sign_in_failed', { reason: toAppError(error).kind }),
  });
