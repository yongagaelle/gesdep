import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES } from '../constants';

interface DeleteConfirmationModalProps {
  visible: boolean;
  title?: string;
  message: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  COLORS: any;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  visible,
  title = 'Confirmer la suppression',
  message,
  onConfirm,
  onCancel,
  loading = false,
  COLORS,
}) => {
  const styles = createStyles(COLORS);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContent}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons
              name="warning-outline"
              size={48}
              color={COLORS.danger}
            />
          </View>

          {/* Title */}
          <Text style={styles.title}>{title}</Text>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Annuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.deleteButton]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.card} />
              ) : (
                <>
                  <Ionicons
                    name="trash-outline"
                    size={20}
                    color={COLORS.card}
                  />
                  <Text style={[styles.buttonText, styles.deleteButtonText]}>
                    Supprimer
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const createStyles = (COLORS: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.lg,
    },
    modalContent: {
      backgroundColor: COLORS.background,
      borderRadius: 16,
      padding: SPACING.lg,
      width: '100%',
      maxWidth: 320,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 5,
    },
    iconContainer: {
      marginBottom: SPACING.md,
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: `${COLORS.danger}15`,
      justifyContent: 'center',
      alignItems: 'center',
    },
    title: {
      fontSize: FONT_SIZES.lg,
      fontWeight: '700',
      color: COLORS.text,
      marginBottom: SPACING.sm,
      textAlign: 'center',
    },
    message: {
      fontSize: FONT_SIZES.md,
      color: COLORS.textSecondary,
      marginBottom: SPACING.lg,
      textAlign: 'center',
      lineHeight: 20,
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: SPACING.md,
      width: '100%',
    },
    button: {
      flex: 1,
      paddingVertical: SPACING.md,
      borderRadius: 12,
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: SPACING.xs,
    },
    cancelButton: {
      backgroundColor: COLORS.card,
      borderWidth: 1,
      borderColor: COLORS.border,
    },
    deleteButton: {
      backgroundColor: COLORS.danger,
    },
    buttonText: {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
    },
    cancelButtonText: {
      color: COLORS.text,
    },
    deleteButtonText: {
      color: COLORS.card,
    },
  });