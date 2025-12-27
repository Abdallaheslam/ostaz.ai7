// Enhanced helper to convert admin tables into professional collapsible cards on small screens
function makeAdminTablesResponsive(container) {
  try {
    const tables = (container || document).querySelectorAll('.table-responsive .admin-table');
    tables.forEach(table => {
      if (table.dataset.responsiveEnhanced) return;
      const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());

      const cardsWrapper = document.createElement('div');
      cardsWrapper.className = 'admin-cards';
      cardsWrapper.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-top: 15px;
      `;

      Array.from(table.querySelectorAll('tbody tr')).forEach(tr => {
        const card = document.createElement('div');
        card.className = 'admin-card';
        card.style.cssText = `
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(107, 91, 255, 0.08);
          border: 1px solid rgba(107, 91, 255, 0.1);
          overflow: hidden;
          transition: all 0.3s ease;
        `;

        // Header row: image/name/price & toggle
        const headerRow = document.createElement('div');
        headerRow.className = 'admin-card-header';
        headerRow.style.cssText = `
          display: flex;
          align-items: center;
          padding: 15px;
          background: linear-gradient(135deg, rgba(107, 91, 255, 0.03), rgba(124, 100, 255, 0.02));
          border-bottom: 1px solid rgba(107, 91, 255, 0.08);
          cursor: pointer;
        `;

        // Create compact columns: first 2 cells as header preview
        const cells = Array.from(tr.children);
        const previewLeft = document.createElement('div');
        previewLeft.className = 'preview-left';
        previewLeft.style.cssText = `
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;
        `;
        previewLeft.innerHTML = cells[0] ? cells[0].innerHTML : '';

        const nameDiv = document.createElement('div');
        nameDiv.className = 'name';
        nameDiv.style.cssText = `
          font-weight: 600;
          color: #333;
          font-size: 0.95rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        `;
        nameDiv.textContent = cells[1] ? cells[1].innerText : '';
        previewLeft.appendChild(nameDiv);

        const previewRight = document.createElement('div');
        previewRight.className = 'preview-right';
        previewRight.style.cssText = `
          font-weight: 700;
          color: #6B5BFF;
          font-size: 0.9rem;
        `;
        previewRight.innerHTML = cells[2] ? cells[2].innerHTML : '';

        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'card-toggle';
        toggleBtn.style.cssText = `
          background: #6B5BFF;
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-left: 12px;
          flex-shrink: 0;
        `;
        toggleBtn.innerHTML = '▼';
        toggleBtn.setAttribute('aria-expanded', 'false');

        headerRow.appendChild(previewLeft);
        headerRow.appendChild(previewRight);
        headerRow.appendChild(toggleBtn);
        card.appendChild(headerRow);

        // Details (other columns)
        const details = document.createElement('div');
        details.className = 'admin-card-details';
        details.style.cssText = `
          display: none;
          padding: 15px;
          background: #fafbfc;
          border-top: 1px solid rgba(107, 91, 255, 0.08);
        `;

        Array.from(tr.children).forEach((td, idx) => {
          // skip first two cells (preview) and last actions (added separately)
          if (idx < 2) return;
          const labelText = headers[idx] || '';
          const row = document.createElement('div');
          row.className = 'admin-card-row';
          row.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid rgba(107, 91, 255, 0.05);
          `;

          const label = document.createElement('div');
          label.className = 'label';
          label.style.cssText = `
            font-weight: 600;
            color: #666;
            font-size: 0.85rem;
            flex-shrink: 0;
          `;
          label.textContent = labelText;

          const value = document.createElement('div');
          value.className = 'value';
          value.style.cssText = `
            color: #333;
            font-size: 0.9rem;
            text-align: left;
            flex: 1;
            margin-left: 12px;
          `;
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
          actionsDiv.style.cssText = `
            display: flex;
            gap: 8px;
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid rgba(107, 91, 255, 0.08);
          `;
          actionsDiv.innerHTML = actionsCell.innerHTML;

          // make buttons touch-friendly and professional
          Array.from(actionsDiv.querySelectorAll('button')).forEach(btn => {
            btn.style.cssText = `
              padding: 10px 16px;
              border-radius: 8px;
              border: none;
              font-weight: 600;
              font-size: 0.85rem;
              cursor: pointer;
              transition: all 0.2s ease;
              min-height: 44px;
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 6px;
            `;

            // Style based on button class or content
            if (btn.classList.contains('btn-danger') || btn.innerHTML.includes('fa-trash')) {
              btn.style.background = 'linear-gradient(135deg, #FF2D55, #FF4757)';
              btn.style.color = 'white';
            } else if (btn.classList.contains('btn-primary') || btn.innerHTML.includes('fa-edit')) {
              btn.style.background = 'linear-gradient(135deg, #6B5BFF, #7C64FF)';
              btn.style.color = 'white';
            } else {
              btn.style.background = 'linear-gradient(135deg, #666, #777)';
              btn.style.color = 'white';
            }

            // Hover effects
            btn.onmouseover = () => {
              btn.style.transform = 'translateY(-1px)';
              btn.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            };
            btn.onmouseout = () => {
              btn.style.transform = 'translateY(0)';
              btn.style.boxShadow = 'none';
            };
          });
          details.appendChild(actionsDiv);
        }

        card.appendChild(details);

        // Enhanced toggle behavior
        let isExpanded = false;
        toggleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          isExpanded = !isExpanded;
          toggleBtn.setAttribute('aria-expanded', String(isExpanded));
          toggleBtn.innerHTML = isExpanded ? '▲' : '▼';
          toggleBtn.style.transform = isExpanded ? 'rotate(180deg)' : 'rotate(0deg)';
          details.style.display = isExpanded ? 'block' : 'none';

          // Animate card expansion
          card.style.transform = isExpanded ? 'scale(1.01)' : 'scale(1)';
        });

        // Click header to toggle
        headerRow.addEventListener('click', () => {
          toggleBtn.click();
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
