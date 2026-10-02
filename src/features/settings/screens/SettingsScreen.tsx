import { Alert, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { analytics } from '@/core/analytics';
import { endSession, useIsSignedIn } from '@/core/auth';
import { buildInfo, env } from '@/core/config';
import {
  changeLanguage,
  getCurrentLanguage,
  LANGUAGE_CODES,
  LANGUAGE_SWITCHING_ENABLED,
  requiresRestartFor,
  SUPPORTED_LANGUAGES,
  type Language,
} from '@/core/i18n';
import {
  Button,
  ListRow,
  makeStyles,
  Screen,
  Section,
  setThemePreference,
  useThemePreference,
  type ThemePreference,
} from '@/ui';

const THEME_OPTIONS: readonly ThemePreference[] = ['system', 'light', 'dark'];
const CHECKMARK = '✓';

export function SettingsScreen() {
  const styles = useStyles();
  const { t } = useTranslation();
  const themePreference = useThemePreference();
  const currentLanguage = getCurrentLanguage();
  // Also reachable by guests if the app adopts the guest-browsing recipe.
  const isSignedIn = useIsSignedIn();

  const selectTheme = (preference: ThemePreference) => {
    setThemePreference(preference);
    analytics.track('theme_changed', { preference });
  };

  const selectLanguage = (language: Language) => {
    if (language === currentLanguage) return;
    const apply = () => {
      analytics.track('language_changed', { language });
      void changeLanguage(language);
    };
    if (!requiresRestartFor(language)) {
      apply();
      return;
    }
    Alert.alert(t('settings.restartTitle'), t('settings.restartMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.confirm'), onPress: apply },
    ]);
  };

  return (
    <Screen preset="scroll" padded={false} testID="settings-screen">
      <Section title={t('settings.appearance')}>
        {THEME_OPTIONS.map(option => (
          <ListRow
            key={option}
            testID={`theme-${option}`}
            title={t(`settings.theme.${option}`)}
            selected={themePreference === option}
            trailing={themePreference === option ? CHECKMARK : undefined}
            onPress={() => selectTheme(option)}
          />
        ))}
      </Section>

      {LANGUAGE_SWITCHING_ENABLED && (
        <Section title={t('settings.language')}>
          {LANGUAGE_CODES.map(code => (
            <ListRow
              key={code}
              testID={`language-${code}`}
              title={SUPPORTED_LANGUAGES[code].nativeName}
              selected={currentLanguage === code}
              trailing={currentLanguage === code ? CHECKMARK : undefined}
              onPress={() => selectLanguage(code)}
            />
          ))}
        </Section>
      )}

      <Section title={t('settings.about')}>
        <ListRow title={t('settings.version')} trailing={buildInfo.label} />
        <ListRow title={t('settings.environment')} trailing={env.APP_ENV} />
      </Section>

      {isSignedIn && (
        <View style={styles.signOut}>
          <Button
            testID="sign-out"
            title={t('settings.signOut')}
            variant="secondary"
            onPress={() => {
              analytics.track('signed_out');
              void endSession('user');
            }}
            fullWidth
          />
        </View>
      )}
    </Screen>
  );
}

const useStyles = makeStyles(({ spacing }) => ({
  signOut: { padding: spacing.lg, marginTop: spacing.xl },
}));
