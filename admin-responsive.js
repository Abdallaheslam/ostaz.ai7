// Helper to convert admin tables into collapsible cards on small screens
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

        // Header row: image/name/price & toggle
        const headerRow = document.createElement('div');
        headerRow.className = 'admin-card-header';

        // Create compact columns: first 2 cells as header preview
        const cells = Array.from(tr.children);
        const previewLeft = document.createElement('div');
        previewLeft.className = 'preview-left';
        previewLeft.innerHTML = (cells[0] ? cells[0].innerHTML : '') + (cells[1] ? `<div class="name">${cells[1].innerText}</div>` : '');

        const previewRight = document.createElement('div');
        previewRight.className = 'preview-right';
        previewRight.innerHTML = (cells[2] ? cells[2].innerHTML : '');

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'card-toggle';
        toggleBtn.innerHTML = 'تفاصيل ▾';
        toggleBtn.setAttribute('aria-expanded', 'false');

        headerRow.appendChild(previewLeft);
        headerRow.appendChild(previewRight);
        headerRow.appendChild(toggleBtn);
        card.appendChild(headerRow);

        // Details (other columns)
        const details = document.createElement('div');
        details.className = 'admin-card-details';
        details.style.display = 'none';

        Array.from(tr.children).forEach((td, idx) => {
          // skip first two cells (preview) and last actions (added separately)
          if (idx < 2) return;
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
          details.appendChild(row);
        });

        // Actions (last cell)
        const actionsCell = tr.querySelector('td:last-child');
        if (actionsCell) {
          const actionsDiv = document.createElement('div');
          actionsDiv.className = 'actions';
          actionsDiv.innerHTML = actionsCell.innerHTML;
          // make buttons touch-friendly
          Array.from(actionsDiv.querySelectorAll('button')).forEach(btn => {
            btn.style.padding = '10px 12px';
            btn.style.minWidth = '44%';
            btn.style.marginRight = '6px';
          });
          details.appendChild(actionsDiv);
        }

        card.appendChild(details);

        // Toggle behavior
        toggleBtn.addEventListener('click', () => {
          const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
          toggleBtn.setAttribute('aria-expanded', String(!isOpen));
          toggleBtn.innerHTML = isOpen ? 'تفاصيل ▾' : 'خفّي ▴';
          details.style.display = isOpen ? 'none' : 'block';
        });

        cardsWrapper.appendChild(card);
      });

      table.parentNode.insertBefore(cardsWrapper, table.nextSibling);
      table.dataset.responsiveEnhanced = '1';
    });
  } catch (error) {
    console.error('makeAdminTablesResponsive error:', error);
  }
}

// Initialize on DOMContentLoaded and keep resize handler minimal
document.addEventListener('DOMContentLoaded', () => makeAdminTablesResponsive(document));

window.addEventListener('resize', () => {
  // no-op for now; cards are static once created
});
