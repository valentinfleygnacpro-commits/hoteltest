const bookingForm = document.getElementById('bookingForm');
const checkIn = document.getElementById('checkIn');
const checkOut = document.getElementById('checkOut');
const roomType = document.getElementById('roomType');
const guests = document.getElementById('guests');
const promo = document.getElementById('promo');
const addons = document.getElementById('addons');
const totalPrice = document.getElementById('totalPrice');
const bookingModal = document.getElementById('bookingModal');
const bookingSummary = document.getElementById('bookingSummary');
const closeModal = document.getElementById('closeModal');
const navToggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-links');

const prices = {
    classic: 140,
    deluxe: 190,
    suite: 280
};

const addonPrices = {
    none: 0,
    breakfast: 18,
    spa: 35,
    transfer: 55
};

const promoCodes = {
    ATLAS24: 0.1
};

function setMinDates() {
    const today = new Date();
    const minDate = today.toISOString().split('T')[0];
    checkIn.min = minDate;
    checkOut.min = minDate;
}

function calculateNights() {
    const inDate = new Date(checkIn.value);
    const outDate = new Date(checkOut.value);
    const diff = outDate - inDate;
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return Number.isFinite(nights) && nights > 0 ? nights : 0;
}

function calculateTotal() {
    if (!checkIn.value || !checkOut.value || !roomType.value) {
        totalPrice.textContent = '—';
        return;
    }

    const nights = calculateNights();
    if (!nights) {
        totalPrice.textContent = 'Dates invalides';
        return;
    }

    const base = prices[roomType.value] * nights;
    const guestsCount = Number(guests.value || 1);
    const addon = addonPrices[addons.value] * (addons.value === 'transfer' ? 1 : guestsCount);
    const subtotal = base + addon;
    const promoKey = promo.value.trim().toUpperCase();
    const discountRate = promoCodes[promoKey] || 0;
    const discount = subtotal * discountRate;
    const total = subtotal - discount;

    totalPrice.textContent = `${total.toFixed(0)}€`;
}

function openModal(summary) {
    bookingSummary.textContent = summary;
    bookingModal.style.display = 'flex';
    bookingModal.setAttribute('aria-hidden', 'false');
}

function closeBookingModal() {
    bookingModal.style.display = 'none';
    bookingModal.setAttribute('aria-hidden', 'true');
}

bookingForm.addEventListener('input', calculateTotal);
bookingForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const nights = calculateNights();
    if (!nights) {
        alert('La date de départ doit être après la date d\'arrivée.');
        return;
    }

    const summary = `Séjour ${roomType.options[roomType.selectedIndex].text} pour ${guests.value} personne(s), du ${checkIn.value} au ${checkOut.value} (${nights} nuit(s)). Total estimé : ${totalPrice.textContent}.`;
    openModal(summary);
    bookingForm.reset();
    calculateTotal();
});

closeModal.addEventListener('click', closeBookingModal);
bookingModal.addEventListener('click', (event) => {
    if (event.target === bookingModal) {
        closeBookingModal();
    }
});

navToggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
});

// FAQ toggle
const faqItems = document.querySelectorAll('.faq-item');
faqItems.forEach((item) => {
    item.addEventListener('click', () => {
        const panel = item.nextElementSibling;
        const isOpen = panel.style.display === 'block';
        document.querySelectorAll('.faq-panel').forEach((p) => (p.style.display = 'none'));
        document.querySelectorAll('.faq-icon').forEach((icon) => (icon.textContent = '+'));
        if (!isOpen) {
            panel.style.display = 'block';
            item.querySelector('.faq-icon').textContent = '–';
        }
    });
});

// Room quick select
const roomButtons = document.querySelectorAll('[data-room]');
roomButtons.forEach((button) => {
    button.addEventListener('click', () => {
        roomType.value = button.dataset.room;
        document.getElementById('booking').scrollIntoView({ behavior: 'smooth' });
        calculateTotal();
    });
});

setMinDates();
calculateTotal();
