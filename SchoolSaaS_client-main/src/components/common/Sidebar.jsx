import { useState } from 'react';
import { Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Box, Typography, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import GroupIcon from '@mui/icons-material/Group';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EventIcon from '@mui/icons-material/Event';
import PaymentIcon from '@mui/icons-material/Payment';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import SettingsIcon from '@mui/icons-material/Settings';
import DescriptionIcon from '@mui/icons-material/Description';

const DRAWER_WIDTH = 260;
const MOBILE_DRAWER_WIDTH = 280;

const getRoleMenuItems = (role) => {
  const baseItems = [
    { label: 'Dashboard', icon: DashboardIcon, path: '/dashboard', roles: ['super_admin', 'school_admin', 'teacher', 'parent', 'student'] },
  ];

  const roleSpecificItems = {
    super_admin: [
      { label: 'Schools', icon: SchoolIcon, path: '/schools', roles: ['super_admin'] },
      { label: 'Users', icon: GroupIcon, path: '/users', roles: ['super_admin'] },
      { label: 'Analytics', icon: DashboardIcon, path: '/analytics', roles: ['super_admin'] },
      { label: 'Settings', icon: SettingsIcon, path: '/settings', roles: ['super_admin'] },
    ],
    school_admin: [
      { label: 'Students', icon: GroupIcon, path: '/students', roles: ['school_admin'] },
      { label: 'Teachers', icon: AssignmentIcon, path: '/teachers', roles: ['school_admin'] },
      { label: 'Attendance', icon: EventIcon, path: '/attendance', roles: ['school_admin'] },
      { label: 'Examinations', icon: AssignmentIcon, path: '/examinations', roles: ['school_admin'] },
      { label: 'Fees', icon: PaymentIcon, path: '/fees', roles: ['school_admin'] },
      { label: 'Announcements', icon: AnnouncementIcon, path: '/announcements', roles: ['school_admin'] },
      { label: 'Templates', icon: DescriptionIcon, path: '/templates', roles: ['school_admin'] },
    ],
    teacher: [
      { label: 'Attendance', icon: EventIcon, path: '/attendance', roles: ['teacher'] },
      { label: 'Examinations', icon: AssignmentIcon, path: '/examinations', roles: ['teacher'] },
      { label: 'Assignments', icon: AssignmentIcon, path: '/assignments', roles: ['teacher'] },
      { label: 'Students', icon: GroupIcon, path: '/students', roles: ['teacher'] },
    ],
    student: [
      { label: 'Attendance', icon: EventIcon, path: '/attendance', roles: ['student'] },
      { label: 'Results', icon: AssignmentIcon, path: '/results', roles: ['student'] },
      { label: 'Assignments', icon: AssignmentIcon, path: '/assignments', roles: ['student'] },
      { label: 'Fees', icon: PaymentIcon, path: '/fees', roles: ['student'] },
    ],
    parent: [
      { label: 'Child Attendance', icon: EventIcon, path: '/attendance', roles: ['parent'] },
      { label: 'Child Results', icon: AssignmentIcon, path: '/results', roles: ['parent'] },
      { label: 'Fees', icon: PaymentIcon, path: '/fees', roles: ['parent'] },
    ],
  };

  const items = [...baseItems];
  if (roleSpecificItems[role]) {
    items.push(...roleSpecificItems[role]);
  }

  return items.filter(item => item.roles.includes(role));
};

export function Sidebar({ mobileOpen, onMobileClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const menuItems = getRoleMenuItems(user?.role || 'student');

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile && onMobileClose) {
      onMobileClose();
    }
  };

  const drawerContent = (
    <>
      <Box sx={{
        p: { xs: 2, sm: 2 },
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        minHeight: { xs: 64, sm: 80 },
        bgcolor: 'background.paper'
      }}>
        <Typography variant="h6" sx={{
          fontWeight: 'bold',
          fontSize: { xs: '0.875rem', sm: '1.25rem' },
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {user?.role?.replace('_', ' ').toUpperCase()}
        </Typography>
        <Typography variant="caption" color="textSecondary" sx={{
          fontSize: { xs: '0.7rem', sm: '0.75rem' },
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          display: 'block'
        }}>
          {user?.firstName} {user?.lastName}
        </Typography>
      </Box>

      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={location.pathname === item.path}
              sx={{
                py: { xs: 1, sm: 1.5 },
                px: { xs: 2, sm: 2 },
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  borderLeft: (theme) => `4px solid ${theme.palette.primary.main}`,
                  paddingLeft: { xs: '12px', sm: '12px' },
                  '&:hover': {
                    bgcolor: 'action.selected'
                  }
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: { xs: 40, sm: 56 } }}>
                <item.icon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          zIndex: (theme) => theme.zIndex.appBar + 1,
          '& .MuiDrawer-paper': {
            width: MOBILE_DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: 'background.default',
            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            zIndex: (theme) => theme.zIndex.appBar + 1
          }
        }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: 'background.default',
          borderRight: (theme) => `1px solid ${theme.palette.divider}`
        }
      }}
    >
      {drawerContent}
    </Drawer>
  );
}

export { DRAWER_WIDTH };
