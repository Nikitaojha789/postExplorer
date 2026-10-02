import type { ReactNode } from 'react';
import { View } from 'react-native';

import { makeStyles } from '@/ui/theme';

import { Text } from './Text';

export interface SectionProps {
  /** Already-translated heading. */
  title: string;
  children: ReactNode;
  /** Optional caption under the group. */
  footer?: string;
  testID?: string;
}

/** Grouped settings-style block: uppercase heading + bordered body (e.g. of ListRows). */
export function Section({ title, children, footer, testID }: SectionProps) {
  const styles = useStyles();
  return (
    <View style={styles.section} testID={testID}>
      <Text variant="label" color="textSecondary" style={styles.title} accessibilityRole="header">
        {title}
      </Text>
      <View style={styles.body}>{children}</View>
      {footer !== undefined && (
        <Text variant="caption" color="textSecondary" style={styles.footer}>
          {footer}
        </Text>
      )}
    </View>
  );
}

const useStyles = makeStyles(({ colors, spacing }) => ({
  section: { marginTop: spacing.xl },
  title: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, textTransform: 'uppercase' },
  body: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  footer: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },
}));
