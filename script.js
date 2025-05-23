document.addEventListener('DOMContentLoaded', function() {
    // Sample featured products data
    const featuredProducts = [
        {
            id: 1,
            vehicle: "Mercedes Benz",
            loan_amount: 58,034,
            years: "3.3",
            discounted_price: 596.27,
            category: "auto_tradelines"
        },
        {
            id: 7,
            vendor: "Supply Work",
            account_type: "Commercial",
            credit_amount: 37,272,
            years: "1.8",
            discounted_price: 448.06,
            category: "business_tradelines"
        },
        {
            id: 5,
            vehicle: "Mercedes Benz",
            loan_amount: 58,034,
            years: "3.3",
            discounted_price: 596.27,
            category: "auto_tradelines"
        },
        {
            id: 3,
            lender: "Citibank",
            mortgage_type: "Interest_Only",
            loan_amount: 492,438,
            years: "5.4",
            discounted_price: 2,025.93,
            category: "mortgage_tradelines"
        },
    ];

    // Display featured products
    const productGrid = document.querySelector('.product-grid');
    
    featuredProducts.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <img src="${product.image}" alt="${product.name}" class="product-img">
            <div class="product-info">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-price">$${product.price.toFixed(2)}</p>
                <button class="add-to-cart" data-id="${product.id}">Add to Cart</button>
            </div>
        `;
        productGrid.appendChild(productCard);
    });

    // Add to cart functionality
    const addToCartButtons = document.querySelectorAll('.add-to-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            const productId = this.getAttribute('data-id');
            const product = featuredProducts.find(p => p.id == productId);
            
            // Get existing cart from localStorage or create new one
            let cart = JSON.parse(localStorage.getItem('cart')) || [];
            
            // Check if product already in cart
            const existingItem = cart.find(item => item.id == productId);
            
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.image,
                    quantity: 1
                });
            }
            
            // Save to localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Show success message
            alert(`${product.name} has been added to your cart!`);
        });
    });
});