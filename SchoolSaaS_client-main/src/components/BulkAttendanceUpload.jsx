import { useState } from 'react';
import { Box, Button, Typography, Paper, Alert, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { CloudUpload, Download, Close } from '@mui/icons-material';
import { attendanceService } from '../services/api';

export function BulkAttendanceUpload({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^[\"&quot;]+|[\"&quot;]+$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^[\"&quot;]+|[\"&quot;]+$/g, ''));
    return result;
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = parseCSVLine(lines[0]);
        
        const attendanceRecords = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          
          return {
            studentId: obj['Student ID'] || obj['studentId'],
            date: obj['Date'] || obj['date'],
            status: obj['Status'] || obj['status'],
            class: obj['Class'] || obj['class'],
            section: obj['Section'] || obj['section']
          };
        });

        await attendanceService.bulkMarkAttendance({ attendanceRecords });
        setSuccess(`Successfully uploaded ${attendanceRecords.length} attendance records`);
        setFile(null);
        onSuccess();
        
        setTimeout(() => {
          onClose();
          setSuccess('');
        }, 2000);
      };
      reader.readAsText(file);
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'Student ID,Date,Status,Class,Section\n507f1f77bcf86cd799439011,2024-01-15,present,10,A';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Bulk Attendance Upload
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Button
            startIcon={<Download />}
            onClick={downloadTemplate}
            variant="outlined"
            sx={{ mb: 2 }}
          >
            Download CSV Template
          </Button>
          <Typography variant="body2" color="textSecondary">
            Download the template, fill in attendance data, and upload the CSV file.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Paper sx={{ p: 3, border: '2px dashed #ccc', textAlign: 'center' }}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="csv-upload-attendance"
          />
          <label htmlFor="csv-upload-attendance">
            <Button
              component="span"
              variant="contained"
              startIcon={<CloudUpload />}
              sx={{ mb: 2 }}
            >
              Select CSV File
            </Button>
          </label>
          {file && (
            <Typography variant="body2" sx={{ mt: 1 }}>
              Selected: {file.name}
            </Typography>
          )}
        </Paper>

        {loading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!file || loading}
        >
          {loading ? 'Uploading...' : 'Upload Attendance'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
