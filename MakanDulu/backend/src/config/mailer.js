
require("dotenv").config();
const nodemailer = require("nodemailer");

let transporter;
let emailPengirim;

if (process.env.OTP_EMAIL_PROVIDER === "gmail") {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASS) {
        throw new Error("Konfigurasi Gmail belum lengkap.");
    }

    transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASS,
        },
    });

    emailPengirim = process.env.GMAIL_USER;

} else if (process.env.OTP_EMAIL_PROVIDER === "mailtrap") {
    if (
        !process.env.MAILTRAP_HOST ||
        !process.env.MAILTRAP_USER ||
        !process.env.MAILTRAP_PASS
    ) {
        throw new Error("Konfigurasi Mailtrap belum lengkap.");
    }

    transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_HOST,
        port: Number(process.env.MAILTRAP_PORT || 2525),
        auth: {
            user: process.env.MAILTRAP_USER,
            pass: process.env.MAILTRAP_PASS,
        },
    });

    emailPengirim = "noreply@example.com";

} else {
    throw new Error("Provider email tidak valid.");
}


const judulMap = {
    registrasi: "Verifikasi Akun MakanDulu",
    reset_password: "Reset Kata Sandi MakanDulu",
    ubah_email: "Verifikasi Perubahan Email MakanDulu",
};


const konteksMap = {
    registrasi: "memverifikasi akun MakanDulu",
    reset_password: "mereset kata sandi akun",
    ubah_email: "mengubah alamat email akun",
};


const kirimEmailOtp = async (toEmail, kodeOtp, tujuan) => {
    if (!judulMap[tujuan] || !konteksMap[tujuan]) {
        throw new Error("Tujuan OTP tidak valid.");
    }

    const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;background:#f9f9ff;border-radius:16px;border:1px solid #dee8ff;overflow:hidden">
      <div style="background:#111c2d;padding:24px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:22px">MakanDulu</h1>
        <p style="color:#cfdaf2;margin:6px 0 0;font-size:13px">Platform Kuliner Terpercaya</p>
      </div>
      <div style="padding:32px 28px">
        <h2 style="color:#111c2d;font-size:18px;margin:0 0 12px">${judulMap[tujuan]}</h2>
        <p style="color:#444;font-size:14px;line-height:1.6">
          Gunakan kode OTP berikut untuk ${konteksMap[tujuan]}:
        </p>
        <div style="background:#111c2d;border-radius:12px;padding:20px;text-align:center;margin:20px 0">
          <span style="color:#fff;font-size:36px;font-weight:bold;letter-spacing:10px">${kodeOtp}</span>
        </div>
        <p style="color:#666;font-size:13px;line-height:1.6">
          ⏱️ Kode berlaku <strong>10 menit</strong>.<br/>
          🔒 Jangan bagikan kode ini kepada siapapun.
        </p>
      </div>
      <div style="background:#f0f0f0;padding:16px;text-align:center">
        <p style="color:#999;font-size:12px;margin:0">© 2026 MakanDulu. All rights reserved.</p>
      </div>
    </div>`;

    return await transporter.sendMail({
        from: `"MakanDulu" <${emailPengirim}>`,
        to: toEmail,
        subject: judulMap[tujuan],
        html,
    });
};


const verifikasiMailer = async () => {
    await transporter.verify();
    console.log(
        `[mailer] SMTP ${process.env.OTP_EMAIL_PROVIDER} siap digunakan.`
    );
};

module.exports = {
    kirimEmailOtp,
    verifikasiMailer,
};
