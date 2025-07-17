import React, { useState, useEffect } from "react";
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
import parkingSlotsService from "services/parkingSlotsService";
import parkingZonesService from "services/parkingZonesService";

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

function ParkingSlots() {
  const [slots, setSlots] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", color: "success" });

  const [modalOpen, setModalOpen] = useState(false);
  const [currentSlot, setCurrentSlot] = useState(null);

  const [formData, setFormData] = useState({
    slotId: "",
    parkingZoneId: "",
    slotType: "",
    pricePerHour: "",
    status: "",
  });

  const fetchParkingData = async () => {
    try {
      setLoading(true);
      const [slotsData, zonesData] = await Promise.all([
        parkingSlotsService.getAllParkingSlots(),
        parkingZonesService.getAllParkingZones(),
      ]);
      setSlots(slotsData);
      setZones(zonesData);
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
    fetchParkingData();
  }, []);

  const handleModalOpen = (slot = null) => {
    setCurrentSlot(slot);
    if (slot) {
      setFormData({
        slotId: slot.slotId,
        parkingZoneId: slot.parkingZone.zoneId,
        slotType: slot.slotType,
        pricePerHour: slot.pricePerHour,
        status: slot.status,
      });
    } else {
      setFormData({
        slotId: "",
        parkingZoneId: "",
        slotType: "REGULAR",
        pricePerHour: "",
        status: "AVAILABLE",
      });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setCurrentSlot(null);
    setFormData({
      slotId: "",
      parkingZoneId: "",
      slotType: "",
      pricePerHour: "",
      status: "",
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(name, value, "on select change");
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
      const submitData = {
        ...formData,
        pricePerHour: parseFloat(formData.pricePerHour),
      };

      if (currentSlot) {
        const updatedSlot = await parkingSlotsService.updateParkingSlot(
          currentSlot.slotId,
          submitData
        );
        setSlots(slots.map((slot) => (slot._id === updatedSlot._id ? updatedSlot : slot)));
        setSnackbar({
          open: true,
          message: "Parking slot updated successfully!",
          color: "success",
        });
      } else {
        const newSlot = await parkingSlotsService.createParkingSlot(submitData);
        setSlots([...slots, newSlot]);
        setSnackbar({
          open: true,
          message: "New parking slot created successfully!",
          color: "success",
        });
      }
      handleModalClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        `Failed to ${currentSlot ? "update" : "create"} parking slot.`;
      setSnackbar({ open: true, message: errorMessage, color: "error" });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this parking slot?")) {
      try {
        await parkingSlotsService.deleteParkingSlot(id);
        setSlots(slots.filter((slot) => slot._id !== id));
        setSnackbar({
          open: true,
          message: "Parking slot deleted successfully!",
          color: "success",
        });
      } catch (err) {
        setSnackbar({ open: true, message: "Failed to delete parking slot.", color: "error" });
      }
    }
  };

  const columns = [
    { Header: "Slot ID", accessor: "slotId" },
    { Header: "Parking Zone", accessor: "parkingZone" },
    { Header: "Slot Type", accessor: "slotType" },
    { Header: "Price Per Hour", accessor: "pricePerHour" },
    { Header: "Status", accessor: "status" },
    { Header: "Actions", accessor: "actions" },
  ];

  const rows = slots.map((slot) => ({
    slotId: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {slot.slotId}
      </MDTypography>
    ),
    parkingZone: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {slot.parkingZone ? slot.parkingZone.name : "N/A"}
        <br />
        {slot.parkingZone ? slot.parkingZone.address : "N/A"}
      </MDTypography>
    ),
    slotType: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {slot.slotType}
      </MDTypography>
    ),
    pricePerHour: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        ${slot.pricePerHour.toFixed(2)}
      </MDTypography>
    ),
    status: (
      <MDBox ml={-1}>
        <MDBadge
          badgeContent={slot.status}
          color={
            slot.status === "AVAILABLE"
              ? "success"
              : slot.status === "OCCUPIED"
              ? "error"
              : slot.status === "MAINTENANCE"
              ? "error"
              : "warning"
          }
          variant="gradient"
          size="sm"
        />
      </MDBox>
    ),
    actions: (
      <MDBox>
        <MDButton variant="text" color="info" onClick={() => handleModalOpen(slot)}>
          <Icon>edit</Icon>
        </MDButton>
        <MDButton variant="text" color="error" onClick={() => handleDelete(slot.slotId)}>
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
                  <MDTypography variant="h5">Loading parking slots...</MDTypography>
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
                  Parking Slots
                </MDTypography>
                <MDButton variant="gradient" color="dark" onClick={() => handleModalOpen(null)}>
                  <Icon sx={{ fontWeight: "bold" }}>add</Icon>  Add Parking Slot
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

      {/* Parking Slot Create/Edit Modal */}
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
              {currentSlot ? "Edit Parking Slot" : "Add New Parking Slot"}
            </MDTypography>
            <MDBox
              component="form"
              onSubmit={handleSubmit}
              sx={{ flexGrow: 1, overflowY: "auto", pr: 2 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Slot ID"
                    name="slotId"
                    value={formData.slotId}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={!!currentSlot}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="parking-zone-label">Parking Zone</InputLabel>
                    <Select
                      labelId="parking-zone-label"
                      id="parking-zone-select"
                      value={formData.parkingZoneId}
                      label="Parking Zone"
                      name="parkingZoneId"
                      onChange={handleChange}
                      style={{ height: "3rem" }}
                    >
                      {zones.map((zone) => (
                        <MenuItem key={zone.zoneId} value={zone.zoneId}>
                          {zone.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel id="slot-type-label">Slot Type</InputLabel>
                    <Select
                      labelId="slot-type-label"
                      id="slot-type-select"
                      value={formData.slotType}
                      label="Slot Type"
                      name="slotType"
                      onChange={handleChange}
                      style={{ height: "3rem" }}
                    >
                      <MenuItem value="COMPACT">COMPACT</MenuItem>
                      <MenuItem value="REGULAR">REGULAR</MenuItem>
                      <MenuItem value="LARGE">LARGE</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Price Per Hour"
                    name="pricePerHour"
                    type="number"
                    value={formData.pricePerHour}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth required>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      id="status-select"
                      value={formData.status}
                      label="Status"
                      name="status"
                      onChange={handleChange}
                      style={{ height: "3rem" }}
                    >
                      <MenuItem value="AVAILABLE">AVAILABLE</MenuItem>
                      <MenuItem value="OCCUPIED">OCCUPIED</MenuItem>
                      <MenuItem value="RESERVED">RESERVED</MenuItem>
                      <MenuItem value="MAINTENANCE">MAINTENANCE</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <MDButton variant="contained" color="dark" onClick={handleModalClose}>
                    Cancel
                  </MDButton>
                  <MDButton type="submit" variant="contained" color="info">
                    {currentSlot ? "Update" : "Create"}
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

export default ParkingSlots;
