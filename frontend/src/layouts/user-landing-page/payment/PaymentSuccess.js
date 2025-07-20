import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { Card, CircularProgress, Grid } from "@mui/material";
import UserLayout from "../components/UserLayout";
import bgImage from "assets/images/parking-cover.jpg";
import axiosInstance from "utils/axiosInstance";
import moment from "moment";
import BookingSuccessGIF from "assets/images/booking-success.gif";
import ParkingBanner from "assets/images/parksmart-banner.png";

function PaymentSuccessPage() {
  const { invoiceId } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axiosInstance.get(`/invoices/${invoiceId}`);
        setInvoice(response.data);
      } catch (err) {
        setError("Failed to load booking details.");
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    } else {
      setLoading(false);
      setError("No invoice ID provided. Please check your URL.");
    }
  }, [invoiceId]);

  if (loading) {
    return (
      <UserLayout image={bgImage}>
        <MDBox display="flex" justifyContent="center" py={5}>
          <CircularProgress color="info" />
        </MDBox>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout image={bgImage}>
        <MDBox p={4} textAlign="center">
          <MDTypography color="error">{error}</MDTypography>
        </MDBox>
      </UserLayout>
    );
  }

  return (
    <UserLayout image={bgImage}>
      <Grid container spacing={0} py={5} px={3} justifyContent="center">
        {/* Main Content Card */}
        <Grid item xs={12} md={8}>
          <Card
            sx={{
              p: 4,
              textAlign: "center",
              maxWidth: 600,
              mx: "auto",
            }}
          >
            <MDBox
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                mb: 3,
              }}
            >
              <img src={BookingSuccessGIF} alt="Booking Success" width={80} height={80} />
              <MDTypography variant="h3" mt={2} mb={1} fontWeight="bold">
                Thank you!
              </MDTypography>
              <MDTypography variant="h5" color="text" fontWeight="bold">
                Your booking has been confirmed.
              </MDTypography>
            </MDBox>

            <Grid container spacing={2} sx={{ my: 3 }}>
              <Grid item xs={12} sm={4}>
                <MDBox sx={{ p: 2, borderRadius: "8px", backgroundColor: "#f0f2f5" }}>
                  <MDTypography variant="h5" color="text" fontWeight="bold">
                    ${invoice?.amount.toFixed(2)}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Amount
                  </MDTypography>
                </MDBox>
              </Grid>
              {/* Total Hours */}
              <Grid item xs={12} sm={4}>
                <MDBox sx={{ p: 2, borderRadius: "8px", backgroundColor: "#f0f2f5" }}>
                  <MDTypography variant="h5" color="text" fontWeight="bold">
                    {invoice?.parkingSession?.durationHours?.toFixed(0) || "N/A"}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Total Hours
                  </MDTypography>
                </MDBox>
              </Grid>
              {/* Payment Status */}
              <Grid item xs={12} sm={4}>
                <MDBox sx={{ p: 2, borderRadius: "8px", backgroundColor: "#f0f2f5" }}>
                  <MDTypography variant="h5" color="success" fontWeight="bold">
                    {invoice?.paymentStatus?.status?.toUpperCase()}
                  </MDTypography>
                  <MDTypography variant="caption" color="text">
                    Payment Status
                  </MDTypography>
                </MDBox>
              </Grid>
            </Grid>

            <MDBox sx={{ textAlign: "left", my: 4 }}>
              <MDTypography variant="body1" mb={1} sx={{ fontWeight: "bold" }}>
                Here are your booking details:
              </MDTypography>
              <MDTypography variant="body2" mb={0.5} sx={{ fontWeight: "bold" }}>
                Parking at:{" "}
                <MDTypography component="span" variant="body2">
                  {invoice?.parkingSession?.parkingSlot?.parkingZone?.address}
                </MDTypography>
              </MDTypography>
              <MDTypography variant="body2" mb={0.5} sx={{ fontWeight: "bold" }}>
                Arriving on:{" "}
                <MDTypography component="span" variant="body2">
                  {moment(invoice?.parkingSession?.entryTime).format("MMMM Do YYYY, h:mm a")}
                </MDTypography>
              </MDTypography>
              <MDTypography variant="body2" mb={0.5} sx={{ fontWeight: "bold" }}>
                Leaving on:{" "}
                <MDTypography component="span" variant="body2">
                  {moment(invoice?.parkingSession?.exitTime).format("MMMM Do YYYY, h:mm a")}
                </MDTypography>
              </MDTypography>
              <MDTypography variant="body2" sx={{ fontWeight: "bold" }}>
                Plate no:{" "}
                <MDTypography component="span" variant="body2">
                  {invoice?.parkingSession?.vehicle?.licensePlate}
                </MDTypography>
              </MDTypography>
            </MDBox>

            <MDButton
              variant="gradient"
              color="info"
              fullWidth
              sx={{ mt: 3 }}
              onClick={() => navigate(`/invoices/${invoice._id}`)}
            >
              View Invoice
            </MDButton>

            {/* Email confirmation message at the bottom */}
            <MDBox mt={2}>
              <MDTypography variant="caption" color="text" align="center">
                We have also sent you an email with the invoice details.
              </MDTypography>
            </MDBox>
          </Card>
        </Grid>
      </Grid>
    </UserLayout>
  );
}

export default PaymentSuccessPage;
