// Helper to convert admin tables into cards on small screens
function makeAdminTablesResponsive(container) {
  try {
    const tables = (container || document).querySelectorAll('.table-responsive .admin-table');
    tables.forEach(table => {
      if (table.dataset.responsiveEnhanced) return;
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());

      const cardsWrapper = document.createElement('div');
      cardsWrapper.className = 'admin-cards';

      Array.from(table.querySelectorAll('tbody tr')).forEach(tr => {
        const card = document.createElement('div');
        card.className = 'admin-card';

        Array.from(tr.children).forEach((td, idx) => {
          const labelText = headers[idx] || '';
          const row = document.createElement('div');
          row.className = 'admin-card-row';

          const label = document.createElement('div');
          label.className = 'label';
          label.textContent = labelText;

          const value = document.createElement('div');
          value.className = 'value';
          value.innerHTML = td.innerHTML;

          row.appendChild(label);
          row.appendChild(value);
          card.appendChild(row);
        });

        // Actions (last cell)
        const actionsCell = tr.querySelector('td:last-child');
        if (actionsCell) {
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'actions';
          actionsDiv.innerHTML = actionsCell.innerHTML;
          card.appendChild(actionsDiv);
        }

        cardsWrapper.appendChild(card);
      });

      table.parentNode.insertBefore(cardsWrapper, table.nextSibling);
      table.dataset.responsiveEnhanced = '1';
    });
  } catch (error) {
    console.error('makeAdminTablesResponsive error:', error);
  }
}

// Run on resize to ensure responsiveness
window.addEventListener('resize', () => {
  // no-op for now; cards are static once created
});
