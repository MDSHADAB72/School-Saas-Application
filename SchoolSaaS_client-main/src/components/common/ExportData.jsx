import { useState } from 'react';
import { Box, Button, Menu, MenuItem, TextField, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Download, PictureAsPdf, TableChart } from '@mui/icons-material';
import { exportToCSV, exportToPDF, filterDataByDate } from '../../utils/exportUtils';

export function ExportData({ data, filename, title, dateField = 'createdAt' }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [dateDialog, setDateDialog] = useState(false);
  const [customDate, setCustomDate] = useState('');
  const [exportFormat, setExportFormat] = useState('');

  const handleExport = (format, filterType) => {
    let filteredData = data;
    
    if (filterType !== 'all') {
      filteredData = filterDataByDate(data, dateField, filterType, customDate);
    }
    
    if (!filteredData.length) {
      alert('No data available for selected date');
      return;
    }
    
    if (format === 'csv') {
      exportToCSV(filteredData, filename);
    } else {
      exportToPDF(filteredData, filename, title);
    }
    
    setAnchorEl(null);
    setDateDialog(false);
  };

  const openDateDialog = (format) => {
    setExportFormat(format);
    setDateDialog(true);
    setAnchorEl(null);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Download />}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        Export
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => openDateDialog('csv')}>
          <TableChart sx={{ mr: 1 }} /> Export as CSV
        </MenuItem>
        <MenuItem onClick={() => openDateDialog('pdf')}>
          <PictureAsPdf sx={{ mr: 1 }} /> Export as PDF
        </MenuItem>
      </Menu>

      <Dialog open={dateDialog} onClose={() => setDateDialog(false)}>
        <DialogTitle>Select Date Range</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2, minWidth: 300 }}>
            <Button variant="outlined" onClick={() => handleExport(exportFormat, 'all')}>
              All Data
            </Button>
            <Button variant="outlined" onClick={() => handleExport(exportFormat, 'today')}>
              Today
            </Button>
            <Button variant="outlined" onClick={() => handleExport(exportFormat, 'tomorrow')}>
              Tomorrow
            </Button>
            <TextField
              label="Custom Date"
              type="date"
              value={customDate}
              onChange={(e) => setCustomDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <Button 
              variant="contained" 
              onClick={() => handleExport(exportFormat, 'custom')}
              disabled={!customDate}
            >
              Export Custom Date
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDateDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
