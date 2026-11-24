import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import type { ChartSeries } from "../../utils/chart";
import { summarize } from "../../utils/chart";

type Props = {
  series: ChartSeries[];
  unit: string;
};

const formatNumber = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

export default function MetricStatsSummary({ series, unit }: Props) {
  return (
    <View style={styles.statsWrapper}>
      {series.map((s) => {
        const summary = summarize(s.points);
        if (!summary) return null;
        return (
          <View key={s.key} style={styles.statsCard}>
            {series.length > 1 ? (
              <Text style={styles.statsCardTitle}>{s.label}</Text>
            ) : null}
            <View style={styles.statsCols}>
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Thấp nhất</Text>
                <Text style={styles.statNum}>{formatNumber(summary.min)}</Text>
                <Text style={styles.statSubUnit}>{unit}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Trung bình</Text>
                <Text style={[styles.statNum, styles.statNumPrimary]}>
                  {formatNumber(Math.round(summary.average * 10) / 10)}
                </Text>
                <Text style={styles.statSubUnit}>{unit}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCol}>
                <Text style={styles.statLabel}>Cao nhất</Text>
                <Text style={styles.statNum}>{formatNumber(summary.max)}</Text>
                <Text style={styles.statSubUnit}>{unit}</Text>
              </View>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  statsWrapper: {
    gap: 10,
  },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 8,
  },
  statsCardTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 4,
  },
  statsCols: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  statCol: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: colors.border,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "500",
  },
  statNum: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  statNumPrimary: {
    color: colors.primary,
  },
  statSubUnit: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
});
