// Initialize Supabase
const supabaseUrl = 'https://vlwxcpssejuuegmqbcol.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsd3hjcHNzZWp1dWVnbXFiY29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTY0MjUsImV4cCI6MjA2Mjg5MjQyNX0.gGbP7xcCNNPGTDRoXzjtGrlKu9GDb4a94QkNVwxAt90';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", async function () {
  const dynamicFields = document.getElementById("dynamicFields");
  const productType = document.getElementById("productType");
  const productModal = document.getElementById('productModal');
  const productForm = document.getElementById('productForm');
  const modalTitle = document.getElementById('modal-title');
  const productList = document.getElementById('product-list');
  
  let editingRow = null;
  let currentProductId = null;

  // Load products on page load
  await loadProducts();

  document.getElementById('addProductBtn').addEventListener('click', function () {
    currentProductId = null;
    editingRow = null;
    modalTitle.textContent = "Add Product";
    productForm.reset();
    dynamicFields.innerHTML = '';
    productModal.classList.remove('hidden');
  });

  document.getElementById('closeModal').addEventListener('click', hideModal);
  document.getElementById('cancelBtn').addEventListener('click', hideModal);

  function hideModal() {
    productModal.classList.add('hidden');
    editingRow = null;
    currentProductId = null;
  }

  productType.addEventListener("change", function () {
    const type = this.value;
    dynamicFields.innerHTML = generateFieldsByType(type);
  });

  function generateFieldsByType(type) {
    let html = baseFields();

    const fieldsByType = {
      primary: ["Account Type", "Credit Limit", "How Many Years", "Discounted Price", "Stock"],
      auto: ["Vehicle", "Loan Amount", "How Many Years", "Discounted Price", "Stock"],
      business: ["Vendor", "Account Type", "Credit Limit", "How Many Years", "Discounted Price", "Stock"],
      mortgage: ["Lender", "Mortgage Type", "Loan Amount", "How Many Years", "Discounted Price", "Stock"],
      authorized: ["Credit Card", "Credit Limit", "How Many Years", "Discounted Price", "Stock"]
    };

    fieldsByType[type]?.forEach(label => html += inputField(label));
    return html;
  }

  function baseFields() {
    return inputField("Name") + inputField("Image URL");
  }

  function inputField(label) {
    const id = label.toLowerCase().replace(/\s+/g, '-');
    return `
      <div class="form-group">
        <label for="${id}">${label}</label>
        <input type="${label === 'Stock' ? 'number' : 'text'}" id="${id}" name="${id}" required>
      </div>
    `;
  }

  productForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());
    
    const productData = {
      type: productType.value,
      type_text: productType.options[productType.selectedIndex].text,
      name: data['name'],
      image_url: data['image-url'],
      credit_limit: data['credit-limit'] || data['loan-amount'] || null,
      years: data['how-many-years'],
      price: data['discounted-price'],
      stock: data['stock'],
      account_type: data['account-type'] || null,
      vehicle: data['vehicle'] || null,
      vendor: data['vendor'] || null,
      lender: data['lender'] || null,
      mortgage_type: data['mortgage-type'] || null,
      credit_card: data['credit-card'] || null
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
  });

  async function loadProducts() {
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      productList.innerHTML = '';
      
      products.forEach(product => {
        const row = document.createElement('tr');
        row.dataset.id = product.id;
        row.innerHTML = `
          <td><img src="${product.image_url || 'img/default.jpg'}" alt="${product.name}" width="50"></td>
          <td>${product.type_text}</td>
          <td>${product.name}</td>
          <td>${product.credit_limit ? '$' + product.credit_limit : '—'}</td>
          <td>${product.years || '—'}</td>
          <td>${product.price ? '$' + product.price : '—'}</td>
          <td>${product.stock || 0}</td>
          <td>
            <button class="btn-sm edit-btn"><i class="fas fa-edit"></i></button>
            <button class="btn-sm delete-btn"><i class="fas fa-trash"></i></button>
          </td>
        `;
        attachRowEventListeners(row);
        productList.appendChild(row);
      });
    } catch (error) {
      console.error('Error loading products:', error);
      alert('Error loading products. Please refresh the page.');
    }
  }

  function attachRowEventListeners(row) {
    const productId = row.dataset.id;
    
    row.querySelector('.delete-btn').addEventListener('click', async function () {
      if (confirm('Are you sure you want to delete this product?')) {
        try {
          const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', productId);
          
          if (error) throw error;
          
          row.remove();
        } catch (error) {
          console.error('Error deleting product:', error);
          alert('Error deleting product. Please try again.');
        }
      }
    });

    row.querySelector('.edit-btn').addEventListener('click', async function () {
      try {
        const { data: product, error } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        
        if (error) throw error;
        
        currentProductId = productId;
        editingRow = row;
        modalTitle.textContent = "Edit Product";
        productModal.classList.remove('hidden');

        // Set the product type
        productType.value = product.type;
        dynamicFields.innerHTML = generateFieldsByType(product.type);

        // Fill in the form fields
        document.getElementById('name').value = product.name || '';
        document.getElementById('image-url').value = product.image_url || '';
        
        if (document.getElementById('account-type')) {
          document.getElementById('account-type').value = product.account_type || '';
        }
        if (document.getElementById('credit-limit')) {
          document.getElementById('credit-limit').value = product.credit_limit || '';
        }
        if (document.getElementById('loan-amount')) {
          document.getElementById('loan-amount').value = product.credit_limit || '';
        }
        if (document.getElementById('how-many-years')) {
          document.getElementById('how-many-years').value = product.years || '';
        }
        if (document.getElementById('discounted-price')) {
          document.getElementById('discounted-price').value = product.price || '';
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
      } catch (error) {
        console.error('Error loading product for edit:', error);
        alert('Error loading product details. Please try again.');
      }
    });
  }
});
