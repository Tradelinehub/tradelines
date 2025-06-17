document.addEventListener('DOMContentLoaded', function() {
    const downloadCartBtn = document.querySelector('.download-cart');
    
    if (downloadCartBtn) {
        downloadCartBtn.addEventListener('click', function() {
            try {
                // Get all cart items (adjust selector based on your actual cart item structure)
                const cartItems = document.querySelectorAll('.cart-item');
                
                if (cartItems.length === 0) {
                    alert('Your cart is empty!');
                    return;
                }

                let cartContent = 'TRADELINES - Cart Details\n\n';
                cartContent += 'ITEMS:\n';
                cartContent += '--------------------------------\n';

                // Extract item details (update selectors to match your actual HTML structure)
                cartItems.forEach(item => {
                    const name = item.querySelector('.item-name')?.textContent || 'Unknown Item';
                    const price = item.querySelector('.item-price')?.textContent || '$0.00';
                    const quantity = item.querySelector('.item-quantity')?.value || '1';
                    
                    cartContent += `${name} | Price: ${price} | Qty: ${quantity}\n`;
                });

                // Add summary
                cartContent += '\nSUMMARY:\n';
                cartContent += '--------------------------------\n';
                cartContent += `Subtotal: ${document.querySelector('.subtotal-amount')?.textContent || '$0.00'}\n`;
                cartContent += `Shipping: FREE\n`;
                cartContent += `Total: ${document.querySelector('.total-amount')?.textContent || '$0.00'}\n\n`;
                cartContent += 'Generated on: ' + new Date().toLocaleString();

                // Create and trigger download
                const blob = new Blob([cartContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `tradelines-cart-${new Date().getTime()}.txt`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
            } catch (error) {
                console.error('Error generating cart download:', error);
                alert('There was an error downloading your cart details. Please try again.');
            }
        });
    }
});
