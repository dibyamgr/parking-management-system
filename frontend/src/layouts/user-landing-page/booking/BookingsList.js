import React, { useState, useEffect } from "react";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { Card, Grid, CircularProgress, Box } from "@mui/material"; // Removed Button, Box as they are not directly used here, or replaced by MDButton

import moment from "moment";
import PropTypes from "prop-types";
import UserLayout from "../components/UserLayout";
import axiosInstance from "utils/axiosInstance";
import MDButton from "components/MDButton";
import bgImage from "assets/images/parking-cover.jpg";
import MDBadge from "components/MDBadge";
import { useNavigate } from "react-router-dom";

// Helper function to format the timer display
const formatTime = (duration) => {
  // If duration is negative, it means time has passed the exitTime
  if (duration.asSeconds() < 0) {
    const absoluteDuration = moment.duration(Math.abs(duration.asMilliseconds()));
    const hours = Math.floor(absoluteDuration.asHours());
    const minutes = absoluteDuration.minutes();
    const seconds = absoluteDuration.seconds();
    return `OVERDUE BY ${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  } else {
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }
};

const MyBookingsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [remainingTime, setRemainingTime] = useState("00:00:00");
  const [message, setMessage] = useState(null); // State for user messages (e.g., success/error)

  const navigate = useNavigate();

  const fetchSessions = async () => {
    setLoading(true); // Ensure loading is true when fetching
    setError(null); // Clear previous errors
    try {
      const response = await axiosInstance.get("/parking-sessions/my");
      setSessions(response.data);

      const active = response.data.find((s) => s.status === "ACTIVE");
      setActiveSession(active);
    } catch (err) {
      setError("Failed to fetch parking sessions.");
      console.error("Error fetching sessions:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Timer logic for the active session
  useEffect(() => {
    let timerInterval;
    if (activeSession) {
      timerInterval = setInterval(() => {
        const now = moment();
        const endTime = moment(activeSession.exitTime);
        const diff = endTime.diff(now); // This can be negative if endTime is in the past

        // Log for debugging (can be removed in production)
        // console.log("Current Time:", now.format());
        // console.log("Active Session Exit Time:", endTime.format());
        // console.log("Time Difference (ms):", diff);

        const duration = moment.duration(diff);
        setRemainingTime(formatTime(duration));

        // If the session is past its exit time and still active,
        // you might want to trigger a refresh or a notification,
        // but the 'End Session Now' button should remain clickable.
        // The actual status change to 'COMPLETED' happens on backend after handleEndSession.
      }, 1000);
    }

    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [activeSession]);

  const handleEndSession = async (sessionId) => {
    setMessage(null); // Clear previous messages
    try {
      const response = await axiosInstance.post(`/parking-sessions/${sessionId}/end`, {
        actualExitTime: moment.utc().toISOString(), // Send current UTC time as actual exit time
      });

      if (!response.data || !response.data.session) {
        throw new Error("Failed to end session: Invalid response from server.");
      }

      // Assuming the backend returns a paymentUrl or a success message
      const paymentUrl = response.data.paymentUrl;

      if (paymentUrl) {
        setMessage("Session ended successfully! Redirecting to payment...");
        setTimeout(() => {
          window.location.href = paymentUrl; // Use window.location.href for external redirect
        }, 1500); // Give user a moment to read the message
      } else {
        setMessage("Session ended successfully. No immediate payment required.");
        fetchSessions(); // Refresh sessions to update UI
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to end session. Please try again.";
      setError(errorMessage);
      console.error("Error ending session:", err);
    }
  };

  const SessionCard = ({ session }) => {
    return (
      <Card sx={{ p: 3, mb: 2, borderRadius: "10px" }} height="20rem">
        <MDTypography variant="h6" fontWeight="bold">
          Session ID: {session._id}
        </MDTypography>
        <MDTypography variant="body2">Slot: {session.parkingSlot?.slotId || "N/A"}</MDTypography>
        <MDTypography variant="body2">
          Vehicle: {session.vehicle?.licensePlate || "N/A"}
        </MDTypography>
        <MDTypography variant="body2">
          Status:{" "}
          <MDBadge
            badgeContent={session.status}
            color={
              session.status === "ACTIVE"
                ? "success"
                : session.status === "CANCELLED"
                ? "error"
                : session.status === "COMPLETED"
                ? "secondary"
                : "warning" // For RESERVED or other statuses
            }
            variant="gradient"
            size="sm"
          />
        </MDTypography>
        <MDTypography variant="body2">
          Entry Time: {moment(session.entryTime).utc().format("MMMM Do YYYY, h:mm a")}
        </MDTypography>
        <MDTypography variant="body2">
          Exit Time: {moment(session.exitTime).utc().format("MMMM Do YYYY, h:mm a")}
        </MDTypography>

        {/* Show End Session button only for ACTIVE or RESERVED sessions */}
        {session.status === "RESERVED" || session.status === "ACTIVE" ? (
          <MDButton
            variant="contained"
            color="secondary"
            onClick={() => handleEndSession(session._id)}
            sx={{ mt: 2, borderRadius: "8px" }}
          >
            End Session
          </MDButton>
        ) : (
          <MDButton
            variant="contained"
            color="secondary"
            disabled
            sx={{ mt: 2, borderRadius: "8px" }}
          >
            Session Ended
          </MDButton>
        )}
      </Card>
    );
  };

  SessionCard.propTypes = {
    session: PropTypes.shape({
      _id: PropTypes.string.isRequired,
      status: PropTypes.string.isRequired,
      entryTime: PropTypes.string.isRequired,
      exitTime: PropTypes.string.isRequired,
      parkingSlot: PropTypes.shape({
        slotId: PropTypes.string, // Made optional as it might be null for some states
      }),
      vehicle: PropTypes.shape({
        licensePlate: PropTypes.string, // Made optional
      }),
    }).isRequired,
  };

  if (loading) {
    return (
      <MDBox display="flex" justifyContent="center" p={4}>
        <CircularProgress color="inherit" />
      </MDBox>
    );
  }

  const otherSessions = sessions.filter((s) => s.status !== "ACTIVE");

  return (
    <UserLayout image={bgImage}>
      <MDBox py={5} px={3} mt={10}>
        {/* Display messages */}
        {message && (
          <MDBox
            mb={2}
            p={2}
            sx={{ backgroundColor: "#d4edda", borderRadius: "8px", textAlign: "center" }}
          >
            <MDTypography variant="body2" color="success">
              {message}
            </MDTypography>
          </MDBox>
        )}
        {error && (
          <MDBox
            mb={2}
            p={2}
            sx={{ backgroundColor: "#f8d7da", borderRadius: "8px", textAlign: "center" }}
          >
            <MDTypography variant="body2" color="error">
              {error}
            </MDTypography>
          </MDBox>
        )}

        {activeSession && (
          <Card
            sx={{
              p: 4,
              mb: 4,
              textAlign: "center",
              backgroundColor: "#e8f5e9",
              borderRadius: "10px",
            }}
          >
            <MDTypography variant="h5" color="success" fontWeight="bold">
              ACTIVE PARKING SESSION
            </MDTypography>
            <MDTypography variant="h2" color="success" fontWeight="bold" my={2}>
              {remainingTime}
            </MDTypography>
            <MDTypography variant="h6">
              Slot: {activeSession.parkingSlot?.slotId || "N/A"}
            </MDTypography>
            <MDTypography variant="h6">
              Vehicle: {activeSession.vehicle?.licensePlate || "N/A"}
            </MDTypography>
            <MDTypography variant="body2" mt={1}>
              Ending at: {moment(activeSession.exitTime).utc().format("MMMM Do YYYY, h:mm a")}
            </MDTypography>
            <MDButton
              variant="contained"
              color="error"
              className="text-white w-20" // Tailwind class, ensure it's compatible or remove
              onClick={() => handleEndSession(activeSession._id)}
              sx={{ mt: 2, borderRadius: "8px" }}
            >
              End Session Now
            </MDButton>
          </Card>
        )}

        {otherSessions.length > 0 && (
          <MDBox>
            <MDTypography variant="h4" mb={2} color="white">
              Other Sessions
            </MDTypography>
            <Grid container spacing={3}>
              {otherSessions.map((session) => (
                <Grid item xs={12} sm={6} md={4} key={session._id}>
                  <SessionCard session={session} />
                </Grid>
              ))}
            </Grid>
          </MDBox>
        )}

        {!activeSession && otherSessions.length === 0 && (
          <MDBox p={4} textAlign="center">
            <MDTypography variant="h5" color="text">
              You have no active or reserved parking sessions.
            </MDTypography>
          </MDBox>
        )}
      </MDBox>
    </UserLayout>
  );
};

export default MyBookingsPage;
