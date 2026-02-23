import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle, Line, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTransactions } from '../contexts/TransactionContext';
import { useColors } from '../hooks';
import { SPACING, FONT_SIZES } from '../constants';
import { Transaction } from '../types';
import { generateStatisticsReport } from '../utils/statisticsPdfExport';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Period = '1D' | '1W' | '2W' | '1M' | '3M' | '1Y' | 'All';
type ChartFilter = 'all' | 'expenses' | 'donations';

export const StatisticsScreen: React.FC = () => {
  const COLORS = useColors();
  const styles = createStyles(COLORS);
  
  const { transactions, loading, refreshTransactions } = useTransactions();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('1W');
  const [chartFilter, setChartFilter] = useState<ChartFilter>('all');
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    refreshTransactions();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshTransactions();
    }, [refreshTransactions])
  );

  // Calculer les totaux
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const balance = totalIncome - totalExpense;

  // Filtrer les transactions par période
  const filterTransactionsByPeriod = (period: Period): Transaction[] => {
    const now = new Date();
    const periodStart = new Date();

    switch (period) {
      case '1D':
        periodStart.setHours(0, 0, 0, 0);
        break;
      case '1W':
        periodStart.setDate(now.getDate() - 7);
        break;
      case '2W':
        periodStart.setDate(now.getDate() - 14);
        break;
      case '1M':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case '1Y':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
      case 'All':
        return transactions;
    }

    return transactions.filter(t => t.date >= periodStart);
  };

  // Générer les données du graphique basées sur les vraies transactions
  const getChartData = () => {
    const filteredTransactions = filterTransactionsByPeriod(selectedPeriod);
    
    let labels: string[] = [];
    let expensesData: number[] = [];
    let donationsData: number[] = [];

    const groupByPeriod = (transactions: Transaction[]) => {
      const groups: { [key: string]: { expenses: number; income: number } } = {};
      
      transactions.forEach(t => {
        let key = '';
        const date = t.date;

        switch (selectedPeriod) {
          case '1D':
            key = `${date.getHours()}h`;
            break;
          case '1W':
          case '2W':
            const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
            key = days[date.getDay()];
            break;
          case '1M':
            key = date.getDate().toString();
            break;
          case '3M':
            key = `S${Math.ceil(date.getDate() / 7)}`;
            break;
          case '1Y':
            const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
            key = months[date.getMonth()];
            break;
          case 'All':
            key = date.getFullYear().toString();
            break;
        }

        if (!groups[key]) {
          groups[key] = { expenses: 0, income: 0 };
        }

        if (t.type === 'expense') {
          groups[key].expenses += t.amount;
        } else if (t.type === 'income') {
          groups[key].income += t.amount;
        }
      });

      return groups;
    };

    const grouped = groupByPeriod(filteredTransactions);
    labels = Object.keys(grouped);
    expensesData = labels.map(key => Math.abs(grouped[key].expenses));
    donationsData = labels.map(key => grouped[key].income);

    // Si pas de données, afficher un graphique vide avec des labels par défaut
    if (labels.length === 0) {
      switch (selectedPeriod) {
        case '1W':
          labels = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
          break;
        case '1M':
          labels = ['1', '5', '10', '15', '20', '25', '30'];
          break;
        default:
          labels = ['', '', '', '', '', ''];
      }
      expensesData = new Array(labels.length).fill(0);
      donationsData = new Array(labels.length).fill(0);
    }

    return { labels, expenses: expensesData, donations: donationsData };
  };

  const chartData = getChartData();
  const maxValue = Math.max(...chartData.expenses, ...chartData.donations, 1);
  const chartHeight = 200;
  const chartWidth = SCREEN_WIDTH - 100;

  const periods: Period[] = ['1D', '1W', '2W', '1M', '3M', '1Y', 'All'];

  const renderDonutChart = () => {
    const total = totalExpense + totalIncome;
    if (total === 0) {
      return (
        <View style={styles.donutContainer}>
          <Text style={styles.emptyChartText}>Aucune donnée</Text>
        </View>
      );
    }

    const expensePercentage = (Math.abs(totalExpense) / total) * 100;
    const expenseAngle = (expensePercentage / 100) * 2 * Math.PI;
    
    const expenseEndX = 100 + 80 * Math.cos(expenseAngle - Math.PI / 2);
    const expenseEndY = 100 + 80 * Math.sin(expenseAngle - Math.PI / 2);
    
    return (
      <View style={styles.donutContainer}>
        <Svg width="200" height="200" viewBox="0 0 200 200">
          <Defs>
            <LinearGradient id="expGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={COLORS.danger} stopOpacity="0.9" />
              <Stop offset="100%" stopColor={COLORS.danger} stopOpacity="0.7" />
            </LinearGradient>
            <LinearGradient id="donGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor={COLORS.success} stopOpacity="0.9" />
              <Stop offset="100%" stopColor={COLORS.success} stopOpacity="0.7" />
            </LinearGradient>
          </Defs>
          
          {/* Expenses arc */}
          <Path
            d={`M 100 20 A 80 80 0 ${expensePercentage > 50 ? 1 : 0} 1 ${expenseEndX} ${expenseEndY} L 100 100 Z`}
            fill="url(#expGrad)"
          />
          
          {/* Donations arc */}
          <Path
            d={`M 100 100 L ${expenseEndX} ${expenseEndY} A 80 80 0 ${100 - expensePercentage > 50 ? 1 : 0} 1 100 20 Z`}
            fill="url(#donGrad)"
          />
          
          {/* Center circle */}
          <Circle cx="100" cy="100" r="50" fill={COLORS.card} />
        </Svg>
        
        <View style={styles.donutCenter}>
          <Text style={styles.donutValue}>{total.toFixed(0)}€</Text>
          <Text style={styles.donutLabel}>Total</Text>
        </View>
      </View>
    );
  };

  const handleExportPDF = async () => {
    if (transactions.length === 0) {
      Alert.alert('Aucune donnée', 'Il n\'y a aucune statistique à exporter.');
      return;
    }

    setIsExporting(true);
    try {
      const periodLabel = selectedPeriod === '1D' ? 'Aujourd\'hui' : 
        selectedPeriod === '1W' ? 'Cette semaine' :
        selectedPeriod === '2W' ? '2 dernières semaines' :
        selectedPeriod === '1M' ? 'Ce mois' :
        selectedPeriod === '3M' ? '3 derniers mois' :
        selectedPeriod === '1Y' ? 'Cette année' : 'Toutes les périodes';

      const filteredTrans = filterTransactionsByPeriod(selectedPeriod);

      await generateStatisticsReport({
        transactions: filteredTrans,
        totalIncome,
        totalExpense,
        balance,
        period: periodLabel,
        userName: 'Utilisateur', // Vous pouvez récupérer le nom réel de l'utilisateur
        chartData: getChartData(),
      });
      
      Alert.alert('Succès', 'Les statistiques ont été exportées avec succès !');
    } catch (error) {
      console.error(error);
      Alert.alert('Erreur', 'Impossible d\'exporter les statistiques.');
    } finally {
      setIsExporting(false);
    }
  };

  const yAxisValues = Array.from({ length: 5 }, (_, i) => Math.round((maxValue * (4 - i)) / 4));

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Statistiques</Text>
          <Text style={styles.subtitle}>Votre bilan financier</Text>
        </View>
        <TouchableOpacity 
          style={styles.exportButton}
          onPress={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="download" size={24} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>Dons</Text>
            <View style={[styles.iconContainer, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="arrow-down" size={20} color={COLORS.success} />
            </View>
          </View>
          <Text style={[styles.summaryValue, { color: COLORS.success }]}>+{totalIncome.toFixed(0)}€</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>Dépenses</Text>
            <View style={[styles.iconContainer, { backgroundColor: '#fee2e2' }]}>
              <Ionicons name="arrow-up" size={20} color={COLORS.danger} />
            </View>
          </View>
          <Text style={[styles.summaryValue, { color: COLORS.danger }]}>-{Math.abs(totalExpense).toFixed(0)}€</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryLabel}>Solde</Text>
            <View style={[styles.iconContainer, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="wallet" size={20} color={COLORS.primary} />
            </View>
          </View>
          <Text style={[styles.summaryValue, { color: balance >= 0 ? COLORS.success : COLORS.danger }]}>
            {balance.toFixed(0)}€
          </Text>
        </View>
      </View>

      {/* Chart Card */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Évolution</Text>
        <Text style={styles.chartSubtitle}>Dépenses et dons</Text>

        {/* Period Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period}
              onPress={() => setSelectedPeriod(period)}
              style={[
                styles.periodButton,
                selectedPeriod === period && styles.periodButtonActive
              ]}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period && styles.periodButtonTextActive
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter Buttons */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            onPress={() => setChartFilter('all')}
            style={[styles.filterButton, chartFilter === 'all' && styles.filterButtonAll]}
          >
            <Text style={[styles.filterButtonText, chartFilter === 'all' && styles.filterButtonTextActive]}>
              Les deux
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setChartFilter('expenses')}
            style={[styles.filterButton, chartFilter === 'expenses' && styles.filterButtonExpenses]}
          >
            <Text style={[styles.filterButtonText, chartFilter === 'expenses' && styles.filterButtonTextActive]}>
              Dépenses
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setChartFilter('donations')}
            style={[styles.filterButton, chartFilter === 'donations' && styles.filterButtonDonations]}
          >
            <Text style={[styles.filterButtonText, chartFilter === 'donations' && styles.filterButtonTextActive]}>
              Dons
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chart with Y-axis */}
        <View style={styles.chartContainer}>
          <View style={styles.yAxisContainer}>
            {yAxisValues.map((value, i) => (
              <Text key={i} style={styles.yAxisLabel}>
                {value}€
              </Text>
            ))}
          </View>

          <View style={{ flex: 1, height: chartHeight }}>
            <Svg width={chartWidth} height={chartHeight} viewBox={`0 0 100 ${chartHeight}`}>
              <Defs>
                <LinearGradient id="expensesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={COLORS.danger} stopOpacity="0.2" />
                  <Stop offset="100%" stopColor={COLORS.danger} stopOpacity="0" />
                </LinearGradient>
                <LinearGradient id="donationsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop offset="0%" stopColor={COLORS.success} stopOpacity="0.2" />
                  <Stop offset="100%" stopColor={COLORS.success} stopOpacity="0" />
                </LinearGradient>
              </Defs>

              {/* Grid lines */}
              {[0, 1, 2, 3, 4].map((i) => (
                <Line
                  key={i}
                  x1="0"
                  y1={i * (chartHeight / 4)}
                  x2="100"
                  y2={i * (chartHeight / 4)}
                  stroke="#000000"
                  strokeWidth="0.3"
                  opacity="0.2"
                />
              ))}

              {/* Expenses line */}
              {(chartFilter === 'all' || chartFilter === 'expenses') && chartData.expenses.length > 0 && (
                <>
                  {chartData.expenses.length > 1 && (
                    <>
                      <Path
                        d={`M 0 ${chartHeight} ${chartData.expenses
                          .map((value, index) => {
                            const x = chartData.expenses.length === 1 
                              ? 50 
                              : (index / (chartData.expenses.length - 1)) * 100;
                            const y = chartHeight - ((value || 0) / Math.max(maxValue, 1)) * chartHeight;
                            return `L ${x} ${isNaN(y) ? chartHeight : y}`;
                          })
                          .join(' ')} L 100 ${chartHeight} Z`}
                        fill="url(#expensesGradient)"
                      />
                      <Path
                        d={chartData.expenses
                          .map((value, index) => {
                            const x = chartData.expenses.length === 1 
                              ? 50 
                              : (index / (chartData.expenses.length - 1)) * 100;
                            const y = chartHeight - ((value || 0) / Math.max(maxValue, 1)) * chartHeight;
                            return `${index === 0 ? 'M' : 'L'} ${x} ${isNaN(y) ? chartHeight : y}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke={COLORS.danger}
                        strokeWidth="2"
                      />
                      {chartData.expenses.map((value, index) => {
                        const x = chartData.expenses.length === 1 
                          ? 50 
                          : (index / (chartData.expenses.length - 1)) * 100;
                        const y = chartHeight - ((value || 0) / Math.max(maxValue, 1)) * chartHeight;
                        if (isNaN(x) || isNaN(y)) return null;
                        return <Circle key={`exp-${index}`} cx={x} cy={y} r="2" fill={COLORS.danger} />;
                      })}
                    </>
                  )}
                </>
              )}

              {/* Donations line */}
              {(chartFilter === 'all' || chartFilter === 'donations') && chartData.donations.length > 0 && (
                <>
                  {chartData.donations.length > 1 && (
                    <>
                      <Path
                        d={`M 0 ${chartHeight} ${chartData.donations
                          .map((value, index) => {
                            const x = chartData.donations.length === 1 
                              ? 50 
                              : (index / (chartData.donations.length - 1)) * 100;
                            const y = chartHeight - ((value || 0) / Math.max(maxValue, 1)) * chartHeight;
                            return `L ${x} ${isNaN(y) ? chartHeight : y}`;
                          })
                          .join(' ')} L 100 ${chartHeight} Z`}
                        fill="url(#donationsGradient)"
                      />
                      <Path
                        d={chartData.donations
                          .map((value, index) => {
                            const x = chartData.donations.length === 1 
                              ? 50 
                              : (index / (chartData.donations.length - 1)) * 100;
                            const y = chartHeight - ((value || 0) / Math.max(maxValue, 1)) * chartHeight;
                            return `${index === 0 ? 'M' : 'L'} ${x} ${isNaN(y) ? chartHeight : y}`;
                          })
                          .join(' ')}
                        fill="none"
                        stroke={COLORS.success}
                        strokeWidth="2"
                      />
                      {chartData.donations.map((value, index) => {
                        const x = chartData.donations.length === 1 
                          ? 50 
                          : (index / (chartData.donations.length - 1)) * 100;
                        const y = chartHeight - ((value || 0) / Math.max(maxValue, 1)) * chartHeight;
                        if (isNaN(x) || isNaN(y)) return null;
                        return <Circle key={`don-${index}`} cx={x} cy={y} r="2" fill={COLORS.success} />;
                      })}
                    </>
                  )}
                </>
              )}
            </Svg>
          </View>
        </View>

        {/* X-axis labels */}
        <View style={styles.xAxisContainer}>
          {chartData.labels.map((label, index) => (
            <Text key={index} style={styles.xAxisLabel}>{label}</Text>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
            <Text style={styles.legendText}>Dépenses</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <Text style={styles.legendText}>Dons</Text>
          </View>
        </View>
      </View>

      {/* Donut Chart */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Répartition : Dépenses vs Dons</Text>
        {renderDonutChart()}
        
        <View style={styles.donutLegend}>
          <View style={styles.donutLegendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.danger }]} />
            <View>
              <Text style={styles.legendText}>Dépenses</Text>
              <Text style={styles.legendValue}>{Math.abs(totalExpense).toFixed(0)}€</Text>
            </View>
          </View>
          <View style={styles.donutLegendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.success }]} />
            <View>
              <Text style={styles.legendText}>Dons</Text>
              <Text style={styles.legendValue}>{totalIncome.toFixed(0)}€</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={{ height: SPACING.xxl }} />
    </ScrollView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  exportButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  summaryCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'nowrap',
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
    flexShrink: 1,
    marginRight: SPACING.xs,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  chartSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  periodScroll: {
    marginBottom: SPACING.md,
  },
  periodButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    marginRight: SPACING.sm,
  },
  periodButtonActive: {
    backgroundColor: COLORS.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  periodButtonTextActive: {
    color: COLORS.card,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  filterButton: {
    flex: 1,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  filterButtonAll: {
    backgroundColor: COLORS.text,
  },
  filterButtonExpenses: {
    backgroundColor: COLORS.danger,
  },
  filterButtonDonations: {
    backgroundColor: COLORS.success,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterButtonTextActive: {
    color: COLORS.card,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 200,
  },
  yAxisContainer: {
    justifyContent: 'space-between',
    paddingRight: SPACING.sm,
    width: 50,
  },
  yAxisLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
  xAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 50,
    marginTop: SPACING.sm,
  },
  xAxisLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.lg,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  legendValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  donutContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.lg,
    position: 'relative',
    height: 200,
  },
  donutCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutValue: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
  },
  donutLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  donutLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  donutLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  emptyChartText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});