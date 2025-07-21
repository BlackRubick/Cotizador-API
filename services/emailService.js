const nodemailer = require('nodemailer');
const path = require('path');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // Initialize email transporter
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT == 465, // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      // Verify connection
      this.transporter.verify((error, success) => {
        if (error) {
          console.log('❌ Email configuration error:', error);
        } else {
          console.log('✅ Email server is ready to send messages');
        }
      });
    } catch (error) {
      console.error('Email transporter initialization error:', error);
    }
  }

  // Send basic email
  async sendEmail({ to, subject, text, html, attachments = [] }) {
    try {
      if (!this.transporter) {
        throw new Error('Email transporter not initialized');
      }

      const mailOptions = {
        from: `${process.env.COMPANY_NAME || 'Cotizador Médico'} <${process.env.SMTP_USER}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        text,
        html,
        attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        message: 'Email sent successfully'
      };
    } catch (error) {
      console.error('Send email error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Send welcome email to new users
  async sendWelcomeEmail(user) {
    const subject = `Bienvenido a ${process.env.COMPANY_NAME || 'Cotizador Médico'}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>¡Bienvenido a ${process.env.COMPANY_NAME || 'Cotizador Médico'}!</h1>
          </div>
          <div class="content">
            <h2>Hola ${user.firstName} ${user.lastName},</h2>
            <p>Nos complace darte la bienvenida a nuestra plataforma de cotizaciones médicas.</p>
            
            <h3>Detalles de tu cuenta:</h3>
            <ul>
              <li><strong>Usuario:</strong> ${user.username}</li>
              <li><strong>Email:</strong> ${user.email}</li>
              <li><strong>Rol:</strong> ${user.role}</li>
              <li><strong>Fecha de registro:</strong> ${new Date().toLocaleDateString('es-MX')}</li>
            </ul>
            
            <p>Puedes comenzar a usar la plataforma inmediatamente para:</p>
            <ul>
              <li>🏥 Gestionar clientes</li>
              <li>📋 Crear cotizaciones</li>
              <li>📊 Ver reportes y estadísticas</li>
              <li>🔧 Administrar productos</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" class="button">
                Iniciar Sesión
              </a>
            </div>

            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>¡Gracias por elegirnos!</p>
          </div>
          <div class="footer">
            <p>${process.env.COMPANY_NAME || 'Cotizador Médico'}</p>
            <p>${process.env.COMPANY_ADDRESS || ''}</p>
            <p>${process.env.COMPANY_PHONE || ''} | ${process.env.COMPANY_EMAIL || ''}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Bienvenido a ${process.env.COMPANY_NAME || 'Cotizador Médico'}!
      
      Hola ${user.firstName} ${user.lastName},
      
      Nos complace darte la bienvenida a nuestra plataforma.
      
      Usuario: ${user.username}
      Email: ${user.email}
      Rol: ${user.role}
      
      Puedes iniciar sesión en: ${process.env.FRONTEND_URL || 'http://localhost:5173'}
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  // Send password reset email
  async sendPasswordResetEmail(user, resetToken, resetUrl) {
    const subject = 'Restablecer contraseña - Cotizador Médico';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .button { display: inline-block; background: #DC2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔒 Restablecer Contraseña</h1>
          </div>
          <div class="content">
            <h2>Hola ${user.firstName},</h2>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" class="button">
                Restablecer Contraseña
              </a>
            </div>

            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expira en 10 minutos</li>
                <li>Solo puedes usar este enlace una vez</li>
                <li>Si no solicitaste este cambio, ignora este email</li>
              </ul>
            </div>

            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px; font-family: monospace;">
              ${resetUrl}
            </p>

            <p>Si tienes problemas, contacta a nuestro equipo de soporte.</p>
          </div>
          <div class="footer">
            <p>${process.env.COMPANY_NAME || 'Cotizador Médico'}</p>
            <p>${process.env.COMPANY_EMAIL || ''}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Restablecer contraseña - ${process.env.COMPANY_NAME || 'Cotizador Médico'}
      
      Hola ${user.firstName},
      
      Recibimos una solicitud para restablecer tu contraseña.
      
      Para restablecer tu contraseña, visita este enlace:
      ${resetUrl}
      
      Este enlace expira en 10 minutos.
      
      Si no solicitaste este cambio, ignora este email.
    `;

    return this.sendEmail({
      to: user.email,
      subject,
      text,
      html
    });
  }

  // Send quote email to client
  async sendQuoteEmail(quote, pdfAttachment = null) {
    const subject = `Cotización ${quote.folio} - ${process.env.COMPANY_NAME || 'Cotizador Médico'}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .quote-details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
          .total { font-size: 18px; font-weight: bold; color: #10B981; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📋 Cotización ${quote.folio}</h1>
          </div>
          <div class="content">
            <h2>Estimado/a ${quote.clientInfoContact},</h2>
            <p>Adjuntamos la cotización solicitada con los detalles de los productos médicos.</p>
            
            <div class="quote-details">
              <h3>Resumen de la Cotización:</h3>
              <ul>
                <li><strong>Folio:</strong> ${quote.folio}</li>
                <li><strong>Fecha:</strong> ${quote.getFormattedDate ? quote.getFormattedDate() : new Date(quote.createdAt).toLocaleDateString('es-MX')}</li>
                <li><strong>Cliente:</strong> ${quote.clientInfoName}</li>
                <li><strong>Productos:</strong> ${quote.products ? quote.products.length : 0} artículos</li>
                <li><strong>Total:</strong> <span class="total">$${quote.total ? parseFloat(quote.total).toLocaleString('es-MX') : '0'} MXN</span></li>
              </ul>
            </div>

            <h3>Condiciones:</h3>
            <ul>
              <li><strong>Condiciones de pago:</strong> ${quote.termsPaymentConditions}</li>
              <li><strong>Tiempo de entrega:</strong> ${quote.termsDeliveryTime}</li>
              <li><strong>Garantía:</strong> ${quote.termsWarranty}</li>
            </ul>

            ${quote.termsObservations ? `<p><strong>Observaciones:</strong> ${quote.termsObservations}</p>` : ''}

            <p>La cotización adjunta en PDF contiene todos los detalles técnicos y especificaciones.</p>
            
            <p>Para cualquier duda o aclaración, no dude en contactarnos.</p>
            <p>¡Esperamos tener la oportunidad de trabajar con ustedes!</p>
            
            <p>Saludos cordiales,</p>
            <p><strong>${process.env.COMPANY_NAME || 'Equipo de Ventas'}</strong></p>
          </div>
          <div class="footer">
            <p>${process.env.COMPANY_NAME || 'Cotizador Médico'}</p>
            <p>${process.env.COMPANY_ADDRESS || ''}</p>
            <p>${process.env.COMPANY_PHONE || ''} | ${process.env.COMPANY_EMAIL || ''}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Cotización ${quote.folio}
      
      Estimado/a ${quote.clientInfoContact},
      
      Adjuntamos la cotización solicitada.
      
      Folio: ${quote.folio}
      Fecha: ${new Date(quote.createdAt).toLocaleDateString('es-MX')}
      Total: $${quote.total ? parseFloat(quote.total).toLocaleString('es-MX') : '0'} MXN
      
      Condiciones de pago: ${quote.termsPaymentConditions}
      Tiempo de entrega: ${quote.termsDeliveryTime}
      
      Para cualquier duda, contactenos.
      
      Saludos cordiales,
      ${process.env.COMPANY_NAME || 'Equipo de Ventas'}
    `;

    const attachments = [];
    if (pdfAttachment) {
      attachments.push({
        filename: `Cotizacion-${quote.folio}.pdf`,
        content: pdfAttachment,
        contentType: 'application/pdf'
      });
    }

    return this.sendEmail({
      to: quote.clientInfoEmail,
      subject,
      text,
      html,
      attachments
    });
  }

  // Send notification email to admin
  async sendAdminNotification(subject, message, data = {}) {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
    
    if (!adminEmail) {
      console.log('Admin email not configured');
      return { success: false, error: 'Admin email not configured' };
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #6366F1; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .data { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; font-family: monospace; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔔 Notificación del Sistema</h1>
          </div>
          <div class="content">
            <h2>${subject}</h2>
            <p>${message}</p>
            
            ${Object.keys(data).length > 0 ? `
              <h3>Detalles:</h3>
              <div class="data">
                ${Object.entries(data).map(([key, value]) => `<strong>${key}:</strong> ${value}<br>`).join('')}
              </div>
            ` : ''}
            
            <p><small>Timestamp: ${new Date().toLocaleString('es-MX')}</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: adminEmail,
      subject: `[ADMIN] ${subject}`,
      text: `${subject}\n\n${message}\n\nTimestamp: ${new Date().toLocaleString('es-MX')}`,
      html
    });
  }

  // Test email configuration
  async testEmailConfiguration() {
    try {
      if (!this.transporter) {
        return { success: false, error: 'Transporter not initialized' };
      }

      await this.transporter.verify();
      
      // Send test email
      const testResult = await this.sendEmail({
        to: process.env.SMTP_USER,
        subject: 'Test Email - Cotizador Médico',
        text: 'Este es un email de prueba. La configuración está funcionando correctamente.',
        html: '<h1>✅ Test Email</h1><p>La configuración de email está funcionando correctamente.</p>'
      });

      return testResult;
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();