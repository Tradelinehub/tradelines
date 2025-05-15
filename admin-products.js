// Initialize Supabase
const supabaseUrl = 'https://vlwxcpssejuuegmqbcol.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsd3hjcHNzZWp1dWVnbXFiY29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTY0MjUsImV4cCI6MjA2Mjg5MjQyNX0.gGbP7xcCNNPGTDRoXzjtGrlKu9GDb4a94QkNVwxAt90';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", async function () {
  // DOM Elements
  const dynamicFields = document.getElementById("dynamicFields");
  const productType = document.getElementById("productType");
  const productModal = document.getElementById('productModal');
  const productForm = document.getElementById('productForm');
  const modalTitle = document.getElementById('modal-title');
  const productList = document.getElementById('product-list');
  const addProductBtn = document.getElementById('addProductBtn');
  const closeModalBtn = document.getElementById('closeModal');
  const cancelBtn = document.getElementById('cancelBtn');
  
  // State variables
  let editingRow = null;
  let currentProductId = null;
  let products = [];

  // Initialize the page
  await initializePage();

  // Event Listeners
  addProductBtn.addEventListener('click', showAddModal);
  closeModalBtn.addEventListener('click', hideModal);
  cancelBtn.addEventListener('click', hideModal);
  productType.addEventListener("change", updateDynamicFields);
  productForm.addEventListener('submit', handleFormSubmit);

  // Initialize page data
  async function initializePage() {
    await loadProducts();
    // Remove the hardcoded rows after loading from Supabase
    productList.querySelectorAll('tr').forEach(row => row.remove());
  }

  // Show modal for adding new product
  function showAddModal() {
    currentProductId = null;
    editingRow = null;
    modalTitle.textContent = "Add Product";
    productForm.reset();
    dynamicFields.innerHTML = '';
    productModal.classList.remove('hidden');
    productType.value = '';
  }

  // Hide modal
  function hideModal() {
    productModal.classList.add('hidden');
    editingRow = null;
    currentProductId = null;
  }

  // Update dynamic fields based on product type
  function updateDynamicFields() {
    const type = productType.value;
    dynamicFields.innerHTML = generateFieldsByType(type);
  }

  // Generate fields based on product type
  function generateFieldsByType(type) {
    if (!type) return '';
    
    let html = baseFields();

    const fieldsByType = {
      primary: ["Account Type", "Credit Limit", "Years", "Discount Price", "Stock"],
      auto: ["Vehicle", "Loan Amount", "Years", "Discount Price", "Stock"],
      business: ["Vendor", "Account Type", "Credit Limit", "Years", "Discount Price", "Stock"],
      mortgage: ["Lender", "Mortgage Type", "Loan Amount", "Years", "Discount Price", "Stock"],
      authorized: ["Credit Card", "Credit Limit", "Years", "Discount Price", "Stock"]
    };

    fieldsByType[type]?.forEach(label => html += inputField(label));
    return html;
  }

  // Base fields that appear for all product types
  function baseFields() {
    return inputField("Name") + inputField("Image URL");
  }

  // Helper function to generate input fields
  function inputField(label) {
    const id = label.toLowerCase().replace(/\s+/g, '-');
    const inputType = label === 'Stock' ? 'number' : 
                     label === 'Discount Price' || 
                     label === 'Credit Limit' || 
                     label === 'Loan Amount' ? 'number' : 'text';
    
    return `
      <div class="form-group">
        <label for="${id}">${label}</label>
        <input type="${inputType}" id="${id}" name="${id}" ${inputType === 'number' ? 'step="0.01"' : ''} required>
      </div>
    `;
  }

  // Handle form submission
  async function handleFormSubmit(event) {
    event.preventDefault();
    
    // Validate product type selection
    if (!productType.value) {
      alert('Please select a product type');
      return;
    }

    // Prepare form data
    const formData = new FormData(productForm);
    const data = Object.fromEntries(formData.entries());
    
    // Format numeric fields
    const formatNumber = (value) => value ? parseFloat(value) : null;
    
    // Create product data object
    const productData = {
      type: productType.value,
      type_text: productType.options[productType.selectedIndex].text,
      name: data['name'],
      image_url: data['image-url'],
      credit_limit: formatNumber(data['credit-limit']) || formatNumber(data['loan-amount']),
      years: data['years'],
      price: formatNumber(data['discount-price']),
      stock: parseInt(data['stock']) || 0,
      account_type: data['account-type'] || null,
      vehicle: data['vehicle'] || null,
      vendor: data['vendor'] || null,
      lender: data['lender'] || null,
      mortgage_type: data['mortgage-type'] || null,
      credit_card: data['credit-card'] || null,
      updated_at: new Date().toISOString()
    };

    try {
      if (currentProductId) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', currentProductId);
        
        if (error) throw error;
      } else {
        // Create new product
        productData.created_at = new Date().toISOString();
        const { error } = await supabase
          .from('products')
          .insert([productData]);
        
        if (error) throw error;
      }
      
      await loadProducts();
      hideModal();
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  }

  // Load products from Supabase
  async function loadProducts() {
    try {
      showLoadingState();
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      products = data || [];
      renderProducts();
    } catch (error) {
      console.error('Error loading products:', error);
      showErrorState();
    }
  }

  // Show loading state
  function showLoadingState() {
    productList.innerHTML = '<tr><td colspan="8" class="loading">Loading products...</td></tr>';
  }

  // Show error state
  function showErrorState() {
    productList.innerHTML = '<tr><td colspan="8" class="error">Error loading products. Please refresh the page.</td></tr>';
  }

  // Render products to the table
  function renderProducts() {
    productList.innerHTML = '';
    
    if (products.length === 0) {
      productList.innerHTML = '<tr><td colspan="8">No products found</td></tr>';
      return;
    }

    products.forEach(product => {
      const row = document.createElement('tr');
      row.dataset.id = product.id;
      row.innerHTML = `
        <td><img src="${product.image_url || 'img/default.jpg'}" alt="${product.name}" width="50" onerror="this.src='img/default.jpg'"></td>
        <td>${product.type_text}</td>
        <td>${product.name}</td>
        <td>${product.credit_limit ? '$' + product.credit_limit.toLocaleString() : '—'}</td>
        <td>${product.years || '—'}</td>
        <td>${product.price ? '$' + product.price.toFixed(2) : '—'}</td>
        <td>${product.stock || 0}</td>
        <td>
          <button class="btn-sm edit-btn"><i class="fas fa-edit"></i></button>
          <button class="btn-sm delete-btn"><i class="fas fa-trash"></i></button>
        </td>
      `;
      attachRowEventListeners(row);
      productList.appendChild(row);
    });
  }

  // Attach event listeners to product rows
  function attachRowEventListeners(row) {
    const productId = row.dataset.id;
    const product = products.find(p => p.id === productId);
    
    if (!product) return;
    
    // Delete button
    row.querySelector('.delete-btn').addEventListener('click', async function () {
      if (confirm(`Are you sure you want to delete "${product.name}"?`)) {
        try {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
          
          if (error) throw error;
          
          // Remove from local state and re-render
          products = products.filter(p => p.id !== productId);
          renderProducts();
        } catch (error) {
          console.error('Error deleting product:', error);
          alert('Error deleting product. Please try again.');
        }
      }
    });

    // Edit button
    row.querySelector('.edit-btn').addEventListener('click', async function () {
      try {
        currentProductId = productId;
        editingRow = row;
        modalTitle.textContent = "Edit Product";
        productModal.classList.remove('hidden');

        // Set the product type first
        productType.value = product.type;
        // Then generate the fields
        dynamicFields.innerHTML = generateFieldsByType(product.type);

        // Fill in the form fields - we need to wait for the fields to be created
        setTimeout(() => {
          document.getElementById('name').value = product.name || '';
          document.getElementById('image-url').value = product.image_url || '';
          
          // Fill dynamic fields
          if (document.getElementById('account-type')) {
            document.getElementById('account-type').value = product.account_type || '';
          }
          if (document.getElementById('credit-limit')) {
            document.getElementById('credit-limit').value = product.credit_limit || '';
          }
          if (document.getElementById('loan-amount')) {
            document.getElementById('loan-amount').value = product.credit_limit || '';
          }
          if (document.getElementById('years')) {
            document.getElementById('years').value = product.years || '';
          }
          if (document.getElementById('discount-price')) {
            document.getElementById('discount-price').value = product.price || '';
          }
          if (document.getElementById('stock')) {
            document.getElementById('stock').value = product.stock || '';
          }
          if (document.getElementById('vehicle')) {
            document.getElementById('vehicle').value = product.vehicle || '';
          }
          if (document.getElementById('vendor')) {
            document.getElementById('vendor').value = product.vendor || '';
          }
          if (document.getElementById('lender')) {
            document.getElementById('lender').value = product.lender || '';
          }
          if (document.getElementById('mortgage-type')) {
            document.getElementById('mortgage-type').value = product.mortgage_type || '';
          }
          if (document.getElementById('credit-card')) {
            document.getElementById('credit-card').value = product.credit_card || '';
          }
        }, 50);
      } catch (error) {
        console.error('Error loading product for edit:', error);
        alert('Error loading product details. Please try again.');
      }
    });
  }
});
