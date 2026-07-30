/**
 * Export JSON array data to a downloadable CSV / Excel sheet
 * @param {string} filename Name of the downloaded file without extension
 * @param {Array<string>} headers Column header titles
 * @param {Array<Array<any>>} rows Rows of cell values matching headers
 */
export function exportToCSV(filename, headers, rows) {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const csvContent = [
    headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(','),
    ...rows.map(row => 
      row.map(cell => {
        const val = cell === null || cell === undefined ? '' : String(cell);
        return `"${val.replace(/"/g, '""')}"`;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
