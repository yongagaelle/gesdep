import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { Button, Input, PasswordStrengthIndicator } from '../components';
import { SPACING, FONT_SIZES } from '../constants';
import { useColors } from '../hooks';
import { useAuth } from '../contexts/AuthContext';

type SignupScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Signup'>;
};

export const SignupScreen: React.FC<SignupScreenProps> = ({ navigation }) => {
  const COLORS = useColors();
  const styles = createStyles(COLORS);
  const { signup, loginWithGoogle } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePassword = () => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSymbol;
  };

  const handleSignup = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer votre nom');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if (!email.trim() || !emailRegex.test(email)) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    if (!validatePassword()) {
      Alert.alert('Erreur','Votre mot de passe ne respecte pas tous les critères de sécurité');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Erreur', 'Les mots de passe ne correspondent pas');
      return;
    }

    setLoading(true);
    try {
      await signup(email.trim(), password, name.trim());
      setLoading(false);
      navigation.navigate('Main');
    } catch (error: any) {
      setLoading(false);
      Alert.alert('Erreur d\'inscription', error.message || 'Impossible de créer le compte');
    }
    /*setTimeout(() => {
      setLoading(false);
      navigation.navigate('Main');
    }, 1500);*/
  };

  const handleSocialSignup = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de s\'inscrire avec Google');
    }
  };

  const handlePhoneSignup = () => {
    navigation.navigate('PhoneLogin');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.navigate('Login')}
            accessibilityLabel="Retour à l'authentification"
          >
            <Ionicons name="chevron-back" size={32} color={COLORS.primary} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Ionicons name="person-add-outline" size={44} color={COLORS.primary} />
          </View>
        </View>
        <Text style={styles.title}>Créer un compte</Text>
        <Text style={styles.subtitle}>Commencez à gérer vos dépenses</Text>
        <View style={styles.headerSpacer} />

        {/*<View style={styles.socialContainer}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => handleSocialSignup('Google')}
          >
            <Ionicons name="logo-google" size={24} color="#DB4437" />
          </TouchableOpacity>


          <TouchableOpacity
            style={styles.socialButton}
            onPress={handlePhoneSignup}
          >
            <Ionicons name="call" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>ou</Text>
          <View style={styles.divider} />
        </View>*/}

        <View style={styles.form}>
          <Input
            label="Nom complet"
            value={name}
            onChangeText={setName}
            placeholder="Jean Dupont"
          />
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="votre@email.com"
            keyboardType="email-address"
          />

          <View>
            <View style={styles.passwordContainer}>
              <View style={styles.passwordInputWrapper}>
                <Input
                  label="Mot de passe"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                />
              </View>
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={24}
                  color={COLORS.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {password.length > 0 && (
              <PasswordStrengthIndicator password={password} />
            )}
          </View>

          <View style={styles.passwordContainer}>
            <View style={styles.passwordInputWrapper}>
              <Input
                label="Confirmer le mot de passe"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry={!showConfirmPassword}
              />
            </View>
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <Ionicons
                name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                size={24}
                color={COLORS.textSecondary}
              />
            </TouchableOpacity>
          </View>
          {confirmPassword.length > 0 && password !== confirmPassword && (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
              <Text style={styles.errorText}>
                Les mots de passe ne correspondent pas
              </Text>
            </View>
          )}

          <Button
            title="Créer mon compte"
            onPress={handleSignup}
            loading={loading}
            disabled={!validatePassword() || password !== confirmPassword}
          />

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>
              Déjà un compte ?{' '}
              <Text style={styles.loginTextBold}>Se connecter</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (COLORS: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    gap: SPACING.md,
  },
  backButton: {
    position: 'absolute',
    left: 0,
    zIndex: 2,
    padding: SPACING.xs,
    backgroundColor: 'transparent',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 50,
    backgroundColor: `${COLORS.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    alignSelf: 'center',
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
  },
  headerSpacer: {
    height: SPACING.xl,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  socialButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    marginHorizontal: SPACING.md,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
  },
  form: {
    gap: SPACING.xs,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInputWrapper: {
    flex: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: SPACING.md,
    top: 38,
    padding: SPACING.xs,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.sm,
    borderRadius: 8,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.danger,
    marginTop: -SPACING.xs,
  },
  errorText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: COLORS.danger,
  },
  loginLink: {
    marginTop: SPACING.md,
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