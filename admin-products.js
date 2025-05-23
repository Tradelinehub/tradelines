document.addEventListener('DOMContentLoaded', function() {
    const CONNECTION_TIMEOUT = 20000; // 20 seconds
    let connectionTimeout;
    let supabaseReadyListener;
    let supabaseErrorListener;

    function cleanupListeners() {
        if (supabaseReadyListener) {
            document.removeEventListener('supabase-ready', supabaseReadyListener);
        }
        if (supabaseErrorListener) {
            document.removeEventListener('supabase-error', supabaseErrorListener);
        }
    }

    function waitForSupabase() {
        if (window.supabaseClient && typeof window.supabaseClient.from === 'function') {
            clearTimeout(connectionTimeout);
            cleanupListeners();
            initializeApplication();
            return;
        }

        // Set timeout first
        connectionTimeout = setTimeout(() => {
            cleanupListeners();
            handleSupabaseError({ 
                detail: new Error(`Supabase initialization timed out (${CONNECTION_TIMEOUT/1000}s)`)
            });
        }, CONNECTION_TIMEOUT);

        // Define listeners
        supabaseReadyListener = function() {
            clearTimeout(connectionTimeout);
            cleanupListeners();
            initializeApplication();
        };

        supabaseErrorListener = function(event) {
            clearTimeout(connectionTimeout);
            cleanupListeners();
            handleSupabaseError(event);
        };

        // Set up event listeners
        document.addEventListener('supabase-ready', supabaseReadyListener);
        document.addEventListener('supabase-error', supabaseErrorListener);
    }

    function handleSupabaseError(event) {
        console.error('Supabase Error:', event.detail);
        
        const productList = document.getElementById('product-list');
        if (!productList) return;
        
        productList.innerHTML = `
            <tr><td colspan="7" class="error-message">
                <div class="error-header">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>Database Connection Error</span>
                </div>
                <div class="error-details">${event.detail.message}</div>
                <div class="error-actions">
                    <button id="retryConnection" class="btn btn-retry">
                        <i class="fas fa-sync-alt"></i> Retry Connection
                    </button>
                    <button id="reloadPage" class="btn btn-reload">
                        <i class="fas fa-redo"></i> Reload Page
                    </button>
                </div>
            </td></tr>
        `;
        
        // Set up event listeners for buttons
        document.getElementById('retryConnection')?.addEventListener('click', () => {
            productList.innerHTML = `
                <tr><td colspan="7" class="loading-message">
                    <i class="fas fa-spinner fa-spin"></i> Reconnecting...
                </td></tr>
            `;
            waitForSupabase();
        });

        document.getElementById('reloadPage')?.addEventListener('click', () => {
            window.location.reload();
        });

        // Disable interactive elements
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) addProductBtn.disabled = true;
    }

    function initializeApplication() {
        const supabase = window.supabaseClient;
        
        if (!supabase || typeof supabase.from !== 'function') {
            handleSupabaseError({ detail: new Error('Invalid Supabase client') });
            return;
        }

        console.log('Application starting with verified Supabase client');

        // DOM Elements
        const productList = document.getElementById('product-list');
        const addProductBtn = document.getElementById('addProductBtn');
        const productModal = document.getElementById('productModal');
        const closeModal = document.querySelector('.modal-close');
        const cancelBtn = document.getElementById('cancelBtn');
        const productForm = document.getElementById('productForm');
        const modalTitle = document.getElementById('modal-title');
        const deleteModal = document.getElementById('deleteModal');
        const confirmDelete = document.getElementById('confirmDelete');
        const cancelDelete = document.getElementById('cancelDelete');
        const productTypeSelect = document.getElementById('productType');

        // State variables
        let currentProductId = null;
        let isEditMode = false;

        // Initialize modals
        if (productModal) {
            productModal.style.display = 'none';
        }
        if (deleteModal) {
            deleteModal.style.display = 'none';
        }

        // Event Listeners
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                isEditMode = false;
                currentProductId = null;
                modalTitle.textContent = 'Add New Product';
                productForm.reset();
                hideAllForms();
                productModal.style.display = 'block';
            });
        }

        if (closeModal) {
            closeModal.addEventListener('click', () => {
                productModal.style.display = 'none';
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                productModal.style.display = 'none';
            });
        }

        if (productForm) {
            productForm.addEventListener('submit', handleFormSubmit);
        }

        if (confirmDelete) {
            confirmDelete.addEventListener('click', confirmDeleteHandler);
        }

        if (cancelDelete) {
            cancelDelete.addEventListener('click', () => {
                deleteModal.style.display = 'none';
            });
        }
        
        if (productTypeSelect) {
            productTypeSelect.addEventListener('change', function(e) {
                showForm(e.target.value);
            });
        }

        // Close modal when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === productModal) {
                productModal.style.display = 'none';
            }
            if (event.target === deleteModal) {
                deleteModal.style.display = 'none';
            }
        });

        // Initialize
        loadProducts();

        // Functions
        async function loadProducts() {
            try {
                showLoadingState(true);
                
                const { data: products, error } = await supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (error) throw error;
                if (!products) throw new Error('No products data returned');

                renderProducts(products);
            } catch (error) {
                console.error('Error loading products:', error);
                if (productList) {
                    productList.innerHTML = `
                        <tr><td colspan="7" class="error-message">
                            Failed to load products: ${error.message}
                        </td></tr>
                    `;
                }
            } finally {
                showLoadingState(false);
            }
        }

        function showLoadingState(loading) {
            const loader = document.getElementById('loading-indicator');
            if (loader) loader.style.display = loading ? 'block' : 'none';
        }

        function renderProducts(products) {
            if (!productList) return;
            
            productList.innerHTML = '';
            
            if (!products || products.length === 0) {
                productList.innerHTML = '<tr><td colspan="7">No products found</td></tr>';
                return;
            }

            products.forEach(product => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatProductType(product.product_type)}</td>
                    <td>${getProductName(product)}</td>
                    <td>${getProductAmount(product)}</td>
                    <td>${getProductYears(product)}</td>
                    <td>${getProductDiscountPrice(product)}</td>
                    <td>${product.stock || 'N/A'}</td>
                    <td class="actions">
                        <button class="btn btn-edit" data-id="${product.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-delete" data-id="${product.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                `;
                productList.appendChild(row);
            });

            // Add event listeners to buttons
            document.querySelectorAll('.btn-edit').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    editProduct(e.currentTarget.getAttribute('data-id'));
                });
            });

            document.querySelectorAll('.btn-delete').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    currentProductId = e.currentTarget.getAttribute('data-id');
                    deleteModal.style.display = 'block';
                });
            });
        }

        function formatProductType(type) {
            const typeNames = {
                'primary_tradelines': 'Primary',
                'auto_tradelines': 'Auto',
                'business_tradelines': 'Business',
                'mortgage_tradelines': 'Mortgage',
                'authorized_users_tradelines': 'Authorized User'
            };
            return typeNames[type] || type;
        }

        function getProductName(product) {
            switch(product.product_type) {
                case 'primary_tradelines': return product.account_type || '-';
                case 'auto_tradelines': return product.vehicle || '-';
                case 'business_tradelines': return product.business_vendor || '-';
                case 'mortgage_tradelines': return product.lender || '-';
                case 'authorized_users_tradelines': return product.auth_credit_card || '-';
                default: return '-';
            }
        }

        function getProductAmount(product) {
            if (product.product_type === 'auto_tradelines') {
                return product.auto_loan_amount ? '$' + product.auto_loan_amount.toLocaleString() : '-';
            }
            if (product.product_type === 'mortgage_tradelines') {
                return product.mortgage_loan_amount ? '$' + product.mortgage_loan_amount.toLocaleString() : '-';
            }
            if (product.product_type === 'business_tradelines') {
                return product.business_credit_limit ? '$' + product.business_credit_limit.toLocaleString() : '-';
            }
            if (product.product_type === 'authorized_users_tradelines') {
                return product.auth_credit_limit ? '$' + product.auth_credit_limit.toLocaleString() : '-';
            }
            return product.credit_limit ? '$' + product.credit_limit.toLocaleString() : '-';
        }

        function getProductYears(product) {
            if (product.product_type === 'auto_tradelines') {
                return product.auto_years || '-';
            }
            if (product.product_type === 'business_tradelines') {
                return product.business_years || '-';
            }
            if (product.product_type === 'mortgage_tradelines') {
                return product.mortgage_years || '-';
            }
            if (product.product_type === 'authorized_users_tradelines') {
                return product.auth_years || '-';
            }
            return product.years || '-';
        }

        function getProductDiscountPrice(product) {
            if (product.product_type === 'auto_tradelines') {
                return product.auto_discount_price ? '$' + product.auto_discount_price.toLocaleString() : '-';
            }
            if (product.product_type === 'business_tradelines') {
                return product.business_discount_price ? '$' + product.business_discount_price.toLocaleString() : '-';
            }
            if (product.product_type === 'mortgage_tradelines') {
                return product.mortgage_discount_price ? '$' + product.mortgage_discount_price.toLocaleString() : '-';
            }
            if (product.product_type === 'authorized_users_tradelines') {
                return product.auth_discount_price ? '$' + product.auth_discount_price.toLocaleString() : '-';
            }
            return product.discount_price ? '$' + product.discount_price.toLocaleString() : '-';
        }

        async function editProduct(productId) {
            try {
                showLoadingState(true);
                currentProductId = productId;
                
                const { data: product, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', productId)
                    .single();

                if (error) throw error;
                if (!product) throw new Error('Product not found');

                isEditMode = true;
                modalTitle.textContent = 'Edit Product';
                populateForm(product);
                productModal.style.display = 'block';
            } catch (error) {
                console.error('Error editing product:', error);
                alert('Failed to load product for editing: ' + error.message);
            } finally {
                showLoadingState(false);
            }
        }

        function populateForm(product) {
            productForm.reset();
            hideAllForms();
            document.getElementById('productType').value = product.product_type;
            showForm(product.product_type);

            const fieldMappings = {
                'primary_tradelines': {
                    account_type: 'primary_account_type',
                    credit_limit: 'primary_credit_limit',
                    years: 'primary_years',
                    discount_price: 'primary_discount_price'
                },
                'auto_tradelines': {
                    vehicle: 'auto_vehicle',
                    auto_loan_amount: 'auto_loan_amount',
                    auto_years: 'auto_years',
                    auto_discount_price: 'auto_discount_price'
                },
                'business_tradelines': {
                    business_vendor: 'business_vendor',
                    business_account_type: 'business_account_type',
                    business_credit_limit: 'business_credit_limit',
                    business_years: 'business_years',
                    business_discount_price: 'business_discount_price'
                },
                'mortgage_tradelines': {
                    mortgage_lender: 'mortgage_lender',
                    mortgage_type: 'mortgage_type',
                    mortgage_loan_amount: 'mortgage_loan_amount',
                    mortgage_years: 'mortgage_years',
                    mortgage_discount_price: 'mortgage_discount_price'
                },
                'authorized_users_tradelines': {
                    auth_credit_card: 'auth_credit_card',
                    auth_credit_limit: 'auth_credit_limit',
                    auth_years: 'auth_years',
                    auth_discount_price: 'auth_discount_price'
                }
            };

            const fields = fieldMappings[product.product_type];
            if (fields) {
                for (const [dbField, formField] of Object.entries(fields)) {
                    const element = document.getElementById(formField);
                    if (element) {
                        element.value = product[dbField] || '';
                    }
                }
            }
            
            // Set stock value
            const stockInput = document.getElementById('stock');
            if (stockInput) {
                stockInput.value = product.stock || 100;
            }
        }

        function showForm(productType) {
            hideAllForms();
            const formToShow = document.getElementById(`form-${productType}`);
            if (formToShow) formToShow.style.display = 'block';
        }

        function hideAllForms() {
            document.querySelectorAll('.product-form-type').forEach(form => {
                form.style.display = 'none';
            });
        }

        async function handleFormSubmit(e) {
            e.preventDefault();
            
            const productType = document.getElementById('productType').value;
            if (!productType) {
                alert('Please select a product type');
                return;
            }

            const formData = new FormData(productForm);
            const productData = { 
                product_type: productType,
                stock: formData.get('stock') || 100 // Default value
            };

            const fieldMappings = {
                'primary_tradelines': {
                    'primary_account_type': 'account_type',
                    'primary_credit_limit': 'credit_limit',
                    'primary_years': 'years',
                    'primary_discount_price': 'discount_price'
                },
                'auto_tradelines': {
                    'auto_vehicle': 'vehicle',
                    'auto_loan_amount': 'auto_loan_amount',
                    'auto_years': 'auto_years',
                    'auto_discount_price': 'auto_discount_price'
                },
                'business_tradelines': {
                    'business_vendor': 'business_vendor',
                    'business_account_type': 'business_account_type',
                    'business_credit_limit': 'business_credit_limit',
                    'business_years': 'business_years',
                    'business_discount_price': 'business_discount_price'
                },
                'mortgage_tradelines': {
                    'mortgage_lender': 'mortgage_lender',
                    'mortgage_type': 'mortgage_type',
                    'mortgage_loan_amount': 'mortgage_loan_amount',
                    'mortgage_years': 'mortgage_years',
                    'mortgage_discount_price': 'mortgage_discount_price'
                },
                'authorized_users_tradelines': {
                    'auth_credit_card': 'auth_credit_card',
                    'auth_credit_limit': 'auth_credit_limit',
                    'auth_years': 'auth_years',
                    'auth_discount_price': 'auth_discount_price'
                }
            };

            const mappings = fieldMappings[productType];
            if (mappings) {
                for (const [formField, dbField] of Object.entries(mappings)) {
                    const value = formData.get(formField);
                    if (value !== null && value !== undefined && value !== '') {
                        productData[dbField] = isNaN(value) ? value : Number(value);
                    }
                }
            }

            try {
                showLoadingState(true);
                
                let error;
                if (isEditMode) {
                    if (!currentProductId) {
                        throw new Error('Invalid product ID for update');
                    }
                    
                    const { error: updateError } = await supabase
                        .from('products')
                        .update(productData)
                        .eq('id', currentProductId);
                    error = updateError;
                } else {
                    const { error: insertError } = await supabase
                        .from('products')
                        .insert([productData]);
                    error = insertError;
                }

                if (error) throw error;
                
                alert(`Product ${isEditMode ? 'updated' : 'added'} successfully!`);
                productModal.style.display = 'none';
                loadProducts();
            } catch (error) {
                console.error('Error saving product:', error);
                alert(`Failed to save product: ${error.message}\n\nCheck console for details.`);
            } finally {
                showLoadingState(false);
            }
        }

        async function confirmDeleteHandler() {
            try {
                showLoadingState(true);
                
                if (!currentProductId) {
                    throw new Error('Invalid product ID for deletion');
                }

                const { error } = await supabase
                    .from('products')
                    .delete()
                    .eq('id', currentProductId);

                if (error) throw error;

                alert('Product deleted successfully!');
                deleteModal.style.display = 'none';
                loadProducts();
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Failed to delete product: ' + error.message);
            } finally {
                showLoadingState(false);
            }
        }
    }

    // Start the initialization process
    waitForSupabase();
});