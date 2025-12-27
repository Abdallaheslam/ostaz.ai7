// Enhanced helper to convert admin tables into professional collapsible cards on small screens
function makeAdminTablesResponsive(container) {
  try {
    const tables = (container || document).querySelectorAll('.table-responsive .admin-table');

// Initialize on DOMContentLoaded and keep resize handler minimal
document.addEventListener('DOMContentLoaded', () => makeAdminTablesResponsive(document));

window.addEventListener('resize', () => {
  // no-op for now; cards are static once created
});
