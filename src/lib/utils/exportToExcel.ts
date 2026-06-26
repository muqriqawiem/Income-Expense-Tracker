import * as XLSX from 'xlsx';

export interface ExportTransaction {
  Date: string;
  Type: string;
  Category: string;
  Description: string;
  Amount: number;
}

export function exportTransactionsToExcel(
  transactions: ExportTransaction[],
  fileName: string = 'transactions'
) {
  const worksheet = XLSX.utils.json_to_sheet(transactions);

  // Column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Date
    { wch: 10 }, // Type
    { wch: 20 }, // Category
    { wch: 30 }, // Description
    { wch: 14 }, // Amount
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');

  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}
