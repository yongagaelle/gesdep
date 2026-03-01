import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { Button, Input } from '../components';
import { SPACING, FONT_SIZES } from '../constants';
import { useColors } from '../hooks';

type PhoneLoginScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PhoneLogin'>;
};

export const PhoneLoginScreen: React.FC<PhoneLoginScreenProps> = ({
  navigation,
}) => {
  const COLORS = useColors();
  const styles = createStyles(COLORS);

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setCodeSent(true);
    }, 1500);
  };

  const handleVerifyCode = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.navigate('Main');
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.emoji}>📱</Text>
          <Text style={styles.title}>Connexion par téléphone</Text>
          <Text style={styles.subtitle}>
            {codeSent
              ? 'Entrez le code reçu par SMS'
              : 'Entrez votre numéro de téléphone'}
          </Text>
        </View>

        <View style={styles.form}>
          {!codeSent ? (
            <>
              <Input
                label="Numéro de téléphone"
                value={phone}
                onChangeText={setPhone}
                placeholder="+33 6 12 34 56 78"
                keyboardType="phone-pad"
              />
              <Button
                title="Envoyer le code"
                onPress={handleSendCode}
                loading={loading}
              />
            </>
          ) : (
            <>
              <Input
                label="Code PIN"
                value={code}
                onChangeText={setCode}
                placeholder="123456"
                keyboardType="numeric"
              />
              <Button
                title="Vérifier"
                onPress={handleVerifyCode}
                loading={loading}
              />
              <Button
                title="Renvoyer le code"
                onPress={handleSendCode}
                variant="outline"
              />
            </>
          )}
        </View>
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
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
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
  },
  form: {
    gap: SPACING.md,
  },
});
