import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Expense } from '../types';

interface PdfOptions {
  expenses: Expense[];
  totalAmount?: number;
  period: string;
  userName?: string;
  beneficiary?: string;
  author?: string;
}

export const generateExpensesReport = async (options: PdfOptions) => {
  const {
    expenses: rawExpenses,
    totalAmount: providedTotal,
    period,
    userName = 'Utilisateur',
    beneficiary = 'Non spécifié',
    author = 'Non spécifié',
  } = options;

  // Normaliser les données (dates, montants)
  const expenses: Expense[] = rawExpenses.map((e) => ({
    ...e,
    date: e.date ? new Date(e.date) : new Date(),
    amount: typeof e.amount === 'number' ? e.amount : Number(e.amount) || 0,
  }));

  // Calculer total si besoin (somme des valeurs absolues)
  const totalAmount =
    typeof providedTotal === 'number' && providedTotal > 0
      ? providedTotal
      : expenses.reduce((s, ex) => s + Math.abs(ex.amount), 0);

  const incomeExpenses = expenses.filter((e) => e.type === 'income');
  const expenseExpenses = expenses.filter((e) => e.type === 'expense');

  const totalIncome = incomeExpenses.reduce((s, e) => s + Math.abs(e.amount), 0);
  const totalExpense = expenseExpenses.reduce((s, e) => s + Math.abs(e.amount), 0);
  const balance = totalIncome - totalExpense;

  const expensesByCategory = expenses.reduce<Record<string, number>>((acc, expense) => {
    const key = expense.type || 'Autres';
    acc[key] = (acc[key] || 0) + Math.abs(expense.amount);
    return acc;
  }, {});

  const rowsHtml = expenses
    .slice()
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((expense) => {
      const date = expense.date.toLocaleDateString('fr-FR');
      const desc = expense.description || '';
      const beneficiaryCell = expense.type === 'expense' ? (expense.beneficiary || '-') : '-';
      const authorCell = expense.type === 'income' ? (expense.author || '-') : '-';
      const typeLabel = expense.type === 'income' ? 'Revenu' : 'Dépense';
      const amt = (expense.type === 'expense' ? '-' : '+') + Math.abs(expense.amount).toFixed(2) + '€';
      const amtClass = expense.type === 'income' ? 'income' : 'expense';
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

  const categoriesHtml = Object.entries(expensesByCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([category, amount]) => {
      const pct = totalAmount > 0 ? ((amount / totalAmount) * 100).toFixed(1) : '0.0';
      return `
        <div class="category-item">
          <span class="category-name">${category === 'income' ? 'Revenu' : 'Dépense'}</span>
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
  body{font-family:Helvetica,Arial,sans-serif;color:#333;padding:28px}
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
          }
          
          .header p {
            font-size: 14px;
            color: #666;
          }
  .info-section{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:18px;background:#f5f5f5;padding:12px;border-radius:6px}
  .info-item{min-width:140px;flex:1}
  .info-label{font-size:11px;color:#666;text-transform:uppercase}
  .info-value{font-weight:700;font-size:16px}
  .summary-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px}
  .summary-card{padding:12px;border-radius:8px;color:#fff;text-align:center}
  .summary-card.income{background:#059669}
  .summary-card.expense{background:#dc2626}
  .summary-card.balance{background:#1d4ed8}
  .summary-card .amount{font-size:20px;font-weight:700}
  .section-title{font-size:16px;margin:18px 0 8px}
  .category-item{display:flex;justify-content:space-between;align-items:center;padding:8px;background:#fafafa;border-radius:6px;margin-bottom:8px}
  table{width:100%;border-collapse:collapse;margin-top:12px}
  th,td{padding:8px;border-bottom:1px solid #eee;text-align:left;font-size:13px}
  thead th{background:#f3f4f6;font-size:12px;text-transform:uppercase;color:#666}
  .amount-cell.income{color:#10b981}
  .amount-cell.expense{color:#ef4444}
  .footer{margin-top:24px;font-size:12px;color:#999;text-align:center}
</style>
</head>
<body>
   <div class="header">
          <h1>📊 Rapport de Dépenses - ${period}</h1>
          <p>Généré le ${new Date().toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}</p>
        </div>

  <div class="info-section">
    <div class="info-item"><div class="info-label">Utilisateur</div><div class="info-value">${userName}</div></div>
    <div class="info-item"><div class="info-label">Bénéficiaire</div><div class="info-value">${beneficiary}</div></div>
    <div class="info-item"><div class="info-label">Auteur</div><div class="info-value">${author}</div></div>
    <div class="info-item"><div class="info-label">Transactions</div><div class="info-value">${expenses.length}</div></div>
    <div class="info-item"><div class="info-label">Total</div><div class="info-value">${totalAmount.toFixed(2)}€</div></div>
  </div>

  <div class="summary-cards">
    <div class="summary-card income"><div>Total Revenus</div><div class="amount">+${totalIncome.toFixed(2)}€</div></div>
    <div class="summary-card expense"><div>Total Dépenses</div><div class="amount">${totalExpense.toFixed(2)}€</div></div>
    <div class="summary-card balance"><div>Solde</div><div class="amount">${balance.toFixed(2)}€</div></div>
  </div>

  <div class="section-title">Répartition par catégorie</div>
  <div>${categoriesHtml}</div>

  <div class="section-title">Détail des opérations</div>
  <table>
    <thead><tr><th>Date</th><th>Description</th><th>Beneficiaire</th>
        <th>Auteur</th><th style="text-align:right">Montant</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>

  <div class="footer">
    Document généré par GesDep • ${new Date().getFullYear()}
  </div>
</body>
</html>`;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Exporter le rapport', UTI: 'com.adobe.pdf' });
    }
    return uri;
  } catch (err) {
    console.error('pdf generation error', err);
    throw err;
  }
};