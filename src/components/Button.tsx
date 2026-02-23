import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
  Platform,
} from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { COLORS, SPACING, FONT_SIZES } from '../constants';

interface ButtonProps {
  title?: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  flatListRef?: any;
  flatListIndex?: SharedValue<number>;
  dataLength?: number;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  flatListRef,
  flatListIndex,
  dataLength,
}) => {
  // Si c'est un bouton d'onboarding avec navigation
  if (flatListRef && flatListIndex && dataLength) {
    const buttonAnimationStyle = useAnimatedStyle(() => {
      if (Platform.OS === 'web') {
        return {
          width: flatListIndex.value === dataLength - 1 ? 140 : 60,
          height: 60,
        };
      }
      return {
        width:
          flatListIndex.value === dataLength - 1
            ? withSpring(140)
            : withSpring(60),
        height: 60,
      };
    });

    const arrowAnimationStyle = useAnimatedStyle(() => {
      if (Platform.OS === 'web') {
        return {
          opacity: flatListIndex.value === dataLength - 1 ? 0 : 1,
          transform: [{ translateX: flatListIndex.value === dataLength - 1 ? 100 : 0 }],
        };
      }
      return {
        opacity:
          flatListIndex.value === dataLength - 1 ? withTiming(0) : withTiming(1),
        transform: [
          {
            translateX:
              flatListIndex.value === dataLength - 1
                ? withTiming(100)
                : withTiming(0),
          },
        ],
      };
    });

    const textAnimationStyle = useAnimatedStyle(() => {
      if (Platform.OS === 'web') {
        return {
          opacity: flatListIndex.value === dataLength - 1 ? 1 : 0,
          transform: [{ translateX: flatListIndex.value === dataLength - 1 ? 0 : -100 }],
        };
      }
      return {
        opacity:
          flatListIndex.value === dataLength - 1 ? withTiming(1) : withTiming(0),
        transform: [
          {
            translateX:
              flatListIndex.value === dataLength - 1
                ? withTiming(0)
                : withTiming(-100),
          },
        ],
      };
    });

    return (
      <AnimatedTouchable
        style={[styles.onboardingButton, buttonAnimationStyle]}
        onPress={() => {
          if (flatListIndex.value < dataLength - 1) {
            flatListRef.current?.scrollToIndex({
              index: flatListIndex.value + 1,
            });
          } else {
            onPress?.();
          }
        }}
      >
        <Animated.Text style={[styles.onboardingTextButton, textAnimationStyle]}>
          Commencer
        </Animated.Text>
        <Animated.Text style={[styles.onboardingArrowButton, arrowAnimationStyle]}>
          →
        </Animated.Text>
      </AnimatedTouchable>
    );
  }

  // Bouton normal
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'primary' && styles.primaryButton,
        variant === 'secondary' && styles.secondaryButton,
        variant === 'outline' && styles.outlineButton,
        (disabled || loading) && styles.disabledButton,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' ? COLORS.primary : COLORS.card}
        />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'primary' && styles.primaryText,
            variant === 'secondary' && styles.secondaryText,
            variant === 'outline' && styles.outlineText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  outlineButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
  },
  primaryText: {
    color: COLORS.card,
  },
  secondaryText: {
    color: COLORS.card,
  },
  outlineText: {
    color: COLORS.primary,
  },
  // Onboarding button styles
  onboardingButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  onboardingTextButton: {
    color: COLORS.card,
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    position: 'absolute',
  },
  onboardingArrowButton: {
    color: COLORS.card,
    fontSize: 30,
    fontWeight: 'bold',
    position: 'absolute',
  },
});
