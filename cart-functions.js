/**
 * Cart Core Functionality Module
 * Handles all cart operations and state management
 */
const CartFunctions = (function() {
    // Private state
    let cart = [];
    const CART_KEY = 'tradelines_cart';
    let initialized = false;

    // Private methods
    const saveCart = () => {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
    };

    const loadCart = () => {
        const savedCart = localStorage.getItem(CART_KEY);
        cart = savedCart ? JSON.parse(savedCart) : [];
    };

    const updateCartCount = () => {
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        cartCountElements.forEach(el => {
            el.textContent = count;
            el.classList.toggle('has-items', count > 0);
            el.parentElement.classList.toggle('has-items', count > 0);
            
            // Accessibility
            el.setAttribute('aria-label', `${count} items in cart`);
            el.setAttribute('aria-live', 'polite');
        });

        return count;
    };

    // Public API
    return {
        init() {
            if (initialized) return;
            loadCart();
            updateCartCount();
            initialized = true;
        },

        addItem(id, name, price, image) {
            loadCart();
            const existingItem = cart.find(item => item.id === id);
            
            if (existingItem) {
                existingItem.quantity++;
            } else {
                cart.push({
                    id,
                    name,
                    price: parseFloat(price),
                    image: image || 'tradeline-default.jpg',
                    quantity: 1
                });
            }
            
            saveCart();
            return updateCartCount();
        },

        removeItem(id) {
            loadCart();
            cart = cart.filter(item => item.id !== id);
            saveCart();
            return updateCartCount();
        },

        updateQuantity(id, newQuantity) {
            loadCart();
            const item = cart.find(item => item.id === id);
            
            if (!item) return false;
            
            if (newQuantity > 0) {
                item.quantity = newQuantity;
            } else {
                return this.removeItem(id);
            }
            
            saveCart();
            updateCartCount();
            return true;
        },

        getCart() {
            loadCart();
            return [...cart];
        },

        clearCart() {
            cart = [];
            saveCart();
            updateCartCount();
            return true;
        },

        getCartCount() {
            loadCart();
            return cart.reduce((total, item) => total + item.quantity, 0);
        }
    };
})();

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => CartFunctions.init());

// Export for modules (if using ES modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartFunctions;
} else {
    window.CartFunctions = CartFunctions;
}