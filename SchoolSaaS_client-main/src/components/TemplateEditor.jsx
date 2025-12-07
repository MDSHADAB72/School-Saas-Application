import { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch, Grid, Paper, Chip, Alert
} from '@mui/material';
import { Save as SaveIcon, Preview as PreviewIcon } from '@mui/icons-material';
import { DashboardLayout } from './common/DashboardLayout';
import { AuthContext } from '../context/AuthContext';
import { templateService } from '../services/templateService';

const TEMPLATE_TYPES = [
  { value: 'FEE_RECEIPT', label: 'Fee Receipt' },
  { value: 'ADMIT_CARD', label: 'Admit Card' },
  { value: 'RESULT_CARD', label: 'Result Card' },
  { value: 'NOTICE', label: 'Notice' },
  { value: 'CERTIFICATE', label: 'Certificate' }
];

const AVAILABLE_VARIABLES = [
  'student.name', 'student.class', 'student.section', 'student.rollNumber',
  'school.name', 'school.address', 'school.phone', 'school.email', 'school.logo',
  'exam.name', 'exam.date', 'exam.time',
  'fee.amountPaid', 'fee.totalAmount', 'fee.dueAmount', 'fee.receiptNumber',
  'result.totalMarks', 'result.obtainedMarks', 'result.percentage', 'result.grade',
  'date.today', 'date.year'
];

export function TemplateEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const isNew = id === 'new';

  const [template, setTemplate] = useState({
    name: '',
    type: '',
    html: '',
    css: '',
    isDefault: false
  });
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState({ html: '', variables: [] });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew) {
      fetchTemplate();
    }
  }, [id]);

  const fetchTemplate = async () => {
    try {
      setLoading(true);
      const response = await templateService.getTemplate(id);
      setTemplate(response.data);
    } catch (error) {
      setError('Failed to load template');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError('');

      if (isNew) {
        await templateService.createTemplate(template);
      } else {
        await templateService.updateTemplate(id, template);
      }

      navigate('/templates');
    } catch (error) {
      setError('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    try {
      const response = await templateService.previewTemplate(template.html, template.css);
      setPreview(response.data);
    } catch (error) {
      setError('Failed to generate preview');
    }
  };

  const insertVariable = (variable) => {
    const placeholder = `{{${variable}}}`;
    setTemplate(prev => ({
      ...prev,
      html: prev.html + placeholder
    }));
  };

  const handleInputChange = (field, value) => {
    setTemplate(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            {isNew ? 'Create Template' : 'Edit Template'}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<PreviewIcon />} onClick={handlePreview} disabled={!template.html}>
              Preview
            </Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} 
              disabled={loading || !template.name || !template.type || !template.html}>
              Save Template
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField fullWidth label="Template Name" value={template.name} 
                    onChange={(e) => handleInputChange('name', e.target.value)} required />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Template Type</InputLabel>
                    <Select value={template.type} label="Template Type" 
                      onChange={(e) => handleInputChange('type', e.target.value)}>
                      {TEMPLATE_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={<Switch checked={template.isDefault} 
                      onChange={(e) => handleInputChange('isDefault', e.target.checked)} />}
                    label="Set as Default Template" />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={12} label="HTML Content" value={template.html}
                    onChange={(e) => handleInputChange('html', e.target.value)} required
                    placeholder="Enter your HTML template here..." />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={6} label="CSS Styles" value={template.css}
                    onChange={(e) => handleInputChange('css', e.target.value)}
                    placeholder="Enter your CSS styles here..." />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>Available Variables</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {AVAILABLE_VARIABLES.map((variable) => (
                  <Chip key={variable} label={variable} onClick={() => insertVariable(variable)} 
                    clickable size="small" />
                ))}
              </Box>
            </Paper>

            {preview.html && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Preview</Typography>
                <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 2, maxHeight: 400, overflow: 'auto' }}
                  dangerouslySetInnerHTML={{ __html: preview.html }} />
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Variables found: {preview.variables.length}
                </Typography>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}