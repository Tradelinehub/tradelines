// admin-products.js

const SUPABASE_URL = 'https://vlwxcpssejuuegmqbcol.supabase.co'; // ← Replace with your project URL
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsd3hjcHNzZWp1dWVnbXFiY29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTY0MjUsImV4cCI6MjA2Mjg5MjQyNX0.gGbP7xcCNNPGTDRoXzjtGrlKu9GDb4a94QkNVwxAt90'; // ← Replace with your anon public key
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// DOM elements
const productList = document.getElementById('product-list');
const addProductBtn = document.getElementById('addProductBtn');
const productModal = document.getElementById('productModal');
const closeModal = document.getElementById('closeModal');
const cancelBtn = document.getElementById('cancelBtn');
const productForm = document.getElementById('productForm');
const productType = document.getElementById('productType');
const dynamicFields = document.getElementById('dynamicFields');
const modalTitle = document.getElementById('modal-title');

let editingProductId = null;

// Fetch and render products
async function loadProducts() {
  productList.innerHTML = '';
  const { data: products, error } = await supabase.from('products').select('*');
  if (error) return alert('Error loading products');

  products.forEach(product => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><img src="${product.image_url || 'img/default.jpg'}" alt="${product.type}" width="50"></td>
      <td>${capitalize(product.type)}</td>
      <td>${product.name}</td>
      <td>${product.credit_limit}</td>
      <td>${product.years}</td>
      <td>$${product.discount_price.toFixed(2)}</td>
      <td>${product.stock}</td>
      <td>
        <button class="btn-sm edit-btn" data-id="${product.id}"><i class="fas fa-edit"></i></button>
        <button class="btn-sm delete-btn" data-id="${product.id}"><i class="fas fa-trash"></i></button>
      </td>
    `;
    productList.appendChild(tr);
  });

  setupEventListeners();
}

function setupEventListeners() {
  document.querySelectorAll('.edit-btn').forEach(btn =>
    btn.onclick = () => openEditModal(btn.dataset.id)
  );
  document.querySelectorAll('.delete-btn').forEach(btn =>
    btn.onclick = () => deleteProduct(btn.dataset.id)
  );
}

// Add or Update Product
productForm.onsubmit = async (e) => {
  e.preventDefault();
  const formData = new FormData(productForm);
  const payload = {
    type: productType.value,
    name: formData.get('name'),
    credit_limit: formData.get('credit_limit'),
    years: formData.get('years'),
    discount_price: parseFloat(formData.get('discount_price')),
    stock: parseInt(formData.get('stock')),
    image_url: formData.get('image_url')
  };

  let result;
  if (editingProductId) {
    result = await supabase.from('products').update(payload).eq('id', editingProductId);
  } else {
    result = await supabase.from('products').insert(payload);
  }

  if (result.error) {
    alert('Failed to save product');
  } else {
    closeProductModal();
    loadProducts();
  }
};

// Delete
async function deleteProduct(id) {
  if (confirm('Delete this product?')) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) alert('Failed to delete product');
    else loadProducts();
  }
}

// Open Add Modal
addProductBtn.onclick = () => {
  editingProductId = null;
  modalTitle.textContent = 'Add Product';
  productForm.reset();
  dynamicFields.innerHTML = buildDynamicFields(); // Custom inputs
  openModal();
};

// Open Edit Modal
async function openEditModal(id) {
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error) return alert('Failed to load product');

  editingProductId = id;
  modalTitle.textContent = 'Edit Product';
  productType.value = data.type;
  dynamicFields.innerHTML = buildDynamicFields(data);
  openModal();
}

// Build Dynamic Fields
function buildDynamicFields(data = {}) {
  return `
    <div class="form-group"><label>Name</label><input name="name" required value="${data.name || ''}"></div>
    <div class="form-group"><label>Credit Limit</label><input name="credit_limit" value="${data.credit_limit || ''}"></div>
    <div class="form-group"><label>Years</label><input name="years" value="${data.years || ''}"></div>
    <div class="form-group"><label>Discount Price</label><input type="number" step="0.01" name="discount_price" value="${data.discount_price || ''}" required></div>
    <div class="form-group"><label>Stock</label><input type="number" name="stock" value="${data.stock || ''}" required></div>
    <div class="form-group"><label>Image URL</label><input name="image_url" value="${data.image_url || ''}"></div>
  `;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Modal Functions
function openModal() {
  productModal.classList.remove('hidden');
}
function closeProductModal() {
  productModal.classList.add('hidden');
  editingProductId = null;
}
closeModal.onclick = closeProductModal;
cancelBtn.onclick = closeProductModal;

// Load initial products
loadProducts();
