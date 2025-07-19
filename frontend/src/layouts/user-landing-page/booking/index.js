import React, { useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import moment from "moment";

// @mui material components
import { Grid, Card, Box, TextField } from "@mui/material";

// React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";

import bgImage from "assets/images/parking-cover.jpg";
import UserLayout from "../components/UserLayout";
import axiosInstance from "utils/axiosInstance";

function BookingPage() {
  // Read parkingSlotId from the URL path
  const { parkingSlotId } = useParams();

  console.log("BookingPage - parkingSlotId:", parkingSlotId);

  // Read query parameters from the URL
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const parkingSlot = location.state?.parkingSlot;

  const navigate = useNavigate();
  // State for user input and booking details
  const [licensePlate, setLicensePlate] = useState("");
  const [bookingStatus, setBookingStatus] = useState("idle");

  // Parse times from URL query parameters
  const date = query.get("date");
  const startTimeStr = query.get("startTime");
  const endTimeStr = query.get("endTime");

  const startDateTime = moment.utc(`${date}T${startTimeStr}`);
  const endDateTime = moment.utc(`${date}T${endTimeStr}`);
  const durationHours = endDateTime.diff(startDateTime, "hours", true); // Use 'true' for float result

  const hourlyRate = parkingSlot?.pricePerHour || 18.0;
  const totalPrice = hourlyRate * durationHours;

  const handleConfirmBooking = async () => {
    if (!licensePlate) {
      alert("Please enter a license plate.");
      return;
    }

    setBookingStatus("loading");

    try {
      // Step 1: Register the vehicle
      const vehicleResponse = await axiosInstance.post("/vehicles", {
        licensePlate: licensePlate,
        vehicleType: "CAR",
      });

      if (
        vehicleResponse &&
        vehicleResponse.response &&
        vehicleResponse.response.data &&
        vehicleResponse.response.data.message
      ) {
        throw new Error(vehicleResponse.response.data.message);
      }

      // Step 2: Start the parking session
      const parkingSessionResponse = await axiosInstance.post("/parking-sessions/start", {
        parkingSlotId: parkingSlotId,
        vehicleId: licensePlate,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      });

      console.log("Parking session response:", parkingSessionResponse);

      if (!parkingSessionResponse.data || !parkingSessionResponse.data.session) {
        throw new Error("Parking session failed to start.");
      }

      setBookingStatus("success");
      // alert("Parking spot booked successfully!");
      navigate("/my-bookings");
    } catch (error) {
      setBookingStatus("error");
      console.error("Booking failed:", error);
      alert(`Booking failed: ${error.message}`);
    }
  };

  if (!parkingSlot) {
    return (
      <MDBox p={4} textAlign="center">
        <MDTypography variant="h4" color="text">
          Parking slot details not found. Please go back and select a slot.
        </MDTypography>
      </MDBox>
    );
  }

  return (
    <UserLayout image={bgImage}>
      <MDBox py={5} px={3} mt={20}>
        <Grid container justifyContent="center">
          <Grid item xs={12} md={6}>
            <Card sx={{ p: 4 }}>
              <MDTypography variant="h4" mb={2}>
                Confirm Your Booking
              </MDTypography>

              <Box mb={3} display="flex" justifyContent="space-between">
                <Box>
                  <MDTypography variant="h6">Entrance</MDTypography>
                  <MDTypography variant="body2">
                    {startDateTime.format("MMM, DD YYYY hh:mm A")}
                  </MDTypography>
                </Box>
                <Box>
                  <MDTypography variant="h6">Exit</MDTypography>
                  <MDTypography variant="body2">
                    {endDateTime.format("MMM, DD YYYY hh:mm A")}
                  </MDTypography>
                </Box>
              </Box>

              <MDTypography variant="h5" fontWeight="bold" mb={1}>
                {parkingSlot.parkingZone.address}
              </MDTypography>
              <MDTypography variant="h6" mb={2}>
                Slot: {parkingSlot.slotId}
              </MDTypography>

              <Box mb={2}>
                <MDTypography variant="body1">Hourly rate: ${hourlyRate.toFixed(2)}</MDTypography>
                <MDTypography variant="body1">Total price: ${totalPrice.toFixed(2)}</MDTypography>
              </Box>

              <TextField
                fullWidth
                label="Plate #"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                sx={{ mb: 2 }}
              />

              <MDButton
                variant="gradient"
                color="info"
                fullWidth
                onClick={handleConfirmBooking}
                disabled={bookingStatus === "loading"}
              >
                {bookingStatus === "loading" ? "Processing..." : "Proceed to payment"}
              </MDButton>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
    </UserLayout>
  );
}

export default BookingPage;
