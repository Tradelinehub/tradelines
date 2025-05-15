  // ✅ Supabase init
  const supabase = supabase.createClient(
    'https://vlwxcpssejuuegmqbcol.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsd3hjcHNzZWp1dWVnbXFiY29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTY0MjUsImV4cCI6MjA2Mjg5MjQyNX0.gGbP7xcCNNPGTDRoXzjtGrlKu9GDb4a94QkNVwxAt90'
  );

  document.addEventListener("DOMContentLoaded", async function () {
    const dynamicFields = document.getElementById("dynamicFields");
    const productType = document.getElementById("productType");
    const productModal = document.getElementById('productModal');
    const productForm = document.getElementById('productForm');
    const modalTitle = document.getElementById('modal-title');
    const table = document.getElementById('product-list');
    let editingRow = null;

    // ✅ Load existing products
    const { data: products, error } = await supabase.from('products').select('*');
    if (products) {
      products.forEach(item => {
        const row = createTableRow(item);
        attachRowEventListeners(row);
        table.appendChild(row);
      });
    }

    document.getElementById('addProductBtn').addEventListener('click', function () {
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
      const creditVal = data['credit-limit'] || data['loan-amount'] || null;
      const years = data['how-many-years'] || null;
      const price = data['discounted-price'] || null;

      // ✅ Supabase Insert
      const { error } = await supabase.from('products').insert([{
        id: data['id'],
        type,
        credit: creditVal,
        years,
        price
      }]);

      if (error) {
        alert("Error saving to Supabase");
        console.error(error.message);
        return;
      }

      const row = createTableRow({
        id: data['id'],
        type,
        credit: creditVal,
        years,
        price
      });
      attachRowEventListeners(row);
      table.appendChild(row);

      hideModal();
    });

    function createTableRow(data) {
      const typeText = capitalizeFirst(data.type);
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><img src="img/default.jpg" alt="${data.id}" width="50"></td>
        <td>${typeText}</td>
        <td>${data.id}</td>
        <td>${data.credit || '—'}</td>
        <td>${data.years || '—'}</td>
        <td>${data.price || '—'}</td>
        <td>10</td>
        <td>
          <button class="btn-sm edit-btn"><i class="fas fa-edit"></i></button>
          <button class="btn-sm delete-btn"><i class="fas fa-trash"></i></button>
        </td>
      `;
      return row;
    }

    function attachRowEventListeners(row) {
      row.querySelector('.delete-btn').addEventListener('click', async function () {
        const id = row.children[2].textContent;

        // ✅ Supabase Delete
        const { error } = await supabase.from('products').delete().eq('id', id);
        if (!error) row.remove();
        else console.error(error.message);
      });

      row.querySelector('.edit-btn').addEventListener('click', function () {
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
      });
    }

    function capitalizeFirst(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }
  });
