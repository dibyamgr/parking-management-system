import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Modal from "@mui/material/Modal";
import Backdrop from "@mui/material/Backdrop";
import Fade from "@mui/material/Fade";
import TextField from "@mui/material/TextField";
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

// Map components
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// API Service
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

// Custom marker icon to avoid default marker issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

const customIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function ParkingZones() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", color: "success" });

  const [modalOpen, setModalOpen] = useState(false);
  const [currentZone, setCurrentZone] = useState(null);

  const [formData, setFormData] = useState({
    zoneId: "",
    name: "",
    address: "",
    latitude: "",
    longitude: "",
    description: "",
  });

  const fetchZones = async () => {
    try {
      setLoading(true);
      const data = await parkingZonesService.getAllParkingZones();
      setZones(data);
      setLoading(false);
    } catch (err) {
      setSnackbar({
        open: true,
        message: "Failed to fetch parking zones. Please try again.",
        color: "error",
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // Get Address from lat and long for pinning in map
  const getAddressFromLatLng = async (lat, lng) => {
    const headers = {
      "User-Agent": "Vehicle Parking Management System/1.0",
    };

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
        { headers }
      );
      const data = await response.json();

      if (data && data.address) {
        const addressParts = data.address;
        const formattedAddress = [
          addressParts.road || "",
          addressParts.house_number || "",
          addressParts.city || addressParts.town || addressParts.village || "",
          addressParts.state || "",
          addressParts.postcode || "",
          addressParts.country || "",
        ]
          .filter(Boolean)
          .join(", ");

        setFormData((prevData) => ({ ...prevData, address: formattedAddress }));
        setSnackbar({ open: true, message: "Address populated automatically!", color: "info" });
      } else {
        setSnackbar({
          open: true,
          message: "No address found for this location.",
          color: "warning",
        });
      }
    } catch (error) {
      console.error("Geocoding failed: ", error);
      setSnackbar({
        open: true,
        message: "Could not find an address for this location.",
        color: "warning",
      });
    }
  };

  // geocoding with nominatim openstreetmap API
  const getLatLngFromAddress = async () => {
    if (!formData.address) {
      setSnackbar({ open: true, message: "Please enter an address to search.", color: "warning" });
      return;
    }

    const headers = {
      "User-Agent": "Vehicle Parking Management System/1.0",
    };

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          formData.address
        )}&format=json&limit=1`,
        { headers }
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData((prevData) => ({
          ...prevData,
          latitude: lat,
          longitude: lon,
        }));
        setSnackbar({ open: true, message: "Location found and map updated!", color: "success" });
      } else {
        setSnackbar({
          open: true,
          message: "No coordinates found for this address.",
          color: "warning",
        });
      }
    } catch (error) {
      console.error("Geocoding failed: ", error);
      setSnackbar({
        open: true,
        message: "Failed to find coordinates for the address.",
        color: "error",
      });
    }
  };

  const handleModalOpen = (zone = null) => {
    setCurrentZone(zone);
    if (zone) {
      setFormData({
        zoneId: zone.zoneId,
        name: zone.name,
        address: zone.address,
        latitude: zone.latitude,
        longitude: zone.longitude,
        description: zone.description,
      });
    } else {
      setFormData({
        zoneId: "",
        name: "",
        address: "",
        latitude: 47.5615,
        longitude: -52.7126,
        description: "",
      });
    }
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setCurrentZone(null);
    setFormData({
      zoneId: "",
      name: "",
      address: "",
      latitude: "",
      longitude: "",
      description: "",
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
      const submitData = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
      };

      if (currentZone) {
        const updatedZone = await parkingZonesService.updateParkingZone(
          currentZone.zoneId,
          submitData
        );
        setZones(zones.map((zone) => (zone.zoneId === updatedZone.zoneId ? updatedZone : zone)));
        setSnackbar({
          open: true,
          message: "Parking zone updated successfully!",
          color: "success",
        });
      } else {
        const newZone = await parkingZonesService.createParkingZone(submitData);
        setZones([...zones, newZone]);
        setSnackbar({
          open: true,
          message: "New parking zone created successfully!",
          color: "success",
        });
      }
      handleModalClose();
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        `Failed to ${currentZone ? "update" : "create"} parking zone.`;
      setSnackbar({ open: true, message: errorMessage, color: "error" });
    }
  };

  const handleDelete = async (zoneId) => {
    if (window.confirm("Are you sure you want to delete this parking zone?")) {
      try {
        await parkingZonesService.deleteParkingZone(zoneId);
        setZones(zones.filter((zone) => zone.zoneId !== zoneId));
        setSnackbar({
          open: true,
          message: "Parking zone deleted successfully!",
          color: "success",
        });
      } catch (err) {
        setSnackbar({ open: true, message: "Failed to delete parking zone.", color: "error" });
      }
    }
  };

  // DataTable columns
  const columns = [
    { Header: "Zone ID", accessor: "zoneId" },
    { Header: "Name", accessor: "name" },
    { Header: "Address", accessor: "address" },
    { Header: "Total Slots", accessor: "totalSlots" },
    { Header: "Available Slots", accessor: "availableSlots" },
    { Header: "Description", accessor: "description" },
    { Header: "actions", accessor: "actions" },
  ];

  // DataTable rows
  const rows = zones.map((zone) => ({
    zoneId: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {zone.zoneId}
      </MDTypography>
    ),
    name: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {zone.name}
      </MDTypography>
    ),
    address: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {zone.address}
      </MDTypography>
    ),
    totalSlots: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {zone.totalSlots}
      </MDTypography>
    ),
    availableSlots: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {zone.availableSlots}
      </MDTypography>
    ),
    description: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {zone.description}
      </MDTypography>
    ),
    actions: (
      <MDBox>
        <MDButton variant="text" color="info" onClick={() => handleModalOpen(zone)}>
          <Icon>edit</Icon>
        </MDButton>
        <MDButton variant="text" color="error" onClick={() => handleDelete(zone.zoneId)}>
          <Icon>delete</Icon>
        </MDButton>
      </MDBox>
    ),
  }));

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setFormData({
          ...formData,
          latitude: lat,
          longitude: lng,
        });
        getAddressFromLatLng(lat, lng);
      },
    });
    return null;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3}>
          <Grid container spacing={6}>
            <Grid item xs={12}>
              <Card>
                <MDBox p={3} textAlign="center">
                  <MDTypography variant="h5">Loading parking zones...</MDTypography>
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
                  Parking Zones
                </MDTypography>
                <MDButton variant="gradient" color="dark" onClick={() => handleModalOpen(null)}>
                  <Icon sx={{ fontWeight: "bold" }}>add</Icon>  Add Parking Zone
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
              {currentZone ? "Edit Parking Zone" : "Add New Parking Zone"}
            </MDTypography>
            <MDBox
              component="form"
              onSubmit={handleSubmit}
              sx={{ flexGrow: 1, overflowY: "auto", pr: 2 }}
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Zone ID"
                    name="zoneId"
                    value={formData.zoneId}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled={!!currentZone}
                  />
                </Grid>
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
                <Grid item xs={12} display="flex" alignItems="center">
                  <TextField
                    label="Address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    fullWidth
                    required
                  />
                  <MDButton
                    variant="contained"
                    color="info"
                    onClick={getLatLngFromAddress}
                    sx={{ ml: 2, p: 1 }}
                  >
                    <Icon>search</Icon>
                  </MDButton>
                </Grid>

                <Grid item xs={12}>
                  <MDBox mb={2}>
                    <MDTypography variant="h6">Select Location on Map</MDTypography>
                    <MDTypography variant="caption" color="text">
                      Click on the map to place a marker and get coordinates. The address will be
                      populated automatically.
                    </MDTypography>
                  </MDBox>
                  <div style={{ height: "300px", borderRadius: "8px", overflow: "hidden" }}>
                    <MapContainer
                      key={modalOpen ? "map-active" : "map-inactive"}
                      center={[
                        parseFloat(formData.latitude) || 47.5615,
                        parseFloat(formData.longitude) || -52.7126,
                      ]}
                      zoom={13}
                      scrollWheelZoom={true}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <MapClickHandler />
                      {formData.latitude && formData.longitude && (
                        <Marker
                          position={[formData.latitude, formData.longitude]}
                          icon={customIcon}
                        />
                      )}
                    </MapContainer>
                  </div>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Latitude"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Longitude"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    fullWidth
                    required
                    disabled
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
                <Grid item xs={12} display="flex" justifyContent="flex-end" gap={2} mt={3}>
                  <MDButton variant="contained" color="dark" onClick={handleModalClose}>
                    Cancel
                  </MDButton>
                  <MDButton type="submit" variant="contained" color="info">
                    {currentZone ? "Update" : "Create"}
                  </MDButton>
                </Grid>
              </Grid>
            </MDBox>
          </MDBox>
        </Fade>
      </Modal>

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

export default ParkingZones;
