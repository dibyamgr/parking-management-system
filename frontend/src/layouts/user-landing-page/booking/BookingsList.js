import React, { useState, useEffect } from "react";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { Card, Grid, CircularProgress, Button, Box } from "@mui/material";

import moment from "moment";
import PropTypes from "prop-types";
import UserLayout from "../components/UserLayout";
import axiosInstance from "utils/axiosInstance";
import MDButton from "components/MDButton";
import bgImage from "assets/images/parking-cover.jpg";
import MDBadge from "components/MDBadge";

// Helper function to format the timer display
const formatTime = (duration) => {
  const hours = Math.floor(duration.asHours());
  const minutes = duration.minutes();
  const seconds = duration.seconds();
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
};

const MyBookingsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSession, setActiveSession] = useState(null);
  const [remainingTime, setRemainingTime] = useState("00:00:00");

  const fetchSessions = async () => {
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

  // Timer logic for the active session, but no API calls here
  useEffect(() => {
    if (activeSession) {
      const timerInterval = setInterval(() => {
        const now = moment();
        const endTime = moment(activeSession.exitTime);
        const diff = endTime.diff(now);

        if (diff > 0) {
          const duration = moment.duration(diff);
          setRemainingTime(formatTime(duration));
        } else {
          setRemainingTime("Session Ended");
          clearInterval(timerInterval);
        }
      }, 1000);

      return () => clearInterval(timerInterval);
    }
  }, [activeSession]);

  const handleEndSession = async (sessionId) => {
    try {
      await axiosInstance.post(`/parking-sessions/${sessionId}/end`, {
        actualExitTime: moment.utc().toISOString(),
      });
      alert("Parking session ended successfully!");
      fetchSessions();
    } catch (err) {
      console.error("Error ending session:", err);
      alert("Failed to end session.");
    }
  };

  const SessionCard = ({ session }) => {
    return (
      <Card sx={{ p: 3, mb: 2 }} height="20rem">
        <MDTypography variant="h6" fontWeight="bold">
          Session ID: {session._id}
        </MDTypography>
        <MDTypography variant="body2">Slot: {session.parkingSlot.slotId}</MDTypography>
        <MDTypography variant="body2">Vehicle: {session.vehicle.licensePlate}</MDTypography>
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
                : "warning"
            }
            variant="gradient"
            size="sm"
          />
        </MDTypography>
        <MDTypography variant="body2">
          Entry Time: {moment(session.entryTime).local().format("MMMM Do YYYY, h:mm a")}
        </MDTypography>
        <MDTypography variant="body2">
          Exit Time: {moment(session.exitTime).local().format("MMMM Do YYYY, h:mm a")}
        </MDTypography>

        {session.status === "RESERVED" || session.status === "ACTIVE" ? (
          <MDButton
            variant="contained"
            color="secondary"
            onClick={() => handleEndSession(session._id)}
            sx={{ mt: 2 }}
          >
            End Session
          </MDButton>
        ) : (
          <MDButton variant="contained" color="secondary" disabled sx={{ mt: 2 }}>
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
        slotId: PropTypes.string.isRequired,
      }).isRequired,
      vehicle: PropTypes.shape({
        licensePlate: PropTypes.string.isRequired,
      }).isRequired,
    }).isRequired,
  };

  if (loading) {
    return (
      <MDBox display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </MDBox>
    );
  }

  if (error) {
    return (
      <MDBox p={4} textAlign="center">
        <MDTypography color="error">{error}</MDTypography>
      </MDBox>
    );
  }

  const otherSessions = sessions.filter((s) => s.status !== "ACTIVE");

  return (
    <UserLayout image={bgImage}>
      <MDBox py={5} px={3} mt={10}>
        {activeSession && (
          <Card sx={{ p: 4, mb: 4, textAlign: "center", backgroundColor: "#e8f5e9" }}>
            <MDTypography variant="h5" color="success" fontWeight="bold">
              ACTIVE PARKING SESSION
            </MDTypography>
            <MDTypography variant="h2" color="success" fontWeight="bold" my={2}>
              {remainingTime}
            </MDTypography>
            <MDTypography variant="h6">Slot: {activeSession.parkingSlot.slotId}</MDTypography>
            <MDTypography variant="h6">Vehicle: {activeSession.vehicle.licensePlate}</MDTypography>
            <MDTypography variant="body2" mt={1}>
              Ending at: {moment(activeSession.exitTime).local().format("MMMM Do YYYY, h:mm a")}
            </MDTypography>
            <MDButton
              variant="contained"
              color="error"
              className="text-white w-20"
              onClick={() => handleEndSession(activeSession._id)}
              sx={{ mt: 2 }}
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
