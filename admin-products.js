<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js"></script>
<script>
document.addEventListener("DOMContentLoaded", function () {
  // Initialize Supabase
  const supabaseUrl = "https://vlwxcpssejuuegmqbcol.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsd3hjcHNzZWp1dWVnbXFiY29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTY0MjUsImV4cCI6MjA2Mjg5MjQyNX0.gGbP7xcCNNPGTDRoXzjtGrlKu9GDb4a94QkNVwxAt90";
  const supabase = supabase.createClient(supabaseUrl, supabaseKey);

  const dynamicFields = document.getElementById("dynamicFields");
  const productType = document.getElementById("productType");
  const productModal = document.getElementById('productModal');
  const productForm = document.getElementById('productForm');
  const modalTitle = document.getElementById('modal-title');
  let editingRow = null;
  let editingProductId = null;

  document.getElementById('addProductBtn').addEventListener('click', function () {
    editingRow = null;
    editingProductId = null;
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
    editingProductId = null;
  }

  productType.addEventListener("change", function () {
    const type = this.value;
    dynamicFields.innerHTML = generateFieldsByType(type);
  });

  function generateFieldsByType(type) {
    let html = baseFields();

    const fieldsByType = {
      primary: ["Account Type", "Credit Limit", "How Many Years", "Discounted Price"],
      auto: ["Vehicle", "Loan Amount", "How Many Years", "Discounted Price"],
      business: ["Vendor", "Account Type", "Credit Limit", "How Many Years", "Discounted Price"],
      mortgage: ["Lender", "Mortgage Type", "Loan Amount", "How Many Years", "Discounted Price"],
      authorized: ["Credit Card", "Credit Limit", "How Many Years", "Discounted Price"]
    };

    fieldsByType[type]?.forEach(label => html += inputField(label));
    return html;
  }

  function baseFields() {
    return inputField("ID");
  }

  function inputField(label) {
    const id = label.toLowerCase().replace(/\s+/g, '-');
    return `
      <div class="form-group">
        <label for="${id}">${label}</label>
        <input type="text" id="${id}" name="${id}" required>
      </div>
    `;
  }

  productForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    const type = productType.value;
    const typeText = productType.options[productType.selectedIndex].text;
    const imageSrc = `img/default.jpg`;
    const creditVal = data['credit-limit'] || data['loan-amount'] || '—';
    const years = data['how-many-years'] || '—';
    const price = data['discounted-price'] || '—';

    const newProduct = {
      id: data['id'],
      type: type,
      type_label: typeText,
      credit_value: creditVal,
      years: years,
      price: price,
      image_url: imageSrc,
      metadata: JSON.stringify(data)  // You can customize this to only include custom fields
    };

    let supabaseResponse;
    if (editingProductId) {
      supabaseResponse = await supabase
        .from('products')
        .update(newProduct)
        .eq('id', editingProductId);
    } else {
      supabaseResponse = await supabase
        .from('products')
        .insert(newProduct);
    }

    if (supabaseResponse.error) {
      alert("Supabase error: " + supabaseResponse.error.message);
      return;
    }

    if (editingRow) {
      editingRow.innerHTML = renderRowHTML(newProduct);
      attachRowEventListeners(editingRow);
    } else {
      const table = document.getElementById('product-list');
      const row = document.createElement('tr');
      row.innerHTML = renderRowHTML(newProduct);
      attachRowEventListeners(row);
      table.appendChild(row);
    }

    hideModal();
  });

  function renderRowHTML(data) {
    return `
      <td><img src="${data.image_url}" alt="${data.id}" width="50"></td>
      <td>${data.type_label}</td>
      <td>${data.id}</td>
      <td>${data.credit_value}</td>
      <td>${data.years}</td>
      <td>${data.price}</td>
      <td>10</td>
      <td>
        <button class="btn-sm edit-btn"><i class="fas fa-edit"></i></button>
        <button class="btn-sm delete-btn"><i class="fas fa-trash"></i></button>
      </td>
    `;
  }

  function attachRowEventListeners(row) {
    row.querySelector('.delete-btn').addEventListener('click', async function () {
      const productId = row.children[2].textContent;
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (!error) row.remove();
      else alert("Failed to delete product.");
    });

    row.querySelector('.edit-btn').addEventListener('click', async function () {
      editingRow = row;
      modalTitle.textContent = "Edit Product";
      productModal.classList.remove('hidden');

      const type = row.children[1].textContent.toLowerCase();
      const id = row.children[2].textContent;
      const credit = row.children[3].textContent;
      const years = row.children[4].textContent;
      const price = row.children[5].textContent;

      productType.value = type;
      dynamicFields.innerHTML = generateFieldsByType(type);

      document.getElementById('id').value = id;
      if (document.getElementById('credit-limit')) {
        document.getElementById('credit-limit').value = credit;
      }
      if (document.getElementById('loan-amount')) {
        document.getElementById('loan-amount').value = credit;
      }
      if (document.getElementById('how-many-years')) {
        document.getElementById('how-many-years').value = years;
      }
      if (document.getElementById('discounted-price')) {
        document.getElementById('discounted-price').value = price;
      }

      editingProductId = id;
    });
  }

  // OPTIONAL: Load products from Supabase on page load
  async function loadProducts() {
    const { data, error } = await supabase.from('products').select('*');
    if (error) return console.error(error);

    const table = document.getElementById('product-list');
    data.forEach(product => {
      const row = document.createElement('tr');
      row.innerHTML = renderRowHTML(product);
      attachRowEventListeners(row);
      table.appendChild(row);
    });
  }

  loadProducts();
});
</script>
