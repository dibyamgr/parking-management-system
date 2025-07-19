import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import MDInput from "components/MDInput";
import Icon from "@mui/material/Icon";
import { Card, Grid, CircularProgress } from "@mui/material";
import bgImage from "assets/images/parking-cover.jpg";
import UserLayout from "layouts/user-landing-page/components/UserLayout";
import axiosInstance from "utils/axiosInstance";
import PropTypes from "prop-types";

// Leaflet Map components
import { MapContainer, TileLayer, Marker, useMap, Circle } from "react-leaflet"; // Import Circle
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

const SetMapView = ({ coords }) => {
  const map = useMap();
  useEffect(() => {
    if (coords) {
      map.setView(coords, map.getZoom());
    }
  }, [coords, map]);
  return null;
};

SetMapView.propTypes = {
  coords: PropTypes.arrayOf(PropTypes.number),
};

const FindNearbyParkingZones = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyZones, setNearbyZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [arrivingDate, setArrivingDate] = useState("");
  const [arrivingTime, setArrivingTime] = useState("");
  const [leavingTime, setLeavingTime] = useState("");

  const defaultLocation = [47.5615, -52.7126]; // Default to St. John's
  const searchRadius = 1000; // Define search radius in meters

  const fetchNearbyZones = async (latitude, longitude) => {
    try {
      const response = await axiosInstance.get(`/parking-zones/nearby`, {
        params: { lat: latitude, lng: longitude, radius: searchRadius }, // Pass radius to backend
      });
      setNearbyZones(response.data);
    } catch (err) {
      setError("Failed to fetch nearby parking zones.");
      console.error("Error fetching nearby zones:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFindNearby = () => {
    if (navigator.geolocation) {
      setLoading(true);
      setError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          fetchNearbyZones(latitude, longitude);
        },
        (err) => {
          console.error(err);
          setError("Geolocation failed. Please enable location services.");
          setLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const handleBookClick = (zone) => {
    // Changed from slot to zone
    if (!arrivingDate || !arrivingTime || !leavingTime) {
      alert("Please select a date and time before booking.");
      return;
    }
    // Navigate to a booking page for the selected parking zone
    // You might need to adjust this route based on your actual booking flow
    navigate(
      `/parking-zones/${zone._id}/book?date=${arrivingDate}&startTime=${arrivingTime}&endTime=${leavingTime}`,
      {
        state: { parkingZone: zone }, // Pass the entire zone object if needed
      }
    );
  };

  return (
    <UserLayout image={bgImage}>
      <MDBox
        m={9}
        p={3}
        style={{ backgroundColor: "#fff", borderRadius: "8px", marginTop: "10vh" }}
      >
        <MDBox display="flex" justifyContent="space-between" alignItems="center">
          <MDTypography variant="h4" fontWeight="medium">
            Find Nearby Parking Zones
          </MDTypography>
          <MDButton
            variant="gradient"
            color="info"
            onClick={handleFindNearby}
            disabled={loading}
            startIcon={<Icon>location_on</Icon>}
          >
            {loading ? <CircularProgress size={20} color="inherit" /> : "Find My Location"}
          </MDButton>
        </MDBox>
        {error && (
          <MDTypography variant="body2" color="error" mt={2}>
            {error}
          </MDTypography>
        )}

        <Grid container spacing={2} mt={2}>
          <Grid item xs={12} md={4}>
            <MDInput
              label="Arriving on"
              type="date"
              fullWidth
              value={arrivingDate}
              onChange={(e) => setArrivingDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MDInput
              label="Arriving time"
              type="time"
              fullWidth
              value={arrivingTime}
              onChange={(e) => setArrivingTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <MDInput
              label="Leaving time"
              type="time"
              fullWidth
              value={leavingTime}
              onChange={(e) => setLeavingTime(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>

        <MDBox mt={4} sx={{ height: "60vh", display: "flex", gap: "16px" }}>
          <MDBox
            flex={2}
            sx={{ border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden" }}
          >
            <MapContainer
              center={userLocation || defaultLocation}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <SetMapView coords={userLocation} />
              {userLocation && (
                <>
                  <Marker position={userLocation} icon={customIcon} />
                  {/* Draw the circle representing the search radius */}
                  <Circle
                    center={userLocation}
                    radius={searchRadius} // Radius in meters
                    pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.1, weight: 2 }}
                  />
                </>
              )}
              {nearbyZones.map((zone) => (
                <Marker
                  key={zone._id}
                  position={[zone.location.coordinates[1], zone.location.coordinates[0]]} // [lat, lng]
                  icon={customIcon}
                />
              ))}
            </MapContainer>
          </MDBox>

          <MDBox flex={1} sx={{ border: "1px solid #ccc", borderRadius: "8px", overflowY: "auto" }}>
            <MDBox variant="gradient" bgColor="dark" p={2} sx={{ borderBottom: "1px solid #ccc" }}>
              <MDTypography variant="h6" color="white" textAlign="center">
                Nearby Zones ({nearbyZones.length})
              </MDTypography>
            </MDBox>
            <MDBox component="ul" p={2}>
              {nearbyZones.length > 0 ? (
                nearbyZones.map((zone) => (
                  <MDBox
                    key={zone._id}
                    component="li"
                    p={1}
                    sx={{ borderBottom: "1px solid #eee", "&:last-child": { borderBottom: 0 } }}
                  >
                    <MDTypography variant="body1" fontWeight="bold">
                      {zone.name}
                    </MDTypography>
                    <MDTypography variant="caption" color="text">
                      {zone.address}
                    </MDTypography>
                    <MDButton
                      variant="gradient"
                      color="success"
                      size="small"
                      sx={{ mt: 1, float: "right" }}
                      onClick={() => handleBookClick(zone)}
                    >
                      Book
                    </MDButton>
                  </MDBox>
                ))
              ) : (
                <MDTypography variant="body2" color="text" textAlign="center" p={2}>
                  No parking zones found.
                </MDTypography>
              )}
            </MDBox>
          </MDBox>
        </MDBox>
      </MDBox>
    </UserLayout>
  );
};

export default FindNearbyParkingZones;
