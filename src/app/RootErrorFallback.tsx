import { useTranslation } from 'react-i18next';

import { Button, makeStyles, Screen, Text } from '@/ui';

export function RootErrorFallback({ reset }: { error: Error; reset: () => void }) {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content} testID="root-error">
      <Text variant="title2" align="center" accessibilityRole="header">
        {t('errorBoundary.title')}
      </Text>
      <Text color="textSecondary" align="center">
        {t('errorBoundary.message')}
      </Text>
      <Button title={t('errorBoundary.action')} onPress={reset} />
    </Screen>
  );
}

const useStyles = makeStyles(({ spacing }) => ({
  content: { justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
}));
