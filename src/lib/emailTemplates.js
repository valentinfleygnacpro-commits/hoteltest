function wrapEmail(title, body) {
  return `
    <div style="font-family:Arial,sans-serif;color:#1f1c17;line-height:1.5">
      <h2 style="margin:0 0 12px 0">${title}</h2>
      ${body}
      <p style="margin-top:20px;color:#6d655b">Hotel Atlas</p>
    </div>
  `;
}

function bookingAdminTemplate({ bookingId, payload, estimate }) {
  return wrapEmail(
    `Nouvelle réservation ${bookingId}`,
    `
      <p><strong>Client:</strong> ${payload.fullName}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>Téléphone:</strong> ${payload.phone || "-"}</p>
      <p><strong>Arrivée:</strong> ${payload.checkIn}</p>
      <p><strong>Départ:</strong> ${payload.checkOut}</p>
      <p><strong>Chambre:</strong> ${payload.roomType}</p>
      <p><strong>Voyageurs:</strong> ${payload.guests}</p>
      <p><strong>Option:</strong> ${payload.addon}</p>
      <p><strong>Total:</strong> ${Math.round(estimate.total)} EUR</p>
    `
  );
}

function bookingClientTemplate({ bookingId, payload, estimate }) {
  return wrapEmail(
    "Votre réservation est bien enregistrée",
    `
      <p>Bonjour ${payload.fullName},</p>
      <p>Nous confirmons votre réservation <strong>${bookingId}</strong>.</p>
      <p>Séjour du <strong>${payload.checkIn}</strong> au <strong>${payload.checkOut}</strong>.</p>
      <p>Montant estimé: <strong>${Math.round(estimate.total)} EUR</strong>.</p>
      <p>Notre équipe reviendra vers vous si besoin d'informations complémentaires.</p>
    `
  );
}

function contactAdminTemplate({ name, email, message }) {
  return wrapEmail(
    "Nouveau message de contact",
    `
      <p><strong>Nom:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Message:</strong><br/>${message}</p>
    `
  );
}

function contactClientTemplate({ name }) {
  return wrapEmail(
    "Message reçu",
    `
      <p>Bonjour ${name},</p>
      <p>Merci pour votre message. Notre équipe vous répond sous 24h.</p>
    `
  );
}

function newsletterWelcomeTemplate(email) {
  return wrapEmail(
    "Bienvenue à la newsletter Hotel Atlas",
    `
      <p>Votre inscription (${email}) est confirmée.</p>
      <p>Vous recevrez nos offres privées et inspirations voyage.</p>
    `
  );
}

module.exports = {
  bookingAdminTemplate,
  bookingClientTemplate,
  contactAdminTemplate,
  contactClientTemplate,
  newsletterWelcomeTemplate,
};
