import { useState } from 'react';
import { Box, Button, Typography, Paper, Alert, LinearProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton } from '@mui/material';
import { CloudUpload, Download, Close } from '@mui/icons-material';
import { teacherService } from '../services/api';

export function BulkTeacherUpload({ open, onClose, onSuccess }) {
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
        
        const teachers = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          
          return {
            firstName: obj['First Name'] || obj['firstName'],
            lastName: obj['Last Name'] || obj['lastName'],
            email: obj['Email'] || obj['email'],
            phoneNumber: obj['Phone Number'] || obj['phoneNumber'],
            employeeId: obj['Employee ID'] || obj['employeeId'],
            subject: obj['Subject'] || obj['subject'],
            qualification: obj['Qualification'] || obj['qualification'],
            experience: parseInt(obj['Experience'] || obj['experience']) || 0
          };
        });

        await teacherService.bulkCreateTeachers({ teachers });
        setSuccess(`Successfully uploaded ${teachers.length} teachers`);
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
    const csvContent = 'First Name,Last Name,Email,Phone Number,Employee ID,Subject,Qualification,Experience\nJohn,Doe,john@teacher.com,9876543210,EMP001,Mathematics,M.Sc,5';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teacher_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Bulk Teacher Upload
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
            Download the template, fill in teacher data, and upload the CSV file.
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
            id="csv-upload-teacher"
          />
          <label htmlFor="csv-upload-teacher">
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
          {loading ? 'Uploading...' : 'Upload Teachers'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
