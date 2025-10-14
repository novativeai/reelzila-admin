import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TransactionData } from '@/components/admin/EditTransactionPopup';

export const generateTransactionPDF = (transaction: TransactionData, userName: string, userEmail: string) => {
  const doc = new jsPDF();

  // Add a title
  doc.setFontSize(22);
  doc.text("Transaction Invoice", 14, 22);

  // Add user and transaction details
  doc.setFontSize(11);
  doc.text(`User: ${userName} (${userEmail})`, 14, 32);
  doc.text(`Transaction ID: ${transaction.id}`, 14, 38);

  // Use autoTable to create a clean table
  autoTable(doc, {
    startY: 50,
    head: [['Detail', 'Value']],
    body: [
      ['Date', transaction.date],
      ['Amount', `${transaction.amount}$`],
      ['Type', transaction.type],
      ['Status', transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)],
    ],
    theme: 'grid',
    headStyles: { fillColor: [22, 22, 22] },
  });

  // Save the PDF
  doc.save(`invoice-${transaction.id}.pdf`);
};