import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { Transaction } from '../types';

interface PdfOptions {
  transactions: Transaction[];
  totalAmount?: number;
  period: string;
  userName?: string;
  author?: string;
}

export const generateExpensesReport = async (options: PdfOptions) => {
  const {
    transactions: rawTransactions,
    totalAmount: providedTotal,
    period,
    userName = 'Utilisateur',
    author = 'Non spécifié',
  } = options;

  // Normaliser les données
  const transactions: Transaction[] = rawTransactions.map((t) => ({
    ...t,
    date: t.date ? new Date(t.date) : new Date(),
    amount: typeof t.amount === 'number' ? t.amount : Number(t.amount) || 0,
  }));

  // Calculer totaux
  const totalAmount =
    typeof providedTotal === 'number' && providedTotal > 0
      ? providedTotal
      : transactions.reduce((s, t) => s + Math.abs(t.amount), 0);

  const incomeTransactions = transactions.filter((t) => t.type === 'income');
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  const totalIncome = incomeTransactions.reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalExpense = expenseTransactions.reduce((s, t) => s + Math.abs(t.amount), 0);
  const balance = totalIncome - totalExpense;

  const transactionsByType = transactions.reduce<Record<string, number>>((acc, transaction) => {
    const key = transaction.type === 'income' ? 'Revenus' : 'Dépenses';
    acc[key] = (acc[key] || 0) + Math.abs(transaction.amount);
    return acc;
  }, {});

  const rowsHtml = transactions
    .slice()
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((transaction) => {
      const date = transaction.date.toLocaleDateString('fr-FR');
      const desc = transaction.description || '';
      const beneficiaryCell = transaction.type === 'expense' ? (transaction.beneficiary || '-') : '-';
      const authorCell = transaction.type === 'income' ? (transaction.author || '-') : '-';
      const amt = (transaction.type === 'expense' ? '-' : '+') + Math.abs(transaction.amount).toFixed(2) + '€';
      const amtClass = transaction.type === 'income' ? 'income' : 'expense';
      return `
        <tr>
          <td>${date}</td>
          <td>${desc}</td>
          <td>${beneficiaryCell}</td>
          <td>${authorCell}</td>
          <td class="amount-cell ${amtClass}" style="text-align:right;">${amt}</td>
        </tr>
      `;
    })
    .join('');

  const categoriesHtml = Object.entries(transactionsByType)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => {
      const pct = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : '0.0';
      return `
        <div class="category-item">
          <span class="category-name">${category}</span>
          <div>
            <span class="category-amount">${amount.toFixed(2)}€</span>
            <span class="category-percentage">${pct}%</span>
          </div>
        </div>
      `;
    })
    .join('');

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
  body {
    font-family: Helvetica, Arial, sans-serif;
    color: #333;
    padding: 28px;
    margin: 0;
  }
  .header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 3px solid #007AFF;
  }
  .header h1 {
    font-size: 32px;
    color: #007AFF;
    margin-bottom: 10px;
    margin-top: 0;
  }
  .header p {
    font-size: 14px;
    color: #666;
    margin: 0;
  }
  .info-section {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 18px;
    background: #f5f5f5;
    padding: 12px;
    border-radius: 6px;
  }
  .info-item {
    min-width: 140px;
    flex: 1;
  }
  .info-label {
    font-size: 11px;
    color: #666;
    text-transform: uppercase;
  }
  .info-value {
    font-weight: 700;
    font-size: 16px;
  }
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 18px;
  }
  .summary-card {
    padding: 12px;
    border-radius: 8px;
    color: #fff;
    text-align: center;
  }
  .summary-card.income {
    background: #059669;
  }
  .summary-card.expense {
    background: #dc2626;
  }
  .summary-card.balance {
    background: #1d4ed8;
  }
  .summary-card .amount {
    font-size: 20px;
    font-weight: 700;
  }
  .section-title {
    font-size: 16px;
    margin: 18px 0 8px;
    font-weight: bold;
  }
  .category-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px;
    background: #fafafa;
    border-radius: 6px;
    margin-bottom: 8px;
  }
  .category-name {
    font-weight: 600;
  }
  .category-amount {
    margin-right: 10px;
    font-weight: bold;
  }
  .category-percentage {
    color: #666;
    font-size: 12px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 12px;
  }
  th, td {
    padding: 8px;
    border-bottom: 1px solid #eee;
    text-align: left;
    font-size: 13px;
  }
  thead th {
    background: #f3f4f6;
    font-size: 12px;
    text-transform: uppercase;
    color: #666;
  }
  .amount-cell.income {
    color: #10b981;
  }
  .amount-cell.expense {
    color: #ef4444;
  }
  .footer {
    margin-top: 24px;
    font-size: 12px;
    color: #999;
    text-align: center;
  }
