// ============ Checkout Page ============
document.addEventListener('DOMContentLoaded', () => {
    initCheckout();
});

let currentStep = 0;

function initCheckout() {
    const items = CartManager.getLocal();
    if (items.length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    if (!Auth.isLoggedIn()) {
        showToast('Please login to checkout', 'warning');
        window.location.href = 'login.html?redirect=checkout.html';
        return;
    }

    renderCheckoutItems(items);
    setupSteps();
    setupPaymentMethods();
    setupPlaceOrder();
}

// ============ Render Checkout Items ============
function renderCheckoutItems(items) {
    const container = document.getElementById('checkoutItems');
    if (!container) return;

    container.innerHTML = items.map(item => `
        <div style="display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eee;">
            <img src="${item.image_url || 'https://via.placeholder.com/60'}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
            <div style="flex: 1;">
                <p style="font-size: 0.85rem; font-weight: 500;">${item.name}</p>
                <p style="font-size: 0.8rem; color: #666;">${formatPrice(item.price)} × ${item.quantity}</p>
            </div>
            <span style="font-weight: 600; font-size: 0.9rem;">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');

    updateCheckoutTotals(items);
}

function updateCheckoutTotals(items) {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= Config.FREE_SHIPPING_THRESHOLD ? 0 : Config.SHIPPING_COST;
    const total = subtotal + shipping;

    const subtotalEl = document.getElementById('checkSubtotal');
    const shippingEl = document.getElementById('checkShipping');
    const totalEl = document.getElementById('checkTotal');

    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) shippingEl.textContent = shipping === 0 ? 'FREE' : formatPrice(shipping);
    if (totalEl) totalEl.textContent = formatPrice(total);
}

// ============ Multi-Step Navigation ============
function setupSteps() {
    const steps = document.querySelectorAll('.checkout-steps .step');
    const panels = [document.getElementById('step1'), document.getElementById('step2'), document.getElementById('step3')];

    function goToStep(index) {
        steps.forEach((s, i) => {
            s.classList.toggle('active', i === index);
            s.classList.toggle('completed', i < index);
        });
        panels.forEach((p, i) => {
            if (p) p.classList.toggle('active', i === index);
        });
        currentStep = index;
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Step 1 -> Step 2 (shipping form submit)
    const shippingForm = document.getElementById('shippingForm');
    if (shippingForm) {
        shippingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const required = shippingForm.querySelectorAll('[required]');
            let valid = true;
            required.forEach(input => {
                if (!input.value.trim()) {
                    input.style.borderColor = '#e74c3c';
                    valid = false;
                } else {
                    input.style.borderColor = '#ddd';
                }
            });
            if (valid) goToStep(1);
        });
    }

    // Step 2 -> Step 3
    const continueToConfirm = document.getElementById('continueToConfirm');
    if (continueToConfirm) {
        continueToConfirm.addEventListener('click', () => {
            const selected = document.querySelector('input[name="paymentMethod"]:checked');
            if (!selected) {
                showToast('Please select a payment method', 'warning');
                return;
            }
            renderOrderConfirmation();
            goToStep(2);
        });
    }

    // Back buttons
    const backToShipping = document.getElementById('backToShipping');
    if (backToShipping) backToShipping.addEventListener('click', () => goToStep(0));

    const backToPayment = document.getElementById('backToPayment');
    if (backToPayment) backToPayment.addEventListener('click', () => goToStep(1));
}

// ============ Payment Methods ============
function setupPaymentMethods() {
    const paymentOptions = document.querySelectorAll('.payment-option');
    const cardForm = document.getElementById('cardForm');
    const upiForm = document.getElementById('upiForm');

    paymentOptions.forEach(option => {
        option.addEventListener('click', () => {
            paymentOptions.forEach(o => o.classList.remove('active'));
            option.classList.add('active');
            const radio = option.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;

            if (cardForm) cardForm.style.display = radio?.value === 'card' ? 'block' : 'none';
            if (upiForm) upiForm.style.display = radio?.value === 'upi' ? 'block' : 'none';
        });
    });
}

// ============ Order Confirmation Review ============
function renderOrderConfirmation() {
    const review = document.getElementById('orderReview');
    if (!review) return;

    const items = CartManager.getLocal();
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal >= Config.FREE_SHIPPING_THRESHOLD ? 0 : Config.SHIPPING_COST;
    const total = subtotal + shipping;
    const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';
    const paymentLabels = { cod: 'Cash on Delivery', card: 'Credit / Debit Card', upi: 'UPI Payment' };

    const form = document.getElementById('shippingForm');
    const firstName = form?.querySelector('#shipFirstName')?.value || '';
    const lastName = form?.querySelector('#shipLastName')?.value || '';
    const address1 = form?.querySelector('#shipAddress1')?.value || '';
    const city = form?.querySelector('#shipCity')?.value || '';
    const state = form?.querySelector('#shipState')?.value || '';
    const postal = form?.querySelector('#shipPostal')?.value || '';
    const phone = form?.querySelector('#shipPhone')?.value || '';

    review.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
            <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin-bottom: 10px;"><i class="fas fa-truck"></i> Shipping Address</h4>
                <p><strong>${firstName} ${lastName}</strong></p>
                <p>${address1}</p>
                <p>${city}, ${state} - ${postal}</p>
                <p>Phone: ${phone}</p>
            </div>
            <div style="padding: 15px; background: #f8f9fa; border-radius: 8px;">
                <h4 style="margin-bottom: 10px;"><i class="fas fa-credit-card"></i> Payment Method</h4>
                <p><strong>${paymentLabels[paymentMethod] || paymentMethod}</strong></p>
                ${paymentMethod === 'card' ? '<p style="color:#666;"><i class="fas fa-shield-alt"></i> Fake demo payment - no real charge</p>' : ''}
                ${paymentMethod === 'upi' ? `<p style="color:#666;">UPI ID: ${document.getElementById('upiId')?.value || 'N/A'}</p>` : ''}
                ${paymentMethod === 'cod' ? '<p style="color:#666;">Pay when your order arrives</p>' : ''}
            </div>
        </div>
        <h4 style="margin-bottom: 10px;">Order Items (${items.length})</h4>
        ${items.map(item => `
            <div style="display: flex; gap: 10px; padding: 10px 0; border-bottom: 1px solid #eee; align-items: center;">
                <img src="${item.image_url || 'https://via.placeholder.com/50'}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;">
                <div style="flex: 1;">
                    <p style="font-weight: 500;">${item.name}</p>
                    <p style="font-size: 0.85rem; color: #666;">${formatPrice(item.price)} × ${item.quantity}</p>
                </div>
                <span style="font-weight: 600;">${formatPrice(item.price * item.quantity)}</span>
            </div>
        `).join('')}
        <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #eee;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Subtotal</span><span>${formatPrice(subtotal)}</span></div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>Shipping</span><span>${shipping === 0 ? 'FREE' : formatPrice(shipping)}</span></div>
            <div style="display: flex; justify-content: space-between; font-size: 1.2rem; font-weight: 700; padding-top: 10px; border-top: 1px solid #ddd;"><span>Total</span><span style="color: var(--primary-color, #667eea);">${formatPrice(total)}</span></div>
        </div>
    `;
}

// ============ Place Order (Fake Payment) ============
function setupPlaceOrder() {
    const placeBtn = document.getElementById('placeOrderBtn');
    if (!placeBtn) return;

    placeBtn.addEventListener('click', async () => {
        placeBtn.disabled = true;
        placeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing Payment...';

        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'cod';

        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // For card/upi, simulate fake payment success
        if (paymentMethod === 'card' || paymentMethod === 'upi') {
            placeBtn.innerHTML = '<i class="fas fa-check"></i> Payment Successful! Creating order...';
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        try {
            const form = document.getElementById('shippingForm');
            const shippingAddress = {
                full_name: (form?.querySelector('#shipFirstName')?.value || '') + ' ' + (form?.querySelector('#shipLastName')?.value || ''),
                address_line1: form?.querySelector('#shipAddress1')?.value || '',
                address_line2: form?.querySelector('#shipAddress2')?.value || '',
                city: form?.querySelector('#shipCity')?.value || '',
                state: form?.querySelector('#shipState')?.value || '',
                postal_code: form?.querySelector('#shipPostal')?.value || '',
                phone: form?.querySelector('#shipPhone')?.value || ''
            };

            const res = await Auth.fetchWithAuth(`${Config.API_BASE}/orders`, {
                method: 'POST',
                body: JSON.stringify({
                    shipping_address: shippingAddress,
                    payment_method: paymentMethod,
                    coupon_code: window._appliedCoupon || null
                })
            });

            if (!res) {
                showToast('Session expired, please login again', 'error');
                return;
            }

            const data = await res.json();

            if (res.ok) {
                CartManager.clearLocal();

                // Show success modal
                const modal = document.getElementById('orderSuccessModal');
                const orderNumEl = document.getElementById('orderNumber');
                if (modal && orderNumEl) {
                    orderNumEl.textContent = data.order.order_number;
                    modal.style.display = 'flex';
                } else {
                    showToast('Order placed successfully! Order #' + data.order.order_number, 'success', 5000);
                    setTimeout(() => window.location.href = 'orders.html', 3000);
                }
            } else {
                showToast(data.error || 'Failed to place order', 'error');
            }
        } catch {
            showToast('Something went wrong. Please try again.', 'error');
        } finally {
            placeBtn.disabled = false;
            placeBtn.innerHTML = '<i class="fas fa-lock"></i> Place Order';
        }
    });
}
