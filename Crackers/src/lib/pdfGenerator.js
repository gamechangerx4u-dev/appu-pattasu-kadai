import jsPDF from 'jspdf';

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const drawSectionTitle = (doc, title, x, y) => {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(176, 0, 32);
  doc.text(title, x, y);
  doc.setDrawColor(176, 0, 32);
  doc.setLineWidth(1);
  doc.line(x, y + 4, x + 140, y + 4);
  doc.setTextColor(51, 51, 51);
};

const drawTableHeader = (doc, y, columns) => {
  doc.setFillColor(248, 249, 250);
  doc.rect(columns.margin, y - 12, columns.width, 22, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(columns.margin, y - 12, columns.width, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Item', columns.itemX, y);
  doc.text('Qty', columns.qtyX, y, { align: 'center' });
  doc.text('Rate', columns.rateX, y, { align: 'right' });
  doc.text('Amount', columns.amountX, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
};

export async function generateInvoicePdf({
  site_txn,
  customer_name,
  phone,
  email,
  address,
  items,
  subtotal,
  gst,
  discount,
  total,
  payment_method,
  receiptDataUrl,
  logoDataUrl,
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;

  doc.setFillColor(176, 0, 32);
  doc.rect(0, 0, pageWidth, 78, 'F');

  if (logoDataUrl) {
    try {
      const match = /^data:(image\/[^;]+);base64,/.exec(logoDataUrl);
      const logoType = (match && match[1]) || 'image/png';
      const fmt = logoType.split('/')[1].toUpperCase() === 'JPG' ? 'JPEG' : logoType.split('/')[1].toUpperCase();
      doc.addImage(logoDataUrl, fmt, pageWidth - margin - 58, 16, 58, 58);
    } catch {
      // ignore logo failures
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('APPU CRACKERS', margin, 36);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Premium Sivakasi Crackers | appucrackers.in', margin, 54);
  doc.text('appucrackers@gmail.com', margin, 68);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('INVOICE', pageWidth - margin, 36, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Txn: ${site_txn || 'TBD'}`, pageWidth - margin, 54, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleString('en-IN')}`, pageWidth - margin, 68, { align: 'right' });

  let y = 102;
  doc.setTextColor(51, 51, 51);

  drawSectionTitle(doc, 'Bill To', margin, y);
  y += 18;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(customer_name || 'Guest', margin, y);
  doc.setFont('helvetica', 'normal');
  y += 14;
  doc.text(`Phone: ${phone || '-'}`, margin, y);
  y += 14;
  doc.text(`Email: ${email || '-'}`, margin, y);
  y += 14;
  const addressLines = doc.splitTextToSize(`Address: ${address || '-'}`, contentWidth * 0.62);
  doc.text(addressLines, margin, y);
  y += addressLines.length * 12 + 10;

  drawSectionTitle(doc, 'Order Details', margin, y);
  y += 18;
  doc.text(`Payment Method: ${payment_method || 'GPay'}`, margin, y);
  y += 24;

  const columns = {
    margin,
    width: contentWidth,
    itemX: margin + 10,
    qtyX: margin + contentWidth * 0.62,
    rateX: margin + contentWidth * 0.76,
    amountX: margin + contentWidth - 10,
  };

  drawTableHeader(doc, y, columns);
  y += 18;

  const itemsToRender = Array.isArray(items) ? items : [];
  itemsToRender.forEach((item, index) => {
    const nameLines = doc.splitTextToSize(item.name || `Item ${index + 1}`, contentWidth * 0.52);
    const rowHeight = Math.max(20, nameLines.length * 12 + 8);

    if (y + rowHeight > pageHeight - 180) {
      doc.addPage();
      y = margin;
      drawTableHeader(doc, y, columns);
      y += 18;
    }

    doc.setDrawColor(235, 235, 235);
    doc.rect(columns.margin, y - 10, columns.width, rowHeight);

    doc.setFontSize(9);
    nameLines.forEach((line, lineIndex) => {
      doc.text(line, columns.itemX, y + lineIndex * 12);
    });

    const qty = String(item.quantity || 1);
    const unitPrice = Number(item.ourPrice || item.price || 0);
    const lineTotal = unitPrice * Number(item.quantity || 1);

    doc.text(qty, columns.qtyX, y, { align: 'center' });
    doc.text(formatCurrency(unitPrice), columns.rateX, y, { align: 'right' });
    doc.text(formatCurrency(lineTotal), columns.amountX, y, { align: 'right' });

    y += rowHeight;
  });

  y += 16;
  const totalsX = margin + contentWidth * 0.55;
  const totalsValueX = margin + contentWidth - 10;

  doc.setFillColor(248, 249, 250);
  doc.rect(totalsX - 12, y - 8, contentWidth * 0.45 + 12, 92, 'F');
  doc.setDrawColor(220, 220, 220);
  doc.rect(totalsX - 12, y - 8, contentWidth * 0.45 + 12, 92);

  doc.setFontSize(10);
  doc.text('Subtotal', totalsX, y);
  doc.text(formatCurrency(subtotal), totalsValueX, y, { align: 'right' });
  y += 16;

  if (discount) {
    doc.setTextColor(176, 0, 32);
    doc.text('Discount', totalsX, y);
    doc.text(`- ${formatCurrency(discount)}`, totalsValueX, y, { align: 'right' });
    doc.setTextColor(51, 51, 51);
    y += 16;
  }

  doc.text('GST (18%)', totalsX, y);
  doc.text(formatCurrency(gst), totalsValueX, y, { align: 'right' });
  y += 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(176, 0, 32);
  doc.text('Grand Total', totalsX, y);
  doc.text(formatCurrency(total || (subtotal || 0) + (gst || 0) - (discount || 0)), totalsValueX, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 51, 51);
  y += 30;

  if (receiptDataUrl) {
    drawSectionTitle(doc, 'Payment Proof', margin, y);
    y += 18;

    try {
      const match = /^data:(image\/[^;]+);base64,/.exec(receiptDataUrl);
      const imgType = (match && match[1]) || 'image/png';
      const fmt = imgType.split('/')[1].toUpperCase() === 'JPG' ? 'JPEG' : imgType.split('/')[1].toUpperCase();
      const maxImgWidth = contentWidth * 0.55;
      const imgProps = doc.getImageProperties(receiptDataUrl);
      const ratio = imgProps.width / imgProps.height;
      const imgHeight = Math.min(maxImgWidth / ratio, pageHeight - y - margin);

      if (y + imgHeight > pageHeight - margin) {
        doc.addPage();
        y = margin;
        drawSectionTitle(doc, 'Payment Proof', margin, y);
        y += 18;
      }

      doc.setDrawColor(220, 220, 220);
      doc.rect(margin - 2, y - 2, maxImgWidth + 4, imgHeight + 4);
      doc.addImage(receiptDataUrl, fmt, margin, y, maxImgWidth, imgHeight);
      y += imgHeight + 16;
    } catch (err) {
      console.warn('Failed to embed receipt image into PDF', err);
    }
  }

  const footerY = pageHeight - 28;
  doc.setDrawColor(176, 0, 32);
  doc.line(margin, footerY - 10, pageWidth - margin, footerY - 10);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Thank you for shopping with Appu Crackers. For support, contact appucrackers@gmail.com', pageWidth / 2, footerY, { align: 'center' });

  return doc.output('blob');
}
