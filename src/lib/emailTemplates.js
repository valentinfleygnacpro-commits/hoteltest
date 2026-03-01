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
    `Nouvelle r\u00e9servation ${bookingId}`,
    `
      <p><strong>Client:</strong> ${payload.fullName}</p>
      <p><strong>Email:</strong> ${payload.email}</p>
      <p><strong>T\u00e9l\u00e9phone:</strong> ${payload.phone || "-"}</p>
      <p><strong>Arriv\u00e9e:</strong> ${payload.checkIn}</p>
      <p><strong>D\u00e9part:</strong> ${payload.checkOut}</p>
      <p><strong>Chambre:</strong> ${payload.roomType}</p>
      <p><strong>Voyageurs:</strong> ${payload.guests}</p>
      <p><strong>Option:</strong> ${payload.addon}</p>
      <p><strong>Total:</strong> ${Math.round(estimate.total)} EUR</p>
    `
  );
}

function bookingClientTemplate({ bookingId, payload, estimate }) {
  return wrapEmail(
    "Votre r\u00e9servation est bien enregistr\u00e9e",
    `
      <p>Bonjour ${payload.fullName},</p>
      <p>Nous confirmons votre r\u00e9servation <strong>${bookingId}</strong>.</p>
      <p>S\u00e9jour du <strong>${payload.checkIn}</strong> au <strong>${payload.checkOut}</strong>.</p>
      <p>Montant estim\u00e9: <strong>${Math.round(estimate.total)} EUR</strong>.</p>
      <p>Notre \u00e9quipe reviendra vers vous si besoin d'informations compl\u00e9mentaires.</p>
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
    "Message re\u00e7u",
    `
      <p>Bonjour ${name},</p>
      <p>Merci pour votre message. Notre \u00e9quipe vous r\u00e9pond sous 24h.</p>
    `
  );
}

function newsletterWelcomeTemplate(email) {
  return wrapEmail(
    "Bienvenue \u00e0 la newsletter Hotel Atlas",
    `
      <p>Votre inscription (${email}) est confirm\u00e9e.</p>
      <p>Vous recevrez nos offres priv\u00e9es et inspirations voyage.</p>
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