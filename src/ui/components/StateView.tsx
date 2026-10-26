import { ActivityIndicator, View } from 'react-native';

import { useTranslation } from 'react-i18next';

import { errorMessageKey } from '@/core/errors';
import { makeStyles, useTheme } from '@/ui/theme';

import { Button } from './Button';
import { Text } from './Text';

/**
 * Full-area loading indicator. For content-shaped loading (lists, cards)
 * prefer `<Skeleton>` placeholders that mirror the layout.
 */
export function LoadingState({
  testID = 'loading-state',
  message,
}: {
  testID?: string;
  message?: string;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const label = message ?? t('common.loading');
  return (
    <View
      style={styles.center}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={label}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message !== undefined && (
        <Text color="textSecondary" align="center">
          {message}
        </Text>
      )}
    </View>
  );
}

/** Maps any error to a translated message with an optional retry. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <View style={styles.center} testID="error-state">
      <Text variant="title3" align="center" accessibilityRole="alert">
        {t(errorMessageKey(error))}
      </Text>
      {onRetry && <Button title={t('common.retry')} variant="secondary" onPress={onRetry} />}
    </View>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.center} testID="empty-state">
      <Text variant="title3" align="center">
        {title}
      </Text>
      {message !== undefined && (
        <Text color="textSecondary" align="center">
          {message}
        </Text>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ spacing }) => ({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
}));
