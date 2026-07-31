/**
 * Export JSON array data to a downloadable CSV / Excel sheet
 * @param {string} filename Name of the downloaded file without extension
 * @param {Array<string>} headers Column header titles
 * @param {Array<Array<any>>} rows Rows of cell values matching headers
 */
import ExcelJS from 'exceljs';

export async function exportToCSV(filename, headers, rows) {
  if (!rows || !rows.length) {
    alert('No data available to export.');
    return;
  }

  const cleanTitle = filename.replace(/_/g, ' ').toUpperCase();
  const dateStr = new Date().toLocaleDateString('en-IN', { dateStyle: 'long' });

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Report Log');

  // Add brand headers
  worksheet.addRow(['BOMBAY CHOWPATI']).font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF691F1A' } };
  worksheet.addRow([cleanTitle]).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF4B5563' } };
  worksheet.addRow([`Exported On: ${dateStr}`]).font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF4B5563' } };
  worksheet.addRow([]); // empty row

  // Add headers
  const headerRow = worksheet.addRow(headers);
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF691F1A' }
    };
    cell.font = {
      name: 'Segoe UI',
      color: { argb: 'FFF8A324' },
      bold: true,
      size: 11
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right: { style: 'thin', color: { argb: 'FFD1D5DB' } }
    };
  });

  // Add rows
  rows.forEach((row, rIdx) => {
    const dataRow = worksheet.addRow(row);
    const isEven = rIdx % 2 === 0;
    const bgColor = isEven ? 'FFFFF9EE' : 'FFFFFFFF';

    dataRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor }
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        color: { argb: 'FF374151' }
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
      };

      const val = String(cell.value || '');
      const isNumeric = !isNaN(val) && val.trim() !== '';
      const isPrice = val.startsWith('₹') || val.startsWith('$');
      if (isNumeric || isPrice) {
        cell.alignment = { horizontal: 'right' };
      } else {
        cell.alignment = { horizontal: 'left' };
      }
    });
  });

  // Auto-fit columns
  worksheet.columns.forEach((column) => {
    let maxLength = 0;
    column.eachCell({ includeEmpty: true }, (cell) => {
      const columnLength = cell.value ? cell.value.toString().length : 10;
      if (columnLength > maxLength) {
        maxLength = columnLength;
      }
    });
    column.width = Math.min(Math.max(maxLength + 3, 12), 40);
  });

  // Write and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
