/**
 * Export utilities for downloading data as CSV or capturing charts as PNG.
 */

// Convert array of objects to CSV string
function arrayToCsv(data: Record<string, any>[], headers?: string[]): string {
  if (data.length === 0) return '';
  
  const keys = headers || Object.keys(data[0]);
  const csvRows = [
    // Add BOM for Excel UTF-8 support
    keys.join(','),
    ...data.map(row =>
      keys.map(key => {
        const val = row[key];
        if (val === null || val === undefined) return '';
        const str = String(val);
        // Escape quotes and wrap in quotes if needed
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',')
    )
  ];
  return '\uFEFF' + csvRows.join('\n');
}

// Download a string as a file
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Download data as CSV file */
export function downloadCsv(data: Record<string, any>[], filename: string, headers?: string[]) {
  const csv = arrayToCsv(data, headers);
  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

/** Capture a chart container as PNG and download */
export async function downloadChartAsPng(containerId: string, filename: string) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // Use html2canvas dynamically
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(container, {
    backgroundColor: null,
    scale: 2,
  });
  
  const url = canvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
