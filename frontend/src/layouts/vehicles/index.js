import React, { useState, useEffect } from "react";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Modal from "@mui/material/Modal";
import Backdrop from "@mui/material/Backdrop";
import Fade from "@mui/material/Fade";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import InputLabel from "@mui/material/InputLabel";
import FormControl from "@mui/material/FormControl";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

// MUI Icons for vehicle types
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar"; // CAR
import LocalShippingIcon from "@mui/icons-material/LocalShipping"; // TRUCK
import TwoWheelerIcon from "@mui/icons-material/TwoWheeler"; // BIKE

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

// API Services
import vehiclesService from "services/vehiclesService";
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
  display: "flex",
  flexDirection: "column",
  maxHeight: "90vh",
  overflowY: "auto",
};
// --- END: MODAL STYLES ---

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]); // To store users for dropdown
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", color: "success" });

  const [modalOpen, setModalOpen] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState(null);

  const [formData, setFormData] = useState({
    owner: "",
    licensePlate: "",
    vehicleType: "CAR", // Default type, now from the new enum
  });

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [vehiclesData, usersData] = await Promise.all([
        vehiclesService.getAllVehicles(),
        usersService.getAllUsers(), // Fetch all users for the dropdown
      ]);
      setVehicles(vehiclesData);
      setUsers(usersData);
      setLoading(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to fetch data. Please try again.",
        color: "error",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const getVehicleIcon = (type) => {
    switch (type) {
      case "CAR":
        return <DirectionsCarIcon fontSize="small" />;
      case "TRUCK":
        return <LocalShippingIcon fontSize="small" />;
      case "BIKE":
        return <TwoWheelerIcon fontSize="small" />;
      default:
        return <DirectionsCarIcon fontSize="small" />;
    }
  };

  const handleModalOpen = (vehicle = null) => {
    setCurrentVehicle(vehicle);
    if (vehicle) {
      setFormData({
        owner: vehicle.owner._id,
        licensePlate: vehicle.licensePlate,
        vehicleType: vehicle.vehicleType,
      });
    } else {
      setFormData({
        owner: "",
        licensePlate: "",
        vehicleType: "CAR", // Default type
      });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setCurrentVehicle(null);
    setFormData({
      owner: "",
      licensePlate: "",
      vehicleType: "CAR",
    });
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
      if (currentVehicle) {
        await vehiclesService.updateVehicle(currentVehicle._id, formData);
        setSnackbar({ open: true, message: "Vehicle updated successfully!", color: "success" });
      } else {
        await vehiclesService.createVehicle(formData);
        setSnackbar({ open: true, message: "New vehicle created successfully!", color: "success" });
      }
      handleModalClose();
      fetchAllData(); // Refresh data after successful operation
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || `Failed to ${currentVehicle ? "update" : "create"} vehicle.`;
      setSnackbar({ open: true, message: errorMessage, color: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this vehicle?")) {
      try {
        await vehiclesService.deleteVehicle(id);
        setSnackbar({ open: true, message: "Vehicle deleted successfully!", color: "success" });
        fetchAllData(); // Refresh data after deletion
      } catch (err) {
        setSnackbar({ open: true, message: "Failed to delete vehicle.", color: "error" });
      }
    }
  };

  const columns = [
    { Header: "License Plate", accessor: "licensePlate" },
    { Header: "Owner", accessor: "owner" },
    { Header: "Type", accessor: "vehicleType" },
    { Header: "Registration Date", accessor: "addedDate" },
    { Header: "Actions", accessor: "actions" },
  ];

  const rows = vehicles.map((vehicle) => ({
    licensePlate: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {vehicle.licensePlate}
      </MDTypography>
    ),
    owner: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {vehicle.owner ? vehicle.owner.email : "N/A"}
      </MDTypography>
    ),
    vehicleType: (
      <MDBox display="flex" alignItems="center" lineHeight={1}>
        {getVehicleIcon(vehicle.vehicleType)}
        <MDTypography variant="caption" color="text" fontWeight="medium" ml={1}>
          {vehicle.vehicleType}
        </MDTypography>
      </MDBox>
    ),
    addedDate: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {new Date(vehicle.addedDate).toLocaleDateString()}
      </MDTypography>
    ),
    actions: (
      <MDBox>
        <MDButton variant="text" color="info" onClick={() => handleModalOpen(vehicle)}>
          <Icon>edit</Icon>
        </MDButton>
        <MDButton variant="text" color="error" onClick={() => handleDelete(vehicle._id)}>
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
                  <MDTypography variant="h5">Loading vehicles...</MDTypography>
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
                  Vehicles
                </MDTypography>
                <MDButton variant="gradient" color="dark" onClick={() => handleModalOpen(null)}>
                  <Icon sx={{ fontWeight: "bold" }}>add</Icon> Add Vehicle
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

      {/* Vehicle Create/Edit Modal */}
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
              {currentVehicle ? "Edit Vehicle" : "Add New Vehicle"}
            </MDTypography>
            <MDBox
              component="form"
              onSubmit={handleSubmit}
              sx={{ flexGrow: 1, overflowY: "auto", pr: 2 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="user-label">Owner (User)</InputLabel>
                    <Select
                      labelId="user-label"
                      id="user-select"
                      value={formData.owner}
                      label="Owner (User)"
                      name="owner"
                      onChange={handleChange}
                      style={{ height: "3rem" }}
                    >
                      {users.map((user) => (
                        <MenuItem key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="License Plate"
                    name="licensePlate"
                    value={formData.licensePlate}
                    onChange={handleChange}
                    fullWidth
                    required
                    // disabled={!!currentVehicle}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="vehicle-type-label">Vehicle Type</InputLabel>
                    <Select
                      labelId="vehicle-type-label"
                      id="vehicle-type-select"
                      value={formData.vehicleType}
                      label="Vehicle Type"
                      name="vehicleType"
                      onChange={handleChange}
                      style={{ height: "3rem" }}
                    >
                      <MenuItem value="CAR">CAR</MenuItem>
                      <MenuItem value="BIKE">BIKE</MenuItem>
                      <MenuItem value="TRUCK">TRUCK</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <MDButton variant="contained" color="dark" onClick={handleModalClose}>
                    Cancel
                  </MDButton>
                  <MDButton type="submit" variant="contained" color="info">
                    {currentVehicle ? "Update" : "Create"}
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

export default Vehicles;
