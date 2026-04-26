import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"Séjour Sénégal" <${process.env.SMTP_FROM || 'noreply@sejoursenegal.sn'}>`;

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${process.env.WEB_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Vérifiez votre adresse email - Séjour Sénégal',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#d97706">Bienvenue sur Séjour Sénégal</h2>
        <p>Cliquez sur le lien ci-dessous pour vérifier votre email :</p>
        <a href="${url}" style="background:#d97706;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
          Vérifier mon email
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">Ce lien expire dans 24 heures.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${process.env.WEB_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: FROM,
    to,
    subject: 'Réinitialisation de votre mot de passe - Séjour Sénégal',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#d97706">Réinitialisation du mot de passe</h2>
        <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
        <a href="${url}" style="background:#d97706;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block">
          Réinitialiser mon mot de passe
        </a>
        <p style="color:#6b7280;font-size:12px;margin-top:24px">Ce lien expire dans 1 heure.</p>
      </div>
    `,
  });
}

export async function sendBookingConfirmationEmail(to: string, booking: {
  id: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  totalAmount: number;
  currency: string;
}) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Confirmation de réservation #${booking.id.slice(0, 8)} - Séjour Sénégal`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#d97706">Réservation confirmée !</h2>
        <p>Votre réservation pour <strong>${booking.propertyTitle}</strong> est confirmée.</p>
        <div style="background:#f9fafb;border-radius:8px;padding:16px;margin:16px 0">
          <p><strong>Arrivée :</strong> ${booking.checkIn}</p>
          <p><strong>Départ :</strong> ${booking.checkOut}</p>
          <p><strong>Durée :</strong> ${booking.nights} nuit(s)</p>
          <p><strong>Total :</strong> ${booking.totalAmount.toLocaleString('fr-SN')} ${booking.currency}</p>
        </div>
        <p>Retrouvez tous les détails dans votre espace personnel.</p>
      </div>
    `,
  });
}

export async function sendBookingCancellationEmail(to: string, booking: {
  id: string;
  propertyTitle: string;
  reason?: string;
}) {
  await transporter.sendMail({
    from: FROM,
    to,
    subject: `Annulation de réservation #${booking.id.slice(0, 8)} - Séjour Sénégal`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
        <h2 style="color:#ef4444">Réservation annulée</h2>
        <p>Votre réservation pour <strong>${booking.propertyTitle}</strong> a été annulée.</p>
        ${booking.reason ? `<p><strong>Raison :</strong> ${booking.reason}</p>` : ''}
        <p>Si vous avez des questions, contactez notre support.</p>
      </div>
    `,
  });
}
