import React, { useState, useEffect } from "react";
import { format, differenceInMinutes } from "date-fns";

// @mui material components
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

// ParkSmart React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";

// ParkSmart examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import DataTable from "examples/Tables/DataTable";

// API Services
import parkingSessionsService from "services/parkingSessionsService";

function ParkingSessions() {
  const [parkingSessions, setParkingSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchParkingSessions = async () => {
    try {
      setLoading(true);
      const data = await parkingSessionsService.getAllParkingSessions();
      setParkingSessions(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch parking sessions:", err);
      setError("Failed to load parking sessions. Please try again later.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParkingSessions();
  }, []);

  const getStatusBadge = (status) => {
    let color;
    switch (status) {
      case "ACTIVE":
        color = "success";
        break;
      case "RESERVED":
        color = "info";
        break;
      case "COMPLETED":
        color = "dark";
        break;
      case "CANCELLED":
        color = "error";
        break;
      default:
        color = "secondary";
    }
    return (
      <MDBox ml={-1}>
        <MDBadge badgeContent={status} color={color} variant="gradient" size="sm" />
      </MDBox>
    );
  };

  const getPaymentStatusBadge = (status) => {
    let color;
    switch (status) {
      case "PAID":
        color = "success";
        break;
      case "PENDING":
        color = "warning";
        break;
      case "FAILED":
        color = "error";
        break;
      default:
        color = "secondary";
    }
    return (
      <MDBox ml={-1}>
        <MDBadge badgeContent={status} color={color} variant="gradient" size="sm" />
      </MDBox>
    );
  };

  const calculateDuration = (entry, exit) => {
    if (!entry || !exit) return "N/A";
    const minutes = differenceInMinutes(new Date(exit), new Date(entry));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    let durationString = "";
    if (hours > 0) {
      durationString += `${hours} hr `;
    }
    durationString += `${remainingMinutes} min`;

    return durationString.trim();
  };

  const columns = [
    { Header: "License Plate", accessor: "licensePlate" },
    { Header: "User", accessor: "user" },
    { Header: "Parking Slot", accessor: "parkingSlot" },
    { Header: "Entry Time", accessor: "entryTime" },
    { Header: "Exit Time", accessor: "exitTime" },
    { Header: "Duration", accessor: "duration" },
    { Header: "Status", accessor: "status" },
    { Header: "Invoice Amount", accessor: "invoiceAmount" },
    { Header: "Payment Status", accessor: "paymentStatus" },
  ];

  const rows = parkingSessions.map((session) => ({
    licensePlate: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {session.vehicle ? session.vehicle.licensePlate : "N/A"}
      </MDTypography>
    ),
    user: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {session.user ? session.user.email : "N/A"}
      </MDTypography>
    ),
    parkingSlot: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {session.parkingSlot && session.parkingSlot.parkingZone
          ? session.parkingSlot.parkingZone.name
          : "N/A"}
        <br />
        {session.parkingSlot ? session.parkingSlot.slotId : "N/A"}
      </MDTypography>
    ),
    entryTime: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {format(new Date(session.entryTime), "Pp")}
      </MDTypography>
    ),
    exitTime: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {session.actualExitTime ? format(new Date(session.actualExitTime), "Pp") : "N/A"}
      </MDTypography>
    ),
    duration: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {session.actualExitTime
          ? calculateDuration(session.entryTime, session.actualExitTime)
          : "Active"}
      </MDTypography>
    ),
    status: getStatusBadge(session.status),
    invoiceAmount: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {session.invoice ? `$${session.invoice.amount.toFixed(2)}` : "N/A"}
      </MDTypography>
    ),
    paymentStatus: session.invoice
      ? getPaymentStatusBadge(session.invoice.paymentStatus.status)
      : "N/A",
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3} textAlign="center">
          <MDTypography variant="h5">Loading parking sessions...</MDTypography>
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
              >
                <MDTypography variant="h6" color="white">
                  All Parking Sessions
                </MDTypography>
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
    </DashboardLayout>
  );
}

export default ParkingSessions;
