import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Input, Button } from './';
import { SPACING, FONT_SIZES } from '../constants';
import { TransactionType, Transaction } from '../types';
import { useColors } from '../hooks';

interface AddTransactionModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (transaction: {
    amount: number;
    description: string;
    type: TransactionType;
    date: Date;
    author?: string;
    beneficiary?: string;
  }) => void;
  editMode?: boolean;
  initialData?: Transaction;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  visible,
  onClose,
  onAdd,
  editMode = false,
  initialData,
}) => {
  const COLORS = useColors();
  const styles = createStyles(COLORS);

  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Initialiser les champs en mode édition
  useEffect(() => {
    if (editMode && initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setDescription(initialData.description);
      setAuthor(initialData.author || '');
      setBeneficiary(initialData.beneficiary || '');
      setDate(initialData.date);
    } else {
      resetForm();
    }
  }, [editMode, initialData, visible]);

  const resetForm = () => {
    setAmount('');
    setDescription('');
    setAuthor('');
    setBeneficiary('');
    setType('expense');
    setDate(new Date());
  };

  const handleAdd = () => {
    if (!amount || !description) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Validation selon le type
    if (type === 'income' && !author.trim()) {
      alert('Veuillez entrer le nom de l\'auteur de l\'entrée');
      return;
    }

    if (type === 'expense' && !beneficiary.trim()) {
      alert('Veuillez entrer le nom du bénéficiaire');
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
      type,
      date,
      author: type === 'income' ? author : undefined,
      beneficiary: type === 'expense' ? beneficiary : undefined,
    });

    // Reset
    if (!editMode) {
      resetForm();
    }
    onClose();
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    // Reset les champs author/beneficiary lors du changement de type
    setAuthor('');
    setBeneficiary('');
  };

  const handleClose = () => {
    if (!editMode) {
      resetForm();
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Modifier la transaction' : 'Nouvelle transaction'}
            </Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Toggle Type */}
            <Text style={styles.label}>Type de transaction</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'expense' && styles.typeButtonExpenseActive,
                ]}
                onPress={() => handleTypeChange('expense')}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={24}
                  color={type === 'expense' ? COLORS.card : COLORS.danger}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'expense' && styles.typeButtonTextActive,
                  ]}
                >
                  Dépense
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeButton,
                  type === 'income' && styles.typeButtonIncomeActive,
                ]}
                onPress={() => handleTypeChange('income')}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={24}
                  color={type === 'income' ? COLORS.card : COLORS.success}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    type === 'income' && styles.typeButtonTextActive,
                  ]}
                >
                  Dons
                </Text>
              </TouchableOpacity>
            </View>

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
              placeholder="Ex: Depannages, Scolarites ..."
            />

            {/* Champ conditionnel : Auteur pour entrées */}
            {type === 'income' && (
              <View style={styles.conditionalField}>
                <Input
                  label="Auteur de l'entrée *"
                  value={author}
                  onChangeText={setAuthor}
                  placeholder="Ex: Jean Marc, Entreprise XYZ..."
                />
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.infoText}>
                    Qui est à l'origine de cette entrée d'argent ?
                  </Text>
                </View>
              </View>
            )}

            {/* Champ conditionnel : Bénéficiaire pour dépenses */}
            {type === 'expense' && (
              <View style={styles.conditionalField}>
                <Input
                  label="Bénéficiaire *"
                  value={beneficiary}
                  onChangeText={setBeneficiary}
                  placeholder="Ex: Marie, EDF..."
                />
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={16} color={COLORS.primary} />
                  <Text style={styles.infoText}>
                    À qui avez-vous versé de l'argent ?
                  </Text>
                </View>
              </View>
            )}

            {/* Date Picker */}
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Ionicons name="calendar-outline" size={20} color={COLORS.text} />
              <Text style={styles.dateText}>
                {date.toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
              <Ionicons name="chevron-down" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            )}

            <Button 
              title={editMode ? 'Modifier la transaction' : 'Ajouter la transaction'} 
              onPress={handleAdd} 
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
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
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    marginBottom: SPACING.sm,
    color: COLORS.text,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  typeButtonExpenseActive: {
    backgroundColor: COLORS.danger,
    borderColor: COLORS.danger,
  },
  typeButtonIncomeActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  typeButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.text,
  },
  typeButtonTextActive: {
    color: COLORS.card,
  },
  conditionalField: {
    marginBottom: SPACING.md,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: `${COLORS.primary}15`,
    padding: SPACING.sm,
    borderRadius: 8,
    marginTop: -SPACING.sm,
    marginBottom: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    opacity: 0.8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.lg,
  },
  dateText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
});