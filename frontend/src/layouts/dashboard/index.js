import React from "react";

// @mui material components
import Grid from "@mui/material/Grid";

// ParkSmart React components
import MDBox from "components/MDBox";

// ParkSmart examples components
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import Footer from "examples/Footer";
import ReportsBarChart from "examples/Charts/BarCharts/ReportsBarChart";
import ReportsLineChart from "examples/Charts/LineCharts/ReportsLineChart";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";

// ParkSmart Data for dashboard
import parksmartStatisticsData from "layouts/dashboard/data/parksmartStatisticsData";
import parksmartChartsData from "layouts/dashboard/data/parksmartChartsData";

// ParkSmart dashboard components
import RecentParkingActivity from "layouts/dashboard/components/RecentParkingActivity";
import ParkingZoneOccupancy from "layouts/dashboard/components/ParkingZoneOccupancy";

function Dashboard() {
  const { parkingSessionsChart, revenueTrendChart, newUsersChart } = parksmartChartsData;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox py={3}>
        <Grid container spacing={3}>
          {parksmartStatisticsData.map((data, index) => (
            <Grid item xs={12} md={6} lg={3} key={index}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  color={data.color}
                  icon={data.icon}
                  title={data.title}
                  count={data.count}
                  percentage={data.percentage}
                />
              </MDBox>
            </Grid>
          ))}
        </Grid>
        <MDBox mt={4.5}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsBarChart
                  color="info"
                  title="Daily Parking Sessions"
                  description="Overview of sessions per day"
                  date="updated hourly"
                  chart={parkingSessionsChart}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="success"
                  title="Revenue Trend"
                  description={
                    <>
                      (<strong>+15%</strong>) increase in revenue this week.
                    </>
                  }
                  date="last updated 4 min ago"
                  chart={revenueTrendChart}
                />
              </MDBox>
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <MDBox mb={3}>
                <ReportsLineChart
                  color="dark"
                  title="New User Registrations"
                  description="Monthly trend for new sign-ups"
                  date="just updated"
                  chart={newUsersChart}
                />
              </MDBox>
            </Grid>
          </Grid>
        </MDBox>
        <MDBox>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={8}>
              <RecentParkingActivity />
            </Grid>
            <Grid item xs={12} md={6} lg={4}>
              <ParkingZoneOccupancy />
            </Grid>
          </Grid>
        </MDBox>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Dashboard;
