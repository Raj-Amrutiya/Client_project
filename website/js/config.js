// API Configuration
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? `http://${window.location.hostname}:3000/api`
    : '/api';

const Config = {
    API_BASE,
    CURRENCY: '₹',
    CURRENCY_CODE: 'INR',
    FREE_SHIPPING_THRESHOLD: 999,
    SHIPPING_COST: 99,
    TAX_RATE: 0.18,
    ITEMS_PER_PAGE: 12
};
