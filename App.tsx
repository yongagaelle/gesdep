import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { RootNavigator } from './src/navigation/RootNavigator';
import { TransactionProvider } from '@/contexts/TransactionContext';
import { AuthProvider } from '@/contexts/AuthContext';

function AppContent() {
  const { theme } = useTheme();

  return (
    <>
      <RootNavigator />
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TransactionProvider>
          <AppContent />
        </TransactionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
