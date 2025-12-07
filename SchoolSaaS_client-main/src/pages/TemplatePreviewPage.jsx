import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper, Alert, CircularProgress
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon, Download as DownloadIcon, Edit as EditIcon
} from '@mui/icons-material';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { templateService } from '../services/templateService';

export function TemplatePreviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [preview, setPreview] = useState({ html: '', variables: [] });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTemplateAndPreview();
  }, [id]);

  const fetchTemplateAndPreview = async () => {
    try {
      setLoading(true);
      const templateResponse = await templateService.getTemplate(id);
      setTemplate(templateResponse.data);

      const previewResponse = await templateService.previewTemplate(
        templateResponse.data.html,
        templateResponse.data.css
      );
      setPreview(previewResponse.data);
    } catch (error) {
      setError('Failed to load template preview');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    try {
      setGenerating(true);
      const response = await templateService.renderTemplate(id);
      
      const pdfBlob = new Blob([
        Uint8Array.from(atob(response.data.pdf), c => c.charCodeAt(0))
      ], { type: 'application/pdf' });
      
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${template.name}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/templates')}>
              Back to Templates
            </Button>
            <Typography variant="h4" component="h1">
              {template?.name} - Preview
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" startIcon={<EditIcon />} 
              onClick={() => navigate(`/templates/editor/${id}`)}>
              Edit Template
            </Button>
            <Button variant="contained" startIcon={<DownloadIcon />} 
              onClick={handleGeneratePDF} disabled={generating}>
              {generating ? 'Generating...' : 'Download PDF'}
            </Button>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {template && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body1" color="text.secondary">
              Type: {template.type} | Version: {template.version} | 
              Variables: {preview.variables.length} | 
              {template.isDefault && ' (Default Template)'}
            </Typography>
          </Box>
        )}

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Template Preview (with sample data)
          </Typography>
          <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 3, minHeight: 600, backgroundColor: 'white' }}
            dangerouslySetInnerHTML={{ __html: preview.html }} />
        </Paper>

        {preview.variables.length > 0 && (
          <Paper sx={{ p: 3, mt: 3 }}>
            <Typography variant="h6" gutterBottom>Template Variables</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {preview.variables.map((variable, index) => (
                <Typography key={index} variant="body2" sx={{
                  backgroundColor: 'grey.100', px: 1, py: 0.5, borderRadius: 1, fontFamily: 'monospace'
                }}>
                  {`{{${variable}}}`}
                </Typography>
              ))}
            </Box>
          </Paper>
        )}
      </Box>
    </DashboardLayout>
  );
}