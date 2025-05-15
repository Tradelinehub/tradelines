// admin-products.js

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  document.getElementById('addProductBtn').addEventListener('click', openAddModal);
  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('productForm').addEventListener('submit', saveProduct);
});

let currentProductId = null;

async function loadProducts() {
  const { data, error } = await supabase.from('products').select('*');
  const tbody = document.getElementById('product-list');
  tbody.innerHTML = '';

  if (error) return alert('Failed to load products.');

  data.forEach(product => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${product.image_url}" width="50" /></td>
      <td>${product.type}</td>
      <td>${product.name}</td>
      <td>${product.credit_limit}</td>
      <td>${product.years}</td>
      <td>$${product.price}</td>
      <td>${product.stock}</td>
      <td>
        <button class="btn-sm edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-sm delete-btn" data-id="${product.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelectorAll('.edit-btn').forEach(btn =>
    btn.addEventListener('click', () => openEditModal(btn.dataset.id))
  );
  document.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', () => deleteProduct(btn.dataset.id))
  );
}

function openAddModal() {
  currentProductId = null;
  document.getElementById('modal-title').textContent = 'Add Product';
  document.getElementById('productForm').reset();
  document.getElementById('productModal').classList.remove('hidden');
}

async function openEditModal(id) {
  const { data: product } = await supabase.from('products').select('*').eq('id', id).single();

  currentProductId = id;
  document.getElementById('modal-title').textContent = 'Edit Product';
  document.getElementById('productType').value = product.type;

  // Fill dynamic fields
  const fields = `
    <div class="form-group">
      <label>Name</label><input type="text" id="productName" value="${product.name}" required>
    </div>
    <div class="form-group">
      <label>Credit Limit</label><input type="text" id="creditLimit" value="${product.credit_limit}" required>
    </div>
    <div class="form-group">
      <label>Years</label><input type="text" id="years" value="${product.years}" required>
    </div>
    <div class="form-group">
      <label>Price</label><input type="number" id="price" value="${product.price}" required>
    </div>
    <div class="form-group">
      <label>Stock</label><input type="number" id="stock" value="${product.stock}" required>
    </div>
    <div class="form-group">
      <label>Image URL</label><input type="text" id="imageUrl" value="${product.image_url}" required>
    </div>
  `;
  document.getElementById('dynamicFields').innerHTML = fields;
  document.getElementById('productModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('productModal').classList.add('hidden');
}

async function saveProduct(e) {
  e.preventDefault();

  const product = {
    type: document.getElementById('productType').value,
    name: document.getElementById('productName')?.value || '',
    credit_limit: document.getElementById('creditLimit')?.value || '',
    years: document.getElementById('years')?.value || '',
    price: parseFloat(document.getElementById('price')?.value || 0),
    stock: parseInt(document.getElementById('stock')?.value || 0),
    image_url: document.getElementById('imageUrl')?.value || '',
  };

  let result;
  if (currentProductId) {
    result = await supabase.from('products').update(product).eq('id', currentProductId);
  } else {
    result = await supabase.from('products').insert(product);
  }

  if (result.error) {
    alert('Error saving product.');
  } else {
    closeModal();
    loadProducts(); // Refresh
  }
}

async function deleteProduct(id) {
  if (!confirm('Are you sure you want to delete this product?')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) return alert('Failed to delete.');
  loadProducts();
}
