import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Chip,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Header } from "../components/common/Header.jsx";
import { Sidebar } from "../components/common/Sidebar.jsx";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import { BulkAttendanceUpload } from "../components/BulkAttendanceUpload.jsx";
import { AttendanceDetailsModal } from "../components/AttendanceDetailsModal.jsx";
import { ExportData } from "../components/common/ExportData.jsx";
import { studentService, attendanceService } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.js";

export function AttendancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [selectedDate, setSelectedDate] = useState(
    localStorage.getItem('attendance_date') || new Date().toISOString().split("T")[0]
  );
  const [selectedClass, setSelectedClass] = useState(
    localStorage.getItem('attendance_class') || ""
  );
  const [selectedSection, setSelectedSection] = useState(
    localStorage.getItem('attendance_section') || ""
  );
  const [openBulkUpload, setOpenBulkUpload] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [pendingChanges, setPendingChanges] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const canMarkAttendance =
    user?.role === "teacher" || user?.role === "school_admin";

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
    }
  }, [selectedDate, selectedClass, selectedSection]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await studentService.getAllStudents({
        page: 1,
        limit: 100,
        class: selectedClass,
        section: selectedSection,
      });
      setStudents(res.data.students || []);

      const attendanceRes = await attendanceService.getAllAttendance({
        date: selectedDate,
        class: selectedClass,
        section: selectedSection,
      });
      const attendanceMap = {};
      attendanceRes.data.attendance?.forEach((a) => {
        attendanceMap[a.studentId] = a.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAttendance = (studentId, status) => {
    if (!canMarkAttendance) return;
    setPendingChanges((prev) => ({ ...prev, [studentId]: status }));
    setHasChanges(true);
  };

const handleSaveAttendance = async () => {
  setLoading(true);

  const errors = [];
  const successes = [];
  const updatedAttendance = {}; // will hold studentId: normalizedStatus for successful writes

  try {
    const entries = Object.entries(pendingChanges);
    for (const [studentId, status] of entries) {
      const student = students.find((s) => s._id === studentId);
      console.log("Marking attendance for:", {
        studentId,
        status,
        class: student?.class,
        section: student?.section,
        date: selectedDate,
      });

      const basePayload = {
        studentId,
        date: selectedDate,
        class: student?.class,
        section: student?.section,
      };

      // normalize (lowercase) first
      const normalized = String(status).toLowerCase().trim();
      const capitalized = normalized[0].toUpperCase() + normalized.slice(1);

      // try lowercase first, then capitalized (defensive for deployed enum mismatch)
      const tries = [
        { ...basePayload, status: normalized },
        { ...basePayload, status: capitalized },
      ];

      let succeeded = false;
      let lastError = null;

      for (const payload of tries) {
        try {
          const response = await attendanceService.markAttendance(payload);
          console.log("Marked attendance response:", response.data);
          // store normalized value in local state (use normalized lowercase for UI consistency)
          updatedAttendance[studentId] = normalized;
          successes.push(studentId);
          succeeded = true;
          break;
        } catch (err) {
          lastError = err;
          // inspect error; continue to next try
          const msg =
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            err?.message ||
            String(err);
          console.warn("Attempt failed for payload", payload, msg);
          // continue to next try
        }
      }

      if (!succeeded) {
        console.error(
          "Failed to mark attendance for student:",
          studentId,
          lastError?.response?.data || lastError?.message || lastError
        );
        errors.push({
          studentId,
          error: lastError?.response?.data || lastError?.message || String(lastError),
        });
        // continue to next student
      }
    }

    // Update local attendance state only for successfully saved entries
    setAttendance((prev) => ({ ...prev, ...updatedAttendance }));

    // Remove successfully saved entries from pendingChanges
    const remainingPending = { ...pendingChanges };
    successes.forEach((id) => delete remainingPending[id]);
    setPendingChanges(remainingPending);
    setHasChanges(Object.keys(remainingPending).length > 0);

    // Refresh from server to ensure full sync (optional but recommended)
    await fetchStudents();

    // user feedback summary
    if (errors.length === 0) {
      alert("Attendance saved successfully!");
    } else {
      const failedIds = errors.map((e) => e.studentId).join(", ");
      alert(
        `Completed with errors. Success: ${successes.length}, Failed: ${errors.length}. Failed IDs: ${failedIds}`
      );
    }
  } catch (error) {
    console.error("Unexpected error saving attendance:", error);
    alert(`Unexpected error: ${error?.message || String(error)}`);
  } finally {
    setLoading(false);
  }
};


  const handleBulkUploadSuccess = () => {
    fetchStudents();
  };

  const downloadTodayAttendance = () => {
    const data = students.map((s) => ({
      Name: `${s.userId?.firstName} ${s.userId?.lastName}`,
      "Roll Number": s.rollNumber,
      Class: s.class,
      Section: s.section,
      Status: attendance[s._id] || "Not Marked",
    }));

    const csv = [
      Object.keys(data[0]).join(","),
      ...data.map((d) => Object.values(d).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box
      sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}
    >
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1 }}>
        <Header onMobileMenuToggle={() => setMobileOpen(!mobileOpen)} />
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 4,
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: "bold" }}>
              📍 Attendance
            </Typography>
            <Button
              variant="contained"
              startIcon={<CloudUploadIcon />}
              onClick={() => setOpenBulkUpload(true)}
            >
              Bulk Upload
            </Button>
          </Box>

          <Paper sx={{ p: 3, mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
                mb: 2,
              }}
            >
              <TextField
                label="Select Date"
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  localStorage.setItem('attendance_date', e.target.value);
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 180 }}
              />
              <TextField
                label="Class"
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  localStorage.setItem('attendance_class', e.target.value);
                }}
                placeholder="e.g., 10"
                sx={{ minWidth: 100 }}
              />
              <TextField
                label="Section"
                value={selectedSection}
                onChange={(e) => {
                  setSelectedSection(e.target.value);
                  localStorage.setItem('attendance_section', e.target.value);
                }}
                placeholder="e.g., A"
                sx={{ minWidth: 100 }}
              />
            </Box>
            <Box
              sx={{
                display: "flex",
                gap: 2,
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {canMarkAttendance && hasChanges && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveAttendance}
                  sx={{ fontWeight: "bold" }}
                >
                  Save Attendance
                </Button>
              )}
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadTodayAttendance}
                disabled={!selectedClass || !selectedSection}
              >
                Download Today
              </Button>
              <ExportData
                data={students.map((s) => ({
                  Name: `${s.userId?.firstName} ${s.userId?.lastName}`,
                  "Roll Number": s.rollNumber,
                  Class: s.class,
                  Section: s.section,
                  Status: attendance[s._id] || "Not Marked",
                }))}
                filename="attendance"
                title="Attendance Report"
                dateField="date"
              />
            </Box>
          </Paper>

          {!selectedClass || !selectedSection ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography color="textSecondary">
                Please select Date, Class, and Section to view students
              </Typography>
            </Paper>
          ) : loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : students.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Typography color="textSecondary">
                No students found for Class {selectedClass}-{selectedSection}
              </Typography>
            </Paper>
          ) : (
            <Paper sx={{ overflow: 'hidden' }}>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: 60 }}>
                        <strong>Roll</strong>
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: 120 }}>
                        <strong>Name</strong>
                      </TableCell>
                      {canMarkAttendance ? (
                        <>
                          <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: 90 }}>
                            <strong>Present</strong>
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: 90 }}>
                            <strong>Absent</strong>
                          </TableCell>
                          <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: 90 }}>
                            <strong>Late</strong>
                          </TableCell>
                        </>
                      ) : (
                        <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                          <strong>Status</strong>
                        </TableCell>
                      )}
                      <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' }, minWidth: 80 }}>
                        <strong>Details</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student) => {
                      const currentStatus = pendingChanges[student._id] || attendance[student._id];
                      return (
                        <TableRow key={student._id} hover>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {student.rollNumber}
                          </TableCell>
                          <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                            {student.userId?.firstName} {student.userId?.lastName}
                          </TableCell>
                          {canMarkAttendance ? (
                            <>
                              <TableCell align="center">
                                <Button
                                  variant={currentStatus === "present" ? "contained" : "outlined"}
                                  color="success"
                                  size="small"
                                  onClick={() => handleMarkAttendance(student._id, "present")}
                                  sx={{ minWidth: { xs: 70, sm: 80 }, fontSize: { xs: '0.7rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}
                                >
                                  P
                                </Button>
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  variant={currentStatus === "absent" ? "contained" : "outlined"}
                                  color="error"
                                  size="small"
                                  onClick={() => handleMarkAttendance(student._id, "absent")}
                                  sx={{ minWidth: { xs: 70, sm: 80 }, fontSize: { xs: '0.7rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}
                                >
                                  A
                                </Button>
                              </TableCell>
                              <TableCell align="center">
                                <Button
                                  variant={currentStatus === "late" ? "contained" : "outlined"}
                                  color="warning"
                                  size="small"
                                  onClick={() => handleMarkAttendance(student._id, "late")}
                                  sx={{ minWidth: { xs: 70, sm: 80 }, fontSize: { xs: '0.7rem', sm: '0.875rem' }, px: { xs: 1, sm: 2 } }}
                                >
                                  L
                                </Button>
                              </TableCell>
                            </>
                          ) : (
                            <TableCell>
                              <Chip 
                                label={currentStatus || "Not Marked"}
                                size="small"
                                color={currentStatus === "present" ? "success" : currentStatus === "late" ? "warning" : currentStatus === "absent" ? "error" : "default"}
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                              />
                            </TableCell>
                          )}
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="text"
                              onClick={() => {
                                setSelectedStudent(student);
                                setDetailsModalOpen(true);
                              }}
                              sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
              
              <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: 'action.hover', display: 'flex', gap: { xs: 2, sm: 3 }, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>{students.length}</Typography>
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Total</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="success.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {students.filter(s => (pendingChanges[s._id] || attendance[s._id]) === "present").length}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Present</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="error.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {students.filter(s => (pendingChanges[s._id] || attendance[s._id]) === "absent").length}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Absent</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" color="warning.main" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {students.filter(s => (pendingChanges[s._id] || attendance[s._id]) === "late").length}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Late</Typography>
                </Box>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    {students.filter(s => !(pendingChanges[s._id] || attendance[s._id])).length}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>Not Marked</Typography>
                </Box>
              </Box>
            </Paper>
          )}

          <BulkAttendanceUpload
            open={openBulkUpload}
            onClose={() => setOpenBulkUpload(false)}
            onSuccess={handleBulkUploadSuccess}
          />

          <AttendanceDetailsModal
            open={detailsModalOpen}
            onClose={() => setDetailsModalOpen(false)}
            studentId={selectedStudent?._id}
            studentName={`${selectedStudent?.userId?.firstName} ${selectedStudent?.userId?.lastName}`}
          />
        </Container>
      </Box>
    </Box>
  );
}
