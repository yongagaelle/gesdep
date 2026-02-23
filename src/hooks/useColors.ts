import { useTheme } from '../contexts/ThemeContext';

export const useColors = () => {
  const { colors } = useTheme();
  return colors;
};
