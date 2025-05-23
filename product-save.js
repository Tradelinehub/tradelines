document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('productForm');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Saving...';

    try {
      // 1. Validate connection
      if (!await checkSupabaseConnection()) {
        throw new Error('Cannot connect to database server');
      }

      // 2. Prepare payload
      const payload = preparePayload(form);
      
      // 3. Save with retry logic
      const result = await saveWithRetry(payload);
      
      // 4. Handle success
      handleSaveSuccess(form);

    } catch (error) {
      handleSaveError(error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  });

  // Helper functions
  async function checkSupabaseConnection() {
    try {
      const { data, error } = await supabaseClient
        .from('products')
        .select('id')
        .limit(1)
        .single();
      
      return !error;
    } catch {
      return false;
    }
  }

  function preparePayload(form) {
    const type = form.product_type.value;
    const section = document.getElementById(`form-${type}`);
    if (!section) throw new Error('Invalid product type selected');

    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    
    // Convert numeric fields
    ['years', 'credit_limit', 'discount_price', 'stock'].forEach(field => {
      if (payload[field]) payload[field] = Number(payload[field]);
    });

    payload.created_at = new Date().toISOString();
    return payload;
  }

  async function saveWithRetry(payload, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const { error } = await supabaseClient
          .from('products')
          .insert([payload]);
        
        if (!error) return true;
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      } catch (error) {
        if (i === retries - 1) throw error;
      }
    }
    throw new Error('Max retries reached');
  }

  function handleSaveSuccess(form) {
    // Show success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'alert alert-success';
    successDiv.textContent = 'Product saved successfully!';
    form.prepend(successDiv);
    
    // Reset form
    form.reset();
    document.getElementById('productModal').classList.add('hidden');
    
    // Remove alert after 3 seconds
    setTimeout(() => successDiv.remove(), 3000);
    
    // Refresh product list
    if (typeof loadProducts === 'function') loadProducts();
  }

  function handleSaveError(error) {
    console.error('Save error:', error);
    
    let errorMessage = 'Failed to save product';
    if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error - please check your connection';
    } else if (error.message.includes('JWT expired')) {
      errorMessage = 'Session expired - please refresh the page';
    } else if (error.message.includes('permission denied')) {
      errorMessage = 'Permission denied - check your database permissions';
    }
    
    alert(errorMessage);
  }
});