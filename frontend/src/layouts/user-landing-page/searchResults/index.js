import React, { useState } from "react";
import { useLocation } from "react-router-dom";

// @mui material components
import { Grid, Card } from "@mui/material";

// React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

// Map components
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import UserLayout from "../components/UserLayout";

import bgImage from "assets/images/parking-cover.jpg";
import MDBadge from "components/MDBadge";
import parkingIconUrl from "assets/images/icons/parking-icon.png";

// Custom marker icon to avoid default marker issues
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  // iconRetinaUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl: parkingIconUrl,
  shadowUrl: "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
  iconSize: [50, 50],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function SearchResultsPage() {
  const location = useLocation();
  const searchResults = location.state?.searchResults || [];

  const getLatLngFromSlot = (slot) => {
    return [slot.parkingZone.location.latitude, slot.parkingZone.location.longitude];
  };

  if (searchResults.length === 0) {
    return (
      <MDBox p={4} textAlign="center">
        <MDTypography variant="h4" color="text">
          No parking spots available for the selected criteria.
        </MDTypography>
      </MDBox>
    );
  }

  // Use the location of the first search result to center the map
  const mapCenter =
    searchResults.length > 0 ? getLatLngFromSlot(searchResults[0]) : [47.5615, -52.7126];

  return (
    <UserLayout image={bgImage}>
      <MDBox py={5} px={3}>
        <Grid
          container
          spacing={3}
          style={{
            background: "#fff",
            borderRadius: "4px",
            margin: "68px auto",
            width: "85%",
          }}
        >
          {/* Left Sidebar for Parking Spots List */}
          <Grid item xs={12} md={6}>
            <MDTypography variant="h4" mb={2}>
              Available Parking Spots
            </MDTypography>
            {searchResults.map((slot) => (
              <Card key={slot._id} sx={{ p: 2, mb: 2 }}>
                <MDTypography variant="h6" fontWeight="bold">
                  Slot ID: {slot.slotId}
                </MDTypography>
                <MDTypography variant="body2">
                  <b>Zone:</b> {slot.parkingZone.name}
                </MDTypography>
                <MDTypography variant="body2">
                  <b>Hourly Price:</b> ${slot.pricePerHour}
                </MDTypography>
                <MDTypography variant="body2">
                  <b>Status:</b>{" "}
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
                </MDTypography>
                <MDButton
                  variant="gradient"
                  color="info"
                  size="small"
                  sx={{ mt: 1 }}
                  disabled={slot.status !== "AVAILABLE"}
                  width="20%"
                >
                  Book
                </MDButton>
              </Card>
            ))}
          </Grid>

          {/* Right side with the Map */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%", minHeight: "500px", p: 2 }}>
              <MapContainer
                center={mapCenter}
                zoom={14}
                scrollWheelZoom={true}
                style={{ height: "100%", width: "100%", borderRadius: "8px" }}
              >
                <TileLayer
                  attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {searchResults.map((slot) => (
                  <Marker key={slot._id} position={getLatLngFromSlot(slot)}>
                    <Popup>
                      <MDTypography variant="h6" fontWeight="bold">
                        {slot.parkingZone.name}, {slot.parkingZone.address}
                      </MDTypography>
                      <MDTypography variant="body2">Slot ID: {slot.slotId}</MDTypography>
                      <MDTypography variant="body2">Price: ${slot.pricePerHour}/hr</MDTypography>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </UserLayout>
  );
}

export default SearchResultsPage;
