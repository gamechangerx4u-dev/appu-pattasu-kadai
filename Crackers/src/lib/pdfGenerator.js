import jsPDF from 'jspdf';
import { loadBrandLogo } from './loadBrandLogo.js';

const BRAND = {
  dark: [18, 18, 18],
  red: [176, 0, 32],
  gold: [212, 175, 55],
  text: [34, 34, 34],
  muted: [110, 110, 110],
  border: [224, 224, 224],
  panel: [248, 249, 250],
};

const formatCurrency = (value) => {
  const amount = Number(value || 0);
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const setColor = (doc, [r, g, b]) => doc.setTextColor(r, g, b);
const setFill = (doc, [r, g, b]) => doc.setFillColor(r, g, b);
const setDraw = (doc, [r, g, b]) => doc.setDrawColor(r, g, b);

const addImageFromDataUrl = (doc, dataUrl, x, y, width, height) => {
  const match = /^data:(image\/[^;]+);base64,/.exec(dataUrl);
  const imageType = (match && match[1]) || 'image/jpeg';
  const format = imageType.split('/')[1].toUpperCase();
  const fmt = format === 'JPG' ? 'JPEG' : format;
  doc.addImage(dataUrl, fmt, x, y, width, height);
};

const drawFooter = (doc, pageWidth, pageHeight, margin) => {
  const footerY = pageHeight - 24;
  setDraw(doc, BRAND.red);
  doc.setLineWidth(0.8);
  doc.line(margin, footerY - 8, pageWidth - margin, footerY - 8);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setColor(doc, BRAND.muted);
  doc.text(
    'Thank you for shopping with Appu Crackers | appucrackers.in | appucrackers@gmail.com',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
};

const drawHeader = (doc, pageWidth, margin, { site_txn, logoDataUrl }) => {
  const headerHeight = 92;
  setFill(doc, BRAND.dark);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  setFill(doc, BRAND.red);
  doc.rect(0, headerHeight, pageWidth, 3, 'F');

  const logoWidth = 64;
  const logoX = margin;
  const logoY = 14;

  if (logoDataUrl) {
    try {
      const props = doc.getImageProperties(logoDataUrl);
      const ratio = props.width / props.height;
      const logoHeight = logoWidth / ratio;
      addImageFromDataUrl(doc, logoDataUrl, logoX, logoY, logoWidth, logoHeight);
    } catch {
      // ignore broken logo
    }
  }

  const textX = logoX + logoWidth + 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  setColor(doc, [255, 255, 255]);
  doc.text('Appu Crackers', textX, 36);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setColor(doc, [210, 210, 210]);
  doc.text('Premium Sivakasi Crackers', textX, 52);
  doc.text('appucrackers.in  |  appucrackers@gmail.com', textX, 66);

  const metaX = pageWidth - margin;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  setColor(doc, BRAND.gold);
  doc.text('TAX INVOICE', metaX, 34, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setColor(doc, [235, 235, 235]);
  doc.text(`Transaction: ${site_txn || 'TBD'}`, metaX, 52, { align: 'right' });
  doc.text(`Date: ${new Date().toLocaleString('en-IN')}`, metaX, 66, { align: 'right' });

  return headerHeight + 18;
};

const drawInfoPanel = (doc, x, y, width, title, lines) => {
  const lineHeight = 13;
  const padding = 12;
  const contentHeight = lines.length * lineHeight;
  const panelHeight = contentHeight + padding * 2 + 16;

  setFill(doc, BRAND.panel);
  setDraw(doc, BRAND.border);
  doc.setLineWidth(0.6);
  doc.roundedRect(x, y, width, panelHeight, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  setColor(doc, BRAND.red);
  doc.text(title, x + padding, y + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setColor(doc, BRAND.text);
  lines.forEach((line, index) => {
    const wrapped = doc.splitTextToSize(line, width - padding * 2);
    wrapped.forEach((part, partIndex) => {
      doc.text(part, x + padding, y + 30 + (index * lineHeight) + (partIndex * 11));
    });
  });

  return panelHeight;
};

const drawItemsTable = (doc, startY, margin, contentWidth, pageHeight, items) => {
  const columns = {
    margin,
    width: contentWidth,
    itemX: margin + 10,
    qtyX: margin + contentWidth * 0.58,
    rateX: margin + contentWidth * 0.72,
    amountX: margin + contentWidth - 10,
  };

  let y = startY;

  const drawTableHead = () => {
    setFill(doc, BRAND.dark);
    doc.rect(columns.margin, y, columns.width, 24, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    setColor(doc, [255, 255, 255]);
    doc.text('Item', columns.itemX, y + 16);
    doc.text('Qty', columns.qtyX, y + 16, { align: 'center' });
    doc.text('Rate', columns.rateX, y + 16, { align: 'right' });
    doc.text('Amount', columns.amountX, y + 16, { align: 'right' });
    y += 30;
  };

  drawTableHead();

  const itemsToRender = Array.isArray(items) ? items : [];
  itemsToRender.forEach((item, index) => {
    const nameLines = doc.splitTextToSize(item.name || `Item ${index + 1}`, contentWidth * 0.5);
    const rowHeight = Math.max(22, nameLines.length * 11 + 10);

    if (y + rowHeight > pageHeight - 120) {
      doc.addPage();
      drawFooter(doc, doc.internal.pageSize.getWidth(), pageHeight, margin);
      y = margin;
      drawTableHead();
    }

    if (index % 2 === 0) {
      setFill(doc, [255, 255, 255]);
    } else {
      setFill(doc, BRAND.panel);
    }
    setDraw(doc, BRAND.border);
    doc.rect(columns.margin, y - 12, columns.width, rowHeight, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    setColor(doc, BRAND.text);
    nameLines.forEach((line, lineIndex) => {
      doc.text(line, columns.itemX, y + lineIndex * 11);
    });

    const qty = String(item.quantity || 1);
    const unitPrice = Number(item.ourPrice || item.price || 0);
    const lineTotal = unitPrice * Number(item.quantity || 1);

    doc.text(qty, columns.qtyX, y, { align: 'center' });
    doc.text(formatCurrency(unitPrice), columns.rateX, y, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatCurrency(lineTotal), columns.amountX, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    y += rowHeight;
  });

  return y + 10;
};

const drawTotals = (doc, y, margin, contentWidth, { subtotal, discount, total }) => {
  const boxWidth = contentWidth * 0.42;
  const boxX = margin + contentWidth - boxWidth;
  const rows = [
    ['Subtotal', formatCurrency(subtotal)],
    ...(discount ? [['Discount', `- ${formatCurrency(discount)}`]] : []),
    ['Grand Total (Including GST)', formatCurrency(total)],
  ];
  const boxHeight = 18 + rows.length * 18 + 10;

  setFill(doc, BRAND.panel);
  setDraw(doc, BRAND.border);
  doc.roundedRect(boxX, y, boxWidth, boxHeight, 4, 4, 'FD');

  let rowY = y + 18;
  rows.forEach(([label, value], index) => {
    const isTotal = index === rows.length - 1;
    doc.setFont('helvetica', isTotal ? 'bold' : 'normal');
    doc.setFontSize(isTotal ? 11 : 9.5);
    setColor(doc, isTotal ? BRAND.red : BRAND.text);
    doc.text(label, boxX + 12, rowY);
    doc.text(value, boxX + boxWidth - 12, rowY, { align: 'right' });
    rowY += 18;
  });

  return y + boxHeight + 18;
};

const drawPaymentProof = (doc, pageWidth, pageHeight, margin, contentWidth, y, receiptDataUrl, paymentMethod) => {
  if (!receiptDataUrl) return y;

  try {
    const maxImgWidth = contentWidth * 0.48;
    const imgProps = doc.getImageProperties(receiptDataUrl);
    const ratio = imgProps.width / imgProps.height;
    const imgHeight = maxImgWidth / ratio;

    if (y + imgHeight + 60 > pageHeight - 40) {
      doc.addPage();
      y = margin;
      drawFooter(doc, pageWidth, pageHeight, margin);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor(doc, BRAND.red);
    doc.text('Payment Proof', margin, y);
    setDraw(doc, BRAND.red);
    doc.setLineWidth(1);
    doc.line(margin, y + 4, margin + 120, y + 4);
    y += 18;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setColor(doc, BRAND.muted);
    const proofLabel = paymentMethod === 'Netbanking'
      ? 'Netbanking payment screenshot attached below for verification.'
      : 'GPay payment screenshot attached below for verification.';
    doc.text(proofLabel, margin, y);
    y += 16;

    const imageX = margin + (contentWidth - maxImgWidth) / 2;
    setDraw(doc, BRAND.border);
    doc.setLineWidth(0.8);
    doc.roundedRect(imageX - 4, y - 4, maxImgWidth + 8, imgHeight + 8, 4, 4);

    const match = /^data:(image\/[^;]+);base64,/.exec(receiptDataUrl);
    const imgType = (match && match[1]) || 'image/png';
    const fmt = imgType.split('/')[1].toUpperCase() === 'JPG' ? 'JPEG' : imgType.split('/')[1].toUpperCase();
    doc.addImage(receiptDataUrl, fmt, imageX, y, maxImgWidth, imgHeight);

    return y + imgHeight + 20;
  } catch (err) {
    console.warn('Failed to embed receipt image into PDF', err);
    return y;
  }
};

export async function generateInvoicePdf({
  site_txn,
  customer_name,
  phone,
  email,
  address,
  items,
  subtotal,
  discount,
  total,
  payment_method,
  payment_details,
  receiptDataUrl,
  logoDataUrl,
}) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const contentWidth = pageWidth - margin * 2;

  const resolvedLogo = logoDataUrl || await loadBrandLogo();

  let y = drawHeader(doc, pageWidth, margin, { site_txn, logoDataUrl: resolvedLogo });

  const panelWidth = (contentWidth - 16) / 2;
  const billToLines = [
    `Name: ${customer_name || 'Guest'}`,
    `Phone: ${phone || '-'}`,
    `Email: ${email || '-'}`,
    `Address: ${address || '-'}`,
  ];
  const orderLines = [
    `Payment Method: ${payment_method || 'GPay'}`,
    ...(payment_details?.utr_reference ? [`UTR / Reference: ${payment_details.utr_reference}`] : []),
    ...(payment_details?.customer_bank ? [`Customer Bank: ${payment_details.customer_bank}`] : []),
    ...(payment_details?.payer_name ? [`Payer Name: ${payment_details.payer_name}`] : []),
    `Items: ${Array.isArray(items) ? items.length : 0}`,
    'Delivery: Tamil Nadu',
    'Status: Payment received — processing',
  ];

  const leftPanelHeight = drawInfoPanel(doc, margin, y, panelWidth, 'Bill To', billToLines);
  const rightPanelHeight = drawInfoPanel(doc, margin + panelWidth + 16, y, panelWidth, 'Order Info', orderLines);
  y += Math.max(leftPanelHeight, rightPanelHeight) + 20;

  y = drawItemsTable(doc, y, margin, contentWidth, pageHeight, items);
  y = drawTotals(doc, y, margin, contentWidth, { subtotal, discount, total });
  drawPaymentProof(doc, pageWidth, pageHeight, margin, contentWidth, y, receiptDataUrl, payment_method);
  drawFooter(doc, pageWidth, pageHeight, margin);

  return doc.output('blob');
}
