import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Card, CardContent, CardActions, Grid, Chip, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon,
  Star as StarIcon, StarBorder as StarBorderIcon
} from '@mui/icons-material';
import { DashboardLayout } from '../components/common/DashboardLayout';
import { AuthContext } from '../context/AuthContext';
import templateService from '../services/templateService';

const TEMPLATE_TYPES = [
  { value: 'FEE_RECEIPT', label: 'Fee Receipt' },
  { value: 'ADMIT_CARD', label: 'Admit Card' },
  { value: 'RESULT_CARD', label: 'Result Card' },
  { value: 'NOTICE', label: 'Notice' },
  { value: 'CERTIFICATE', label: 'Certificate' }
];

export function TemplatesPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [deleteDialog, setDeleteDialog] = useState({ open: false, template: null });

  useEffect(() => {
    fetchTemplates();
  }, [filterType]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await templateService.getTemplates(user.schoolId, filterType || null);
      setTemplates(response.data);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await templateService.deleteTemplate(deleteDialog.template._id);
      setDeleteDialog({ open: false, template: null });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
    }
  };

  const handleSetDefault = async (templateId) => {
    try {
      await templateService.setDefaultTemplate(templateId);
      fetchTemplates();
    } catch (error) {
      console.error('Error setting default template:', error);
    }
  };

  const getTypeLabel = (type) => {
    const typeObj = TEMPLATE_TYPES.find(t => t.value === type);
    return typeObj ? typeObj.label : type;
  };

  const getTypeColor = (type) => {
    const colors = {
      'FEE_RECEIPT': 'primary',
      'ADMIT_CARD': 'secondary',
      'RESULT_CARD': 'success',
      'NOTICE': 'warning',
      'CERTIFICATE': 'info'
    };
    return colors[type] || 'default';
  };

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">Templates</Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/templates/editor/new')}>
            Create Template
          </Button>
        </Box>

        <Box sx={{ mb: 3 }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Type</InputLabel>
            <Select value={filterType} label="Filter by Type" onChange={(e) => setFilterType(e.target.value)}>
              <MenuItem value="">All Types</MenuItem>
              {TEMPLATE_TYPES.map((type) => (
                <MenuItem key={type.value} value={type.value}>{type.label}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Typography>Loading templates...</Typography>
        ) : (
          <Grid container spacing={3}>
            {templates.map((template) => (
              <Grid item xs={12} sm={6} md={4} key={template._id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Typography variant="h6" component="h2">{template.name}</Typography>
                      <IconButton size="small" onClick={() => handleSetDefault(template._id)} color={template.isDefault ? 'primary' : 'default'}>
                        {template.isDefault ? <StarIcon /> : <StarBorderIcon />}
                      </IconButton>
                    </Box>
                    <Chip label={getTypeLabel(template.type)} color={getTypeColor(template.type)} size="small" sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Version: {template.version}</Typography>
                    <Typography variant="body2" color="text.secondary">Variables: {template.variables.length}</Typography>
                  </CardContent>
                  <CardActions>
                    <IconButton size="small" onClick={() => navigate(`/templates/preview/${template._id}`)}>
                      <ViewIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => navigate(`/templates/editor/${template._id}`)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteDialog({ open: true, template })}>
                      <DeleteIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, template: null })}>
          <DialogTitle>Delete Template</DialogTitle>
          <DialogContent>
            <Typography>Are you sure you want to delete "{deleteDialog.template?.name}"?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, template: null })}>Cancel</Button>
            <Button onClick={handleDelete} color="error">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  );
}