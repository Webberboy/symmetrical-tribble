import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface TransactionReceiptData {
  transactionId: string;
  date: string;
  type: string;
  amount: number;
  merchant?: string;
  description?: string;
  category?: string;
  status: string;
  accountNumber?: string;
  userName: string;
  userEmail: string;
}

interface WireTransferReceiptData {
  transferId: string;
  date: string;
  amount: number;
  senderName: string;
  senderAccount: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  recipientRoutingNumber: string;
  purpose?: string;
  status: string;
  userEmail: string;
}

/**
 * Generate a PDF receipt for a transaction
 */
export const generateTransactionReceipt = (data: TransactionReceiptData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header - Simple professional design
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(15, 15, pageWidth - 15, 15);
  
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TRANSACTION RECEIPT', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Official Banking Document', pageWidth / 2, 32, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(15, 37, pageWidth - 15, 37);
  
  // Document Info Section
  let yPos = 50;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Receipt ID:', 15, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(data.transactionId, 45, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Date:', pageWidth - 80, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  doc.text(dateStr, pageWidth - 55, yPos, { align: 'right' });
  
  yPos += 15;
  
  // Amount Section - Professional box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.rect(15, yPos, pageWidth - 30, 35);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('TRANSACTION AMOUNT', pageWidth / 2, yPos + 10, { align: 'center' });
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const amountText = `${data.type === 'credit' ? '+' : '-'}$${data.amount.toFixed(2)}`;
  doc.text(amountText, pageWidth / 2, yPos + 25, { align: 'center' });
  
  yPos += 45;
  
  // Transaction Details Table
  const tableData: any[] = [
    ['Transaction ID', data.transactionId],
    ['Date & Time', data.date],
    ['Type', data.type === 'credit' ? 'Credit (Money In)' : 'Debit (Money Out)'],
    ['Status', data.status.charAt(0).toUpperCase() + data.status.slice(1)],
  ];
  
  if (data.merchant) {
    tableData.push(['Merchant', data.merchant]);
  }
  
  if (data.description) {
    tableData.push(['Description', data.description]);
  }
  
  if (data.category) {
    tableData.push(['Category', data.category]);
  }
  
  if (data.accountNumber) {
    tableData.push(['Account Number', data.accountNumber]);
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['Transaction Details', '']],
    body: tableData,
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      lineWidth: 0.3,
      lineColor: [200, 200, 200]
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [80, 80, 80], cellWidth: 60 },
      1: { textColor: [0, 0, 0] }
    },
    margin: { left: 15, right: 15 },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    }
  });
  
  // Account Holder Information
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Account Holder Information', '']],
    body: [
      ['Name', data.userName],
      ['Email', data.userEmail],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      lineWidth: 0.3,
      lineColor: [200, 200, 200]
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [80, 80, 80], cellWidth: 60 },
      1: { textColor: [0, 0, 0] }
    },
    margin: { left: 15, right: 15 },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    }
  });
  
  // Footer
  const footerY = pageHeight - 25;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
  
  doc.text('This is an official computer-generated receipt and does not require a signature.', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text('For inquiries, please contact customer service with the Receipt ID listed above.', pageWidth / 2, footerY + 10, { align: 'center' });
  
  // Save the PDF
  const fileName = `transaction-receipt-${data.transactionId}.pdf`;
  doc.save(fileName);
};

/**
 * Generate a PDF receipt for a wire transfer
 */
export const generateWireTransferReceipt = (data: WireTransferReceiptData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header - Simple professional design
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.line(15, 15, pageWidth - 15, 15);
  
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('WIRE TRANSFER RECEIPT', pageWidth / 2, 25, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Official Banking Document - Confidential', pageWidth / 2, 32, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(15, 37, pageWidth - 15, 37);
  
  // Document Info Section
  let yPos = 50;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Transfer ID:', 15, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(data.transferId, 45, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Status:', pageWidth - 80, yPos);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(data.status.toUpperCase(), pageWidth - 55, yPos, { align: 'right' });
  
  yPos += 15;
  
  // Amount Section - Professional box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.rect(15, yPos, pageWidth - 30, 35);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('TRANSFER AMOUNT', pageWidth / 2, yPos + 10, { align: 'center' });
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`$${data.amount.toFixed(2)} USD`, pageWidth / 2, yPos + 25, { align: 'center' });
  
  yPos += 45;
  
  // Transfer Details
  autoTable(doc, {
    startY: yPos,
    head: [['Transfer Information', '']],
    body: [
      ['Transfer ID', data.transferId],
      ['Date & Time', data.date],
      ['Status', data.status.charAt(0).toUpperCase() + data.status.slice(1)],
      ['Amount', `$${data.amount.toFixed(2)}`],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      lineWidth: 0.3,
      lineColor: [200, 200, 200]
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [80, 80, 80], cellWidth: 60 },
      1: { textColor: [0, 0, 0] }
    },
    margin: { left: 15, right: 15 },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    }
  });
  
  // Sender Information
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  autoTable(doc, {
    startY: yPos,
    head: [['Sender Information', '']],
    body: [
      ['Name', data.senderName],
      ['Account Number', data.senderAccount],
      ['Email', data.userEmail],
    ],
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      lineWidth: 0.3,
      lineColor: [200, 200, 200]
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [80, 80, 80], cellWidth: 60 },
      1: { textColor: [0, 0, 0] }
    },
    margin: { left: 15, right: 15 },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    }
  });
  
  // Recipient Information
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  const recipientData: any[] = [
    ['Name', data.recipientName],
    ['Account Number', data.recipientAccount],
    ['Bank Name', data.recipientBank],
    ['Routing Number', data.recipientRoutingNumber],
  ];
  
  if (data.purpose) {
    recipientData.push(['Purpose', data.purpose]);
  }
  
  autoTable(doc, {
    startY: yPos,
    head: [['Recipient Information', '']],
    body: recipientData,
    theme: 'plain',
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 11,
      fontStyle: 'bold',
      halign: 'left',
      lineWidth: 0.5,
      lineColor: [0, 0, 0]
    },
    bodyStyles: {
      lineWidth: 0.3,
      lineColor: [200, 200, 200]
    },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: [80, 80, 80], cellWidth: 60 },
      1: { textColor: [0, 0, 0] }
    },
    margin: { left: 15, right: 15 },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    }
  });
  
  // Footer
  const footerY = pageHeight - 25;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(15, footerY - 5, pageWidth - 15, footerY - 5);
  
  doc.text('This is an official computer-generated receipt and does not require a signature.', pageWidth / 2, footerY, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, pageWidth / 2, footerY + 5, { align: 'center' });
  doc.text('Please retain this document for your financial records.', pageWidth / 2, footerY + 10, { align: 'center' });
  
  // Save the PDF
  const fileName = `wire-transfer-receipt-${data.transferId}.pdf`;
  doc.save(fileName);
};
