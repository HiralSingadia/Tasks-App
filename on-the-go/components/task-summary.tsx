import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

type TaskSummaryProps = {
  activeTaskCount: number;
  nearbyTaskCount: number;
  nearbyStoreName: string;
};

export function TaskSummary({
  activeTaskCount,
  nearbyTaskCount,
  nearbyStoreName,
}: TaskSummaryProps) {
  return (
    <ThemedView style={styles.summaryRow}>
      <ThemedView style={styles.summaryPill}>
        <ThemedText style={styles.summaryNumber}>{activeTaskCount}</ThemedText>
        <ThemedText style={styles.summaryLabel}>active</ThemedText>
      </ThemedView>

      <ThemedView style={styles.summaryPill}>
        <ThemedText style={styles.summaryNumber}>{nearbyTaskCount}</ThemedText>
        <ThemedText style={styles.summaryLabel}>near {nearbyStoreName}</ThemedText>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  summaryRow: {
    backgroundColor: 'transparent',
    flexDirection: 'row',
    gap: 12,
  },
  summaryPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E5E9',
    flex: 1,
    padding: 14,
  },
  summaryNumber: {
    color: '#1F2933',
    fontSize: 24,
    fontWeight: '800',
  },
  summaryLabel: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 2,
  },
});
