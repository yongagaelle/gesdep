import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { SPACING, FONT_SIZES } from '../constants';
import { useColors } from '../hooks';

const SCREEN_WIDTH = Dimensions.get('window').width;

type TimePeriod = '1D' | '1W' | '1M' | '3M' | '1Y' | 'All';

interface ChartCardProps {
  title?: string;
  value: string;
  data: number[];
  labels: string[];
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  value,
  data,
  labels,
}) => {
  const COLORS = useColors();
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('1Y');

  const periods: TimePeriod[] = ['1D', '1W', '1M', '3M', '1Y', 'All'];

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: COLORS.card,
    backgroundGradientTo: COLORS.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(255, 149, 0, ${opacity})`,
    labelColor: (opacity = 1) => COLORS.textSecondary,
    style: {
      borderRadius: 16,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: COLORS.border,
      strokeWidth: 0.5,
    },
    propsForDots: {
      r: '0',
    },
    fillShadowGradientFrom: 'rgba(255, 149, 0, 0.3)',
    fillShadowGradientTo: 'rgba(255, 149, 0, 0.01)',
    fillShadowGradientFromOpacity: 0.3,
    fillShadowGradientToOpacity: 0.01,
  };

  const styles = createStyles(COLORS);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.value}>{value}</Text>
      </View>

      <LineChart
        data={{
          labels: labels,
          datasets: [
            {
              data: data,
            },
          ],
        }}
        width={SCREEN_WIDTH - SPACING.lg * 4}
        height={180}
        chartConfig={chartConfig}
        bezier
        style={styles.chart}
        withHorizontalLabels={true}
        withVerticalLabels={false}
        withInnerLines={true}
        withOuterLines={false}
        withDots={false}
        withShadow={true}
        segments={4}
      />

      <View style={styles.periodSelector}>
        {periods.map((period) => (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              selectedPeriod === period && styles.periodButtonActive,
            ]}
            onPress={() => setSelectedPeriod(period)}
          >
            <Text
              style={[
                styles.periodText,
                selectedPeriod === period && styles.periodTextActive,
              ]}
            >
              {period}
            </Text>
          </TouchableOpacity>
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
  header: {
    marginBottom: SPACING.md,
  },
  value: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: -1,
  },
  chart: {
    marginLeft: -SPACING.md,
    marginRight: -SPACING.md,
    marginVertical: SPACING.sm,
  },
  periodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: 8,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: COLORS.textSecondary,
  },
  periodText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  periodTextActive: {
    color: COLORS.card,
    fontWeight: '600',
  },
});
