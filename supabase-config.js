// Wait for Supabase to be loaded
function checkForSupabase() {
    if (typeof supabase !== 'undefined' && typeof supabase.createClient === 'function') {
        initializeSupabase();
    } else {
        setTimeout(checkForSupabase, 100);
    }
}

function initializeSupabase() {
    const supabaseUrl = 'https://vlwxcpssejuuegmqbcol.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsd3hjcHNzZWp1dWVnbXFiY29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTY0MjUsImV4cCI6MjA2Mjg5MjQyNX0.gGbP7xcCNNPGTDRoXzjtGrlKu9GDb4a94QkNVwxAt90';

    try {
        const client = supabase.createClient(supabaseUrl, supabaseKey);
        
        // Test connection
        client.from('products').select('*').limit(1)
            .then(() => {
                console.log('Supabase connected successfully');
                window.supabaseClient = client;
                document.dispatchEvent(new CustomEvent('supabase-ready'));
            })
            .catch(error => {
                console.error('Supabase connection test failed:', error);
                document.dispatchEvent(new CustomEvent('supabase-error', { 
                    detail: new Error('Connection test failed: ' + error.message) 
                }));
            });
    } catch (error) {
        console.error('Supabase initialization error:', error);
        document.dispatchEvent(new CustomEvent('supabase-error', { detail: error }));
    }
}

// Start checking for Supabase
checkForSupabase();