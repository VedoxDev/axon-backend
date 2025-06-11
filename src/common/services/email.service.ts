import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private transporter;

    constructor() {
        // Gmail SMTP - replace with your Gmail credentials
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'v.a.fonseca.y@gmail.com',     // Replace with your Gmail
                pass: 'vbpe zaaw cewd iirs'   // Replace with Gmail App Password
            }
        });
    }

    async sendPasswordResetEmail(email: string, resetToken: string) {
        const resetUrl = `https://axon-app.vercel.app//reset-password?token=${resetToken}`; // Frontend URL
        
        try {
            const info = await this.transporter.sendMail({
                from: '"Soporte Axon" <soporte@axon.com>',
                to: email,
                subject: 'Restablecer tu Contraseña - Axon',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #007bff; margin: 0;">🔐 Axon</h1>
                            </div>
                            
                            <h2 style="color: #333; margin-bottom: 20px;">Restablecer Contraseña</h2>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.6;">
                                Hola,<br><br>
                                Has solicitado restablecer tu contraseña en Axon. Haz clic en el botón de abajo para crear una nueva contraseña:
                            </p>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                                    Restablecer Contraseña
                                </a>
                            </div>
                            
                            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p style="margin: 0; color: #856404; font-size: 14px;">
                                    ⚠️ <strong>Importante:</strong> Este enlace expirará en 30 minutos por seguridad.
                                </p>
                            </div>
                            
                            <p style="color: #666; font-size: 14px; line-height: 1.6;">
                                Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no será modificada.
                            </p>
                            
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            
                            <div style="text-align: center; color: #999; font-size: 12px;">
                                <p>Este correo fue enviado por Axon</p>
                                <p>Si tienes problemas con el botón, copia y pega este enlace en tu navegador:</p>
                                <p style="word-break: break-all;">${resetUrl}</p>
                            </div>
                        </div>
                    </div>
                `,
                text: `
Restablecer Contraseña - Axon

Hola,

Has solicitado restablecer tu contraseña en Axon. 

Visita este enlace para crear una nueva contraseña: ${resetUrl}

IMPORTANTE: Este enlace expirará en 30 minutos por seguridad.

Si no solicitaste este cambio, puedes ignorar este correo.

---
Axon - Soporte
                `
            });

            console.log('Email sent:', info.messageId);
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            return true;
        } catch (error) {
            console.error('Email sending failed:', error);
            // For development, just log the reset URL
            console.log('🔗 PASSWORD RESET URL:', resetUrl);
            console.log('📧 EMAIL TO:', email);
            console.log('🔑 TOKEN:', resetToken);
            return true; // Return true anyway for development
        }
    }
} 