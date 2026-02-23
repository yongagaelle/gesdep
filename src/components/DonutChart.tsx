import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { SPACING, FONT_SIZES } from '../constants';
import { useColors } from '../hooks';

interface DonutChartProps {
  data: Array<{
    name: string;
    amount: number;
    color: string;
    percentage?: number;
  }>;
  centerText?: string;
  centerValue?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  centerText,
  centerValue,
}) => {
  const COLORS = useColors();
  const styles = createStyles(COLORS);

  const chartData = data.map((item) => ({
    name: item.name,
    population: item.amount,
    color: item.color,
    legendFontColor: COLORS.text,
    legendFontSize: 13,
  }));

  const total = data.reduce((sum, item) => sum + item.amount, 0);

  return (
    <View style={styles.container}>
      <View style={styles.chartWrapper}>
        <PieChart
          data={chartData}
          width={300}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="0"
          center={[10, 0]}
          absolute={false}
          hasLegend={false}
        />
        {centerValue && (
          <View style={styles.centerLabel}>
            <Text style={styles.centerValue}>{centerValue}</Text>
            {centerText && (
              <Text style={styles.centerText}>{centerText}</Text>
            )}
          </View>
        )}
      </View>

      <View style={styles.legendContainer}>
        {data.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <View style={styles.legendTextContainer}>
              <Text style={styles.legendName}>{item.name}</Text>
              <Text style={styles.legendAmount}>
                {item.amount.toFixed(0)}€ •{' '}
                {((item.amount / total) * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  chartWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  centerLabel: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -30 }],
    alignItems: 'center',
  },
  centerValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  centerText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  legendContainer: {
    marginTop: SPACING.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  legendTextContainer: {
    flex: 1,
  },
  legendName: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  legendAmount: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
});
