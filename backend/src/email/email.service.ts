import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface EnviarCredencialesDto {
  destinatario: string;
  nombreCliente: string;
  identificacion: string;
  nombreUsuario: string;
  contrasenaTemporal: string;
}

export interface EnviarOtpRecuperacionDto {
  destinatario: string;
  nombreUsuario: string;
  codigoOtp: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private readonly remitente: string;
  private readonly portalUrl: string;

  constructor(private readonly config: ConfigService) {
    this.remitente =
      this.config.get<string>('SMTP_FROM') ||
      '"Librería y Papelería Mundo Escolar" <mundoescolar.cr@gmail.com>';
    this.portalUrl =
      this.config.get<string>('APP_PORTAL_URL') ||
      'http://100.122.128.35:5174/login';

    this.inicializarTransporter();
  }

  private inicializarTransporter() {
    const host = this.config.get<string>('SMTP_HOST') || 'smtp.gmail.com';
    const port = Number(this.config.get<number>('SMTP_PORT')) || 465;
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const secure = this.config.get<string>('SMTP_SECURE') === 'true' || port === 465;

    if (user && pass) {
      try {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure,
          auth: { user, pass },
          tls: {
            rejectUnauthorized: false,
          },
        });
        this.logger.log(`Servicio SMTP configurado exitosamente con ${user} (${host}:${port})`);
      } catch (err: any) {
        this.logger.error(`Error inicializando Nodemailer: ${err.message}`);
        this.transporter = null;
      }
    } else {
      this.logger.warn('Credenciales SMTP no detectadas. Los correos se registrarán en modo contingencia (log).');
    }
  }

  /**
   * Envía el correo de bienvenida con credenciales iniciales al cliente registrado.
   * Ejecución asíncrona no bloqueante para no demorar la transacción comercial.
   */
  async enviarCredencialesBienvenida(datos: EnviarCredencialesDto): Promise<boolean> {
    const html = this.construirPlantillaBienvenida(datos);
    const asunto = '¡Bienvenido(a) a Mundo Escolar! Tus credenciales de acceso';

    return this.despacharCorreo(datos.destinatario, asunto, html, {
      tipo: 'BIENVENIDA_CREDENCIALES',
      usuario: datos.nombreUsuario,
      claveTemporal: datos.contrasenaTemporal,
    });
  }

  /**
   * Envía el código OTP de 6 dígitos para recuperación de contraseña.
   */
  async enviarCodigoRecuperacion(datos: EnviarOtpRecuperacionDto): Promise<boolean> {
    const html = this.construirPlantillaRecuperacion(datos);
    const asunto = `Código de seguridad: ${datos.codigoOtp} para restablecer tu contraseña`;

    return this.despacharCorreo(datos.destinatario, asunto, html, {
      tipo: 'RECUPERACION_CONTRASENA',
      usuario: datos.nombreUsuario,
      codigoOtp: datos.codigoOtp,
    });
  }

  /**
   * Despacho asíncrono con manejo de contingencia.
   */
  private async despacharCorreo(
    destinatario: string,
    asunto: string,
    html: string,
    metadataLog: any,
  ): Promise<boolean> {
    // Si no hay transporter o falla, se ejecuta con seguridad sin tumbar la aplicación
    if (!this.transporter) {
      this.logger.warn(
        `[SIMULACIÓN EMAIL] Para: ${destinatario} | Asunto: ${asunto} | Meta: ${JSON.stringify(metadataLog)}`,
      );
      return true;
    }

    try {
      const info = await this.transporter.sendMail({
        from: this.remitente,
        to: destinatario,
        subject: asunto,
        html,
      });
      this.logger.log(`Correo despachado con éxito a ${destinatario} (MessageId: ${info.messageId})`);
      return true;
    } catch (error: any) {
      this.logger.error(
        `Fallo al enviar correo a ${destinatario}: ${error.message}. Registrado para contingencia: ${JSON.stringify(metadataLog)}`,
      );
      return false;
    }
  }

  /**
   * Plantilla HTML institucional de Bienvenida y Credenciales
   */
  private construirPlantillaBienvenida(d: EnviarCredencialesDto): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenido a Mundo Escolar</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #132B20;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF7F0; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(19, 43, 32, 0.08); border: 1px solid #DFD5C4;">
          
          <!-- Encabezado Institucional -->
          <tr>
            <td style="background: linear-gradient(135deg, #132B20 0%, #1A3D2F 100%); padding: 35px 30px; text-align: center; border-bottom: 4px solid #C05A3E;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background: linear-gradient(135deg, #C05A3E 0%, #5C3622 100%); padding: 12px 18px; border-radius: 14px; box-shadow: 0 4px 12px rgba(192, 90, 62, 0.3);">
                      <span style="font-size: 26px; line-height: 1;">📚</span>
                    </div>
                    <h1 style="color: #FAF7F0; margin: 15px 0 5px 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">Librería y Papelería Mundo Escolar</h1>
                    <p style="color: #DFD5C4; margin: 0; font-size: 13px; font-weight: 500;">Liberia, Guanacaste, Costa Rica</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo del Mensaje -->
          <tr>
            <td style="padding: 35px 30px;">
              <p style="font-size: 16px; margin: 0 0 12px 0; font-weight: 700; color: #132B20;">
                ¡Hola, ${d.nombreCliente}! 👋
              </p>
              <p style="font-size: 14px; line-height: 1.6; color: #5C3622; margin: 0 0 25px 0;">
                Te damos la más cordial bienvenida a nuestra plataforma digital. Hemos creado tu cuenta de cliente para que puedas consultar tus facturas electrónicas, revisar tu estado de cuenta, historial de compras y comprobantes fiscales en cualquier momento.
              </p>

              <!-- Tarjeta de Credenciales -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF7F0; border-radius: 14px; border: 1px solid #DFD5C4; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 22px;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #C05A3E; letter-spacing: 1px; margin-bottom: 12px;">
                      Tus Credenciales de Acceso
                    </div>

                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #5C3622; font-weight: 600;">Usuario o Cédula:</td>
                        <td style="padding: 6px 0; font-size: 14px; color: #132B20; font-weight: 800; text-align: right;">${d.identificacion}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #5C3622; font-weight: 600;">Usuario secundario:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #132B20; font-family: monospace; text-align: right;">${d.nombreUsuario}</td>
                      </tr>
                      <tr>
                        <td style="padding: 10px 0 4px 0; font-size: 13px; color: #5C3622; font-weight: 600;">Contraseña Temporal:</td>
                        <td style="padding: 10px 0 4px 0; text-align: right;">
                          <span style="display: inline-block; background-color: #FFFFFF; border: 1.5px dashed #C05A3E; color: #C05A3E; font-family: 'Consolas', monospace; font-size: 16px; font-weight: 800; padding: 4px 12px; border-radius: 8px;">
                            ${d.contrasenaTemporal}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Aviso de Seguridad -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF9F5; border-left: 4px solid #C05A3E; border-radius: 4px 8px 8px 4px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #5C3622;">
                      🔒 <strong>Cambio de clave obligatorio:</strong> Por tu propia seguridad, al ingresar por primera vez al sistema se te solicitará definir tu <strong>contraseña personal definitiva</strong>. La contraseña temporal expirará inmediatamente después.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Botón de Acción -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="${this.portalUrl}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #132B20 0%, #2D5E46 100%); color: #FAF7F0; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 34px; border-radius: 12px; box-shadow: 0 4px 14px rgba(19, 43, 32, 0.25); letter-spacing: 0.3px;">
                      Ingresar a Mi Portal de Cliente &rarr;
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #FAF7F0; padding: 22px 30px; text-align: center; border-top: 1px solid #DFD5C4;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #5C3622; font-weight: 600;">
                Librería & Papelería Mundo Escolar S.A.
              </p>
              <p style="margin: 0; font-size: 11px; color: #8F8073; line-height: 1.4;">
                Cédula Jurídica: 3-101-899540 &bull; Liberia Centro, 150m norte del Parque Central &bull; Tel: +(506) 2666-0000<br>
                Este es un mensaje automático del Sistema de Gestión Comercial.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Plantilla HTML institucional de Recuperación de Contraseña con Código OTP
   */
  private construirPlantillaRecuperacion(d: EnviarOtpRecuperacionDto): string {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecimiento de Contraseña - Mundo Escolar</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF7F0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #132B20;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF7F0; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Contenedor Principal -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(19, 43, 32, 0.08); border: 1px solid #DFD5C4;">
          
          <!-- Encabezado Institucional -->
          <tr>
            <td style="background: linear-gradient(135deg, #132B20 0%, #1A3D2F 100%); padding: 32px 30px; text-align: center; border-bottom: 4px solid #C05A3E;">
              <div style="display: inline-block; background: linear-gradient(135deg, #C05A3E 0%, #5C3622 100%); padding: 12px 18px; border-radius: 14px; box-shadow: 0 4px 12px rgba(192, 90, 62, 0.3); margin-bottom: 12px;">
                <span style="font-size: 24px; line-height: 1;">🛡️</span>
              </div>
              <h1 style="color: #FAF7F0; margin: 0 0 4px 0; font-size: 20px; font-weight: 800;">Seguridad Mundo Escolar</h1>
              <p style="color: #DFD5C4; margin: 0; font-size: 12px;">Recuperación de Contraseña</p>
            </td>
          </tr>

          <!-- Cuerpo del Mensaje -->
          <tr>
            <td style="padding: 35px 30px; text-align: center;">
              <p style="font-size: 15px; margin: 0 0 10px 0; font-weight: 700; color: #132B20;">
                Solicitud de Restablecimiento de Acceso
              </p>
              <p style="font-size: 13px; line-height: 1.6; color: #5C3622; margin: 0 auto 25px auto; max-width: 480px;">
                Hemos recibido una solicitud para cambiar la contraseña de tu cuenta asociada al usuario <strong>${d.nombreUsuario}</strong>. Utiliza el siguiente código de verificación de 6 dígitos en la pantalla del sistema:
              </p>

              <!-- Bloque del Código OTP -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 25px auto;">
                <tr>
                  <td style="background: linear-gradient(135deg, #FAF7F0 0%, #F5ECE0 100%); border: 2px dashed #C05A3E; border-radius: 16px; padding: 18px 36px; text-align: center;">
                    <div style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: #5C3622; letter-spacing: 1.5px; margin-bottom: 6px;">
                      Código de Seguridad (OTP)
                    </div>
                    <div style="font-family: 'Consolas', 'Courier New', monospace; font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #132B20; padding-left: 8px;">
                      ${d.codigoOtp}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Aviso de Expiración -->
              <p style="font-size: 12px; color: #C05A3E; font-weight: 700; margin: 0 0 20px 0;">
                ⏱️ Este código expira en 15 minutos.
              </p>

              <!-- Advertencia de Seguridad -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FAF7F0; border-radius: 10px; margin-bottom: 25px;">
                <tr>
                  <td style="padding: 14px 18px; text-align: left;">
                    <p style="margin: 0; font-size: 12px; line-height: 1.5; color: #5C3622;">
                      ⚠️ <strong>¿No solicitaste este cambio?</strong> Puedes ignorar este correo de forma segura. Tu contraseña actual no sufrirá ninguna modificación y tu cuenta sigue protegida.
                    </p>
                  </td>
                </tr>
              </table>

              <a href="${this.portalUrl}" target="_blank" style="display: inline-block; background-color: #132B20; color: #FAF7F0; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 28px; border-radius: 10px;">
                Volver a la Pantalla de Inicio de Sesión
              </a>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #FAF7F0; padding: 20px 30px; text-align: center; border-top: 1px solid #DFD5C4;">
              <p style="margin: 0; font-size: 11px; color: #8F8073; line-height: 1.4;">
                Librería y Papelería Mundo Escolar S.A. &bull; Liberia, Guanacaste, Costa Rica<br>
                Centro de Operaciones Digitales &bull; mundoescolar.cr@gmail.com
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}

