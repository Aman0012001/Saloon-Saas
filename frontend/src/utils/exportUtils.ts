/**
 * 📊 Export Utilities
 * Handles exporting data to CSV, Excel, and basic PDF (via printing)
 */

/**
 * Normalizes data into a CSV string
 */
const convertToCSV = (data: any[]): string => {
    if (data.length === 0) return '';

    const headers = Object.keys(data[0]);
    const rows = data.map(obj =>
        headers.map(header => {
            let val = obj[header];
            if (val === null || val === undefined) return '';

            const stringVal = String(val);
            // Handle values with commas, quotes, or newlines by wrapping in quotes and escaping internal quotes
            if (stringVal.includes(',') || stringVal.includes('"') || stringVal.includes('\n')) {
                return `"${stringVal.replace(/"/g, '""')}"`;
            }
            return stringVal;
        }).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
};

/**
 * Trigger file download in browser
 */
const downloadFile = (content: string, fileName: string, contentType: string) => {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportToCSV = (data: any[], fileName: string = 'export.csv') => {
    const csvContent = convertToCSV(data);
    downloadFile(csvContent, fileName, 'text/csv;charset=utf-8;');
};

export const exportToExcel = (data: any[], fileName: string = 'export.csv') => {
    // Most Excel versions open CSV perfectly if MIME type is set or even just as .csv
    // To make it "Excel" we use the same CSV logic but could use \t for TSV if needed.
    // We'll stick to CSV for now as it's the most compatible.
    const csvContent = convertToCSV(data);
    // Using .csv extension but we could name it .xls if we used basic HTML table format
    // For simplicity and reliability, CSV is better.
    downloadFile(csvContent, fileName.endsWith('.csv') ? fileName : `${fileName}.csv`, 'text/csv;charset=utf-8;');
};

export const exportToPDF = (elementId?: string) => {
    // Basic PDF export uses browser print
    // If an elementId is provided, we could hide everything else, but window.print() is standard.
    window.print();
};
