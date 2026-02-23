// utils/statisticsPdfExport.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Transaction } from '../types';

interface StatisticsPdfOptions {
  transactions: Transaction[];
  totalIncome: number;
  totalExpense: number;
  balance: number;
  period: string;
  userName?: string;
  chartData?: {
    labels: string[];
    expenses: number[];
    donations: number[];
  };
}

export const generateStatisticsReport = async (options: StatisticsPdfOptions) => {
  const {
    transactions,
    totalIncome,
    totalExpense,
    balance,
    period,
    userName = 'Utilisateur',
    chartData,
  } = options;

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  // Générer le LineChart SVG
  const generateLineChartSVG = () => {
    if (!chartData || chartData.labels.length === 0) {
      return '<p style="text-align:center;color:#94a3b8;">Aucune donnée disponible pour le graphique</p>';
    }

    const { labels, expenses, donations } = chartData;
    const maxValue = Math.max(...expenses, ...donations, 1);
    const chartWidth = 700;
    const chartHeight = 350;
    const padding = { top: 30, right: 50, bottom: 60, left: 70 };
    const graphWidth = chartWidth - padding.left - padding.right;
    const graphHeight = chartHeight - padding.top - padding.bottom;

    // Générer les points pour les lignes avec gradient
    const generateAreaPath = (data: number[], startColor: string, endColor: string, id: string) => {
      if (data.length === 0) return '';
      
      const points = data.map((value, index) => {
        const x = padding.left + (index / Math.max(data.length - 1, 1)) * graphWidth;
        const y = padding.top + graphHeight - (value / maxValue) * graphHeight;
        return { x, y };
      });

      const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      const areaPath = `M ${padding.left} ${padding.top + graphHeight} ${points.map(p => `L ${p.x} ${p.y}`).join(' ')} L ${padding.left + graphWidth} ${padding.top + graphHeight} Z`;

      return `
        <defs>
          <linearGradient id="${id}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${startColor};stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:${endColor};stop-opacity:0.05" />
          </linearGradient>
        </defs>
        <path d="${areaPath}" fill="url(#${id})"/>
        <path d="${linePath}" fill="none" stroke="${startColor}" stroke-width="3"/>
        ${points.map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="5" fill="${startColor}" stroke="white" stroke-width="2"/>`).join('')}
      `;
    };

    // Générer les lignes de grille
    const gridLines = Array.from({ length: 5 }, (_, i) => {
      const y = padding.top + (i * graphHeight) / 4;
      const value = Math.round((maxValue * (4 - i)) / 4);
      return `
        <line x1="${padding.left}" y1="${y}" x2="${chartWidth - padding.right}" y2="${y}" stroke="#e5e7eb" stroke-width="1" stroke-dasharray="5,5"/>
        <text x="${padding.left - 10}" y="${y + 5}" text-anchor="end" font-size="13" fill="#6b7280" font-weight="600">${value}€</text>
      `;
    }).join('');

    // Générer les labels de l'axe X
    const xLabels = labels.map((label, index) => {
      const x = padding.left + (index / Math.max(labels.length - 1, 1)) * graphWidth;
      return `<text x="${x}" y="${chartHeight - 20}" text-anchor="middle" font-size="13" fill="#6b7280" font-weight="600">${label}</text>`;
    }).join('');

    return `
      <svg width="${chartWidth}" height="${chartHeight}" style="margin: 20px auto; display: block; background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <rect width="${chartWidth}" height="${chartHeight}" fill="white" rx="12"/>
        ${gridLines}
        ${generateAreaPath(expenses, '#ef4444', '#fca5a5', 'expGradient')}
        ${generateAreaPath(donations, '#10b981', '#6ee7b7', 'donGradient')}
        ${xLabels}
      </svg>
    `;
  };

  // Générer le DonutChart SVG
  const generateDonutChartSVG = () => {
    const total = Math.abs(totalExpense) + totalIncome;
    if (total === 0) {
      return '<p style="text-align:center;color:#94a3b8;">Aucune donnée disponible</p>';
    }

    const expensePercentage = (Math.abs(totalExpense) / total) * 100;
    const size = 300;
    const center = size / 2;
    const radius = 100;
    const innerRadius = 60;

    // Calculer les angles
    const expenseAngle = (expensePercentage / 100) * 360;
    const donationAngle = 360 - expenseAngle;

    // Fonction pour convertir angle en coordonnées
    const polarToCartesian = (angle: number, r: number) => {
      const angleInRadians = ((angle - 90) * Math.PI) / 180;
      return {
        x: center + r * Math.cos(angleInRadians),
        y: center + r * Math.sin(angleInRadians)
      };
    };

    // Arc pour les dépenses
    const expenseStart = polarToCartesian(0, radius);
    const expenseEnd = polarToCartesian(expenseAngle, radius);
    const expenseInnerStart = polarToCartesian(expenseAngle, innerRadius);
    const expenseInnerEnd = polarToCartesian(0, innerRadius);
    const expenseLargeArc = expenseAngle > 180 ? 1 : 0;

    const expensePath = `
      M ${expenseStart.x} ${expenseStart.y}
      A ${radius} ${radius} 0 ${expenseLargeArc} 1 ${expenseEnd.x} ${expenseEnd.y}
      L ${expenseInnerStart.x} ${expenseInnerStart.y}
      A ${innerRadius} ${innerRadius} 0 ${expenseLargeArc} 0 ${expenseInnerEnd.x} ${expenseInnerEnd.y}
      Z
    `;

    // Arc pour les dons
    const donationStart = polarToCartesian(expenseAngle, radius);
    const donationEnd = polarToCartesian(360, radius);
    const donationInnerStart = polarToCartesian(360, innerRadius);
    const donationInnerEnd = polarToCartesian(expenseAngle, innerRadius);
    const donationLargeArc = donationAngle > 180 ? 1 : 0;

    const donationPath = `
      M ${donationStart.x} ${donationStart.y}
      A ${radius} ${radius} 0 ${donationLargeArc} 1 ${donationEnd.x} ${donationEnd.y}
      L ${donationInnerStart.x} ${donationInnerStart.y}
      A ${innerRadius} ${innerRadius} 0 ${donationLargeArc} 0 ${donationInnerEnd.x} ${donationInnerEnd.y}
      Z
    `;

    return `
      <svg width="${size}" height="${size}" style="margin: 20px auto; display: block;">
        <defs>
          <linearGradient id="expenseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ef4444;stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:#dc2626;stop-opacity:0.8" />
          </linearGradient>
          <linearGradient id="donationGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.9" />
            <stop offset="100%" style="stop-color:#059669;stop-opacity:0.8" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <path d="${expensePath}" fill="url(#expenseGrad)" filter="url(#shadow)"/>
        <path d="${donationPath}" fill="url(#donationGrad)" filter="url(#shadow)"/>
        
        <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="white"/>
        
        <text x="${center}" y="${center - 10}" text-anchor="middle" font-size="32" font-weight="700" fill="#1e293b">
          ${total.toFixed(0)}€
        </text>
        <text x="${center}" y="${center + 15}" text-anchor="middle" font-size="14" fill="#64748b">
          Total
        </text>
      </svg>
    `;
  };

  // Préparer le tableau des transactions
  const transactionsRows = transactions
    .slice()
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 15)
    .map(t => `
      <tr>
        <td>${t.date.toLocaleDateString('fr-FR')}</td>
        <td><strong>${t.description}</strong></td>
        <td><span class="badge ${t.type === 'income' ? 'badge-income' : 'badge-expense'}">${t.type === 'income' ? '✅ Don' : '❌ Dépense'}</span></td>
        <td>${t.type === 'income' ? (t.author || '-') : (t.beneficiary || '-')}</td>
        <td style="text-align: right;" class="${t.type === 'income' ? 'amount-income' : 'amount-expense'}">
          ${t.type === 'income' ? '+' : '-'}${Math.abs(t.amount).toFixed(2)}€
        </td>
      </tr>
    `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            padding: 40px;
            background: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
          }
          
          .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            border-radius: 20px;
            color: white;
            box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
          }
          
          .header h1 {
            font-size: 42px;
            margin-bottom: 12px;
            font-weight: 800;
            letter-spacing: -1px;
          }
          
          .header .subtitle {
            font-size: 18px;
            opacity: 0.95;
            margin-bottom: 12px;
            font-weight: 500;
          }
          
          .header .user-name {
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
            opacity: 0.9;
          }
          
          .header .date {
            font-size: 14px;
            opacity: 0.8;
          }
          
          .summary-section {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 24px;
            margin-bottom: 40px;
          }
          
          .summary-card {
            background: white;
            border-radius: 16px;
            padding: 32px;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            border: 2px solid transparent;
            transition: all 0.3s ease;
          }
          
          .summary-card.income {
            border-color: #10b981;
            background: linear-gradient(135deg, #ffffff 0%, #ecfdf5 100%);
          }
          
          .summary-card.expense {
            border-color: #ef4444;
            background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
          }
          
          .summary-card.balance {
            border-color: #3b82f6;
            background: linear-gradient(135deg, #ffffff 0%, #eff6ff 100%);
          }
          
          .summary-card .label {
            font-size: 13px;
            color: #64748b;
            font-weight: 700;
            margin-bottom: 16px;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .summary-card .value {
            font-size: 48px;
            font-weight: 800;
            margin-bottom: 8px;
            line-height: 1;
          }
          
          .summary-card .icon {
            font-size: 32px;
            margin-bottom: 16px;
          }
          
          .summary-card.income .value {
            color: #10b981;
          }
          
          .summary-card.expense .value {
            color: #ef4444;
          }
          
          .summary-card.balance .value {
            color: ${balance >= 0 ? '#10b981' : '#ef4444'};
          }
          
          .period-info {
            background: white;
            padding: 24px 32px;
            border-radius: 16px;
            margin-bottom: 40px;
            text-align: center;
            border-left: 6px solid #3b82f6;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }
          
          .period-info strong {
            color: #1e293b;
            font-size: 18px;
            font-weight: 700;
          }
          
          .period-info .period-value {
            color: #3b82f6;
            font-size: 20px;
            font-weight: 800;
            margin-left: 8px;
          }
          
          .chart-section {
            margin-bottom: 40px;
            page-break-inside: avoid;
            background: white;
            border-radius: 20px;
            padding: 32px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }
          
          .chart-section h2 {
            font-size: 28px;
            color: #1e293b;
            margin-bottom: 8px;
            font-weight: 800;
          }
          
          .chart-section .subtitle {
            font-size: 15px;
            color: #64748b;
            margin-bottom: 28px;
          }
          
          .legend {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-top: 24px;
            padding-top: 24px;
            border-top: 2px solid #e2e8f0;
          }
          
          .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
          }
          
          .legend-dot {
            width: 20px;
            height: 20px;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          }
          
          .legend-dot.expenses {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          }
          
          .legend-dot.donations {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          }
          
          .legend-text {
            font-size: 15px;
            color: #1e293b;
            font-weight: 700;
          }
          
          .donut-legend {
            display: flex;
            justify-content: center;
            gap: 48px;
            margin-top: 24px;
          }
          
          .donut-legend-item {
            text-align: center;
          }
          
          .donut-legend-item .percentage {
            font-size: 28px;
            font-weight: 800;
            margin-bottom: 8px;
          }
          
          .donut-legend-item.expense .percentage {
            color: #ef4444;
          }
          
          .donut-legend-item.income .percentage {
            color: #10b981;
          }
          
          .donut-legend-item .label {
            font-size: 14px;
            color: #64748b;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .donut-legend-item .amount {
            font-size: 18px;
            font-weight: 700;
            color: #1e293b;
            margin-top: 4px;
          }
          
          .transactions-section {
            background: white;
            border-radius: 20px;
            padding: 32px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          }
          
          .transactions-section h2 {
            font-size: 28px;
            color: #1e293b;
            margin-bottom: 24px;
            font-weight: 800;
          }
          
          .transactions-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }
          
          .transactions-table th {
            background: #f8fafc;
            padding: 16px;
            text-align: left;
            font-size: 12px;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            border-bottom: 3px solid #e2e8f0;
          }
          
          .transactions-table td {
            padding: 16px;
            border-bottom: 1px solid #f1f5f9;
            font-size: 14px;
          }
          
          .transactions-table tr:hover {
            background: #f8fafc;
          }
          
          .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 700;
          }
          
          .badge-income {
            background: #dcfce7;
            color: #166534;
          }
          
          .badge-expense {
            background: #fee2e2;
            color: #991b1b;
          }
          
          .amount-income {
            color: #10b981;
            font-weight: 800;
          }
          
          .amount-expense {
            color: #ef4444;
            font-weight: 800;
          }
          
          .footer {
            margin-top: 60px;
            text-align: center;
            padding-top: 28px;
            border-top: 3px solid #e2e8f0;
            color: #94a3b8;
            font-size: 13px;
          }
          
          .footer p {
            margin-bottom: 6px;
          }
          
          .footer strong {
            color: #64748b;
            font-weight: 700;
          }
          
          @media print {
            body {
              padding: 20px;
              background: white;
            }
            .summary-section,
            .chart-section,
            .transactions-section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Rapport Statistique Financier</h1>
          <div class="subtitle">Analyse détaillée de vos finances</div>
          <div class="user-name">👤 ${userName}</div>
          <div class="date">📅 Généré le ${currentDate}</div>
        </div>
        
        <div class="period-info">
          <strong>Période sélectionnée :</strong> 
          <span class="period-value">${period}</span>
        </div>
        
        <div class="summary-section">
          <div class="summary-card income">
            <div class="icon">🎁</div>
            <div class="label">Dons Reçus</div>
            <div class="value">+${totalIncome.toFixed(2)}€</div>
          </div>
          
          <div class="summary-card expense">
            <div class="icon">🛒</div>
            <div class="label">Dépenses</div>
            <div class="value">-${Math.abs(totalExpense).toFixed(2)}€</div>
          </div>
          
          <div class="summary-card balance">
            <div class="icon">⚖️</div>
            <div class="label">Solde</div>
            <div class="value">${balance.toFixed(2)}€</div>
          </div>
        </div>
        
         <div class="transactions-section">
          <h2>📈 Liste des transactions</h2>
          <table class="transactions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Auteur/Bénéficiaire</th>
                <th style="text-align: right;">Montant</th>
              </tr>
            </thead>
            <tbody>
              ${transactionsRows}
            </tbody>
          </table>
        </div>

        <div class="chart-section">
          <h2>📈 Évolution des Transactions</h2>
          <div class="subtitle">Courbe d'évolution de vos dépenses et dons sur la période</div>
          ${generateLineChartSVG()}
          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot expenses"></div>
              <span class="legend-text">Dépenses</span>
            </div>
            <div class="legend-item">
              <div class="legend-dot donations"></div>
              <span class="legend-text">Dons</span>
            </div>
          </div>
        </div>
        
        <div class="chart-section">
          <h2>🍩 Répartition : Dépenses vs Dons</h2>
          <div class="subtitle">Distribution proportionnelle de vos finances</div>
          ${generateDonutChartSVG()}
          <div class="donut-legend">
            <div class="donut-legend-item expense">
              <div class="percentage">${((Math.abs(totalExpense) / (Math.abs(totalExpense) + totalIncome)) * 100).toFixed(1)}%</div>
              <div class="label">Dépenses</div>
              <div class="amount">${Math.abs(totalExpense).toFixed(2)}€</div>
            </div>
            <div class="donut-legend-item income">
              <div class="percentage">${((totalIncome / (Math.abs(totalExpense) + totalIncome)) * 100).toFixed(1)}%</div>
              <div class="label">Dons</div>
              <div class="amount">${totalIncome.toFixed(2)}€</div>
            </div>
          </div>
        </div>
        
       
        
        <div class="footer">
          <p><strong>📊 Rapport généré automatiquement par GesDep</strong></p>
          <p>Application professionnelle de gestion financière</p>
          <p>© ${new Date().getFullYear()} - Tous droits réservés - Document confidentiel</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Exporter les statistiques',
        UTI: 'com.adobe.pdf'
      });
    }
    
    return uri;
  } catch (error) {
    console.error('Erreur génération PDF statistiques:', error);
    throw error;
  }
};