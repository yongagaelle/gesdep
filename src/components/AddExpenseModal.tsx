import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input, Button } from './';
import { COLORS, SPACING, FONT_SIZES } from '../constants';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (expense: {
    amount: number;
    description: string;
    auteur: string;
    category: string;
    
  }) => void;
}

const CATEGORIES = [
  { name: 'Alimentation', icon: '🍔', color: '#FF6B6B' },
  { name: 'Transport', icon: '🚗', color: '#4ECDC4' },
  { name: 'Loisirs', icon: '🎮', color: '#95E1D3' },
  { name: 'Santé', icon: '💊', color: '#F38181' },
  { name: 'Shopping', icon: '🛍️', color: '#AA96DA' },
  { name: 'Logement', icon: '🏠', color: '#FCBAD3' },
  { name: 'Én', icon: '📚', color: '#FED766' },
  { name: 'Autre', icon: '💰', color: '#A8DADC' },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [auteur, setAuteur] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Alimentation');

  const handleAdd = () => {
    if (!amount || !description) {
      alert('Veuillez remplir tous les champs');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      alert('Veuillez entrer un montant valide');
      return;
    }

    onAdd({
      amount: numAmount,
      description,
      auteur,
      category: selectedCategory,
    });

    // Reset
    setAmount('');
    setDescription('');
    setAuteur('');
    setSelectedCategory('Alimentation');
    onClose();
  };

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
            <Text style={styles.modalTitle}>Nouvelle Actions</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Input
              label="Montant (€)"
              value={amount}
              onChangeText={setAmount}
              placeholder="50.00"
              keyboardType="numeric"
            />

            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Restaurant, 1, 80..."
            />
            <Input
              label="Description"
              value={description}
              onChangeText={setDescription}
              placeholder="Restaurant, 1, 80..."
            />

            <Text style={styles.categoriesLabel}>Catégorie</Text>
            <View style={styles.categoriesGrid}>
              {CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.name}
                  style={[
                    styles.categoryItem,
                    selectedCategory === category.name &&
                      styles.categoryItemSelected,
                    { borderColor: category.color },
                  ]}
                  onPress={() => setSelectedCategory(category.name)}
                >
                  <Text style={styles.categoryIcon}>{category.icon}</Text>
                  <Text style={styles.categoryName}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Ajouter la dépense" onPress={handleAdd} />
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
    maxHeight: '90%',
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
  categoriesLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  categoryItem: {
    width: '23%',
    aspectRatio: 1,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xs,
  },
  categoryItemSelected: {
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  categoryName: {
    fontSize: FONT_SIZES.xs,
    textAlign: 'center',
    color: COLORS.text,
  },
});
