/**
 * Cart UI Controller
 */
class CartUI {
    constructor() {
        this.elements = {
            tableBody: document.getElementById('cart-table-body'),
            emptyState: document.getElementById('cart-empty'),
            cartItems: document.getElementById('cart-items'),
            subtotal: document.getElementById('cart-subtotal'),
            checkoutBtn: document.getElementById('checkout-btn'),
            clearCartBtn: document.getElementById('clear-cart')
        };

        this.init();
    }

    init() {
        if (!CartFunctions) {
            console.error('CartFunctions is not available');
            return;
        }

        this.setupEventListeners();
        this.renderCart();
    }

    setupEventListeners() {
        // Event delegation for cart actions
        document.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const { action, id } = target.dataset;
            this.handleCartAction(action, id);
        });

        // Quantity input changes
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('quantity-input')) {
                this.handleQuantityChange(
                    e.target.dataset.id, 
                    parseInt(e.target.value) || 1
                );
            }
        });

        // Checkout button
        if (this.elements.checkoutBtn) {
            this.elements.checkoutBtn.addEventListener('click', () => this.handleCheckout());
        }

        // Clear cart button
        if (this.elements.clearCartBtn) {
            this.elements.clearCartBtn.addEventListener('click', () => this.handleClearCart());
        }
    }

    handleCartAction(action, id) {
        const cart = CartFunctions.getCart();
        const item = cart.find(item => item.id === id);

        switch (action) {
            case 'decrease':
                if (item) CartFunctions.updateQuantity(id, item.quantity - 1);
                break;
            case 'increase':
                if (item) CartFunctions.updateQuantity(id, item.quantity + 1);
                break;
            case 'remove':
                CartFunctions.removeItem(id);
                break;
        }

        this.renderCart();
    }

    handleQuantityChange(id, quantity) {
        CartFunctions.updateQuantity(id, quantity);
        this.renderCart();
    }

    handleCheckout() {
        if (CartFunctions.getCartCount() === 0) {
            this.showAlert('Your cart is empty!');
            return;
        }
        
        this.showAlert('Proceeding to checkout!');
        // window.location.href = 'checkout.html';
    }

    handleClearCart() {
        if (CartFunctions.getCartCount() === 0) {
            this.showAlert('Your cart is already empty!');
            return;
        }

        if (confirm('Are you sure you want to clear your cart?')) {
            CartFunctions.clearCart();
            this.renderCart();
            this.showAlert('Your cart has been cleared');
        }
    }

    showAlert(message) {
        // In production, replace with a proper modal or notification system
        alert(message);
    }

    renderCart() {
        const cart = CartFunctions.getCart();
        const hasItems = cart.length > 0;

        // Toggle empty state
        this.elements.emptyState.style.display = hasItems ? 'none' : 'flex';
        this.elements.cartItems.style.display = hasItems ? 'block' : 'none';

        if (!hasItems) return;

        // Calculate subtotal while rendering items
        let subtotal = 0;
        this.elements.tableBody.innerHTML = cart.map(item => {
            const itemTotal = item.price * item.quantity;
            subtotal += itemTotal;

            return `
                <tr>
                    <td>
                        <div class="cart-item-info">
                            <span class="cart-item-name">${item.name}</span>
                        </div>
                    </td>
                    <td>$${item.price.toFixed(2)}</td>
                    <td>
                        <div class="quantity-control">
                            <button class="quantity-btn" 
                                    data-action="decrease" 
                                    data-id="${item.id}">−</button>
                            <input type="number" 
                                   class="quantity-input" 
                                   value="${item.quantity}" 
                                   min="1" 
                                   data-id="${item.id}">
                            <button class="quantity-btn" 
                                    data-action="increase" 
                                    data-id="${item.id}">+</button>
                        </div>
                    </td>
                    <td>$${itemTotal.toFixed(2)}</td>
                    <td>
                        <button class="remove-item" 
                                data-action="remove" 
                                data-id="${item.id}"
                                aria-label="Remove ${item.name}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Update subtotal
        this.elements.subtotal.textContent = `$${subtotal.toFixed(2)}`;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new CartUI();
});