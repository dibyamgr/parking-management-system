import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import axios from "axios";

// @mui material components
import { Card, Grid, Divider, Modal, Backdrop, Fade } from "@mui/material";

// React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";

// Images
import bgImage from "assets/images/parking-cover.jpg";
import UserLayout from "../components/UserLayout";

// Map components
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

function FindParkingPage() {
  const navigate = useNavigate();
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [arrivingDate, setArrivingDate] = useState("");
  const [arrivingTime, setArrivingTime] = useState("");
  const [leavingTime, setLeavingTime] = useState("");
  const [allZones, setAllZones] = useState([]);
  const [filteredZones, setFilteredZones] = useState([]);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [mapModalOpen, setMapModalOpen] = useState(false);

  useEffect(() => {
    const fetchZones = async () => {
      try {
        const zones = await parkingZonesService.getAllParkingZones();
        setAllZones(zones);
        setFilteredZones(zones);
      } catch (error) {
        console.error("Failed to fetch parking zones.", error);
      }
    };
    fetchZones();
  }, []);

  useEffect(() => {
    const searchTerm = address.toLowerCase();
    if (searchTerm) {
      const results = allZones.filter(
        (zone) =>
          zone.name.toLowerCase().includes(searchTerm) ||
          zone.address.toLowerCase().includes(searchTerm)
      );
      setFilteredZones(results);
    } else {
      setFilteredZones(allZones);
    }
  }, [address, allZones]);

  const getAddressFromLatLng = async (lat, lng) => {
    const headers = { "User-Agent": "Vehicle Parking Management System/1.0" };
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
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error("Geocoding failed: ", error);
    }
  };

  const getLatLngFromAddress = async () => {
    if (!address) return;
    const headers = { "User-Agent": "Vehicle Parking Management System/1.0" };
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          address
        )}&format=json&limit=1`,
        { headers }
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setLatitude(lat);
        setLongitude(lon);
      }
    } catch (error) {
      console.error("Geocoding failed: ", error);
    }
  };

  const handleSearch = async () => {
    if (!arrivingDate || !arrivingTime || !leavingTime) {
      alert("Please provide date, arrival, and exit times.");
      return;
    }

    const searchParams = {
      date: arrivingDate,
      arrivalTime: arrivingTime,
      exitTime: leavingTime,
    };

    if (address) {
      await getLatLngFromAddress();
      searchParams.location = address;
    } else if (latitude && longitude) {
      searchParams.latitude = latitude;
      searchParams.longitude = longitude;
    } else {
      alert("Please enter a location or select one on the map.");
      return;
    }

    try {
      const searchResults = await parkingSlotsService.searchParkingSlots(searchParams);
      navigate("/search-results", {
        state: { searchResults, searchParams },
      });
    } catch (error) {
      console.error("Search error:", error);
      alert("An error occurred during the search. Please try again.");
    }
  };

  const NavLink = ({ text, route }) => (
    <MDTypography
      component={Link}
      to={route}
      variant="button"
      color="white"
      fontWeight="medium"
      ml={2}
      sx={{ "&:hover": { textDecoration: "underline" } }}
    >
      {text}
    </MDTypography>
  );

  NavLink.propTypes = {
    text: PropTypes.string.isRequired,
    route: PropTypes.string.isRequired,
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setLatitude(lat);
        setLongitude(lng);
        getAddressFromLatLng(lat, lng);
        setMapModalOpen(false);
      },
    });
    return null;
  };

  const handleZoneClick = (zone) => {
    setAddress(zone.address);
    setIsInputFocused(false);
  };

  return (
    <UserLayout image={bgImage}>
      {/* Main Content */}
      <MDBox
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        flexGrow={1}
        p={2}
        textAlign="center"
        my={4}
      >
        <Card sx={{ p: 4, mt: 20, maxWidth: "800px", width: "100%" }}>
          <MDTypography variant="h3" fontWeight="bold" color="dark" mb={1}>
            Enter an address, pick a time and click search
          </MDTypography>
          <MDTypography variant="body2" color="text" mb={4}>
            No more running around looking for a parking spot.
          </MDTypography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid item xs={12} md={6} sx={{ position: "relative" }}>
              <MDInput
                label="Address"
                fullWidth
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setTimeout(() => setIsInputFocused(false), 200)}
              />
              {isInputFocused && filteredZones.length > 0 && (
                <MDBox
                  sx={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    mt: 1,
                    maxHeight: 200,
                    overflowY: "auto",
                    bgcolor: "background.paper",
                    border: "1px solid #e0e0e0",
                    borderRadius: "4px",
                    boxShadow: 2,
                  }}
                >
                  {filteredZones.map((zone) => (
                    <MDBox
                      key={zone.zoneId}
                      sx={{
                        p: 1.5,
                        cursor: "pointer",
                        "&:hover": {
                          bgcolor: "rgba(0, 0, 0, 0.04)",
                        },
                      }}
                      onClick={() => handleZoneClick(zone)}
                    >
                      <MDTypography variant="body2" fontWeight="bold">
                        {zone.name}
                      </MDTypography>
                      <MDTypography variant="caption" color="text">
                        {zone.address}
                      </MDTypography>
                    </MDBox>
                  ))}
                </MDBox>
              )}
            </Grid>
            <Grid item xs={6} md={3}>
              <MDInput
                label="Arriving on"
                type="date"
                fullWidth
                value={arrivingDate}
                onChange={(e) => setArrivingDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <MDInput
                label="Arriving time"
                type="time"
                fullWidth
                value={arrivingTime}
                onChange={(e) => setArrivingTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <MDInput
                label="Leaving time"
                type="time"
                fullWidth
                value={leavingTime}
                onChange={(e) => setLeavingTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: "flex", justifyContent: "center" }}>
              <MDButton variant="gradient" color="info" fullWidth onClick={handleSearch}>
                Search
              </MDButton>
            </Grid>
          </Grid>
          <MDBox mt={2}>
            <MDTypography variant="body2" color="text" display="block" mb={1}>
              - OR -
            </MDTypography>
            <MDButton variant="outlined" color="info" onClick={() => setMapModalOpen(true)}>
              Choose Location on Map
            </MDButton>
          </MDBox>
        </Card>
      </MDBox>

      <MDBox
        display="flex"
        justifyContent="center"
        alignItems="center"
        py={9}
        flexWrap="wrap"
        mx={6}
      >
        <MDBox
          display="flex"
          flexDirection="column"
          alignItems="center"
          mx={3}
          sx={{
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-5px)",
              boxShadow: "0 8px 16px rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          <MDBox
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="40px"
            height="40px"
            borderRadius="50%"
            bgColor="info"
            mb={1}
          >
            <MDTypography variant="h6" color="white">
              1
            </MDTypography>
          </MDBox>
          <MDTypography variant="caption" color="white" textAlign="center">
            Enter your location
          </MDTypography>
        </MDBox>
        <MDBox
          sx={{
            flexGrow: 1,
            mx: 2,
            borderBottom: "2px dashed white",
            maxHeight: "2px",
            alignSelf: "flex-start",
            mt: "20px",
          }}
        />
        <MDBox
          display="flex"
          flexDirection="column"
          alignItems="center"
          mx={3}
          sx={{
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-5px)",
              boxShadow: "0 8px 16px rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          <MDBox
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="40px"
            height="40px"
            borderRadius="50%"
            border="2px solid white"
            mb={1}
          >
            <MDTypography variant="h6" color="white">
              2
            </MDTypography>
          </MDBox>
          <MDTypography variant="caption" color="white" textAlign="center">
            Pick Date and Time
          </MDTypography>
        </MDBox>
        <MDBox
          sx={{
            flexGrow: 1,
            mx: 2,
            borderBottom: "2px dashed white",
            maxHeight: "2px",
            alignSelf: "flex-start",
            mt: "20px",
          }}
        />
        <MDBox
          display="flex"
          flexDirection="column"
          alignItems="center"
          mx={3}
          sx={{
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "translateY(-5px)",
              boxShadow: "0 8px 16px rgba(255, 255, 255, 0.2)",
            },
          }}
        >
          <MDBox
            display="flex"
            justifyContent="center"
            alignItems="center"
            width="40px"
            height="40px"
            borderRadius="50%"
            border="2px solid white"
            mb={1}
          >
            <MDTypography variant="h6" color="white">
              3
            </MDTypography>
          </MDBox>
          <MDTypography variant="caption" color="white" textAlign="center">
            Pick a spot!
          </MDTypography>
        </MDBox>
      </MDBox>

      {/* Map Modal */}
      <Modal
        open={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={mapModalOpen}>
          <MDBox sx={modalStyle}>
            <MDTypography variant="h5" mb={3}>
              Select Location on Map
            </MDTypography>
            <MDTypography variant="caption" color="text" mb={2}>
              Click on the map to place a marker. The corresponding address will be updated.
            </MDTypography>
            <div
              style={{
                height: "400px",
                borderRadius: "8px",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            >
              <MapContainer
                key={mapModalOpen ? "map-active" : "map-inactive"}
                center={[latitude || 47.5615, longitude || -52.7126]}
                zoom={13}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapClickHandler />
                {latitude && longitude && (
                  <Marker position={[latitude, longitude]} icon={customIcon} />
                )}
              </MapContainer>
            </div>
            <MDBox display="flex" justifyContent="flex-end">
              <MDButton variant="contained" color="dark" onClick={() => setMapModalOpen(false)}>
                Done
              </MDButton>
            </MDBox>
          </MDBox>
        </Fade>
      </Modal>
    </UserLayout>
  );
}

export default FindParkingPage;
