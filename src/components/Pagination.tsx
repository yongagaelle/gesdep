import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { COLORS } from '../constants';
import { Data } from '../data/screens';

interface PaginationProps {
  data: Data[];
  x: SharedValue<number>;
  screenWidth: number;
}

export const Pagination: React.FC<PaginationProps> = ({ data, x, screenWidth }) => {
  return (
    <View style={styles.container}>
      {data.map((_, index) => {
        const dotStyle = useAnimatedStyle(() => {
          const widthAnimation = interpolate(
            x.value,
            [
              (index - 1) * screenWidth,
              index * screenWidth,
              (index + 1) * screenWidth,
            ],
            [10, 30, 10],
            Extrapolate.CLAMP
          );

          const opacityAnimation = interpolate(
            x.value,
            [
              (index - 1) * screenWidth,
              index * screenWidth,
              (index + 1) * screenWidth,
            ],
            [0.5, 1, 0.5],
            Extrapolate.CLAMP
          );

          return {
            width: widthAnimation,
            opacity: opacityAnimation,
          };
        });

        return <Animated.View key={index} style={[styles.dot, dotStyle]} />;
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
});
