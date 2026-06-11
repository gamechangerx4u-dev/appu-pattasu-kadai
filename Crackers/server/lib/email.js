import dns from 'dns';
import nodemailer from 'nodemailer';

dns.setDefaultResultOrder('ipv4first');

let cachedTransporter = null;
let smtpReady = false;
let emailProvider = 'none';

const getEmailProvider = () => {
  if (process.env.RESEND_API_KEY) return 'resend';
  if (process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp';
  return 'none';
};

const getFromAddress = () => {
  if (process.env.RESEND_FROM) return process.env.RESEND_FROM.trim();
  const user = (process.env.SMTP_USER || 'appucrackers@gmail.com').trim();
  return `"Appu Crackers" <${user}>`;
};

const ipv4Lookup = (hostname, options, callback) => {
  dns.lookup(hostname, { family: 4 }, callback);
};

const getSmtpConfig = () => ({
  host: (process.env.SMTP_HOST || 'smtp.gmail.com').trim(),
  port: Number(process.env.SMTP_PORT || 465),
  user: (process.env.SMTP_USER || '').trim(),
  pass: (process.env.SMTP_PASS || '').replace(/\s+/g, ''),
});

export function isSmtpReady() {
  return smtpReady;
}

export function getEmailStatus() {
  return {
    provider: emailProvider,
    ready: smtpReady,
  };
}

function resetTransporter() {
  cachedTransporter = null;
  smtpReady = false;
}

function buildTransportOptions() {
  const { host, port, user, pass } = getSmtpConfig();

  if (host === 'smtp.gmail.com') {
    return {
      service: 'gmail',
      auth: { user, pass },
      lookup: ipv4Lookup,
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 20000,
    };
  }

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { minVersion: 'TLSv1.2' },
    lookup: ipv4Lookup,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  };
}

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport(buildTransportOptions());
  return cachedTransporter;
}

async function verifyResend() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return false;

  try {
    const response = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(body || `Resend API returned ${response.status}`);
    }
    emailProvider = 'resend';
    smtpReady = true;
    console.log('Resend email provider ready (HTTPS — works on Render free tier)');
    return true;
  } catch (error) {
    smtpReady = false;
    emailProvider = 'none';
    console.error('Resend verification failed:', error.message);
    return false;
  }
}

export async function verifyEmailTransport() {
  emailProvider = getEmailProvider();

  if (emailProvider === 'resend') {
    return verifyResend();
  }

  const { user, pass } = getSmtpConfig();
  if (!user || !pass) {
    smtpReady = false;
    emailProvider = 'none';
    console.warn('No email provider configured. Add RESEND_API_KEY (Render free tier) or SMTP credentials (paid Render / local).');
    return false;
  }

  try {
    resetTransporter();
    const transporter = getTransporter();
    await transporter.verify();
    emailProvider = 'smtp';
    smtpReady = true;
    console.log(`SMTP ready for ${user} (IPv4)`);
    return true;
  } catch (error) {
    smtpReady = false;
    emailProvider = 'smtp';
    console.error('SMTP verification failed:', error.message);
    if (error.code) console.error('SMTP error code:', error.code);
    console.error('Render free tier blocks SMTP ports 25/465/587. Use RESEND_API_KEY instead, or upgrade Render to a paid plan.');
    return false;
  }
}

