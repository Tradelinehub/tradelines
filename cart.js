// cart.js
document.addEventListener('DOMContentLoaded', function() {
    // Initialize cart display
    renderCartItems();
    updateCartSummary();

    // Listen for cart updates from other pages
    document.addEventListener('cartUpdated', function() {
        renderCartItems();
        updateCartSummary();
    });

    // Event delegation for cart actions
    document.addEventListener('click', function(e) {
        const target = e.target;
        
        // Handle quantity changes
        if (target.classList.contains('quantity-btn')) {
            const cartItem = target.closest('.cart-item');
            if (!cartItem) return;
            
            const itemId = cartItem.dataset.id;
            const quantityInput = cartItem.querySelector('.quantity-input');
            let quantity = parseInt(quantityInput.value);

            if (target.classList.contains('quantity-up')) {
                quantity++;
            } else if (target.classList.contains('quantity-down') && quantity > 1) {
                quantity--;
            }

            quantityInput.value = quantity;
            TradelinesCart.updateQuantity(itemId, quantity);
        }

        // Handle remove item
        if (target.classList.contains('remove-item') || target.closest('.remove-item')) {
            const cartItem = target.closest('.cart-item');
            if (!cartItem) return;
            
            const itemId = cartItem.dataset.id;
            TradelinesCart.removeItem(itemId);
        }

        // Handle clear cart
        if (target.classList.contains('clear-cart') || target.closest('.clear-cart')) {
            if (confirm('Are you sure you want to clear your cart?')) {
                TradelinesCart.clearCart();
            }
        }
    });

    // Proceed to checkout
    const checkoutBtn = document.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', function() {
            if (TradelinesCart.getTotalItems() > 0) {
                window.location.href = 'checkout.html';
            } else {
                alert('Your cart is empty. Please add items before checkout.');
            }
        });
    }

    // Render cart items
    function renderCartItems() {
        const cartContainer = document.querySelector('.cart-items');
        if (!cartContainer) return;
        
        const cart = TradelinesCart.getCart();

        if (cart.length === 0) {
            cartContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <a href="products.html" class="btn">Continue Shopping</a>
                </div>
            `;
            return;
        }

        cartContainer.innerHTML = cart.map(item => `
            <div class="cart-item" data-id="${item.id}">
                <div class="item-image">
                    <img src="${item.image || 'images/default-product.jpg'}" alt="${item.name}">
                </div>
                <div class="item-details">
                    <h3 class="item-name">${item.name}</h3>
                    <div class="item-price">$${item.price.toFixed(2)}</div>
                </div>
                <div class="quantity-control">
                    <button class="quantity-btn quantity-down">-</button>
                    <input type="number" class="quantity-input" value="${item.quantity}" min="1">
                    <button class="quantity-btn quantity-up">+</button>
                </div>
                <div class="item-total">$${(item.price * item.quantity).toFixed(2)}</div>
                <button class="remove-item"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    }

    // Update cart summary
    function updateCartSummary() {
        const subtotalElement = document.querySelector('.subtotal-amount');
        const totalElement = document.querySelector('.total-amount');
        if (!subtotalElement || !totalElement) return;
        
        const subtotal = TradelinesCart.getSubtotal();
        
        subtotalElement.textContent = `$${subtotal.toFixed(2)}`;
        totalElement.textContent = `$${subtotal.toFixed(2)}`;
    }
});