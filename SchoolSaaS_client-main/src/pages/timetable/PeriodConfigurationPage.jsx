import { useState, useEffect } from 'react';
import { 
  Box, Container, Paper, Typography, Button, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControl, InputLabel, 
  Select, MenuItem, Chip, Grid, Card, CardContent, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControlLabel, Checkbox, Alert
} from '@mui/material';
import { 
  Add, Edit, Delete, AccessTime, Schedule, Save, Cancel,
  CheckCircle, Error as ErrorIcon, Visibility, Warning, Print, Download
} from '@mui/icons-material';
import { useAuth } from '../../hooks/useAuth';
import { Header } from '../../components/common/Header';
import { Sidebar } from '../../components/common/Sidebar';
import { timetableService } from '../../services/api';
import { LoadingBar } from '../../components/common/LoadingBar';

export function PeriodConfigurationPage() {
  const { user } = useAuth();
  const [configurations, setConfigurations] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [viewingConfig, setViewingConfig] = useState(null);
  const [openTimetableDialog, setOpenTimetableDialog] = useState(false);
  const [conflicts, setConflicts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    academicYear: '2024-2025',
    class: '',
    section: '',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    periods: [
      { periodNumber: 1, periodName: 'Period 1', startTime: '08:00', endTime: '08:45', duration: 45, type: 'class', teacher: '', subject: '' },
      { periodNumber: 2, periodName: 'Period 2', startTime: '08:45', endTime: '09:30', duration: 45, type: 'class', teacher: '', subject: '' },
      { periodNumber: 3, periodName: 'Period 3', startTime: '09:30', endTime: '10:15', duration: 45, type: 'class', teacher: '', subject: '' },
      { periodNumber: 4, periodName: 'Break', startTime: '10:15', endTime: '10:35', duration: 20, type: 'break', teacher: '', subject: '' },
      { periodNumber: 5, periodName: 'Period 4', startTime: '10:35', endTime: '11:20', duration: 45, type: 'class', teacher: '', subject: '' },
      { periodNumber: 6, periodName: 'Period 5', startTime: '11:20', endTime: '12:05', duration: 45, type: 'class', teacher: '', subject: '' },
      { periodNumber: 7, periodName: 'Period 6', startTime: '12:05', endTime: '12:50', duration: 45, type: 'class', teacher: '', subject: '' },
      { periodNumber: 8, periodName: 'Lunch', startTime: '12:50', endTime: '13:30', duration: 40, type: 'lunch', teacher: '', subject: '' },
      { periodNumber: 9, periodName: 'Period 7', startTime: '13:30', endTime: '14:15', duration: 45, type: 'class', teacher: '', subject: '' },
      { periodNumber: 10, periodName: 'Period 8', startTime: '14:15', endTime: '15:00', duration: 45, type: 'class', teacher: '', subject: '' }
    ]
  });

  const academicYears = ['2024-2025', '2025-2026', '2026-2027'];
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [configResponse, teachersResponse] = await Promise.all([
        timetableService.getPeriodConfigurations(),
        timetableService.getTeachers()
      ]);

      
      setConfigurations(configResponse.data.data || []);
      setTeachers(teachersResponse.data.data || []);
    } catch (error) {
      setError('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setError('');
      
      // Validate before saving
      const validationData = {
        academicYear: formData.academicYear,
        workingDays: formData.workingDays,
        periods: formData.periods,
        ...(editingConfig && { configId: editingConfig._id })
      };
      
      const validationResponse = await timetableService.validateTimetable(validationData);
      
      if (!validationResponse.data.isValid) {
        const conflictMessages = validationResponse.data.conflicts.map(c => c.message).join(', ');
        setError(`Cannot save: ${conflictMessages}`);
        return;
      }
      
      if (editingConfig) {
        await timetableService.updatePeriodConfiguration(editingConfig._id, formData);
        setSuccess('Configuration updated successfully');
      } else {
        await timetableService.createPeriodConfiguration(formData);
        setSuccess('Configuration created successfully');
      }
      
      setOpenDialog(false);
      setEditingConfig(null);
      fetchData();
      resetForm();
    } catch (error) {
      if (error.response?.data?.conflicts) {
        const conflictMessages = error.response.data.conflicts.map(c => c.message).join(', ');
        setError(`${error.response.data.message}: ${conflictMessages}`);
      } else {
        setError(error.response?.data?.message || 'Error saving configuration');
      }
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setFormData({
      academicYear: config.academicYear,
      class: config.class || '',
      section: config.section || '',
      workingDays: config.workingDays,
      periods: config.periods
    });
    setOpenDialog(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this configuration?')) {
      try {
        await timetableService.deletePeriodConfiguration(id);
        setSuccess('Configuration deleted successfully');
        fetchData();
      } catch (error) {
        setError('Error deleting configuration');
      }
    }
  };

  const handleViewTimetable = async (config) => {
    setViewingConfig(config);
    setOpenTimetableDialog(true);
    
    // Fetch conflicts for this academic year
    try {
      const conflictsResponse = await timetableService.detectConflicts(config.academicYear);
      setConflicts(conflictsResponse.data.data || []);
    } catch (error) {
      console.error('Error fetching conflicts:', error);
      setConflicts([]);
    }
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Not Assigned';
  };

  const hasConflict = (teacherId, day, periodIndex) => {
    return conflicts.some(conflict => 
      conflict.teacherId === teacherId && 
      conflict.timeSlot === `${day}-${periodIndex}`
    );
  };

  const getConflictInfo = (teacherId, day, periodIndex) => {
    return conflicts.find(conflict => 
      conflict.teacherId === teacherId && 
      conflict.timeSlot === `${day}-${periodIndex}`
    );
  };

  const renderTimetableGrid = () => {
    if (!viewingConfig) return null;

    const classPeriods = viewingConfig.periods.filter(p => p.type === 'class');
    const breakPeriods = viewingConfig.periods.filter(p => p.type !== 'class');

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', bgcolor: 'primary.main', color: 'white' }}>Day / Period</TableCell>
              {viewingConfig.periods.map((period, index) => (
                <TableCell 
                  key={index} 
                  sx={{ 
                    fontWeight: 'bold', 
                    bgcolor: period.type === 'class' ? 'primary.main' : 'warning.main',
                    color: 'white',
                    minWidth: 120
                  }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {period.periodName}
                    </Typography>
                    <Typography variant="caption">
                      {period.startTime} - {period.endTime}
                    </Typography>
                  </Box>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {viewingConfig.workingDays.map((day) => (
              <TableRow key={day}>
                <TableCell sx={{ fontWeight: 'bold', bgcolor: 'grey.100' }}>
                  {day}
                </TableCell>
                {viewingConfig.periods.map((period, periodIndex) => (
                  <TableCell 
                    key={periodIndex}
                    sx={{ 
                      bgcolor: period.type === 'class' ? 'background.paper' : 'grey.50',
                      border: '1px solid #e0e0e0',
                      minHeight: 80,
                      verticalAlign: 'top',
                      p: 1
                    }}
                  >
                    {period.type === 'class' ? (
                      <Box 
                        className={hasConflict(period.teacher, day, periodIndex) ? 'conflict-cell' : ''}
                        sx={{ 
                          bgcolor: hasConflict(period.teacher, day, periodIndex) ? 'error.light' : 'transparent',
                          p: hasConflict(period.teacher, day, periodIndex) ? 1 : 0,
                          borderRadius: 1,
                          border: hasConflict(period.teacher, day, periodIndex) ? '2px solid' : 'none',
                          borderColor: 'error.main'
                        }}
                      >
                        {hasConflict(period.teacher, day, periodIndex) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <Warning color="error" fontSize="small" />
                            <Typography variant="caption" color="error" sx={{ fontWeight: 'bold' }}>
                              CONFLICT
                            </Typography>
                          </Box>
                        )}
                        <Typography 
                          variant="body2" 
                          className="subject"
                          sx={{ 
                            fontWeight: 'bold', 
                            color: hasConflict(period.teacher, day, periodIndex) ? 'error.main' : 'primary.main'
                          }}
                        >
                          {period.subject || 'Subject'}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          className="teacher"
                          color={hasConflict(period.teacher, day, periodIndex) ? 'error.main' : 'text.secondary'}
                        >
                          {getTeacherName(period.teacher)}
                        </Typography>
                        {hasConflict(period.teacher, day, periodIndex) && (
                          <Typography variant="caption" color="error" sx={{ display: 'block', fontWeight: 'bold' }}>
                            {getConflictInfo(period.teacher, day, periodIndex)?.conflictCount} classes
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Box 
                        className={period.type === 'break' ? 'break-cell' : 'lunch-cell'}
                        sx={{ textAlign: 'center' }}
                      >
                        <Chip 
                          label={period.periodName} 
                          size="small" 
                          color={period.type === 'break' ? 'warning' : 'success'}
                        />
                      </Box>
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  const addPeriod = () => {
    const newPeriodNumber = Math.max(...formData.periods.map(p => p.periodNumber)) + 1;
    const lastPeriod = formData.periods[formData.periods.length - 1];
    const newStartTime = lastPeriod.endTime;
    const [hours, minutes] = newStartTime.split(':').map(Number);
    const newEndTime = `${String(hours + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    
    setFormData(prev => ({
      ...prev,
      periods: [...prev.periods, {
        periodNumber: newPeriodNumber,
        periodName: `Period ${newPeriodNumber}`,
        startTime: newStartTime,
        endTime: newEndTime,
        duration: 45,
        type: 'class',
        teacher: '',
        subject: ''
      }]
    }));
  };

  const removePeriod = (index) => {
    setFormData(prev => ({
      ...prev,
      periods: prev.periods.filter((_, i) => i !== index)
    }));
  };

  const updatePeriod = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      periods: prev.periods.map((period, i) => 
        i === index ? { ...period, [field]: value } : period
      )
    }));
  };

  const resetForm = () => {
    setFormData({
      academicYear: '2024-2025',
      class: '',
      section: '',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      periods: [
        { periodNumber: 1, periodName: 'Period 1', startTime: '08:00', endTime: '08:45', duration: 45, type: 'class', teacher: '', subject: '' },
        { periodNumber: 2, periodName: 'Period 2', startTime: '08:45', endTime: '09:30', duration: 45, type: 'class', teacher: '', subject: '' }
      ]
    });
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'class': return 'primary';
      case 'break': return 'warning';
      case 'lunch': return 'success';
      default: return 'default';
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('timetable-grid');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Timetable - ${viewingConfig?.academicYear} Class ${viewingConfig?.class}${viewingConfig?.section ? ` Section ${viewingConfig.section}` : ''}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: center; }
            th { background-color: #1976d2; color: white; }
            .break-cell { background-color: #fff3e0; }
            .lunch-cell { background-color: #e8f5e8; }
            .conflict-cell { background-color: #ffebee; border: 2px solid #f44336; }
            .header { text-align: center; margin-bottom: 20px; }
            .subject { font-weight: bold; color: #1976d2; }
            .teacher { font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <h2>Timetable - ${viewingConfig?.academicYear}</h2>
            <h3>Class ${viewingConfig?.class}${viewingConfig?.section ? ` Section ${viewingConfig.section}` : ''}</h3>
          </div>
          ${printContent?.innerHTML || ''}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handleDownload = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `timetable-${viewingConfig?.academicYear}-class-${viewingConfig?.class}${viewingConfig?.section ? `-${viewingConfig.section}` : ''}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = () => {
    if (!viewingConfig) return '';
    
    let csv = 'Day/Period';
    viewingConfig.periods.forEach(period => {
      csv += `,"${period.periodName} (${period.startTime}-${period.endTime})"`;
    });
    csv += '\n';
    
    viewingConfig.workingDays.forEach(day => {
      csv += day;
      viewingConfig.periods.forEach(period => {
        if (period.type === 'class') {
          const teacherName = getTeacherName(period.teacher);
          csv += `,"${period.subject || 'Subject'} - ${teacherName}"`;
        } else {
          csv += `,"${period.periodName}"`;
        }
      });
      csv += '\n';
    });
    
    return csv;
  };

  if (loading) return <LoadingBar />;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
              <Schedule color="primary" />
              Period Configuration
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<Add />} 
              onClick={() => setOpenDialog(true)}
              sx={{ borderRadius: 2 }}
            >
              Create Configuration
            </Button>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          <Grid container spacing={3}>
            {configurations.map((config) => (
              <Grid item xs={12} md={6} lg={4} key={config._id}>
                <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {config.academicYear}
                        </Typography>
                        {config.class && (
                          <Typography variant="body2" color="text.secondary">
                            Class {config.class}{config.section ? ` - Section ${config.section}` : ''}
                          </Typography>
                        )}
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {config.isActive && <CheckCircle color="success" fontSize="small" />}
                        <IconButton size="small" onClick={() => handleViewTimetable(config)} color="primary">
                          <Visibility fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleEdit(config)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(config._id)} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {config.totalPeriodsPerDay} class periods per day
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Working Days:</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {config.workingDays.map(day => (
                          <Chip key={day} label={day.slice(0, 3)} size="small" />
                        ))}
                      </Box>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>Schedule:</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {config.periods[0]?.startTime} - {config.periods[config.periods.length - 1]?.endTime}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Configuration Dialog */}
          <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="lg" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime color="primary" />
              {editingConfig ? 'Edit Period Configuration' : 'Create Period Configuration'}
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3} sx={{ mt: 1 }}>
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    select
                    label="Academic Year"
                    value={formData.academicYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, academicYear: e.target.value }))}
                  >
                    {academicYears.map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Class"
                    value={formData.class}
                    onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
                    placeholder="e.g., 1, 2, 10, 12"
                    required
                  />
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="Section"
                    value={formData.section}
                    onChange={(e) => setFormData(prev => ({ ...prev, section: e.target.value }))}
                    placeholder="e.g., A, B, Alpha, Beta"
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>Working Days</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {allDays.map(day => {
                      const dayLabel = day.slice(0, 3);
                      return (
                        <FormControlLabel
                          key={day}
                          control={
                            <Checkbox
                              checked={formData.workingDays.includes(day)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    workingDays: [...prev.workingDays, day] 
                                  }));
                                } else {
                                  setFormData(prev => ({ 
                                    ...prev, 
                                    workingDays: prev.workingDays.filter(d => d !== day) 
                                  }));
                                }
                              }}
                            />
                          }
                          label={dayLabel}
                        />
                      );
                    })}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h6">Periods Configuration</Typography>
                    <Button variant="outlined" startIcon={<Add />} onClick={addPeriod}>
                      Add Period
                    </Button>
                  </Box>
                  
                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Period Name</TableCell>
                          <TableCell>Start Time</TableCell>
                          <TableCell>End Time</TableCell>
                          <TableCell>Duration (min)</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Teacher</TableCell>
                          <TableCell>Subject</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {formData.periods.map((period, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <TextField
                                size="small"
                                value={period.periodName}
                                onChange={(e) => updatePeriod(index, 'periodName', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="time"
                                value={period.startTime}
                                onChange={(e) => updatePeriod(index, 'startTime', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="time"
                                value={period.endTime}
                                onChange={(e) => updatePeriod(index, 'endTime', e.target.value)}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                type="number"
                                value={period.duration}
                                onChange={(e) => updatePeriod(index, 'duration', parseInt(e.target.value))}
                              />
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                value={period.type}
                                onChange={(e) => updatePeriod(index, 'type', e.target.value)}
                              >
                                <MenuItem value="class">Class</MenuItem>
                                <MenuItem value="break">Break</MenuItem>
                                <MenuItem value="lunch">Lunch</MenuItem>
                              </Select>
                            </TableCell>
                            <TableCell>
                              <Select
                                size="small"
                                value={period.teacher || ''}
                                onChange={(e) => updatePeriod(index, 'teacher', e.target.value)}
                                disabled={period.type !== 'class'}
                                displayEmpty
                              >
                                <MenuItem value="">Select Teacher</MenuItem>
                                {teachers.map((teacher) => (
                                  <MenuItem key={teacher._id} value={teacher._id}>
                                    {teacher.firstName} {teacher.lastName}
                                  </MenuItem>
                                ))}
                              </Select>
                            </TableCell>
                            <TableCell>
                              <TextField
                                size="small"
                                placeholder="Subject name"
                                value={period.subject || ''}
                                onChange={(e) => updatePeriod(index, 'subject', e.target.value)}
                                disabled={period.type !== 'class'}
                              />
                            </TableCell>
                            <TableCell>
                              <IconButton 
                                size="small" 
                                onClick={() => removePeriod(index)}
                                disabled={formData.periods.length <= 1}
                                color="error"
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenDialog(false)} startIcon={<Cancel />}>
                Cancel
              </Button>
              <Button onClick={handleSave} variant="contained" startIcon={<Save />}>
                {editingConfig ? 'Update' : 'Create'}
              </Button>
            </DialogActions>
          </Dialog>

          {/* Timetable Grid View Dialog */}
          <Dialog 
            open={openTimetableDialog} 
            onClose={() => setOpenTimetableDialog(false)} 
            maxWidth="xl" 
            fullWidth
            PaperProps={{
              sx: { height: '90vh' }
            }}
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: 'primary.main', color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Schedule />
                Timetable Grid - {viewingConfig?.academicYear} 
                {viewingConfig?.class && `- Class ${viewingConfig.class}`}
                {viewingConfig?.section && ` Section ${viewingConfig.section}`}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<Print />}
                  onClick={handlePrint}
                  sx={{ color: 'white', borderColor: 'white' }}
                >
                  Print
                </Button>
                <Button 
                  variant="outlined" 
                  size="small" 
                  startIcon={<Download />}
                  onClick={handleDownload}
                  sx={{ color: 'white', borderColor: 'white' }}
                >
                  Download
                </Button>
              </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 2 }}>
              <Box sx={{ mb: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                <Chip 
                  icon={<CheckCircle />} 
                  label={`${viewingConfig?.totalPeriodsPerDay} Class Periods`} 
                  color="primary" 
                />
                <Chip 
                  label={`${viewingConfig?.workingDays?.length} Working Days`} 
                  color="secondary" 
                />
              </Box>
              <div id="timetable-grid">
                {renderTimetableGrid()}
              </div>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenTimetableDialog(false)} variant="contained">
                Close
              </Button>
            </DialogActions>
          </Dialog>
        </Container>
      </Box>
    </Box>
  );
}