const buildItemsHtml = (order) => (order.items || []).map((item) => {
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

const buildOrderSummaryHtml = (order, itemsHtml) => `
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
`;

async function sendViaResend({ to, subject, html, attachments = [] }) {
  const payload = {
    from: getFromAddress(),
    to: [to],
    subject,
    html,
  };

  if (attachments.length) {
    payload.attachments = attachments.map((file) => ({
      filename: file.filename,
      content: Buffer.isBuffer(file.content)
        ? file.content.toString('base64')
        : file.content,
    }));
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Resend send failed with ${response.status}`);
  }
}

async function sendViaSmtp(transporter, { to, subject, html, attachments = [] }) {
  const { user } = getSmtpConfig();
  await transporter.sendMail({
    from: `"Appu Crackers" <${user}>`,
    to,
    subject,
    html,
    attachments,
  });
}

async function sendMail(transporter, mailOptions) {
  if (emailProvider === 'resend') {
    await sendViaResend(mailOptions);
    return;
  }
  await sendViaSmtp(transporter, mailOptions);
}

export async function sendOrderEmail(order, options = {}) {
  const {
    includePdf = false,
    resend = false,
    pdfBuffer = null,
    pdfFilename = '',
  } = options;
  if (emailProvider === 'none') emailProvider = getEmailProvider();

  const storeEmail = (process.env.STORE_EMAIL || 'appucrackers@gmail.com').trim();
  const customerEmail = (order.email || '').trim();

  const itemsHtml = buildItemsHtml(order);

  const adminEmailHtml = `
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

        ${buildOrderSummaryHtml(order, itemsHtml)}

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

  const customerEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <div style="background: linear-gradient(135deg, #e63946, #b00020); color: #fff; padding: 25px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px;">Order Confirmed</h1>
        <p style="margin: 5px 0 0 0; font-size: 16px; opacity: 0.9;">Thank you for shopping with Appu Crackers</p>
      </div>
      <div style="padding: 25px; background: #ffffff; color: #333333;">
        <p style="margin-top: 0;">Hi ${order.customer_name || 'Customer'},</p>
        <p>We received your order and it is being processed. Your transaction ID is <strong>${order.site_txn}</strong>.</p>
        <p><strong>Delivery address:</strong><br>${order.address || 'Not provided'}</p>
        <p><strong>Phone:</strong> ${order.phone || 'Not provided'}</p>
        ${buildOrderSummaryHtml(order, itemsHtml)}
        ${order.pdf_url ? `
        <div style="text-align: center; margin-top: 25px;">
          <a href="${order.pdf_url}" style="background: #e63946; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Download Invoice PDF</a>
        </div>
        ` : ''}
        <p style="margin-bottom: 0;">If you have any questions, reply to this email or contact us at ${storeEmail}.</p>
      </div>
      <div style="background: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #777;">
        Appu Crackers — appucrackers.in
      </div>
    </div>
  `;

  if (emailProvider === 'none') {
    console.warn('--- EMAIL NOTIFICATION LOG (no email provider configured) ---');
    console.warn(`Store notification to: ${storeEmail}`);
    console.warn(`Customer confirmation to: ${customerEmail || '(no customer email provided)'}`);
    console.warn(`Subject: New Order - ${order.site_txn}`);
    console.warn('------------------------------------------------------------------');
    return false;
  }

  if (!smtpReady) {
    console.warn(`Email provider not verified — attempting send for order ${order.site_txn}`);
  }

  const transporter = emailProvider === 'smtp' ? getTransporter() : null;
  const attachmentName = pdfFilename || `invoice-${order.site_txn || 'order'}.pdf`;
  const attachments = pdfBuffer ? [{
    filename: attachmentName,
    content: pdfBuffer,
    contentType: 'application/pdf',
  }] : [];

  try {
    if (!resend) {
      await sendMail(transporter, {
        to: storeEmail,
        subject: `[Appu Crackers] New Order Placed - ${order.site_txn}`,
        html: adminEmailHtml,
      });
      console.log(`Store notification sent to ${storeEmail} for order ${order.site_txn}`);
    } else if (order.pdf_url || pdfBuffer) {
      await sendMail(transporter, {
        to: storeEmail,
        subject: `[Appu Crackers] Invoice Ready - ${order.site_txn}`,
        html: adminEmailHtml,
        attachments,
      });
      console.log(`Store invoice notification sent to ${storeEmail} for order ${order.site_txn}`);
    }

    if (customerEmail) {
      const customerSubject = includePdf && (order.pdf_url || pdfBuffer)
        ? `[Appu Crackers] Your Invoice - ${order.site_txn}`
        : `[Appu Crackers] Your Order Confirmation - ${order.site_txn}`;

      await sendMail(transporter, {
        to: customerEmail,
        subject: customerSubject,
        html: customerEmailHtml,
        attachments: includePdf ? attachments : [],
      });
      console.log(`Customer confirmation sent to ${customerEmail} for order ${order.site_txn}`);
    } else {
      console.warn(`No customer email on order ${order.site_txn} — customer notification skipped`);
    }

    return true;
  } catch (error) {
    smtpReady = false;
    resetTransporter();
    console.error('Failed to send order email:', error?.message || error);
    if (error?.code) console.error('SMTP error code:', error.code);
    if (error?.response) console.error('SMTP response:', error.response);
    return false;
  }
}
