// cart-functions.js
class Cart {
    constructor() {
        this.cartKey = 'tradelines_cart';
        this.initCart();
    }

    initCart() {
        if (!localStorage.getItem(this.cartKey)) {
            localStorage.setItem(this.cartKey, JSON.stringify([]));
        }
        this.updateCartCount();
    }

    getCart() {
        return JSON.parse(localStorage.getItem(this.cartKey)) || [];
    }

    saveCart(cart) {
        localStorage.setItem(this.cartKey, JSON.stringify(cart));
        this.updateCartCount();
        return cart;
    }

    addItem(id, name, price, image = '') {
        const cart = this.getCart();
        const existingItem = cart.find(item => item.id === id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id,
                name,
                price: parseFloat(price),
                image,
                quantity: 1
            });
        }

        return this.saveCart(cart);
    }

    removeItem(id) {
        let cart = this.getCart();
        cart = cart.filter(item => item.id !== id);
        return this.saveCart(cart);
    }

    updateQuantity(id, quantity) {
        quantity = parseInt(quantity);
        if (quantity < 1) return this.removeItem(id);

        const cart = this.getCart();
        const item = cart.find(item => item.id === id);

        if (item) {
            item.quantity = quantity;
            return this.saveCart(cart);
        }
        return cart;
    }

    clearCart() {
        localStorage.removeItem(this.cartKey);
        this.initCart();
        return [];
    }

    getTotalItems() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + item.quantity, 0);
    }

    getSubtotal() {
        const cart = this.getCart();
        return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    updateCartCount() {
        const count = this.getTotalItems();
        const cartCountElements = document.querySelectorAll('.cart-count');
        
        cartCountElements.forEach(element => {
            element.textContent = count;
        });
        
        // Dispatch custom event when cart updates
        document.dispatchEvent(new CustomEvent('cartUpdated', {
            detail: { count }
        }));
    }
}

// Create and export single instance of Cart
const TradelinesCart = new Cart();