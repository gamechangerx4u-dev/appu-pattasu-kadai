import nodemailer from 'nodemailer';

export async function sendOrderEmail(order) {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const recipientEmail = 'appucrackers@gmail.com';

  const itemsHtml = (order.items || []).map(item => {
    const qty = Number(item.quantity || 1);
    const price = Number(item.ourPrice || item.price || 0);
    return `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${qty}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${price.toFixed(2)}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; fontWeight: bold;">₹${(qty * price).toFixed(2)}</td>
      </tr>
    `;
  }).join('');

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #e63946, #b00020); color: #fff; padding: 25px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">New Order Placed</h1>
        <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Transaction ID: ${order.site_txn}</p>
      </div>
      <div style="padding: 25px; background: #ffffff; color: #333333;">
        <h3 style="border-bottom: 2px solid #e63946; padding-bottom: 8px; color: #b00020;">Customer Details</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; width: 120px;">Name:</td>
            <td style="padding: 6px 0;">${order.customer_name || 'Guest'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Phone:</td>
            <td style="padding: 6px 0;">${order.phone}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Email:</td>
            <td style="padding: 6px 0;">${order.email || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Address:</td>
            <td style="padding: 6px 0; line-height: 1.4;">${order.address}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-weight: bold;">Payment Method:</td>
            <td style="padding: 6px 0;">${order.payment_method || 'GPay'}</td>
          </tr>
        </table>

        <h3 style="border-bottom: 2px solid #e63946; padding-bottom: 8px; color: #b00020;">Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
          <thead>
            <tr style="background: #f8f9fa;">
              <th style="padding: 10px; text-align: left; border-bottom: 2px solid #eee;">Item</th>
              <th style="padding: 10px; text-align: center; border-bottom: 2px solid #eee; width: 60px;">Qty</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee; width: 100px;">Price</th>
              <th style="padding: 10px; text-align: right; border-bottom: 2px solid #eee; width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div style="background: #f8f9fa; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
          <table style="width: 100%; font-size: 15px;">
            <tr>
              <td style="padding: 4px 0; color: #666;">Subtotal:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold;">₹${Number(order.subtotal || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #666;">GST:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold;">₹${Number(order.gst || 0).toFixed(2)}</td>
            </tr>
            ${order.discount ? `
            <tr>
              <td style="padding: 4px 0; color: #666;">Discount:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #e63946;">-₹${Number(order.discount).toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr style="border-top: 1px solid #ddd; font-size: 18px;">
              <td style="padding: 12px 0 0 0; font-weight: bold; color: #b00020;">Grand Total:</td>
              <td style="padding: 12px 0 0 0; text-align: right; font-weight: bold; color: #b00020;">₹${Number(order.total || 0).toFixed(2)}</td>
            </tr>
          </table>
        </div>

        ${order.pdf_url ? `
        <div style="text-align: center; margin-top: 25px;">
          <a href="${order.pdf_url}" style="background: #e63946; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Download Invoice PDF</a>
        </div>
        ` : ''}
      </div>
      <div style="background: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #777;">
        This is an automated notification. Appu Crackers Database System.
      </div>
    </div>
  `;

  // If credentials aren't set, output a log representation for test/debug
  if (!smtpUser || !smtpPass) {
    console.warn('--- EMAIL NOTIFICATION LOG (SMTP credentials missing in .env) ---');
    console.warn(`To: ${recipientEmail}`);
    console.warn(`Subject: New Order - ${order.site_txn}`);
    console.warn(`Text representation:\nCustomer: ${order.customer_name}\nTotal: ₹${order.total}\nPhone: ${order.phone}`);
    console.warn('------------------------------------------------------------------');
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Appu Crackers System" <${smtpUser}>`,
      to: recipientEmail,
      subject: `[Appu Crackers] New Order Placed - ${order.site_txn}`,
      html: emailHtml,
    });
    console.log(`Email notification sent to ${recipientEmail} for order ${order.site_txn}`);
  } catch (error) {
    console.error('Failed to send order notification email:', error);
  }
}
