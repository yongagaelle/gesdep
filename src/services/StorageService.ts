// services/StorageService.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Transaction } from '../types';

const TRANSACTIONS_KEY = '@transactions';

class StorageService {
  /**
   * Sauvegarde toutes les transactions
   */
  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(transactions);
      await AsyncStorage.setItem(TRANSACTIONS_KEY, jsonValue);
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      throw new Error('Impossible de sauvegarder les transactions');
    }
  }

  /**
   * Charge toutes les transactions
   */
  async loadTransactions(): Promise<Transaction[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(TRANSACTIONS_KEY);
      if (jsonValue === null) {
        return [];
      }

      const transactions = JSON.parse(jsonValue);
      
      // Convertir les dates string en objets Date
      return transactions.map((t: any) => ({
        ...t,
        date: new Date(t.date),
      }));
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      return [];
    }
  }

  /**
   * Ajoute une nouvelle transaction
   */
  async addTransaction(transaction: Transaction): Promise<Transaction[]> {
    try {
      const transactions = await this.loadTransactions();
      const updatedTransactions = [transaction, ...transactions];
      await this.saveTransactions(updatedTransactions);
      return updatedTransactions;
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      throw error;
    }
  }

  /**
   * Supprime une transaction
   */
  async deleteTransaction(id: string): Promise<Transaction[]> {
    try {
      const transactions = await this.loadTransactions();
      const updatedTransactions = transactions.filter(t => t.id !== id);
      await this.saveTransactions(updatedTransactions);
      return updatedTransactions;
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }

  /**
   * Met à jour une transaction
   */
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction[]> {
    try {
      const transactions = await this.loadTransactions();
      const updatedTransactions = transactions.map(t =>
        t.id === id ? { ...t, ...updates } : t
      );
      await this.saveTransactions(updatedTransactions);
      return updatedTransactions;
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  }

  /**
   * Efface toutes les données (à utiliser avec précaution)
   */
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TRANSACTIONS_KEY);
    } catch (error) {
      console.error('Erreur lors de l\'effacement:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques
   */
  async getStats(): Promise<{
    totalIncome: number;
    totalExpenses: number;
    balance: number;
    transactionCount: number;
  }> {
    try {
      const transactions = await this.loadTransactions();
      
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
        transactionCount: transactions.length,
      };
    } catch (error) {
      console.error('Erreur lors du calcul des stats:', error);
      return {
        totalIncome: 0,
        totalExpenses: 0,
        balance: 0,
        transactionCount: 0,
      };
    }
  }
}

export default new StorageService();