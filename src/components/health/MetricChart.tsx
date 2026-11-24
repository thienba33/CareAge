import React, { useMemo, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { colors, typography } from "../../theme/colors";
import type { ChartSeries, ReferenceLine } from "../../utils/chart";
import { computeYAxis, nearestIndex } from "../../utils/chart";
import { formatDateTime } from "../../utils/date";


const SERIES_COLORS = [colors.chartSeries1, colors.chartSeries2];
const HEIGHT = 240;
const PADDING = { top: 16, right: 16, bottom: 32, left: 44 };
const MAX_POINTS_WITH_MARKERS = 31;

type Props = {
  series: ChartSeries[];
  referenceLines: ReferenceLine[];
  abnormalMetricIds: Set<string>;
  unit: string;
  from: number;
  to: number;
};

const shortDate = (t: number) => {
  const d = new Date(t);
  return `${d.getDate()}/${d.getMonth() + 1}`;
};

export default function MetricChart({ series, referenceLines, abnormalMetricIds, unit, from, to }: Props) {
  const [width, setWidth] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const primary = series[0]?.points ?? [];
  const plotWidth = Math.max(width - PADDING.left - PADDING.right, 1);
  const plotHeight = HEIGHT - PADDING.top - PADDING.bottom;

  const axis = useMemo(
    () =>
      computeYAxis([
        ...series.flatMap((s) => s.points.map((p) => p.value)),
        ...referenceLines.map((r) => r.value),
      ]),
    [series, referenceLines]
  );

  const x = (t: number) => PADDING.left + ((t - from) / Math.max(to - from, 1)) * plotWidth;
  const y = (v: number) => PADDING.top + (1 - (v - axis.min) / Math.max(axis.max - axis.min, 1)) * plotHeight;

  const showMarkers = primary.length <= MAX_POINTS_WITH_MARKERS;
  const selected = selectedIndex !== null ? primary[selectedIndex] : null;

  const handlePress = (locationX: number) => {
    if (primary.length === 0) return;
    const time = from + ((locationX - PADDING.left) / plotWidth) * (to - from);
    setSelectedIndex(nearestIndex(primary, time));
  };

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View>
      {series.length > 1 ? (
        <View style={styles.legend} accessibilityRole="text">
          {series.map((s, i) => (
            <View key={s.key} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: SERIES_COLORS[i] }]} />
              <Text style={styles.legendText}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Tooltip của điểm đang chọn — chữ màu chữ, chấm màu series mang danh tính. */}
      <View style={styles.tooltip}>
        {selected ? (
          <>
            <Text style={styles.tooltipTime}>{formatDateTime(new Date(selected.time).toISOString())}</Text>
            <View style={styles.tooltipValues}>
              {series.map((s, i) => (
                <View key={s.key} style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: SERIES_COLORS[i] }]} />
                  <Text style={styles.tooltipValue}>
                    {series.length > 1 ? `${s.label}: ` : ""}
                    {s.points[selectedIndex!]?.value} {unit}
                  </Text>
                </View>
              ))}
            </View>
            {abnormalMetricIds.has(selected.metricId) ? (
              <View style={styles.legendItem}>
                <Ionicons name="warning" size={16} color={colors.danger} />
                <Text style={styles.tooltipAlert}>Lần đo này có cảnh báo</Text>
              </View>
            ) : null}
          </>
        ) : (
          <Text style={styles.tooltipHint}>Chạm vào biểu đồ để xem giá trị từng lần đo</Text>
        )}
      </View>

      <Pressable onLayout={onLayout} onPress={(e) => handlePress(e.nativeEvent.locationX)} style={{ height: HEIGHT }}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            {/* Lưới + nhãn trục Y */}
            {axis.ticks.map((tick) => (
              <G key={tick}>
                <Line x1={PADDING.left} x2={width - PADDING.right} y1={y(tick)} y2={y(tick)} stroke={colors.chartGrid} strokeWidth={1} />
                <SvgText x={PADDING.left - 8} y={y(tick) + 5} fontSize={14} fill={colors.textMuted} textAnchor="end">
                  {tick}
                </SvgText>
              </G>
            ))}

            {/* Nhãn trục thời gian: đầu, giữa, cuối */}
            {[from, (from + to) / 2, to].map((t, i) => (
              <SvgText
                key={i}
                x={x(t)}
                y={HEIGHT - 8}
                fontSize={14}
                fill={colors.textMuted}
                textAnchor={i === 0 ? "start" : i === 2 ? "end" : "middle"}
              >
                {shortDate(t)}
              </SvgText>
            ))}

            {/* Khoảng tham chiếu do Backend cung cấp */}
            {referenceLines.map((r) => (
              <Line
                key={`${r.direction}-${r.value}`}
                x1={PADDING.left}
                x2={width - PADDING.right}
                y1={y(r.value)}
                y2={y(r.value)}
                stroke={colors.warning}
                strokeWidth={1.5}
                strokeDasharray="6 5"
              />
            ))}

            {/* Crosshair */}
            {selected ? (
              <Line x1={x(selected.time)} x2={x(selected.time)} y1={PADDING.top} y2={PADDING.top + plotHeight} stroke={colors.textMuted} strokeWidth={1} />
            ) : null}

            {series.map((s, i) => {
              const d = s.points.map((p, j) => `${j === 0 ? "M" : "L"}${x(p.time).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
              return (
                <G key={s.key}>
                  <Path d={d} stroke={SERIES_COLORS[i]} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
                  {s.points.map((p, j) => {
                    const isAbnormal = abnormalMetricIds.has(p.metricId);
                    const isSelected = j === selectedIndex;
                    if (!showMarkers && !isAbnormal && !isSelected) return null;
                    return (
                      <Circle
                        key={p.metricId + s.key}
                        cx={x(p.time)}
                        cy={y(p.value)}
                        r={isAbnormal ? 6 : isSelected ? 5 : 4}
                        fill={isAbnormal ? colors.danger : SERIES_COLORS[i]}
                        stroke={colors.surface}
                        strokeWidth={2}
                      />
                    );
                  })}
                </G>
              );
            })}
          </Svg>
        ) : null}
      </Pressable>

      {referenceLines.length > 0 || abnormalMetricIds.size > 0 ? (
        <View style={styles.legend}>
          {referenceLines.length > 0 ? (
            <View style={styles.legendItem}>
              <View style={styles.legendDash} />
              <Text style={styles.legendText}>
                Ngưỡng theo dõi: {referenceLines.map((r) => `${r.direction === "ABOVE" ? "trên" : "dưới"} ${r.value}`).join(", ")}
              </Text>
            </View>
          ) : null}
          {abnormalMetricIds.size > 0 ? (
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
              <Text style={styles.legendText}>Lần đo có cảnh báo</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginVertical: 6 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 16, height: 4, borderRadius: 2 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendDash: { width: 18, height: 0, borderTopWidth: 2, borderStyle: "dashed", borderColor: colors.warning },
  legendText: { fontSize: typography.caption, color: colors.textMuted },
  tooltip: {
    minHeight: 48,
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#EEF2F6",
  },
  tooltipTime: { fontSize: 11, color: colors.textMuted },
  tooltipValues: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 2 },
  tooltipValue: { fontSize: 14, fontWeight: "700", color: colors.text },
  tooltipAlert: { fontSize: 11, fontWeight: "700", color: colors.danger },
  tooltipHint: { fontSize: 12, color: colors.textMuted, textAlign: "center" },
});
