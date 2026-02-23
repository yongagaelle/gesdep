// screens/HomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SPACING, FONT_SIZES } from '../constants';
import { Transaction, SortOption, RootStackParamList } from '../types';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { useColors } from '../hooks';
import { useTransactions } from '../contexts/TransactionContext';
import ExcelExportService from '../services/ExcelExportService';

interface HomeScreenProps {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Main'>;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const COLORS = useColors();
  const styles = createStyles(COLORS);

  // Utiliser le Context
  const { transactions, loading, refreshTransactions, addTransaction, deleteTransaction } = useTransactions();

  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');

  // Charger les transactions au démarrage et quand l'écran est focus
  useEffect(() => {
    refreshTransactions();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      refreshTransactions();
    }, [refreshTransactions])
  );

  const handleAddTransaction = async (newTransaction: {
    amount: number;
    description: string;
    type: 'income' | 'expense';
    date: Date;
    author?: string;
    beneficiary?: string;
  }) => {
    try {
      const transaction: Omit<Transaction, 'id'> = {
        ...newTransaction,
        userId: '1',
      };

      await addTransaction(transaction);
      Alert.alert('Succès', 'Transaction ajoutée avec succès !');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la transaction');
      console.error(error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    Alert.alert(
      'Confirmer',
      'Voulez-vous vraiment supprimer cette transaction ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(id);
              Alert.alert('Succès', 'Transaction supprimée');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la transaction');
            }
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await ExcelExportService.exportAndShare(transactions);
    } catch (error) {
      console.error(error);
    } finally {
      setExporting(false);
    }
  };

  const sortTransactions = (transactionsList: Transaction[], sort: SortOption): Transaction[] => {
    const sorted = [...transactionsList];

    switch (sort) {
      case 'date-desc':
        return sorted.sort((a, b) => b.date.getTime() - a.date.getTime());
      case 'date-asc':
        return sorted.sort((a, b) => a.date.getTime() - b.date.getTime());
      case 'amount-desc':
        return sorted.sort((a, b) => b.amount - a.amount);
      case 'amount-asc':
        return sorted.sort((a, b) => a.amount - b.amount);
      case 'alpha-asc':
        return sorted.sort((a, b) =>
          a.description.toLowerCase().localeCompare(b.description.toLowerCase())
        );
      case 'alpha-desc':
        return sorted.sort((a, b) =>
          b.description.toLowerCase().localeCompare(a.description.toLowerCase())
        );
      default:
        return sorted;
    }
  };

  const handleLogout = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const filteredTransactions = sortTransactions(
    transactions.filter((transaction) =>
      transaction.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (transaction.author?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (transaction.beneficiary?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    ),
    sortOption
  );

  // Limiter à 4 transactions récentes pour l'affichage
  const displayedTransactions = searchQuery 
    ? filteredTransactions // Si recherche active, afficher tous les résultats
    : filteredTransactions.slice(0, 4); // Sinon, afficher seulement les 4 plus récentes

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpenses;

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
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour ! 👋</Text>
          <Text style={styles.subtitle}>Gérez vos finances</Text>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Carte de solde */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Solde actuel</Text>
        <Text style={[styles.balanceAmount, balance < 0 && styles.balanceNegative]}>
          {balance.toFixed(2)}€
        </Text>
        
        <View style={styles.balanceDetails}>
          <View style={styles.balanceDetailItem}>
            <Ionicons name="arrow-down-circle" size={20} color={COLORS.card} />
            <View style={styles.balanceDetailText}>
              <Text style={styles.balanceDetailLabel}>Dons</Text>
              <Text style={styles.balanceDetailAmount}>
                +{totalIncome.toFixed(2)}€
              </Text>
            </View>
          </View>

          <View style={styles.balanceDetailDivider} />

          <View style={styles.balanceDetailItem}>
            <Ionicons name="arrow-up-circle" size={20} color={COLORS.card} />
            <View style={styles.balanceDetailText}>
              <Text style={styles.balanceDetailLabel}>Dépenses</Text>
              <Text style={styles.balanceDetailAmount}>
                -{totalExpenses.toFixed(2)}€
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <View style={styles.searchContainer}>
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
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Ionicons name="add" size={28} color={COLORS.card} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {searchQuery
            ? `Résultats (${displayedTransactions.length})`
            : 'Transactions récentes'}
        </Text>

        <ScrollView showsVerticalScrollIndicator={false}>
          {displayedTransactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>
                {searchQuery ? '🔍' : '📝'}
              </Text>
              <Text style={styles.emptyStateText}>
                {searchQuery
                  ? 'Aucune transaction trouvée'
                  : 'Aucune transaction'}
              </Text>
              {!searchQuery && (
                <Text style={styles.emptyStateSubtext}>
                  Appuyez sur + pour commencer
                </Text>
              )}
            </View>
          ) : (
            displayedTransactions.map((transaction) => (
              <TouchableOpacity
                key={transaction.id}
                style={styles.transactionItem}
                onLongPress={() => handleDeleteTransaction(transaction.id)}
              >
                <View style={styles.transactionLeft}>
                  <View
                    style={[
                      styles.transactionIconContainer,
                      {
                        backgroundColor:
                          transaction.type === 'income'
                            ? `${COLORS.success}20`
                            : `${COLORS.danger}20`,
                      },
                    ]}
                  >
                    <Ionicons
                      name={transaction.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                      size={24}
                      color={transaction.type === 'income' ? COLORS.success : COLORS.danger}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionDescription}>
                      {transaction.description}
                    </Text>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionDate}>
                        {transaction.date.toLocaleDateString('fr-FR')}
                      </Text>
                      <Text style={styles.transactionDot}> • </Text>
                      <Text style={styles.transactionPerson}>
                        {transaction.type === 'income' 
                          ? `De ${transaction.author}`
                          : `À ${transaction.beneficiary}`}
                      </Text>
                    </View>
                  </View>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {
                      color: transaction.type === 'income' ? COLORS.success : COLORS.danger,
                    },
                  ]}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {transaction.amount.toFixed(2)}€
                </Text>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>

      <AddTransactionModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onAdd={handleAddTransaction}
      />
    </View>
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
  greeting: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
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
  logoutButton: {
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
  balanceCard: {
    backgroundColor: COLORS.primary,
    marginHorizontal: SPACING.lg,
    padding: SPACING.lg,
    borderRadius: 16,
    marginBottom: SPACING.lg,
  },
  balanceLabel: {
    color: COLORS.card,
    fontSize: FONT_SIZES.sm,
    opacity: 0.8,
  },
  balanceAmount: {
    color: COLORS.card,
    fontSize: 36,
    fontWeight: 'bold',
    marginTop: SPACING.xs,
    marginBottom: SPACING.md,
  },
  balanceNegative: {
    color: COLORS.danger,
  },
  balanceDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  balanceDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  balanceDetailText: {},
  balanceDetailLabel: {
    color: COLORS.card,
    fontSize: FONT_SIZES.xs,
    opacity: 0.8,
  },
  balanceDetailAmount: {
    color: COLORS.card,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  balanceDetailDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  searchContainer: {
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
  addButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  section: {
    flex: 1,
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    marginBottom: SPACING.md,
    color: COLORS.text,
  },
  transactionItem: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  transactionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionDate: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  transactionDot: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  transactionPerson: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  transactionAmount: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
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
});