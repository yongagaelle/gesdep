// contexts/TransactionContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Transaction } from '../types';
import StorageService from '../services/StorageService';

interface TransactionContextType {
  transactions: Transaction[];
  loading: boolean;
  refreshTransactions: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const loadedTransactions = await StorageService.loadTransactions();
      setTransactions(loadedTransactions);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const addTransaction = useCallback(async (transaction: Omit<Transaction, 'id'>) => {
    try {
      const newTransaction = {
        ...transaction,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      } as Transaction;
      
      await StorageService.addTransaction(newTransaction);
      await refreshTransactions();
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      throw error;
    }
  }, [refreshTransactions]);

  const updateTransaction = useCallback(async (id: string, updates: Partial<Transaction>) => {
    try {
      await StorageService.updateTransaction(id, updates);
      await refreshTransactions();
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      throw error;
    }
  }, [refreshTransactions]);

  const deleteTransaction = useCallback(async (id: string) => {
    try {
      await StorageService.deleteTransaction(id);
      await refreshTransactions();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }, [refreshTransactions]);

  return (
    <TransactionContext.Provider
      value={{
        transactions,
        loading,
        refreshTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
      }}
    >
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error('useTransactions doit être utilisé dans un TransactionProvider');
  }
  return context;
};