import nodemailer from 'nodemailer'

export const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false,
    },
})

export async function sendEmail({ to, subject, html }) {
    const from = `"FYI Store" <${process.env.SMTP_USER}>`
    try {
        const info = await transporter.sendMail({ from, to, subject, html })
        console.log('✅ Email sent:', info.messageId)
        return info
    } catch (err) {
        console.error('❌ Failed to send email:', err)
        throw err
    }
}
