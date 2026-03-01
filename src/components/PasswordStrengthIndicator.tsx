import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '../constants';

interface PasswordStrengthIndicatorProps {
  password: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
}) => {
  // Vérifications des exigences
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const requirements: Requirement[] = [
    { label: 'Au moins 8 caractères', met: hasMinLength },
    { label: 'Une lettre majuscule', met: hasUpperCase },
    { label: 'Une lettre minuscule', met: hasLowerCase },
    { label: 'Un chiffre', met: hasNumber },
    { label: 'Un symbole (!@#$%...)', met: hasSymbol },
  ];

  // Calcul de la force du mot de passe
  const metRequirements = requirements.filter((req) => req.met).length;
  const strengthPercentage = (metRequirements / requirements.length) * 100;

  let strengthText = 'Très faible';
  let strengthColor = COLORS.danger;

  if (metRequirements === 5) {
    strengthText = 'Fort';
    strengthColor = COLORS.success;
  } else if (metRequirements >= 3) {
    strengthText = 'Moyen';
    strengthColor = COLORS.warning;
  } else if (metRequirements >= 1) {
    strengthText = 'Faible';
    strengthColor = '#FF9500';
  }

  if (password.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Barre de force */}
      <View style={styles.strengthBarContainer}>
        <View style={styles.strengthBarBackground}>
          <View
            style={[
              styles.strengthBarFill,
              {
                width: `${strengthPercentage}%`,
                backgroundColor: strengthColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.strengthText, { color: strengthColor }]}>
          {strengthText}
        </Text>
      </View>

      {/* Liste des exigences */}
      <View style={styles.requirementsContainer}>
        <Text style={styles.requirementsTitle}>Votre mot de passe doit contenir :</Text>
        {requirements.map((requirement, index) => (
          <View key={index} style={styles.requirementItem}>
            <Ionicons
              name={requirement.met ? 'checkmark-circle' : 'close-circle'}
              size={18}
              color={requirement.met ? COLORS.success : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.requirementText,
                requirement.met && styles.requirementTextMet,
              ]}
            >
              {requirement.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  strengthBarContainer: {
    marginBottom: SPACING.md,
  },
  strengthBarBackground: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.xs,
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 4,
    transition: 'width 0.3s ease',
  },
  strengthText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    textAlign: 'right',
  },
  requirementsContainer: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  requirementsTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
    gap: SPACING.xs,
  },
  requirementText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  requirementTextMet: {
    color: COLORS.text,
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
});
