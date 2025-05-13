/**
 * Product Listing Module
 * Handles product display and add-to-cart functionality
 */
const ProductListing = (function() {
    // Initialize module
    const init = () => {
        enhanceProductData();
        setupAddToCartHandlers();
    };

    // Enhance product data attributes
    const enhanceProductData = () => {
        document.querySelectorAll('.product-item').forEach(row => {
            const button = row.querySelector('.add-to-cart');
            if (!button) return;

            // Set default data attributes if missing
            if (!button.hasAttribute('data-name')) {
                const accountType = row.querySelector('td:nth-child(2)').textContent.trim();
                const creditLimit = row.querySelector('td:nth-child(3)').textContent.trim();
                button.setAttribute('data-name', `${accountType} Tradeline (${creditLimit})`);
            }

            if (!button.hasAttribute('data-price')) {
                const priceText = row.querySelector('td:nth-child(5)').textContent.trim();
                const priceValue = parseFloat(priceText.replace(/[^\d.]/g, ''));
                button.setAttribute('data-price', priceValue || '0');
            }

            if (!button.hasAttribute('data-image')) {
                button.setAttribute('data-image', 'tradeline-default.jpg');
            }
        });
    };

    // Setup add to cart handlers
    const setupAddToCartHandlers = () => {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('.add-to-cart');
            if (!button) return;

            e.preventDefault();
            handleAddToCart(button);
        });
    };

    // Handle add to cart action
    const handleAddToCart = (button) => {
        const row = button.closest('tr');
        const productData = {
            id: button.getAttribute('data-id'),
            name: button.getAttribute('data-name') || row.querySelector('td:nth-child(2)').textContent.trim(),
            price: parseFloat(button.getAttribute('data-price') || 
                  row.querySelector('td:nth-child(5)').textContent.replace(/[^\d.]/g, '')),
            image: button.getAttribute('data-image') || 'tradeline-default.jpg'
        };

        try {
            CartFunctions.addItem(productData.id, productData.name, productData.price, productData.image);
            showAddToCartFeedback(button);
        } catch (error) {
            console.error('Error adding to cart:', error);
            showErrorFeedback(button);
        }
    };

    // Visual feedback for add to cart
    const showAddToCartFeedback = (button) => {
        const originalText = button.textContent;
        button.textContent = 'Added ✓';
        button.classList.add('added-to-cart');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('added-to-cart');
        }, 2000);
    };

    // Error feedback
    const showErrorFeedback = (button) => {
        const originalText = button.textContent;
        button.textContent = 'Error!';
        button.classList.add('error-feedback');
        
        setTimeout(() => {
            button.textContent = originalText;
            button.classList.remove('error-feedback');
        }, 2000);
    };

    // Public API
    return {
        init
    };
})();

// Initialize on product listing pages
if (document.querySelector('.product-listing')) {
    document.addEventListener('DOMContentLoaded', () => {
        CartFunctions.init();
        ProductListing.init();
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductListing;
} else {
    window.ProductListing = ProductListing;
}