import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants';
import { SortOption } from '../types';

interface SortModalProps {
  visible: boolean;
  currentSort: SortOption;
  onClose: () => void;
  onSelect: (sort: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'date-desc', label: 'Plus récentes d\'abord', icon: 'calendar-outline' },
  { value: 'date-asc', label: 'Plus anciennes d\'abord', icon: 'calendar-outline' },
  { value: 'amount-desc', label: 'Montant décroissant', icon: 'arrow-down' },
  { value: 'amount-asc', label: 'Montant croissant', icon: 'arrow-up' },
  { value: 'alpha-asc', label: 'Alphabétique (A → Z)', icon: 'text-outline' },
  { value: 'alpha-desc', label: 'Alphabétique (Z → A)', icon: 'text-outline' },
  { value: 'category', label: 'Par catégorie', icon: 'albums-outline' },
];

export const SortModal: React.FC<SortModalProps> = ({
  visible,
  currentSort,
  onClose,
  onSelect,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Trier par</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {SORT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.optionItem,
                  currentSort === option.value && styles.optionItemSelected,
                ]}
                onPress={() => {
                  onSelect(option.value);
                  onClose();
                }}
              >
                <View style={styles.optionLeft}>
                  <Ionicons
                    name={option.icon}
                    size={24}
                    color={
                      currentSort === option.value
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <Text
                    style={[
                      styles.optionText,
                      currentSort === option.value && styles.optionTextSelected,
                    ]}
                  >
                    {option.label}
                  </Text>
                </View>
                {currentSort === option.value && (
                  <Ionicons name="checkmark" size={24} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.lg,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  optionItemSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  optionText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  optionTextSelected: {
    fontWeight: '600',
    color: COLORS.primary,
  },
});
