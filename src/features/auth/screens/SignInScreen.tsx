import { useRef } from 'react';
import { View } from 'react-native';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { errorMessageKey, toAppError } from '@/core/errors';
import { Button, makeStyles, Screen, Text, TextField, type TextFieldRef } from '@/ui';

import { useSignIn } from '../hooks/useSignIn';

const MIN_PASSWORD_LENGTH = 8;

// Schema at module scope (built once). Messages are i18n KEYS, translated at render.
const SignInSchema = z.object({
  email: z.string().trim().min(1, 'validation.required').pipe(z.email('validation.email')),
  password: z.string().min(MIN_PASSWORD_LENGTH, 'validation.minLength'),
});
type SignInForm = z.infer<typeof SignInSchema>;

export function SignInScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const signIn = useSignIn();
  const passwordRef = useRef<TextFieldRef>(null);

  const { control, handleSubmit } = useForm<SignInForm>({
    resolver: zodResolver(SignInSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  const fieldError = (message: string | undefined) =>
    message === undefined
      ? undefined
      : message === 'validation.minLength'
        ? t('validation.minLength', { count: MIN_PASSWORD_LENGTH })
        : t(message as 'validation.required' | 'validation.email');

  const submitError = signIn.error
    ? toAppError(signIn.error).kind === 'unauthorized' ||
      toAppError(signIn.error).kind === 'validation'
      ? t('auth.invalidCredentials')
      : t(errorMessageKey(signIn.error))
    : undefined;

  const onSubmit = handleSubmit(values => signIn.mutate(values));

  return (
    <Screen
      preset="scroll"
      edges={['top', 'bottom']}
      contentStyle={styles.content}
      testID="sign-in-screen"
    >
      <View style={styles.header}>
        <Text variant="title1" accessibilityRole="header">
          {t('auth.title')}
        </Text>
        <Text color="textSecondary">{t('auth.subtitle')}</Text>
      </View>

      <Controller
        control={control}
        name="email"
        render={({ field, fieldState }) => (
          <TextField
            testID="sign-in-email"
            label={t('auth.email')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(fieldState.error?.message)}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
        )}
      />
      <Controller
        control={control}
        name="password"
        render={({ field, fieldState }) => (
          <TextField
            ref={passwordRef}
            testID="sign-in-password"
            label={t('auth.password')}
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldError(fieldState.error?.message)}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => void onSubmit()}
          />
        )}
      />

      {submitError !== undefined && (
        <Text color="danger" accessibilityRole="alert" testID="sign-in-error">
          {submitError}
        </Text>
      )}

      <Button
        testID="sign-in-submit"
        title={t('auth.submit')}
        loading={signIn.isPending}
        onPress={() => void onSubmit()}
        fullWidth
      />

      <Text variant="caption" color="textMuted" align="center" testID="sign-in-hint">
        {t('auth.mockHint')}
      </Text>
    </Screen>
  );
}

const useStyles = makeStyles(({ spacing }) => ({
  content: { flexGrow: 1, justifyContent: 'center', gap: spacing.lg },
  header: { gap: spacing.xs, marginBottom: spacing.md },
}));
