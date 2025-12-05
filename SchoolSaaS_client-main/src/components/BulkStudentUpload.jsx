import { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Alert,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import { CloudUpload, Download, Close, Visibility } from '@mui/icons-material';
import { studentService } from '../services/api';

export function BulkStudentUpload({ open, onClose, onSuccess }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
      parseCSV(selectedFile);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim().replace(/^["&quot;]+|["&quot;]+$/g, ''));
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim().replace(/^["&quot;]+|["&quot;]+$/g, ''));
    return result;
  };

  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n').filter(line => line.trim());
      const headers = parseCSVLine(lines[0]);
      
      const data = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = values[index] || '';
        });
        return obj;
      });
      
      setPreviewData(data.slice(0, 5));
    };
    reader.readAsText(file);
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
        
        const students = lines.slice(1).map(line => {
          const values = parseCSVLine(line);
          const obj = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          
          // Map CSV headers to backend expected format
          return {
            firstName: obj['First Name'] || obj['firstName'],
            lastName: obj['Last Name'] || obj['lastName'],
            email: obj['Email'] || obj['email'],
            rollNumber: obj['Roll Number'] || obj['rollNumber'],
            class: obj['Class'] || obj['class'],
            section: obj['Section'] || obj['section'],
            dateOfBirth: obj['Date of Birth'] || obj['dateOfBirth'],
            gender: obj['Gender'] || obj['gender'],
            bloodGroup: obj['Blood Group'] || obj['bloodGroup'],
            address: obj['Address'] || obj['address']
          };
        });

        const response = await studentService.bulkCreateStudents(students);
        setSuccess(`Successfully uploaded ${response.data.count} students`);
        setFile(null);
        setPreviewData([]);
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
    const csvContent = 'First Name,Last Name,Email,Roll Number,Class,Section,Date of Birth,Gender,Blood Group,Address\nJohn,Doe,john@student.com,001,10,A,01/15/2008,Male,O+,"123 Main Street, City"';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Bulk Student Upload
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
            Download the template, fill in student data, and upload the CSV file.
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Paper sx={{ p: 3, mb: 3, border: '2px dashed #ccc', textAlign: 'center' }}>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="csv-upload"
          />
          <label htmlFor="csv-upload">
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

        {previewData.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Data Preview</Typography>
              <Button
                startIcon={<Visibility />}
                onClick={() => setShowPreview(!showPreview)}
                sx={{ ml: 2 }}
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </Button>
            </Box>
            
            {showPreview && (
              <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                <Table stickyHeader size="small">
                  <TableHead>
                    <TableRow>
                      {Object.keys(previewData[0] || {}).map((header) => (
                        <TableCell key={header} sx={{ fontWeight: 'bold' }}>
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {previewData.map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value, cellIndex) => (
                          <TableCell key={cellIndex}>{value}</TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        )}

        {loading && <LinearProgress sx={{ mb: 2 }} />}
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
          {loading ? 'Uploading...' : 'Upload Students'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}