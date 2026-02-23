// contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string) => Promise<void>;
  loginWithPhone: (phone: string, code: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USERS_KEY = '@users';
const CURRENT_USER_KEY = '@current_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Charger l'utilisateur au démarrage
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const userData = await AsyncStorage.getItem(CURRENT_USER_KEY);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        setUser({
          ...parsedUser,
          createdAt: new Date(parsedUser.createdAt)
        });
      }
    } catch (error) {
      console.error('Erreur lors de la vérification auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer tous les utilisateurs
  const getAllUsers = async (): Promise<any[]> => {
    try {
      const usersData = await AsyncStorage.getItem(USERS_KEY);
      return usersData ? JSON.parse(usersData) : [];
    } catch (error) {
      console.error('Erreur lecture utilisateurs:', error);
      return [];
    }
  };

  // Sauvegarder tous les utilisateurs
  const saveAllUsers = async (users: any[]) => {
    try {
      await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Erreur sauvegarde utilisateurs:', error);
      throw new Error('Impossible de sauvegarder les utilisateurs');
    }
  };

  // Connexion avec email/password
  const login = async (email: string, password: string) => {
    try {
      // Validation
      if (!email || !password) {
        throw new Error('Email et mot de passe requis');
      }

      if (!isValidEmail(email)) {
        throw new Error('Email invalide');
      }

      // Récupérer les utilisateurs
      const users = await getAllUsers();
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!foundUser) {
        throw new Error('Aucun compte trouvé avec cet email');
      }

      if (foundUser.password !== password) {
        throw new Error('Mot de passe incorrect');
      }

      // Connexion réussie
      const userToSave = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        phone: foundUser.phone,
        createdAt: foundUser.createdAt
      };

      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToSave));
      setUser(userToSave);
    } catch (error: any) {
      console.error('Erreur connexion:', error);
      throw error;
    }
  };

  // Inscription
  const signup = async (email: string, password: string, name: string) => {
    try {
      // Validation
      if (!email || !password || !name) {
        throw new Error('Tous les champs sont requis');
      }

      if (!isValidEmail(email)) {
        throw new Error('Email invalide');
      }

      if (password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      if (name.trim().length < 2) {
        throw new Error('Le nom doit contenir au moins 2 caractères');
      }

      // Vérifier si l'email existe déjà
      const users = await getAllUsers();
      const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());

      if (emailExists) {
        throw new Error('Cet email est déjà utilisé');
      }

      // Créer le nouvel utilisateur
      const newUser = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase(),
        password: password, // En production, il faut hasher le mot de passe
        name: name.trim(),
        createdAt: new Date().toISOString()
      };

      // Sauvegarder
      users.push(newUser);
      await saveAllUsers(users);

      // Connecter automatiquement
      const userToSave = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        createdAt: new Date(newUser.createdAt)
      };

      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToSave));
      setUser(userToSave);
    } catch (error: any) {
      console.error('Erreur inscription:', error);
      throw error;
    }
  };

  // Connexion par téléphone
  const loginWithPhone = async (phone: string, code: string) => {
    try {
      if (!phone || !code) {
        throw new Error('Numéro de téléphone et code requis');
      }

      if (!isValidPhone(phone)) {
        throw new Error('Numéro de téléphone invalide');
      }

      // Vérifier le code (simulé - en production, vérifier avec un backend)
      if (code !== '123456') {
        throw new Error('Code de vérification incorrect');
      }

      // Rechercher ou créer l'utilisateur
      const users = await getAllUsers();
      let foundUser = users.find(u => u.phone === phone);

      if (!foundUser) {
        // Créer un nouveau compte avec le téléphone
        foundUser = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          email: `${phone}@phone.user`,
          password: Date.now().toString(),
          name: `Utilisateur ${phone.slice(-4)}`,
          phone: phone,
          createdAt: new Date().toISOString()
        };
        users.push(foundUser);
        await saveAllUsers(users);
      }

      // Connecter
      const userToSave = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        phone: foundUser.phone,
        createdAt: new Date(foundUser.createdAt)
      };

      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(userToSave));
      setUser(userToSave);
    } catch (error: any) {
      console.error('Erreur connexion téléphone:', error);
      throw error;
    }
  };

  // Connexion avec Google (simulée)
  const loginWithGoogle = async () => {
    try {
      // Simuler une connexion Google
      const googleUser = {
        id: Date.now().toString(),
        email: 'user@gmail.com',
        name: 'Utilisateur Google',
        createdAt: new Date()
      };

      await AsyncStorage.setItem(CURRENT_USER_KEY, JSON.stringify(googleUser));
      setUser(googleUser);
    } catch (error: any) {
      console.error('Erreur connexion Google:', error);
      throw error;
    }
  };

  // Réinitialisation du mot de passe
  const resetPassword = async (email: string) => {
    try {
      if (!email) {
        throw new Error('Email requis');
      }

      if (!isValidEmail(email)) {
        throw new Error('Email invalide');
      }

      const users = await getAllUsers();
      const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());

      if (!foundUser) {
        throw new Error('Aucun compte trouvé avec cet email');
      }

      // En production, envoyer un email de réinitialisation
      // Pour la démo, on simule juste un succès
      console.log('Email de réinitialisation envoyé à:', email);
    } catch (error: any) {
      console.error('Erreur réinitialisation:', error);
      throw error;
    }
  };

  // Déconnexion
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(CURRENT_USER_KEY);
      setUser(null);
    } catch (error) {
      console.error('Erreur déconnexion:', error);
      throw new Error('Impossible de se déconnecter');
    }
  };

  // Validation d'email
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validation de téléphone
  const isValidPhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        loginWithPhone,
        loginWithGoogle,
        logout,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth doit être utilisé dans un AuthProvider');
  }
  return context;
};