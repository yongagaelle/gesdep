import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { Button, Input } from '../components';
import { SPACING, FONT_SIZES } from '../constants';
import { useColors } from '../hooks';

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;
};

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({
  navigation,
}) => {
  const COLORS = useColors();
  const styles = createStyles(COLORS);

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'email' | 'code' | 'password'>('email');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      alert('Veuillez entrer votre email');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('code');
    }, 1500);
  };

  const handleVerifyCode = async () => {
    if (!code.trim() || code.length !== 6) {
      alert('Veuillez entrer un code à 6 chiffres');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('password');
    }, 1500);
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      alert('Veuillez remplir tous les champs');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    if (newPassword.length < 6) {
      alert('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Mot de passe réinitialisé avec succès !');
      navigation.navigate('Login');
    }, 1500);
  };

  const handleResendCode = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Code renvoyé par email !');
    }, 1000);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>

        {step === 'email' && (
          <>
            <View style={styles.header}>
              <Text style={styles.emoji}>🔒</Text>
              <Text style={styles.title}>Mot de passe oublié ?</Text>
              <Text style={styles.subtitle}>
                Entrez votre email pour recevoir un code de réinitialisation
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                keyboardType="email-address"
              />
              <Button
                title="Envoyer le code"
                onPress={handleSendCode}
                loading={loading}
              />
            </View>
          </>
        )}

        {step === 'code' && (
          <>
            <View style={styles.header}>
              <Text style={styles.emoji}>📧</Text>
              <Text style={styles.title}>Vérification</Text>
              <Text style={styles.subtitle}>
                Nous avons envoyé un code à 6 chiffres à{'\n'}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                label="Code de vérification"
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="numeric"
                maxLength={6}
              />
              <Button
                title="Vérifier le code"
                onPress={handleVerifyCode}
                loading={loading}
              />
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendCode}
              >
                <Text style={styles.resendText}>
                  Code non reçu ?{' '}
                  <Text style={styles.resendTextBold}>Renvoyer</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {step === 'password' && (
          <>
            <View style={styles.header}>
              <Text style={styles.emoji}>🔐</Text>
              <Text style={styles.title}>Nouveau mot de passe</Text>
              <Text style={styles.subtitle}>
                Créez un nouveau mot de passe sécurisé
              </Text>
            </View>

            <View style={styles.form}>
              <Input
                label="Nouveau mot de passe"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                secureTextEntry
              />
              <Input
                label="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
              />
              <View style={styles.passwordHint}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color={COLORS.textSecondary}
                />
                <Text style={styles.passwordHintText}>
                  Le mot de passe doit contenir au moins 6 caractères
                </Text>
              </View>
              <Button
                title="Réinitialiser le mot de passe"
                onPress={handleResetPassword}
                loading={loading}
              />
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginText}>
            Retour à la{' '}
            <Text style={styles.loginTextBold}>connexion</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
    marginTop: SPACING.xl,
  },
  emoji: {
    fontSize: 80,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: SPACING.md,
  },
  emailHighlight: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  form: {
    gap: SPACING.md,
  },
  resendButton: {
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  resendText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  resendTextBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  passwordHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
    marginTop: -SPACING.xs,
  },
  passwordHintText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  loginLink: {
    marginTop: SPACING.xl,
    alignItems: 'center',
  },
  loginText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
  },
  loginTextBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
