import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES } from '../constants';
import { ProfileSection, SettingsItem, SortModal } from '../components';
import { SortOption } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useColors } from '../hooks';

export const HistoryScreen: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const COLORS = useColors();
  
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);

  const getSortLabel = (sort: SortOption): string => {
    const labels: Record<SortOption, string> = {
      'date-desc': 'Plus récentes',
      'date-asc': 'Plus anciennes',
      'amount-desc': 'Montant ↓',
      'amount-asc': 'Montant ↑',
      'alpha-asc': 'A → Z',
      'alpha-desc': 'Z → A',
      'category': 'Catégorie',
    };
    return labels[sort];
  };

  const handleEditProfile = () => {
    Alert.alert('Éditer le profil', 'Fonctionnalité à venir');
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Changer le thème',
      'Sélectionnez un thème',
      [
        {
          text: '☀️ Clair',
          onPress: () => {
            toggleTheme('light');
            setTimeout(() => {
              Alert.alert('✅ Thème modifié', 'Le thème clair a été activé');
            }, 300);
          },
        },
        {
          text: '🌙 Sombre',
          onPress: () => {
            toggleTheme('dark');
            setTimeout(() => {
              Alert.alert('✅ Thème modifié', 'Le thème sombre a été activé');
            }, 300);
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const handleNotificationToggle = (value: boolean) => {
    setNotificationsEnabled(value);
    if (value) {
      Alert.alert(
        'Notifications activées',
        'Vous recevrez des notifications pour vos dépenses'
      );
    } else {
      Alert.alert('Notifications désactivées');
    }
  };

  const styles = createStyles(COLORS);

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Paramètres</Text>
          <Text style={styles.subtitle}>Gérez votre compte et préférences</Text>
        </View>

        {/* Profil */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profil</Text>
          <ProfileSection
            name="Jean Dupont"
            email="jean.dupont@email.com"
            onEdit={handleEditProfile}
          />
        </View>

        {/* Préférences d'affichage */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Affichage des dépenses</Text>
          <SettingsItem
            icon="swap-vertical"
            title="Ordre de tri"
            subtitle={`Actuellement : ${getSortLabel(sortOption)}`}
            type="select"
            value={getSortLabel(sortOption)}
            onPress={() => setSortModalVisible(true)}
          />
        </View>

        {/* Apparence */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apparence</Text>
          <SettingsItem
            icon="color-palette-outline"
            title="Thème"
            subtitle={theme === 'light' ? 'Mode clair activé' : 'Mode sombre activé'}
            type="select"
            value={theme === 'light' ? '☀️ Clair' : '�� Sombre'}
            onPress={handleThemeChange}
          />
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <SettingsItem
            icon="notifications-outline"
            title="Activer les notifications"
            subtitle="Recevez des alertes pour vos dépenses"
            type="toggle"
            value={notificationsEnabled}
            onToggle={handleNotificationToggle}
          />
        </View>

        {/* Autres options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Autres</Text>
          <SettingsItem
            icon="help-circle-outline"
            title="Aide et support"
            onPress={() => Alert.alert('Aide', 'support@gesdep.com')}
          />
          <SettingsItem
            icon="information-circle-outline"
            title="À propos"
            onPress={() =>
              Alert.alert('GesDep', 'Version 1.0.0\n© 2025 GesDep')
            }
          />
          <TouchableOpacity
            style={styles.dangerButton}
            onPress={() =>
              Alert.alert(
                'Supprimer le compte',
                'Êtes-vous sûr ? Cette action est irréversible.',
                [
                  { text: 'Annuler', style: 'cancel' },
                  {
                    text: 'Supprimer',
                    style: 'destructive',
                    onPress: () => Alert.alert('Compte supprimé'),
                  },
                ]
              )
            }
          >
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
            <Text style={styles.dangerButtonText}>Supprimer mon compte</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: SPACING.xxl }} />
      </ScrollView>

      {/* Modal de tri */}
      <SortModal
        visible={sortModalVisible}
        currentSort={sortOption}
        onClose={() => setSortModalVisible(false)}
        onSelect={setSortOption}
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
    padding: SPACING.lg,
    paddingTop: SPACING.xxl,
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
  section: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.sm,
    gap: SPACING.sm,
  },
  dangerButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.danger,
  },
});
