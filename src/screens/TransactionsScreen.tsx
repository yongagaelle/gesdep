import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SPACING, FONT_SIZES } from '../constants';
import { Transaction, TransactionType } from '../types';
import { FilterModal, FilterOptions } from '../components/FilterModal';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { generateExpensesReport } from '../utils';
import { useColors } from '../hooks';
import { useTransactions } from '../contexts/TransactionContext';
import ExcelExportService from '../services/ExcelExportService';


export const TransactionsScreen: React.FC = () => {
  const COLORS = useColors();
  const styles = createStyles(COLORS);

  // Utiliser le Context
  const { transactions, loading, refreshTransactions, updateTransaction, deleteTransaction } = useTransactions();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    types: [],
    dateRange: 'all',
  });
  const [isExporting, setIsExporting] = useState(false);

  // Charger les transactions au démarrage et quand l'écran est focus
  useEffect(() => {
    refreshTransactions();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshTransactions();
    }, [refreshTransactions])
  );

  const handleDeleteTransaction = (transaction: Transaction) => {
    Alert.alert(
      'Supprimer la transaction',
      `Êtes-vous sûr de vouloir supprimer "${transaction.description}" ?`,
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transaction.id);
              Alert.alert('Succès', 'Transaction supprimée avec succès');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la transaction');
            }
          },
        },
      ]
    );
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditModalVisible(true);
  };

  const handleUpdateTransaction = async (updatedData: {
    amount: number;
    description: string;
    type: TransactionType;
    date: Date;
    author?: string;
    beneficiary?: string;
  }) => {
    if (!selectedTransaction) return;

    try {
      await updateTransaction(selectedTransaction.id, updatedData);
      setEditModalVisible(false);
      setSelectedTransaction(null);
      Alert.alert('Succès', 'Transaction modifiée avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier la transaction');
    }
  };

  const applyDateRangeFilter = (expense: Transaction, range: string): boolean => {
    const now = new Date();
    const expenseDate = expense.date;

    switch (range) {
      case 'today':
        return expenseDate.toDateString() === now.toDateString();
      case 'week':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return expenseDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return expenseDate >= monthAgo;
      case 'year':
        const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        return expenseDate >= yearAgo;
      case 'all':
      default:
        return true;
    }
  };

  const filteredTransactions = transactions.filter(t => {
    const matchesFilter = filters.types.length === 0 || filters.types.includes(t.type);
    const matchesSearch = 
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.author?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (t.beneficiary?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesDate = applyDateRangeFilter(t, filters.dateRange);
    return matchesFilter && matchesSearch && matchesDate;
  });

  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalFiltered = filteredTransactions.reduce(
    (sum, exp) => sum + exp.amount,
    0
  );

  const activeFiltersCount =
    filters.types.length + (filters.dateRange !== 'all' ? 1 : 0);

  const groupedByDate = filteredTransactions.reduce((groups, expense) => {
    const dateKey = expense.date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(expense);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const handleExportPDF = async () => {
    if (filteredTransactions.length === 0) {
      Alert.alert('Aucune transaction', 'Il n\'y a aucune transaction à exporter.');
      return;
    }

    setIsExporting(true);
    try {
      const filteredIncome = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const filteredExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      await generateExpensesReport({
        expenses: filteredTransactions,
        totalAmount: Math.abs(totalFiltered),
        period: getPeriodLabel(),
        userName: 'Jean Dupont',
        beneficiary: 'Fondation XYZ',
        author: 'Admin',
      });
      Alert.alert('Succès', 'Le rapport PDF a été généré avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de générer le PDF. Veuillez réessayer.');
    } finally {
      setIsExporting(false);
    }
  };

  const getPeriodLabel = (): string => {
    const labels: Record<string, string> = {
      today: "Aujourd'hui",
      week: 'Cette semaine',
      month: 'Ce mois',
      year: 'Cette année',
      all: 'Toutes les périodes',
    };
    return labels[filters.dateRange] || 'Période personnalisée';
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mes opérations</Text>
          <Text style={styles.subtitle}>{filteredTransactions.length} transaction(s)</Text>
        </View>
        
        <TouchableOpacity
          style={styles.exportButton}
          onPress={handleExportPDF}
          disabled={isExporting}
        >
          {isExporting ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <Ionicons name="document-text" size={24} color={COLORS.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Cartes statistiques */}
      <View style={styles.statsContainer}>
        {/* Revenus */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Dons</Text>
            <View style={[styles.statIconContainer, styles.incomeIconBg]}>
              <Ionicons name="arrow-down" size={20} color="#10b981" />
            </View>
          </View>
          <Text style={styles.statAmount}>+{totalIncome.toFixed(2)}€</Text>
        </View>

        {/* Dépenses */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Dépenses</Text>
            <View style={[styles.statIconContainer, styles.expenseIconBg]}>
              <Ionicons name="arrow-up" size={20} color="#ef4444" />
            </View>
          </View>
          <Text style={[styles.statAmount, { color: '#ef4444' }]}>-{totalExpense.toFixed(2)}€</Text>
        </View>

        {/* Solde */}
        <View style={styles.statCard}>
          <View style={styles.statHeader}>
            <Text style={styles.statLabel}>Solde</Text>
            <View style={[styles.statIconContainer, { backgroundColor: '#dbeafe' }]}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#3b82f6' }}>=</Text>
            </View>
          </View>
          <Text style={[styles.statAmount, { color: balance >= 0 ? '#10b981' : '#ef4444' }]}>
            {balance.toFixed(2)}€
          </Text>
        </View>
      </View>

      {/* Barre de recherche et filtres */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher..."
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            activeFiltersCount > 0 && styles.filterButtonActive,
          ]}
          onPress={() => setFilterModalVisible(true)}
        >
          <Ionicons
            name="filter"
            size={20}
            color={activeFiltersCount > 0 ? COLORS.card : COLORS.text}
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Liste des dépenses groupées par date */}
      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {Object.keys(groupedByDate).length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📭</Text>
            <Text style={styles.emptyStateText}>
              {searchQuery || activeFiltersCount > 0
                ? 'Aucune dépense trouvée'
                : 'Aucune dépense enregistrée'}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery || activeFiltersCount > 0
                ? 'Essayez de modifier vos filtres'
                : 'Commencez à ajouter des dépenses'}
            </Text>
          </View>
        ) : (
          Object.entries(groupedByDate).map(([date, dayExpenses]) => {
            const dayIncome = dayExpenses.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
            const dayExpense = dayExpenses.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
            const dayBalance = dayIncome - dayExpense;
            
            return (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeader}>
                  <Text style={styles.dateText}>
                    <Ionicons name="calendar-outline" size={16} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                    {date}
                  </Text>
                  <Text style={[styles.dateTotalText, { color: dayBalance >= 0 ? '#10b981' : '#ef4444' }]}>
                    {dayBalance.toFixed(2)}€
                  </Text>
                </View>

                {dayExpenses.map((expense) => (
                  <View key={expense.id} style={styles.expenseItem}>
                    <View style={styles.expenseLeft}>
                      <View style={[styles.expenseIconContainer, expense.type === 'income' ? styles.incomeIconBg : styles.expenseIconBg]}>
                        <Ionicons
                          name={expense.type === 'income' ? 'arrow-down' : 'arrow-up'}
                          size={20}
                          color={expense.type === 'income' ? '#10b981' : '#ef4444'}
                        />
                      </View>
                      <View style={styles.expenseInfo}>
                        <Text style={styles.expenseDescription}>
                          {expense.description}
                        </Text>
                        {expense.author && (
                          <Text style={styles.expenseMetadata}>
                            Auteur: {expense.author}
                          </Text>
                        )}
                        {expense.beneficiary && (
                          <Text style={styles.expenseMetadata}>
                            Bénéficiaire: {expense.beneficiary}
                          </Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.expenseRight}>
                      <Text style={[
                        styles.expenseAmount,
                        { color: expense.type === 'income' ? '#10b981' : '#ef4444' }
                      ]}>
                        {expense.type === 'income' ? '+' : '-'}{expense.amount.toFixed(2)}€
                      </Text>
                      
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={styles.actionButton}
                          onPress={() => handleEditTransaction(expense)}
                        >
                          <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                          style={[styles.actionButton, styles.deleteButton]}
                          onPress={() => handleDeleteTransaction(expense)}
                        >
                          <Ionicons name="trash-outline" size={18} color={COLORS.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            );
          })
        )}
      </ScrollView>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApply={setFilters}
        currentFilters={filters}
      />

      <AddTransactionModal
        visible={editModalVisible}
        onClose={() => {
          setEditModalVisible(false);
          setSelectedTransaction(null);
        }}
        onAdd={handleUpdateTransaction}
        editMode={true}
        initialData={selectedTransaction || undefined}
      />
    </View>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
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
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    height: 50,
  },
  searchIcon: {
    marginRight: SPACING.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: COLORS.card,
    fontSize: 10,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  dateGroup: {
    marginBottom: SPACING.lg,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  dateText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  dateTotalText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  expenseItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  expenseIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  incomeIconBg: {
    backgroundColor: '#E6FFFA',
  },
  expenseIconBg: {
    backgroundColor: '#FFE6E6',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  expenseMetadata: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  expenseRight: {
    alignItems: 'flex-end',
    gap: SPACING.xs,
  },
  expenseAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: `${COLORS.danger}15`,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl * 2,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyStateText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  emptyStateSubtext: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    flexWrap: 'nowrap',
  },
  statLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.textSecondary,
    flexShrink: 1,
    marginRight: SPACING.xs,
  },
  statIconContainer: {
    width: 25,
    height: 25,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  statAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '200',
    color: COLORS.text,
  },
});