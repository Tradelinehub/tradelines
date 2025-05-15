document.addEventListener("DOMContentLoaded", function () {
  const dynamicFields = document.getElementById("dynamicFields");
  const productType = document.getElementById("productType");
  const productModal = document.getElementById('productModal');
  const productForm = document.getElementById('productForm');
  const modalTitle = document.getElementById('modal-title');
  let editingRow = null;

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

  productForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const formData = new FormData(this);
    const data = Object.fromEntries(formData.entries());

    const typeText = productType.options[productType.selectedIndex].text;
    const imageSrc = `img/default.jpg`;
    const creditVal = data['credit-limit'] || data['loan-amount'] || '—';
    const years = data['how-many-years'] || '—';
    const price = data['discounted-price'] || '—';

    if (editingRow) {
      editingRow.innerHTML = `
        <td><img src="${imageSrc}" alt="${data.id}" width="50"></td>
        <td>${typeText}</td>
        <td>${data['id']}</td>
        <td>${creditVal}</td>
        <td>${years}</td>
        <td>${price}</td>
        <td>10</td>
        <td>
          <button class="btn-sm edit-btn"><i class="fas fa-edit"></i></button>
          <button class="btn-sm delete-btn"><i class="fas fa-trash"></i></button>
        </td>
      `;
      attachRowEventListeners(editingRow);
    } else {
      const table = document.getElementById('product-list');
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><img src="${imageSrc}" alt="${data.id}" width="50"></td>
        <td>${typeText}</td>
        <td>${data['id']}</td>
        <td>${creditVal}</td>
        <td>${years}</td>
        <td>${price}</td>
        <td>10</td>
        <td>
          <button class="btn-sm edit-btn"><i class="fas fa-edit"></i></button>
          <button class="btn-sm delete-btn"><i class="fas fa-trash"></i></button>
        </td>
      `;
      attachRowEventListeners(row);
      table.appendChild(row);
    }

    hideModal();
  });

  function attachRowEventListeners(row) {
    row.querySelector('.delete-btn').addEventListener('click', function () {
      row.remove();
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

  document.querySelectorAll('#product-list tr').forEach(attachRowEventListeners);
});
