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
                from: '"Axon Support" <support@axon.com>',
                to: email,
                subject: 'Password Reset Request',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Password Reset Request</h2>
                        <p>You have requested to reset your password. Click the link below to reset it:</p>
                        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
                        <p style="margin-top: 20px;">If you didn't request this, please ignore this email.</p>
                        <p>This link will expire in 30 minutes.</p>
                    </div>
                `,
                text: `Password Reset Request. Visit this link: ${resetUrl}. Link expires in 30 minutes.`
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