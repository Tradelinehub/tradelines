document.addEventListener('DOMContentLoaded', () => {
  const productList = document.getElementById('product-list');

  loadProducts();

  async function loadProducts() {
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;

      productList.innerHTML = data.length
  ? data.map(p => `
    <tr>
      <td>${p.type || ''}</td>
      <td>${p.name || ''}</td>
      <td>${p.credit_limit || ''}</td>
      <td>${p.years || ''}</td>
      <td>${p.discount_price || ''}</td>
      <td>
        <button class="btn btn-edit" data-id="${p.id}">Edit</button>
        <button class="btn btn-delete" data-id="${p.id}">Delete</button>
      </td>
    </tr>`).join('')
  : '<tr><td colspan="6" style="text-align:center;">No products found</td></tr>';

      attachEventListeners();
    } catch (error) {
      console.error('Error loading products:', error);
      productList.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Failed to load products</td></tr>';
    }
  }

  // Rest of the file remains the same...
  function attachEventListeners() {
    // Delete buttons
    // In your attachEventListeners function
document.querySelectorAll('.btn-delete').forEach(btn => {
  btn.onclick = async () => {
    const id = btn.dataset.id;
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        // Show loading state
        btn.disabled = true;
        btn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Deleting...';
        
        // First try with regular delete
        let { error } = await supabaseClient
          .from('products')
          .delete()
          .eq('id', id);
        
        // If first attempt fails with RLS error, try as authenticated user
        if (error && error.message.includes('RLS')) {
          const { error: authError } = await supabaseClient
            .from('products')
            .delete()
            .eq('id', id)
            .select();
          
          if (authError) throw authError;
        } else if (error) {
          throw error;
        }
        
        // Success
        loadProducts();
      } catch (error) {
        console.error('Delete error:', error);
        let errorMessage = 'Failed to delete product';
        
        if (error.message.includes('1HIDDEN')) {
          errorMessage = 'Permission denied - check your RLS policies';
        } else if (error.message.includes('JWT')) {
          errorMessage = 'Authentication error - please refresh the page';
        }
        
        alert(errorMessage);
      } finally {
        btn.disabled = false;
        btn.textContent = 'Delete';
      }
    }
  };
});

    // Edit buttons
    document.querySelectorAll('.btn-edit').forEach(btn => {
      btn.onclick = async () => {
        const id = btn.dataset.id;
        try {
          const { data, error } = await supabaseClient.from('products').select('*').eq('id', id).single();
          if (error) throw error;
          
          const newName = prompt('Edit Product Name:', data.name);
          if (newName === null) return;

          const { error: updateError } = await supabaseClient
            .from('products')
            .update({ name: newName })
            .eq('id', id);

          if (updateError) throw updateError;
          loadProducts();
        } catch (error) {
          alert('Error: ' + error.message);
        }
      };
    });
  }
});