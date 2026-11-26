import React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';
import { AuthProvider } from './AuthContext';
import { FavoritesProvider } from './FavoritesContext';

export default function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={{ colors: { primary: theme.primary } }}>
        <AuthProvider>
          <FavoritesProvider>{children}</FavoritesProvider>
        </AuthProvider>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
