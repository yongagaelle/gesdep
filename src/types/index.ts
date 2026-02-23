export interface User {
  id: string;
  email: string;
  name: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: TransactionType;
  date: Date;
  userId: string;
  // Nouveaux champs
  author?: string;      // Pour les entrées
  beneficiary?: string; // Pour les dépenses
}

// Alias pour compatibilité
export type Expense = Transaction;

export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Signup: undefined;
  PhoneLogin: undefined;
  ForgotPassword: undefined;
  Main: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Transactions: undefined;
  Statistics: undefined;
  History: undefined;
};

export type SortOption = 
  | 'date-desc' 
  | 'date-asc' 
  | 'amount-desc' 
  | 'amount-asc' 
  | 'alpha-asc' 
  | 'alpha-desc'

export type ThemeMode = 'light' | 'dark';
