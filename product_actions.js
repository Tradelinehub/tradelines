import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

const supabaseUrl = 'https://vlwxcpssejuuegmqbcol.supabase.co';
const supabaseKey = 'your_supabase_key_here';  // Put your real key here or import from secure location
const supabase = createClient(supabaseUrl, supabaseKey);

// Delete product by ID
export async function deleteProduct(productId) {
  if (!confirm('Are you sure you want to delete this product?')) return;

  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', productId);

  if (error) {
    alert('Delete failed: ' + error.message);
    console.error(error);
    return;
  }

  alert('Product deleted successfully!');
  // Optionally reload the product list here
  window.location.reload();
}

// Open Edit Modal (you will need to create a modal UI)
export async function openEditProductModal(productId) {
  // Fetch product data by id
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error) {
    alert('Failed to fetch product data: ' + error.message);
    return;
  }

  // Populate your modal fields with 'data'
  // Show modal logic here...

  // For demo, just alert
  alert(`Edit product ${data.name} (ID: ${productId}) - Implement your modal UI here.`);
}