</style>
</head>
<body>
  <div class="header">
    <h1>📊 Rapport de Transactions - ${period}</h1>
    <p>Généré le ${new Date().toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })}</p>
  </div>

  <div class="info-section">
    <div class="info-item"><div class="info-label">Utilisateur</div><div class="info-value">${userName}</div></div>
    <div class="info-item"><div class="info-label">Auteur</div><div class="info-value">${author}</div></div>
    <div class="info-item"><div class="info-label">Transactions</div><div class="info-value">${transactions.length}</div></div>
    <div class="info-item"><div class="info-label">Total</div><div class="info-value">${totalAmount.toFixed(2)}€</div></div>
  </div>

  <div class="summary-cards">
    <div class="summary-card income"><div>Total Entrées</div><div class="amount">+${totalIncome.toFixed(2)}€</div></div>
    <div class="summary-card expense"><div>Total Sorties</div><div class="amount">${totalExpense.toFixed(2)}€</div></div>
    <div class="summary-card balance"><div>Solde</div><div class="amount">${balance.toFixed(2)}€</div></div>
  </div>

  <div class="section-title">Répartition par type</div>
  <div>${categoriesHtml}</div>

  <div class="section-title">Détail des opérations</div>
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Bénéficiaire</th>
        <th>Auteur</th>
        <th style="text-align:right">Montant</th>
      </tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="footer">
    Document généré par GesDep • ${new Date().getFullYear()}
  </div>
</body>
</html>`;

  try {
    if (Platform.OS === 'web') {
      // Export pour le web (téléchargement direct)
      await exportPdfWeb(html, `rapport-transactions-${period}.pdf`);
    } else {
      // Export pour mobile (iOS/Android)
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Exporter le rapport',
          UTI: 'com.adobe.pdf',
        });
      }
    }
  } catch (err) {
    console.error('PDF generation error', err);
    throw err;
  }
};

// Fonction pour charger html2pdf depuis CDN et exporter
export const exportPdfWeb = (html: string, filename: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Vérifier si html2pdf est déjà chargé
    if (typeof (window as any).html2pdf !== 'undefined') {
      generatePdf();
      return;
    }

    // Charger html2pdf depuis CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
    script.async = true;

    script.onload = () => {
      generatePdf();
    };

    script.onerror = () => {
      reject(new Error('Impossible de charger la libraire html2pdf'));
    };

    document.head.appendChild(script);

    function generatePdf() {
      try {
        // Créer un élément contenant le HTML
        const element = document.createElement('div');
        element.innerHTML = html;
        element.style.padding = '20px';
        element.style.backgroundColor = 'white';
        element.style.color = '#333';

        // Options pour html2pdf
        const options = {
          margin: [10, 10, 10, 10],
          filename: filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, allowTaint: true },
          jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
        };

        // Générer et télécharger le PDF
        (window as any).html2pdf().set(options).from(element).save();
        
        resolve();
      } catch (error) {
        reject(error);
      }
    }
  });
};

// Alternative : Fonction simple sans dépendances (télécharge HTML mais peut être visualisé)
export const exportHtmlFile = (html: string, filename: string): void => {
  try {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.replace('.pdf', '.html');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Export error:', err);
    throw err;
  }
};