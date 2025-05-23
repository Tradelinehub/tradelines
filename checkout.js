// Global Supabase client reference
let supabaseClient;

// Wait for everything to load
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Initialize Supabase client
        const supabaseUrl = 'https://vlwxcpssejuuegmqbcol.supabase.co';
        const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsd3hjcHNzZWp1dWVnbXFiY29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTY0MjUsImV4cCI6MjA2Mjg5MjQyNX0.gGbP7xcCNNPGTDRoXzjtGrlKu9GDb4a94QkNVwxAt90';
        supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

        // Initialize UI components
        initCheckoutUI();
        
    } catch (error) {
        console.error('Initialization error:', error);
        showError('Failed to initialize checkout system. Please refresh the page.');
    }
});

function initCheckoutUI() {
    renderOrderSummary();
    TradelinesCart.updateCartCount();
    setupPaymentTabs();
    document.getElementById('payment-form').addEventListener('submit', handleFormSubmit);
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    if (!validateCheckoutForm()) return;

    const formData = getFormData();
    const cartItems = TradelinesCart.getCart();
    const orderTotal = TradelinesCart.getSubtotal();
    const taxAmount = orderTotal * 0.08;
    const grandTotal = orderTotal + taxAmount;

    document.getElementById('summary-tax').textContent = `$${taxAmount.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `$${grandTotal.toFixed(2)}`;
    document.querySelector('.loading-overlay').style.display = 'flex';

    try {
        const orderId = await saveOrderToDatabase({
            ...formData,
            items: cartItems,
            subtotal: orderTotal,
            tax: taxAmount,
            total: grandTotal,
            status: 'pending'
        });

        TradelinesCart.clearCart();
        window.location.href = `order-success.html?order_id=${orderId}`;
    } catch (error) {
        console.error('Checkout error:', error);
        showError('There was an error processing your order. Please try again.');
        document.querySelector('.loading-overlay').style.display = 'none';
    }
}
async function saveOrderToDatabase(orderData) {
    try {
        // Get current user ID if authenticated
        const { data: { user } } = await supabaseClient.auth.getUser();
        const userId = user?.id || null;

        // Prepare payment details (still not recommended for production)
        const paymentDetails = {
            method: orderData.payment.method,
            ...orderData.payment.details
        };

        // Prepare checkout data
        const checkoutData = {
            user_id: userId,
            email: orderData.customer.email,
            first_name: orderData.customer.firstName,
            last_name: orderData.customer.lastName,
            phone: orderData.customer.phone,
            address: orderData.billingAddress.address,
            city: orderData.billingAddress.city,
            state: orderData.billingAddress.state,
            zip_code: orderData.billingAddress.zip,
            country: orderData.billingAddress.country,
            order_notes: orderData.notes,
            payment_method: orderData.payment.method,
            subtotal: orderData.subtotal,
            tax: orderData.tax,
            total: orderData.total,
            status: orderData.status,
            payment_details: paymentDetails
        };

        // Insert checkout record
        const { data: checkout, error: checkoutError } = await supabaseClient
            .from('checkouts')
            .insert(checkoutData)
            .select()
            .single();

        if (checkoutError) throw checkoutError;

        // Prepare order items with the CORRECT foreign key field name
        const orderItems = orderData.items.map(item => ({
            checkout_id: checkout.id, // Must match your table's column name
            product_id: item.id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
        }));

        // Insert order items
        const { error: itemsError } = await supabaseClient
            .from('order_items')
            .insert(orderItems);

        if (itemsError) throw itemsError;

        console.log('Order saved successfully with ID:', checkout.id);
        return checkout.id;

    } catch (error) {
        console.error('Database save error:', {
            message: error.message,
            details: error.details,
            code: error.code
        });
        throw new Error('Failed to save order to database');
    }
}

// Helper functions
function maskCardNumber(number) {
    if (!number) return '';
    const cleaned = number.replace(/\s+/g, '');
    return cleaned.slice(0, 4) + ' •••• •••• ' + cleaned.slice(-4);
}

function renderOrderSummary() {
    const cart = TradelinesCart.getCart();
    const summaryContainer = document.getElementById('summary-items');
    const subtotalElement = document.getElementById('summary-subtotal');
    const totalElement = document.getElementById('summary-total');

    if (cart.length === 0) {
        summaryContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
        subtotalElement.textContent = '$0.00';
        totalElement.textContent = '$0.00';
        return;
    }

    summaryContainer.innerHTML = cart.map(item => `
        <div class="summary-item">
            <div class="item-name">${item.name} × ${item.quantity}</div>
            <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
        </div>
    `).join('');

    const subtotal = TradelinesCart.getSubtotal();
    subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
    totalElement.textContent = `$${subtotal.toFixed(2)}`;
}

function setupPaymentTabs() {
    const tabs = document.querySelectorAll('.payment-tab');
    const contents = document.querySelectorAll('.payment-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            const method = this.dataset.method;
            document.getElementById(`${method}-payment`).classList.add('active');
        });
    });
}

function validateCheckoutForm() {
    let isValid = true;
    const requiredFields = [
        'email', 'first-name', 'last-name', 'phone',
        'address', 'city', 'state', 'zip', 'country',
        'terms'
    ];

    requiredFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (!field) return;

        if (field.type === 'checkbox' && !field.checked) {
            isValid = false;
            field.parentNode.classList.add('error');
        } else if (field.value.trim() === '') {
            isValid = false;
            field.classList.add('error');
        } else {
            if (field.type === 'checkbox') {
                field.parentNode.classList.remove('error');
            } else {
                field.classList.remove('error');
            }
        }
    });

    const activePayment = document.querySelector('.payment-content.active').id;
    if (activePayment === 'card-payment') {
        const cardFields = ['card-number', 'expiry', 'cvv', 'card-name'];
        cardFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field.value.trim() === '') {
                isValid = false;
                field.classList.add('error');
            } else {
                field.classList.remove('error');
            }
        });
    }

    if (!isValid) {
        showError('Please fill in all required fields');
        return false;
    }

    return true;
}

function getFormData() {
    const activePayment = document.querySelector('.payment-content.active').id;
    let paymentMethod = '';
    let paymentDetails = {};

    if (activePayment === 'card-payment') {
        paymentMethod = 'credit_card';
        paymentDetails = {
            cardNumber: document.getElementById('card-number').value,
            expiry: document.getElementById('expiry').value,
            cvv: document.getElementById('cvv').value,
            cardName: document.getElementById('card-name').value
        };
    } else if (activePayment === 'paypal-payment') {
        paymentMethod = 'paypal';
    } else if (activePayment === 'bank-payment') {
        paymentMethod = 'bank_transfer';
    }

    return {
        customer: {
            email: document.getElementById('email').value,
            firstName: document.getElementById('first-name').value,
            lastName: document.getElementById('last-name').value,
            phone: document.getElementById('phone').value
        },
        billingAddress: {
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            state: document.getElementById('state').value,
            zip: document.getElementById('zip').value,
            country: document.getElementById('country').value
        },
        payment: {
            method: paymentMethod,
            details: paymentDetails
        },
        notes: document.getElementById('notes').value
    };
}

function showError(message) {
    const errorElement = document.getElementById('checkout-error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}