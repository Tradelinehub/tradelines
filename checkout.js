/**
 * Checkout Controller
 * Handles all checkout page functionality
 */
class CheckoutController {
    constructor() {
        this.elements = {
            paymentTabs: document.querySelectorAll('.payment-tab'),
            paymentContents: document.querySelectorAll('.payment-content'),
            summaryItems: document.getElementById('summary-items'),
            summarySubtotal: document.getElementById('summary-subtotal'),
            summaryFee: document.getElementById('summary-fee'),
            summaryTotal: document.getElementById('summary-total'),
            placeOrderBtn: document.getElementById('place-order'),
            termsCheckbox: document.getElementById('terms'),
            refundCheckbox: document.getElementById('refund-policy')
        };

        this.init();
    }

    init() {
        if (!CartFunctions) {
            console.error('CartFunctions is not available');
            return;
        }

        this.setupEventListeners();
        this.renderOrderSummary();
        this.setupPaymentTabs();
    }

    setupEventListeners() {
        // Payment method tabs
        this.elements.paymentTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchPaymentMethod(tab.dataset.method));
        });

        // Place order button
        if (this.elements.placeOrderBtn) {
            this.elements.placeOrderBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handlePlaceOrder();
            });
        }

        // Terms checkbox validation
        if (this.elements.termsCheckbox) {
            this.elements.termsCheckbox.addEventListener('change', () => {
                this.validateForm();
            });
        }
    }

    setupPaymentTabs() {
        // Default to first payment method
        if (this.elements.paymentTabs.length > 0) {
            this.switchPaymentMethod(this.elements.paymentTabs[0].dataset.method);
        }
    }

    switchPaymentMethod(method) {
        // Update active tab
        this.elements.paymentTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.method === method);
        });

        // Show corresponding content
        this.elements.paymentContents.forEach(content => {
            content.classList.toggle('active', content.id === `${method}-payment`);
        });

        // Special handling for Apple Pay
        if (method === 'applepay') {
            this.initApplePay();
        }
    }

    initApplePay() {
        // Check if Apple Pay is available
        if (window.ApplePaySession && ApplePaySession.canMakePayments()) {
            document.getElementById('apple-pay-button').style.display = 'flex';
            
            // Add Apple Pay event listener
            document.getElementById('apple-pay-button').addEventListener('click', () => {
                this.handleApplePay();
            });
        } else {
            document.getElementById('apple-pay-button').style.display = 'none';
        }
    }

    handleApplePay() {
        // In a real implementation, this would initiate Apple Pay process
        alert('Apple Pay would be processed here');
        console.log('Initiating Apple Pay...');
    }

    renderOrderSummary() {
        const cart = CartFunctions.getCart();
        
        if (cart.length === 0) {
            // Redirect to cart if empty
            window.location.href = 'cart.html';
            return;
        }

        // Calculate totals
        const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const total = subtotal

        // Render items
        this.elements.summaryItems.innerHTML = cart.map(item => `
            <div class="summary-item">
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-quantity">Qty: ${item.quantity}</div>
                </div>
                <div class="item-price">$${(item.price * item.quantity).toFixed(2)}</div>
            </div>
        `).join('');

        // Update totals
        this.elements.summarySubtotal.textContent = `$${subtotal.toFixed(2)}`;
        this.elements.summaryFee.textContent = `$${fee.toFixed(2)}`;
        this.elements.summaryTotal.textContent = `$${total.toFixed(2)}`;
    }

    validateForm() {
        // In a real implementation, this would validate all form fields
        const isValid = this.elements.termsCheckbox.checked;
        
        if (isValid) {
            this.elements.placeOrderBtn.disabled = false;
        } else {
            this.elements.placeOrderBtn.disabled = true;
        }
        
        return isValid;
    }

    handlePlaceOrder() {
        if (!this.validateForm()) {
            alert('Please agree to the terms and conditions');
            return;
        }

        // Get selected payment method
        const activeTab = document.querySelector('.payment-tab.active');
        const paymentMethod = activeTab ? activeTab.dataset.method : 'card';

        // Process order based on payment method
        switch (paymentMethod) {
            case 'card':
                this.processCardPayment();
                break;
            case 'btc':
                this.processBitcoinPayment();
                break;
            case 'applepay':
                this.processApplePay();
                break;
            case 'bank':
                this.processBankTransfer();
                break;
            default:
                this.processCardPayment();
        }
    }

    processCardPayment() {
        // In a real implementation, this would integrate with Stripe or similar
        alert('Processing credit card payment...');
        console.log('Processing card payment');
        this.completeOrder('card');
    }

    processBitcoinPayment() {
        alert('Please complete your Bitcoin payment to the address shown');
        console.log('Waiting for Bitcoin payment');
        // In real implementation, would monitor blockchain for payment
    }

    processApplePay() {
        alert('Processing Apple Pay...');
        console.log('Processing Apple Pay');
        this.completeOrder('applepay');
    }

    processBankTransfer() {
        alert('Please complete your bank transfer with the details provided');
        console.log('Waiting for bank transfer');
        // In real implementation, would monitor bank for payment
    }

    completeOrder(paymentMethod) {
        // In a real implementation, this would:
        // 1. Send order to server
        // 2. Process payment
        // 3. Show confirmation
        
        console.log(`Order completed with ${paymentMethod}`);
        alert('Thank you for your purchase! Your tradelines will be processed shortly.');
        
        // Clear cart and redirect
        CartFunctions.clearCart();
        window.location.href = 'confirmation.html';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize CartFunctions if available
    if (typeof CartFunctions !== 'undefined') {
        CartFunctions.init();
    }
    
    // Initialize CheckoutController
    new CheckoutController();
});