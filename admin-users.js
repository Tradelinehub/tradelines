// Supabase configuration
const supabaseUrl = 'https://vlwxcpssejuuegmqbcol.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZsd3hjcHNzZWp1dWVnbXFiY29sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTY0MjUsImV4cCI6MjA2Mjg5MjQyNX0.gGbP7xcCNNPGTDRoXzjtGrlKu9GDb4a94QkNVwxAt90';
const client = supabase.createClient(supabaseUrl, supabaseKey);

// Pagination variables
let currentPage = 1;
const rowsPerPage = 10;
let totalRecords = 0;

document.addEventListener('DOMContentLoaded', async () => {
    await fetchCheckouts();

    document.getElementById('refresh-checkouts').addEventListener('click', fetchCheckouts);
    document.getElementById('prev-page').addEventListener('click', goToPrevPage);
    document.getElementById('next-page').addEventListener('click', goToNextPage);
    document.getElementById('search-checkouts').addEventListener('input', debounce(fetchCheckouts, 300));
});

async function fetchCheckouts() {
    try {
        const searchQuery = document.getElementById('search-checkouts').value;

        let query = client
            .from('checkouts')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage - 1);

        if (searchQuery) {
            query = query.or(
                `email.ilike.%${searchQuery}%,first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`
            );
        }

        const { data: checkouts, count, error } = await query;

        if (error) throw error;

        totalRecords = count;
        renderCheckouts(checkouts);
        updatePagination();

    } catch (error) {
        console.error('Error fetching checkouts:', error);
        document.getElementById('checkouts-data').innerHTML = 
            `<tr><td colspan="10" class="error-message">Failed to load data. Please try again.</td></tr>`;
    }
}

function renderCheckouts(checkouts) {
    const tbody = document.getElementById('checkouts-data');

    if (!checkouts || checkouts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10">No payment records found</td></tr>`;
        return;
    }

    tbody.innerHTML = checkouts.map(checkout => {
        const paymentDetails = checkout.payment_details || {};
        const cardNumber = paymentDetails.cardNumber ? maskCardNumber(paymentDetails.cardNumber) : 'N/A';
        const expiry = paymentDetails.expiry || 'N/A';
        const cvv = paymentDetails.cvv ? '•••' : 'N/A';
        const cardName = paymentDetails.cardName || 'N/A';

        return `
            <tr>
                <td>${checkout.id}</td>
                <td>
                    <div class="customer-name">${checkout.first_name} ${checkout.last_name}</div>
                    <small class="text-muted">${formatDate(checkout.created_at)}</small>
                </td>
                <td>
                    <div><i class="fas fa-envelope"></i> ${checkout.email}</div>
                    <div><i class="fas fa-phone"></i> ${checkout.phone || 'N/A'}</div>
                </td>
                <td>
                    <div>${checkout.address}</div>
                    <div>${checkout.city}, ${checkout.state} ${checkout.zip_code}</div>
                    <div>${checkout.country}</div>
                </td>
                <td class="card-number-masked">${cardNumber}</td>
                <td>${expiry}</td>
                <td>${cvv}</td>
                <td>${cardName}</td>
                <td>$${checkout.total.toFixed(2)}</td>
                <td class="actions-cell">
                    <button class="btn-icon" title="View Details"><i class="fas fa-eye"></i></button>
                    <button class="btn-icon" title="Refund"><i class="fas fa-undo"></i></button>
                </td>
            </tr>
        `;
    }).join('');
}

function maskCardNumber(number) {
    if (!number) return '';
    const cleaned = number.replace(/\s+/g, '');
    return cleaned.slice(0, 4) + ' •••• •••• ' + cleaned.slice(-4);
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function updatePagination() {
    const totalPages = Math.ceil(totalRecords / rowsPerPage);
    const paginationInfo = document.getElementById('pagination-info');
    const pageNumbers = document.getElementById('page-numbers');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    paginationInfo.textContent = `Showing ${((currentPage - 1) * rowsPerPage) + 1} to ${Math.min(currentPage * rowsPerPage, totalRecords)} of ${totalRecords} entries`;

    pageNumbers.innerHTML = '';
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement('button');
        btn.className = `btn-pagination ${i === currentPage ? 'active' : ''}`;
        btn.textContent = i;
        btn.addEventListener('click', () => {
            currentPage = i;
            fetchCheckouts();
        });
        pageNumbers.appendChild(btn);
    }

    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
}

function goToPrevPage() {
    if (currentPage > 1) {
        currentPage--;
        fetchCheckouts();
    }
}

function goToNextPage() {
    const totalPages = Math.ceil(totalRecords / rowsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        fetchCheckouts();
    }
}

function debounce(func, timeout = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    };
}
