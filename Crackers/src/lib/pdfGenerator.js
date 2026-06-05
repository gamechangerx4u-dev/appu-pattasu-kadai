import jsPDF from 'jspdf';

export async function generateInvoicePdf({ site_txn, customer_name, phone, email, address, items, subtotal, gst, discount, total, payment_method, receiptDataUrl, logoDataUrl }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Crackers - Invoice', margin, y);
  y += 26;

  // Prominent customer name under header (if provided)
  if (customer_name) {
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Customer: ${customer_name}`, margin, y);
    doc.setFont('helvetica', 'normal');
    y += 18;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Transaction: ${site_txn || 'TBD'}`, margin, y);
  doc.text(`Date: ${new Date().toLocaleString()}`, pageWidth - margin, y, { align: 'right' });
  y += 18;

  // Customer details box
  doc.setFontSize(12);
  doc.text('Customer Details', margin, y);
  y += 14;
  doc.setFontSize(9);
  const leftCol = margin;
  const rightCol = pageWidth - margin;
  doc.text(`Name: ${customer_name || 'Guest'}`, leftCol, y);
  doc.text(`Phone: ${phone || ''}`, rightCol, y, { align: 'right' });
  y += 12;
  doc.text(`Email: ${email || ''}`, leftCol, y);
  y += 12;
  const addressLines = doc.splitTextToSize(address || '', pageWidth - margin * 2);
  doc.text(addressLines, leftCol, y);
  y += addressLines.length * 12 + 8;

  // Items table header
  doc.setFontSize(12);
  doc.text('Items', leftCol, y);
  y += 14;

  // Table columns: No | Description | Qty | Unit | Total
  doc.setFontSize(10);
  const descW = pageWidth - margin * 2 - 220; // leave space for numbers
  const qtyX = margin + descW + 10;
  const unitX = qtyX + 60;
  const totalX = unitX + 80;
  // ASCII-safe number formatter: adds commas as thousands separators and 2 decimals
  const formatNumber = (n) => {
    const v = Number(n || 0).toFixed(2);
    // insert commas every 3 digits before the decimal
    return v.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Optional logo at top-left
  if (logoDataUrl) {
    try {
      // detect mime type and use appropriate format
      const mLogo = /^data:(image\/[^;]+);base64,/.exec(logoDataUrl);
      const logoType = (mLogo && mLogo[1]) || 'image/png';
      const fmtLogo = logoType.split('/')[1].toUpperCase() === 'JPG' ? 'JPEG' : logoType.split('/')[1].toUpperCase();
      const logoWidth = 80;
      const imgProps = doc.getImageProperties(logoDataUrl);
      const ratio = imgProps.width / imgProps.height;
      const logoHeight = Math.round(logoWidth / ratio);
      doc.addImage(logoDataUrl, fmtLogo, pageWidth - margin - logoWidth, margin - 10, logoWidth, logoHeight);
    } catch (err) {
      // ignore logo failures
    }
  }

  // Table header line
  doc.setFont('helvetica', 'bold');
  doc.text('Description', leftCol, y);
  doc.text('Qty', qtyX, y);
  doc.text('Price', unitX, y);
  doc.text('Total', totalX, y);
  doc.setFont('helvetica', 'normal');
  y += 12;

  // Ensure items is an array and preserve original order; add index for display
  const itemsToRender = Array.isArray(items) ? items : [];
  itemsToRender.forEach((it, idx) => {
    const nameLines = doc.splitTextToSize(it.name || '', descW);
    const lineCount = Math.max(1, nameLines.length);
    // print name lines
    nameLines.forEach((ln, i) => {
      doc.text(ln, leftCol, y + i * 12);
    });
    // print qty, unit price and line total aligned to right positions (use monospaced font for numbers)
    const qty = String(it.quantity || 1);
    const unitPrice = Number(it.ourPrice || it.price || 0);
    const lineTotal = Number((it.ourPrice || it.price || 0) * (it.quantity || 1));
    const unitPriceStr = formatNumber(unitPrice);
    const lineTotalStr = formatNumber(lineTotal);
    // (no item index printed — we show items in order in the table)
    // draw vertical separators for clarity
    const separatorX = qtyX - 8;
    doc.setDrawColor(230);
    doc.setLineWidth(0.5);
    doc.line(separatorX, y - 8, separatorX, y + (lineCount * 12));
    // numbers in monospace to avoid kerning issues
    doc.setFont('courier', 'normal');
    doc.text(qty, qtyX, y, { align: 'right' });
    doc.text(`₹${unitPriceStr}`, unitX, y, { align: 'right' });
    doc.text(`₹${lineTotalStr}`, totalX, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += lineCount * 12 + 6;
    if (y > doc.internal.pageSize.getHeight() - margin - 120) {
      doc.addPage();
      y = margin;
    }
  });

  // Totals
  y += 6;
  const rightLabelX = totalX - 120;
  doc.setFontSize(11);
  doc.text('Subtotal:', rightLabelX, y);
  // ensure numeric column uses monospace to avoid kerning
  doc.setFont('courier', 'normal');
  doc.text(formatNumber(subtotal || 0), totalX, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 14;
  if (discount) {
    doc.text('Discount:', rightLabelX, y);
    doc.setFont('courier', 'normal');
    doc.text(`-${formatNumber(discount || 0)}`, totalX, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += 14;
  }
  doc.text('GST (18%):', rightLabelX, y);
  doc.setFont('courier', 'normal');
  doc.text(`${formatNumber(gst || 0)}`, totalX, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Total:', rightLabelX, y);
  doc.setFont('courier', 'bold');
  doc.text(`${formatNumber(total || (subtotal || 0) + (gst || 0) - (discount || 0))}`, totalX, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  y += 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Payment Method: ${payment_method || 'GPay'}`, leftCol, y);
  y += 14;

  // Embed receipt image if present
  if (receiptDataUrl) {
    try {
      // detect mime type from data URL
      const m = /^data:(image\/[^;]+);base64,/.exec(receiptDataUrl);
      const imgType = (m && m[1]) || 'image/png';
      const fmt = imgType.split('/')[1].toUpperCase();
      const maxImgWidth = pageWidth - margin * 2;
      const imgProps = doc.getImageProperties(receiptDataUrl);
      const ratio = imgProps.width / imgProps.height;
      const imgHeight = Math.min((maxImgWidth / ratio), doc.internal.pageSize.getHeight() - y - margin);
      if (imgHeight > 0) {
        doc.addImage(receiptDataUrl, fmt === 'JPG' ? 'JPEG' : fmt, leftCol, y, maxImgWidth, imgHeight);
      }
    } catch (err) {
      console.warn('Failed to embed receipt image into PDF', err);
    }
  }

  const blob = doc.output('blob');
  return blob;
}
