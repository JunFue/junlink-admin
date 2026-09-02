import { SupabaseClient } from '@supabase/supabase-js'
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import { getFinancialMetrics } from './dashboardService'
import { getCashoutsBreakdown } from '@/app/transaction/services/cashoutsService'
import { format } from 'date-fns'

export async function generatePDFReport(
  supabase: SupabaseClient,
  storeId: string | null | undefined,
  storeName: string,
  startDate: string,
  endDate: string
) {
  try {
    const normalizedStoreId = (!storeId || storeId === '' || storeId === 'all') ? null : storeId;

    // 1. Fetch Dashboard Metrics
    const metrics = await getFinancialMetrics(supabase, normalizedStoreId, startDate, endDate)
    if (!metrics) {
      throw new Error("Could not fetch financial metrics for the selected period.");
    }

    // 2. Fetch Cashouts Breakdown
    const cashouts = await getCashoutsBreakdown(supabase, startDate, endDate, normalizedStoreId || undefined)

    // 3. Fetch Category Sales from the categorical_cash_flow view
    let categoryQuery = supabase
      .from('categorical_cash_flow')
      .select('category, cash_in');

    if (normalizedStoreId) {
      categoryQuery = categoryQuery.eq('store_id', normalizedStoreId);
    }
    if (startDate) {
      categoryQuery = categoryQuery.gte('date', startDate);
    }
    if (endDate) {
      categoryQuery = categoryQuery.lte('date', endDate);
    }

    const { data: rawCategoryData, error: categoryError } = await categoryQuery;

    if (categoryError) {
      console.error("Error fetching category sales:", categoryError);
      throw categoryError;
    }

    // Aggregate the cash_in by category manually with case-insensitive grouping
    const categoryTotals: Record<string, number> = {};
    if (rawCategoryData) {
      rawCategoryData.forEach(row => {
        const rawCat = (row.category || '').trim() || 'Uncategorized';
        let targetKey = rawCat;
        for (const existingKey of Object.keys(categoryTotals)) {
          if (existingKey.toLowerCase() === rawCat.toLowerCase()) {
            targetKey = existingKey;
            break;
          }
        }
        categoryTotals[targetKey] = (categoryTotals[targetKey] || 0) + Number(row.cash_in || 0);
      });
    }

    // Convert aggregated object back to array for rendering and sort descending
    const categoryData = Object.keys(categoryTotals)
      .map(key => ({
        category_name: key,
        gross_sales: categoryTotals[key]
      }))
      .filter(cat => cat.gross_sales > 0) // Optional: only show categories with sales
      .sort((a, b) => b.gross_sales - a.gross_sales);

    // Format Data
    const formattedStartDate = format(new Date(startDate), 'MMMM d, yyyy');
    const formattedEndDate = format(new Date(endDate), 'MMMM d, yyyy');
    const reportingPeriod = startDate === endDate ? formattedStartDate : `${formattedStartDate} - ${formattedEndDate}`;
    
    const grossSales = metrics.gross_sales;
    const netSales = metrics.net_sales;
    const discounts = grossSales - netSales; // Gross Sales - Net Sales

    let cogsTotal = 0;
    let opexTotal = 0;
    let remittanceTotal = 0;

    const cogsItemsMap = new Map<string, number>();
    const opexItemsMap = new Map<string, number>();
    const remittanceItemsMap = new Map<string, number>();

    // Helper to add/merge amounts case-insensitively while preserving clean typography
    const aggregateCategory = (map: Map<string, number>, rawName: string | undefined | null, amount: number, defaultName: string) => {
      const trimmed = (rawName || '').trim() || defaultName;
      let targetKey = trimmed;
      
      // Look for case-insensitive match
      for (const key of map.keys()) {
        if (key.toLowerCase() === trimmed.toLowerCase()) {
          targetKey = key;
          break;
        }
      }

      map.set(targetKey, (map.get(targetKey) || 0) + amount);
    };

    cashouts.forEach(c => {
      const amount = Number(c.total_amount) || 0;
      if (c.cashout_type === 'COGS') {
        cogsTotal += amount;
        aggregateCategory(cogsItemsMap, c.subcategory, amount, 'Uncategorized COGS');
      } else if (c.cashout_type === 'OPEX') {
        opexTotal += amount;
        aggregateCategory(opexItemsMap, c.subcategory, amount, 'Uncategorized OPEX');
      } else if (c.cashout_type === 'REMITTANCE') {
        remittanceTotal += amount;
        aggregateCategory(remittanceItemsMap, c.subcategory, amount, 'Uncategorized Remittance');
      }
    });

    const cogsItems: [string, number][] = Array.from(cogsItemsMap.entries()).sort((a, b) => b[1] - a[1]);
    const opexItems: [string, number][] = Array.from(opexItemsMap.entries()).sort((a, b) => b[1] - a[1]);
    const remittanceItems: [string, number][] = Array.from(remittanceItemsMap.entries()).sort((a, b) => b[1] - a[1]);

    const grossProfit = netSales - cogsTotal;
    const netProfit = grossProfit - opexTotal;
    const totalCash = metrics.available_cash;

    // Initialize PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Theme colors
    const primaryColor: [number, number, number] = [41, 128, 185]; // A nice blue
    const grayColor: [number, number, number] = [100, 100, 100];
    const lightGray: [number, number, number] = [245, 245, 245];

    let yPos = 20;

    const formatCurrency = (amount: number) => {
      // jsPDF default fonts (helvetica) don't support the Peso sign (₱) out of the box.
      // We will use 'PHP ' instead to avoid garbled text like '&G&r&o...'
      return amount < 0 
        ? `-PHP ${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
        : `PHP ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    // --- Header Section ---
    doc.setFontSize(22);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(storeName, 14, yPos);
    
    yPos += 8;
    doc.setFontSize(11);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.setFont("helvetica", "normal");
    doc.text(`Financial Report | ${reportingPeriod}`, 14, yPos);
    yPos += 4;
    
    // Add a separator line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(14, yPos, 196, yPos);
    yPos += 12;

    // --- Summary Section ---
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", 14, yPos);
    yPos += 6;

    // Summary Table (Cashins, Cashouts, Profit)
    const emptyRow = [{ content: '', colSpan: 2, styles: { minCellHeight: 4 } }];
    const headerStyle = { fontStyle: 'bold', fontSize: 11, fillColor: lightGray, textColor: primaryColor, cellPadding: 4 };

    const summaryData: any[] = [
      [{ content: 'CASH INS', colSpan: 2, styles: headerStyle }],
      ['Gross Sales', formatCurrency(grossSales)],
      ['Discounts, Returns, Taxes', `-${formatCurrency(discounts).replace('PHP -', 'PHP ').replace('-', '')}`],
      [{ content: 'Net Sales', styles: { fontStyle: 'bold' } }, { content: formatCurrency(netSales), styles: { fontStyle: 'bold' } }],
      
      ...emptyRow,
      [{ content: 'CASH OUTS', colSpan: 2, styles: headerStyle }],
      ['Cost of Goods', `-${formatCurrency(cogsTotal).replace('PHP -', 'PHP ').replace('-', '')}`],
      ['OPEX', `-${formatCurrency(opexTotal).replace('PHP -', 'PHP ').replace('-', '')}`],
      ['Remittance', `-${formatCurrency(remittanceTotal).replace('PHP -', 'PHP ').replace('-', '')}`],
      
      ...emptyRow,
      [{ content: 'PROFITABILITY', colSpan: 2, styles: headerStyle }],
      [{ content: 'Gross Profit', styles: { fontStyle: 'bold' } }, { content: formatCurrency(grossProfit), styles: { fontStyle: 'bold' } }],
      [{ content: 'Net Profit', styles: { fontStyle: 'bold' } }, { content: formatCurrency(netProfit), styles: { fontStyle: 'bold' } }],
      
      ...emptyRow,
      [{ content: 'LIQUIDITY', colSpan: 2, styles: headerStyle }],
      [{ content: 'Total Available Cash', styles: { fontStyle: 'bold', textColor: primaryColor } }, { content: formatCurrency(totalCash), styles: { fontStyle: 'bold', textColor: primaryColor } }],
    ];

    autoTable(doc, {
      startY: yPos,
      body: summaryData,
      theme: 'plain',
      styles: { cellPadding: 2, fontSize: 10 },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 70, halign: 'right' }
      },
      margin: { left: 14 }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // --- Category Sales Section (Only if a specific store is selected) ---
    if (normalizedStoreId) {
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Gross Sales per Product Category", 14, yPos);
      yPos += 4;

      const categoryTableData = categoryData && categoryData.length > 0 
        ? categoryData.map((cat: any) => [cat.category_name || 'Uncategorized', formatCurrency(Number(cat.gross_sales))])
        : [["No category sales data found.", ""]];

      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Gross Sales']],
        body: categoryTableData,
        theme: 'grid',
        headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 10 },
        columnStyles: {
          1: { halign: 'right' }
        },
        margin: { left: 14, right: 14 }
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Check if we need a new page for the breakdown
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    // --- Breakdown of Cash Outs Section ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Breakdown of Cash Outs", 14, yPos);
    yPos += 4;

    const tableBody: any[] = [];
    const subHeaderStyle = { fontStyle: 'bold', fontSize: 11, fillColor: lightGray, textColor: primaryColor, cellPadding: 3 };
    
    if (cogsItems.length > 0) {
      if (tableBody.length > 0) tableBody.push(...emptyRow);
      tableBody.push([{ content: 'COST OF GOODS', colSpan: 2, styles: subHeaderStyle }]);
      cogsItems.forEach(([sub, amount]) => {
        tableBody.push([{ content: sub, styles: { cellPadding: { left: 6 } } }, `-${formatCurrency(amount).replace('PHP -', 'PHP ').replace('-', '')}`]);
      });
    }

    if (opexItems.length > 0) {
      if (tableBody.length > 0) tableBody.push(...emptyRow);
      tableBody.push([{ content: 'OPERATING EXPENSES (OPEX)', colSpan: 2, styles: subHeaderStyle }]);
      opexItems.forEach(([sub, amount]) => {
        tableBody.push([{ content: sub, styles: { cellPadding: { left: 6 } } }, `-${formatCurrency(amount).replace('PHP -', 'PHP ').replace('-', '')}`]);
      });
    }

    if (remittanceItems.length > 0) {
      if (tableBody.length > 0) tableBody.push(...emptyRow);
      tableBody.push([{ content: 'REMITTANCES', colSpan: 2, styles: subHeaderStyle }]);
      remittanceItems.forEach(([sub, amount]) => {
        tableBody.push([{ content: sub, styles: { cellPadding: { left: 6 } } }, `-${formatCurrency(amount).replace('PHP -', 'PHP ').replace('-', '')}`]);
      });
    }

    if (tableBody.length === 0) {
      tableBody.push(["No cashouts recorded", ""]);
    }

    autoTable(doc, {
      startY: yPos,
      head: [['Category / Subcategory', 'Amount']],
      body: tableBody,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10 },
      columnStyles: {
        1: { halign: 'right' }
      },
      margin: { left: 14, right: 14 }
    });

    // Open PDF in a new tab for preview instead of downloading directly
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
    
    // Note: The user can download or print from the browser's native PDF viewer.
    
    return true;
  } catch (error) {
    console.error("Error generating PDF report:", error);
    throw error;
  }
}
