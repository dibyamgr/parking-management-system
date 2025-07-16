import React, { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Modal from "@mui/material/Modal";
import Backdrop from "@mui/material/Backdrop";
import Fade from "@mui/material/Fade";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// ParkSmart React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDBadge from "components/MDBadge";

// ParkSmart examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

// API Service
import usersService from "services/userService";

// --- START: MODAL STYLES ---
const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: { xs: "90%", sm: "80%", md: "50%" },
  bgcolor: "background.paper",
  borderRadius: "8px",
  boxShadow: 24,
  p: 4,
};
// --- END: MODAL STYLES ---

function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", color: "success" });

  const [modalOpen, setModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // For editing, or null for creating

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "USER",
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await usersService.getAllUsers();
      setUsers(data);
      setLoading(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to fetch users. Please try again.",
        color: "error",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleModalOpen = (user = null) => {
    setCurrentUser(user);
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: "", // Password should not be pre-filled
        role: user.role?.toUpperCase(),
      });
    } else {
      setFormData({ name: "", email: "", password: "", role: "USER" });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setCurrentUser(null);
    setFormData({ name: "", email: "", password: "", role: "USER" });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (currentUser) {
        const updatedUser = await usersService.updateUser(currentUser._id, formData);
        setUsers(users.map((user) => (user._id === updatedUser._id ? updatedUser : user)));
        setSnackbar({ open: true, message: "User updated successfully!", color: "success" });
      } else {
        const response = await usersService.createUser(formData);
        // FIX: Access the nested 'user' object from the API response
        const newUser = response.user;
        setUsers([...users, newUser]);
        setSnackbar({ open: true, message: "New user created successfully!", color: "success" });
      }
      handleModalClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || `Failed to ${currentUser ? "update" : "create"} user.`;
      setSnackbar({ open: true, message: errorMessage, color: "error" });
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await usersService.deleteUser(userId);
        // Visually remove the user from the list
        setUsers(users.filter((user) => user._id !== userId));
        setSnackbar({ open: true, message: "User deleted successfully!", color: "success" });
      } catch (err) {
        setSnackbar({ open: true, message: "Failed to delete user.", color: "error" });
      }
    }
  };

  // DataTable columns
  const columns = [
    { Header: "user", accessor: "user", width: "30%" },
    { Header: "role", accessor: "role", width: "20%" },
    { Header: "status", accessor: "status", width: "15%" },
    { Header: "actions", accessor: "actions", width: "15%" },
  ];

  // DataTable rows
  const rows = users.map((user) => ({
    user: (
      <MDBox display="flex" alignItems="center">
        <MDBox ml={1} lineHeight={1}>
          <MDTypography display="block" variant="button" fontWeight="medium">
            {user.name}
          </MDTypography>
          <MDTypography variant="caption">{user.email}</MDTypography>
        </MDBox>
      </MDBox>
    ),
    role: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {user.role}
      </MDTypography>
    ),
    status: (
      <MDBadge
        variant="gradient"
        // Use 'active' as a default if no status field is present
        badgeContent={user.status ? user.status.toLowerCase() : "active"}
        color={user.status === "suspended" ? "error" : "success"}
        size="xs"
        container
      />
    ),
    actions: (
      <MDBox>
        <MDButton variant="text" color="info" onClick={() => handleModalOpen(user)}>
          <Icon>edit</Icon>
        </MDButton>
        <MDButton variant="text" color="error" onClick={() => handleDelete(user._id)}>
          <Icon>delete</Icon>
        </MDButton>
      </MDBox>
    ),
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3}>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Card>
                <MDBox p={3} textAlign="center">
                  <MDTypography variant="h5">Loading users...</MDTypography>
                </MDBox>
              </Card>
            </Grid>
          </Grid>
        </MDBox>
        <Footer />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <MDTypography variant="h6" color="white">
                  Users
                </MDTypography>
                <MDButton variant="gradient" color="dark" onClick={() => handleModalOpen(null)}>
                  <Icon sx={{ fontWeight: "bold" }}>add</Icon>&nbsp; Add User
                </MDButton>
              </MDBox>
              <MDBox pt={3}>
                <DataTable
                  table={{ columns, rows }}
                  isSorted={true}
                  entriesPerPage={true}
                  showTotalEntries={true}
                  noEndBorder
                />
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />

      {/* User Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={handleModalClose}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
        }}
      >
        <Fade in={modalOpen}>
          <MDBox sx={modalStyle}>
            <MDTypography variant="h5" mb={3}>
              {currentUser ? "Edit User" : "Add New User"}
            </MDTypography>
            <MDBox component="form" onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    fullWidth
                    required={!currentUser} // Password is required only for new users
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel id="role-label">Role</InputLabel>
                    <Select
                      labelId="role-label"
                      id="role"
                      name="role"
                      value={formData.role}
                      label="Role"
                      onChange={handleChange}
                    >
                      <MenuItem value="ADMIN">Admin</MenuItem>
                      <MenuItem value="USER">User</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <MDButton variant="contained" color="dark" onClick={handleModalClose}>
                    Cancel
                  </MDButton>
                  <MDButton type="submit" variant="contained" color="info">
                    {currentUser ? "Update" : "Create"}
                  </MDButton>
                </Grid>
              </Grid>
            </MDBox>
          </MDBox>
        </Fade>
      </Modal>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.color} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

export default Users;
