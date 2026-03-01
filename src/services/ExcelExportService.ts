// src/services/ExcelExportService.ts - VERSION CORRIGÉE
// @ts-nocheck
import * as XLSX from 'xlsx';
import { writeAsStringAsync, cacheDirectory, documentDirectory } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { Transaction } from '../types';

class ExcelExportService {
  async generateExcel(transactions: Transaction[]): Promise<string> {
    try {
      console.log('🔵 Début génération Excel...');
      console.log('🔵 Nombre de transactions:', transactions.length);
      
      const wb = XLSX.utils.book_new();

      const donations = transactions.filter(t => t.type === 'income');
      const expenses = transactions.filter(t => t.type === 'expense');

      console.log('🔵 Dons:', donations.length, 'Dépenses:', expenses.length);

      const expensesData = expenses.map(exp => ({
        Date: this.formatDate(exp.date),
        Description: exp.description,
        Bénéficiaire: exp.beneficiary || '',
        Montant: exp.amount,
      }));

      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      expensesData.push({
        Date: '',
        Description: 'TOTAL DÉPENSES',
        Bénéficiaire: '',
        Montant: totalExpenses,
      });

      const donationsData = donations.map(don => ({
        Date: this.formatDate(don.date),
        Description: don.description,
        Auteur: don.author || '',
        Montant: don.amount,
      }));

      const totalDonations = donations.reduce((sum, don) => sum + don.amount, 0);
      donationsData.push({
        Date: '',
        Description: 'TOTAL DONS',
        Auteur: '',
        Montant: totalDonations,
      });

      const summaryData = [
        { Catégorie: 'Total Dons', Montant: totalDonations },
        { Catégorie: 'Total Dépenses', Montant: totalExpenses },
        { Catégorie: '', Montant: '' },
        { Catégorie: 'SOLDE', Montant: totalDonations - totalExpenses },
      ];

      console.log('🔵 Création des feuilles...');
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      const wsExpenses = XLSX.utils.json_to_sheet(expensesData);
      const wsDonations = XLSX.utils.json_to_sheet(donationsData);

      wsSummary['!cols'] = [{ wch: 20 }, { wch: 15 }];
      wsExpenses['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 12 }];
      wsDonations['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 20 }, { wch: 12 }];

      XLSX.utils.book_append_sheet(wb, wsSummary, 'Résumé');
      XLSX.utils.book_append_sheet(wb, wsDonations, 'Dons');
      XLSX.utils.book_append_sheet(wb, wsExpenses, 'Dépenses');

      console.log('🔵 Génération du fichier Excel en base64...');
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
      console.log('🔵 Fichier généré, taille:', wbout.length, 'caractères');

      const fileName = 'Mes_Finances.xlsx';
      
      // Utiliser cacheDirectory ou documentDirectory (importés en haut)
      const directory = cacheDirectory || documentDirectory;
      console.log('🔵 Directory:', directory);
      
      const fileUri = `${directory}${fileName}`;
      console.log('🔵 Chemin du fichier:', fileUri);

      console.log('🔵 Écriture du fichier...');
      // Utiliser la fonction importée directement
      await writeAsStringAsync(fileUri, wbout, {
        encoding: 'base64',
      });

      console.log('✅ Fichier créé avec succès:', fileUri);
      return fileUri;
    } catch (error) {
      console.error('❌ ERREUR dans generateExcel:', error);
      console.error('❌ Type d\'erreur:', typeof error);
      console.error('❌ Message:', error?.message);
      console.error('❌ Stack:', error?.stack);
      throw error;
    }
  }

  async shareExcel(fileUri: string): Promise<void> {
    try {
      console.log('🔵 Vérification disponibilité du partage...');
      const isAvailable = await Sharing.isAvailableAsync();
      console.log('🔵 Partage disponible:', isAvailable);
      
      if (!isAvailable) {
        Alert.alert(
          'Partage non disponible',
          'Le partage de fichiers n\'est pas disponible sur cet appareil'
        );
        return;
      }

      console.log('🔵 Partage du fichier...');
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Partager le rapport financier',
      });

      console.log('✅ Fichier partagé avec succès');
    } catch (error) {
      console.error('❌ ERREUR dans shareExcel:', error);
      console.error('❌ Message:', error?.message);
      throw error;
    }
  }

  async exportAndShare(transactions: Transaction[]): Promise<void> {
    try {
      console.log('🔵 Début exportAndShare');
      console.log('🔵 Nombre de transactions:', transactions.length);
      
      if (transactions.length === 0) {
        Alert.alert(
          'Aucune donnée',
          'Il n\'y a aucune transaction à exporter.'
        );
        return;
      }

      console.log('🔵 Appel generateExcel...');
      const fileUri = await this.generateExcel(transactions);
      
      console.log('🔵 Appel shareExcel...');
      await this.shareExcel(fileUri);
      
      console.log('✅ Export et partage terminés');
    } catch (error) {
      console.error('❌ ERREUR dans exportAndShare:', error);
      console.error('❌ Message:', error?.message);
      console.error('❌ Stack:', error?.stack);
      
      Alert.alert(
        'Erreur',
        `Impossible d'exporter les données: ${error?.message || 'Erreur inconnue'}`
      );
    }
  }

  private formatDate(date: Date): string {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
}

export default new ExcelExportService();