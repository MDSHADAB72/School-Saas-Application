import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToCSV = (data, filename) => {
  if (!data.length) return;
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
  const csv = `${headers}\n${rows}`;
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const exportToPDF = (data, filename, title) => {
  if (!data.length) return;
  
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(title, 14, 15);
  
  const headers = [Object.keys(data[0])];
  const rows = data.map(row => Object.values(row));
  
  doc.autoTable({
    head: headers,
    body: rows,
    startY: 25,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [102, 126, 234] }
  });
  
  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const filterDataByDate = (data, dateField, filterType, customDate = null) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    itemDate.setHours(0, 0, 0, 0);
    
    switch(filterType) {
      case 'today':
        return itemDate.getTime() === today.getTime();
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return itemDate.getTime() === tomorrow.getTime();
      case 'custom':
        const custom = new Date(customDate);
        custom.setHours(0, 0, 0, 0);
        return itemDate.getTime() === custom.getTime();
      default:
        return true;
    }
  });
};
