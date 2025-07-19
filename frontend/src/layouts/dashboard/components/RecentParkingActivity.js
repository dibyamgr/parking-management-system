import React from "react";

// @mui material components
import Card from "@mui/material/Card";

// ParkSmart React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge"; // Required for status badges

// ParkSmart examples components
import DataTable from "examples/Tables/DataTable"; // Import the DataTable component

function RecentParkingActivity() {
  // Dummy data for demonstration
  const recentActivitiesRaw = [
    {
      id: 1,
      user: "John Doe",
      zone: "Main Lot A",
      slot: "A12",
      vehicle: "ABC-123",
      status: "Completed",
      timestamp: "2025-07-15 10:00 AM",
    },
    {
      id: 2,
      user: "Jane Smith",
      zone: "Visitor Lot",
      slot: "V05",
      vehicle: "XYZ-456",
      status: "Completed",
      timestamp: "2025-07-15 11:30 AM",
    },
    {
      id: 3,
      user: "Alice Brown",
      zone: "Main Lot B",
      slot: "B01",
      vehicle: "DEF-789",
      status: "Active",
      timestamp: "2025-07-15 01:00 PM",
    },
    {
      id: 4,
      user: "Bob White",
      zone: "Staff Parking",
      slot: "S22",
      vehicle: "GHI-012",
      status: "Reserved",
      timestamp: "2025-07-15 03:00 PM",
    },
    {
      id: 5,
      user: "Charlie Green",
      zone: "Main Lot A",
      slot: "A05",
      vehicle: "JKL-345",
      status: "Completed",
      timestamp: "2025-07-15 04:00 PM",
    },
    {
      id: 6,
      user: "David Blue",
      zone: "Main Lot C",
      slot: "C07",
      vehicle: "MNO-678",
      status: "Active",
      timestamp: "2025-07-15 05:00 PM",
    },
  ];

  // Define columns for the DataTable
  const columns = [
    { Header: "user", accessor: "user", width: "20%" },
    { Header: "location", accessor: "location", width: "20%" },
    { Header: "vehicle", accessor: "vehicle", width: "20%" },
    { Header: "time", accessor: "time", width: "15%" },
    { Header: "status", accessor: "status", width: "15%" },
  ];

  // Prepare rows data for DataTable
  const rows = recentActivitiesRaw.map((activity) => ({
    user: (
      <MDTypography component="a" href="#" variant="caption" color="text" fontWeight="medium">
        {activity.user}
      </MDTypography>
    ),
    location: (
      <MDTypography component="span" variant="caption" color="text" fontWeight="medium">
        {activity.zone} / {activity.slot}
      </MDTypography>
    ),
    vehicle: (
      <MDTypography component="span" variant="caption" color="text" fontWeight="medium">
        {activity.vehicle}
      </MDTypography>
    ),
    time: (
      <MDTypography component="span" variant="caption" color="text" fontWeight="medium">
        {activity.timestamp.split(" ")[1]} {activity.timestamp.split(" ")[2]}{" "}
        {/* Extract just time and AM/PM */}
      </MDTypography>
    ),
    status: (
      <MDBox ml={-1}>
        <MDBadge
          badgeContent={activity.status.toLowerCase()}
          color={
            activity.status === "Active"
              ? "success"
              : activity.status === "Reserved"
              ? "info"
              : "secondary" // For 'Completed' or other statuses
          }
          variant="gradient"
          size="xs"
          container
        />
      </MDBox>
    ),
  }));

  return (
    <Card>
      <MDBox p={3}>
        <MDTypography variant="h6" gutterBottom>
          Recent Parking Activity
        </MDTypography>
        <MDTypography variant="button" color="text" fontWeight="regular">
          Latest parking sessions and status.
        </MDTypography>
      </MDBox>
      <MDBox>
        {" "}
        {/* DataTable doesn't need explicit padding on its container if it has its own */}
        {rows.length > 0 ? (
          <DataTable
            table={{ columns, rows }}
            isSorted={false} // You can enable sorting if needed by changing this to true
            entriesPerPage={false} // Show all entries without pagination
            showTotalEntries={false} // Don't show total entries count
            noEndBorder // Remove border at the bottom of the table
          />
        ) : (
          <MDBox px={3} py={2}>
            <MDTypography variant="body2" color="text" textAlign="center">
              No recent activity found.
            </MDTypography>
          </MDBox>
        )}
      </MDBox>
    </Card>
  );
}

export default RecentParkingActivity;
