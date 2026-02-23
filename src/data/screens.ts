import { ImageSourcePropType } from "react-native";

export interface Data {
  id: number;
  image: ImageSourcePropType;
  title: string;
  text: string;
}

export const data: Data[] = [
  {
    id: 1,
    image: require('../assets/Money stress-pana.png'),
    title: 'Suivez vos transactions',
    text: 'Gardez un œil sur toutes vos transactions et gérez votre budget facilement',
  },
  {
    id: 2,
    image: require('../assets/Credit assesment-amico.png'),
    title: 'Analysez vos habitudes',
    text: 'Visualisez vos dépenses et identifiez où va et vient votre argent',
  },
  {
    id: 3,
    image: require('../assets/Finance app-cuate.png'),
    title: 'Atteignez vos objectifs',
    text: 'Recevez des alertes pour rester sur la bonne voie',
  },
];
