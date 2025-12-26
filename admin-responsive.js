// Helper to convert admin tables into accessible, collapsible cards on small screens
(function(){
  let _idCounter = 0;

  function createCardFromRow(tr, headers, options = {}) {
    const card = document.createElement('div');
    card.className = 'admin-card';

    const headerRow = document.createElement('div');
    headerRow.className = 'admin-card-header';

    const cells = Array.from(tr.children);

    const previewLeft = document.createElement('div');
    previewLeft.className = 'preview-left';
    previewLeft.innerHTML = (cells[0] ? cells[0].innerHTML : '') + (cells[1] ? `<div class="name">${cells[1].innerText}</div>` : '');

    const previewRight = document.createElement('div');
    previewRight.className = 'preview-right';
    previewRight.innerHTML = (cells[2] ? cells[2].innerHTML : '');

    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'card-toggle';
    toggleBtn.type = 'button';
    toggleBtn.innerText = 'تفاصيل ▾';
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-controls', '');
    toggleBtn.setAttribute('aria-label', 'تفاصيل العنصر');
    toggleBtn.tabIndex = 0;

    headerRow.appendChild(previewLeft);
    headerRow.appendChild(previewRight);
    headerRow.appendChild(toggleBtn);
    card.appendChild(headerRow);

    const details = document.createElement('div');
    details.className = 'admin-card-details';
    details.setAttribute('role', 'region');

    // assign an id for aria-controls
    const detailsId = 'admin-card-details-' + (++_idCounter);
    details.id = detailsId;
    toggleBtn.setAttribute('aria-controls', detailsId);

    Array.from(tr.children).forEach((td, idx) => {
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

    // Actions
    const actionsCell = tr.querySelector('td:last-child');
    if (actionsCell) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'actions';
      actionsDiv.innerHTML = actionsCell.innerHTML;
      Array.from(actionsDiv.querySelectorAll('button')).forEach(btn => {
        btn.style.padding = '10px 12px';
        btn.style.minWidth = '44%';
        btn.style.marginRight = '6px';
        btn.setAttribute('aria-label', btn.innerText || 'زر');
      });
      details.appendChild(actionsDiv);
    }

    card.appendChild(details);

    // Toggle behavior with smooth max-height transitions
    function openCard() {
      const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
      if (isOpen) return;
      toggleBtn.setAttribute('aria-expanded', 'true');
      toggleBtn.innerText = 'خفّي ▴';
      card.classList.add('open');
      details.style.maxHeight = details.scrollHeight + 'px';
      if (options.accordion && card.parentNode) {
        // close siblings
        Array.from(card.parentNode.querySelectorAll('.admin-card.open')).forEach(sib => {
          if (sib === card) return;
          sib.classList.remove('open');
          const d = sib.querySelector('.admin-card-details');
          if (d) d.style.maxHeight = 0;
          const tb = sib.querySelector('.card-toggle');
          if (tb) { tb.setAttribute('aria-expanded', 'false'); tb.innerText = 'تفاصيل ▾'; }
        });
      }
    }

    function closeCard() {
      toggleBtn.setAttribute('aria-expanded', 'false');
      toggleBtn.innerText = 'تفاصيل ▾';
      card.classList.remove('open');
      details.style.maxHeight = 0;
    }

    toggleBtn.addEventListener('click', () => {
      const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      if (expanded) closeCard(); else openCard();
    });

    // keyboard support
    toggleBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleBtn.click(); }
    });

    return card;
  }

  function makeAdminTablesResponsive(container) {
    try {
      const root = container || document;
      const tables = root.querySelectorAll('.table-responsive .admin-table');

      tables.forEach(table => {
        if (table.dataset.responsiveEnhanced) return;
        const headers = Array.from(table.querySelectorAll('thead th')).map(th => th.textContent.trim());
        const cardsWrapper = document.createElement('div');
        cardsWrapper.className = 'admin-cards';

        Array.from(table.querySelectorAll('tbody tr')).forEach(tr => {
          const card = createCardFromRow(tr, headers, { accordion: !!table.dataset.accordion });
          cardsWrapper.appendChild(card);
        });

        table.parentNode.insertBefore(cardsWrapper, table.nextSibling);
        table.dataset.responsiveEnhanced = '1';
      });
    } catch (error) {
      console.error('makeAdminTablesResponsive error:', error);
    }
  }

  // run on initial load
  document.addEventListener('DOMContentLoaded', () => makeAdminTablesResponsive());

  // observe for dynamic changes (e.g., table rebuilt) and re-run for new tables
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        // if nodes added contain admin tables, try to enhance them
        m.addedNodes.forEach(node => {
          if (!(node instanceof HTMLElement)) return;
          if (node.matches && node.matches('.table-responsive')) makeAdminTablesResponsive(node);
          else if (node.querySelector && node.querySelector('.table-responsive .admin-table')) makeAdminTablesResponsive(node);
        });
      }
    }
  });

  mo.observe(document.body, { childList: true, subtree: true });

  // expose for manual re-run
  window.makeAdminTablesResponsive = makeAdminTablesResponsive;
})();
