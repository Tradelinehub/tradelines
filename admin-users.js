document.addEventListener('DOMContentLoaded', function() {
  // Toggle user status
  const suspendButtons = document.querySelectorAll('[title="Suspend"], [title="Activate"], [title="Verify"]');
  suspendButtons.forEach(button => {
    button.addEventListener('click', function() {
      const row = this.closest('tr');
      const badge = row.querySelector('.badge');
      const isActive = badge.classList.contains('badge-active');
      const isPending = badge.classList.contains('badge-pending');
      
      if (isActive) {
        // Suspend active user
        if (confirm('Are you sure you want to suspend this user?')) {
          badge.classList.remove('badge-active');
          badge.classList.add('badge-suspended');
          badge.textContent = 'Suspended';
          this.setAttribute('title', 'Activate');
          this.innerHTML = '<i class="fas fa-user-check"></i>';
        }
      } else if (isPending) {
        // Verify pending user
        if (confirm('Verify this user?')) {
          badge.classList.remove('badge-pending');
          badge.classList.add('badge-active');
          badge.textContent = 'Active';
          this.setAttribute('title', 'Suspend');
          this.innerHTML = '<i class="fas fa-user-slash"></i>';
        }
      } else {
        // Activate suspended user
        if (confirm('Activate this user?')) {
          badge.classList.remove('badge-suspended');
          badge.classList.add('badge-active');
          badge.textContent = 'Active';
          this.setAttribute('title', 'Suspend');
          this.innerHTML = '<i class="fas fa-user-slash"></i>';
        }
      }
    });
  });

  // Delete user
  const deleteButtons = document.querySelectorAll('[title="Delete"]');
  deleteButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
        const row = this.closest('tr');
        row.style.opacity = '0.5';
        row.style.pointerEvents = 'none';
        
        // Simulate delete action
        setTimeout(() => {
          row.remove();
          updatePaginationInfo();
        }, 1000);
      }
    });
  });

  // Refresh button
  const refreshButton = document.querySelector('.btn-refresh');
  refreshButton.addEventListener('click', function() {
    this.querySelector('i').classList.add('fa-spin');
    setTimeout(() => {
      this.querySelector('i').classList.remove('fa-spin');
      alert('Data refreshed successfully!');
    }, 1000);
  });

  // Search functionality
  const searchInput = document.querySelector('.search-box input');
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value.toLowerCase();
    const rows = document.querySelectorAll('.users-table tbody tr');
    
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(searchTerm) ? '' : 'none';
    });
    
    updatePaginationInfo();
  });

  // Filter functionality
  const statusFilter = document.getElementById('status-filter');
  statusFilter.addEventListener('change', function() {
    const status = this.value;
    const rows = document.querySelectorAll('.users-table tbody tr');
    
    rows.forEach(row => {
      const badge = row.querySelector('.badge');
      const rowStatus = 
        badge.classList.contains('badge-active') ? 'active' :
        badge.classList.contains('badge-pending') ? 'pending' :
        badge.classList.contains('badge-suspended') ? 'suspended' : '';
      
      if (status === 'all' || rowStatus === status) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
    
    updatePaginationInfo();
  });

  // Pagination controls
  const paginationButtons = document.querySelectorAll('.btn-pagination:not(:disabled)');
  paginationButtons.forEach(button => {
    button.addEventListener('click', function() {
      if (!this.classList.contains('active')) {
        document.querySelector('.btn-pagination.active').classList.remove('active');
        this.classList.add('active');
        // In a real app, you would load the corresponding page data here
      }
    });
  });

  // Helper function to update pagination info
  function updatePaginationInfo() {
    const visibleRows = document.querySelectorAll('.users-table tbody tr:not([style*="display: none"])');
    const totalRows = document.querySelectorAll('.users-table tbody tr').length;
    document.querySelector('.pagination-info').textContent = 
      `Showing 1 to ${visibleRows.length} of ${totalRows} entries`;
  }

  // Export button
  const exportButton = document.querySelector('.btn-export');
  exportButton.addEventListener('click', function() {
    alert('Exporting user data to CSV...');
    // In a real app, you would generate and download a CSV file
  });

  // Add new user button
  const addUserButton = document.querySelector('.btn-add-user');
  addUserButton.addEventListener('click', function() {
    alert('Opening user creation form...');
    // In a real app, you would show a modal or redirect to a user creation page
  });
});