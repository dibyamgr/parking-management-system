import React from "react";

// @mui material components
import Card from "@mui/material/Card";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import TimelineItem from "examples/Timeline/TimelineItem";

function ParkingZoneOccupancy() {
  return (
    <Card sx={{ height: "100%" }}>
      <MDBox pt={3} px={3}>
        <MDTypography variant="h6" fontWeight="medium">
          Parking Zone Occupancy
        </MDTypography>
        <MDBox mt={0.5}>
          <MDTypography variant="button" color="text" fontWeight="regular">
            Current status of parking zones
          </MDTypography>
        </MDBox>
      </MDBox>
      <MDBox p={2}>
        <TimelineItem
          color="success"
          icon="check_circle"
          title="Main Lot A"
          dateTime="30/50 slots available"
          description="High availability"
        />
        <TimelineItem
          color="warning"
          icon="warning"
          title="Visitor Lot"
          dateTime="10/20 slots available"
          description="Moderate availability, filling fast"
        />
        <TimelineItem
          color="error"
          icon="block"
          title="Staff Parking"
          dateTime="0/15 slots available"
          description="Fully occupied"
        />
        <TimelineItem
          color="success"
          icon="check_circle"
          title="Event Zone C"
          dateTime="40/40 slots available"
          description="Currently empty"
        />
        <TimelineItem
          color="info"
          icon="directions_car_filled"
          title="EV Charging Spots"
          dateTime="2/5 slots available"
          description="Specific for electric vehicles"
        />
      </MDBox>
    </Card>
  );
}

export default ParkingZoneOccupancy;
