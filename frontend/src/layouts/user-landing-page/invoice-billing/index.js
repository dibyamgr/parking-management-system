import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import { Card, Grid, Divider, CircularProgress } from "@mui/material";
import UserLayout from "../components/UserLayout";
import bgImage from "assets/images/parking-cover.jpg";
import axiosInstance from "utils/axiosInstance";
import moment from "moment";

function InvoicePage() {
  const { invoiceId } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const response = await axiosInstance.get(`/invoices/${invoiceId}`);
        setInvoice(response.data);
      } catch (err) {
        setError("Failed to load invoice details.");
        console.error("Error fetching invoice:", err);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    } else {
      setLoading(false);
      setError("No invoice ID provided.");
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

  const { user, parkingSession, paymentStatus, amount, issueDate, _id: invoiceNumber } = invoice;

  const paymentStatusColor = paymentStatus?.status === "PAID" ? "success" : "warning";

  return (
    <UserLayout image={bgImage}>
      <MDBox py={5} px={3}>
        <Card sx={{ p: 4, maxWidth: 800, mx: "auto" }}>
          {/* Header */}
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <MDTypography variant="h3" fontWeight="bold">
                INVOICE
              </MDTypography>
              <MDTypography variant="subtitle2" color="text">
                Invoice No: {invoiceNumber}
              </MDTypography>
            </Grid>
            <Grid item>
              <MDBox
                sx={{
                  backgroundColor: `${paymentStatusColor}.main`,
                  borderRadius: "6px",
                  p: "4px 8px",
                }}
              >
                <MDTypography variant="subtitle2" color="white" fontWeight="bold">
                  {paymentStatus?.status?.toUpperCase() || "N/A"}
                </MDTypography>
              </MDBox>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Billing & Service Details */}
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <MDTypography variant="h6" fontWeight="bold">
                Bill To:
              </MDTypography>
              <MDTypography variant="body2">{user?.name || "N/A"}</MDTypography>
              <MDTypography variant="body2">{user?.email || "N/A"}</MDTypography>
            </Grid>
            <Grid item xs={12} sm={6} textAlign={{ xs: "left", sm: "right" }}>
              <MDTypography variant="h6" fontWeight="bold">
                Parking Details:
              </MDTypography>
              <MDTypography variant="body2">
                **Location:** {parkingSession?.parkingSlot?.parkingZone?.address || "N/A"}
              </MDTypography>
              <MDTypography variant="body2">
                **Plate No:** {parkingSession?.vehicle?.licensePlate || "N/A"}
              </MDTypography>
              <MDTypography variant="body2">
                **Issue Date:**{" "}
                {moment(issueDate).isValid() ? moment(issueDate).format("MMMM Do YYYY") : "N/A"}
              </MDTypography>
              <MDTypography variant="body2">
                **Payment Date:**{" "}
                {moment(paymentStatus?.date).isValid()
                  ? moment(paymentStatus.date).format("MMMM Do YYYY")
                  : "N/A"}
              </MDTypography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Invoice Items Table (simulated with MDBox) */}
          <MDBox sx={{ width: "100%", overflowX: "auto" }}>
            <Grid container sx={{ borderBottom: "2px solid #ddd", mb: 1 }}>
              <Grid item xs={6}>
                <MDTypography variant="body2" fontWeight="bold">
                  Description
                </MDTypography>
              </Grid>
              <Grid item xs={2}>
                <MDTypography variant="body2" fontWeight="bold" textAlign="center">
                  Hours
                </MDTypography>
              </Grid>
              <Grid item xs={2}>
                <MDTypography variant="body2" fontWeight="bold" textAlign="right">
                  Rate
                </MDTypography>
              </Grid>
              <Grid item xs={2}>
                <MDTypography variant="body2" fontWeight="bold" textAlign="right">
                  Total
                </MDTypography>
              </Grid>
            </Grid>
            <Grid container>
              <Grid item xs={6}>
                <MDTypography variant="body2">
                  Parking at {parkingSession?.parkingSlot?.slotId || "N/A"}
                </MDTypography>
              </Grid>
              <Grid item xs={2} textAlign="center">
                <MDTypography variant="body2">
                  {parkingSession?.durationHours?.toFixed(0) || "N/A"}
                </MDTypography>
              </Grid>
              <Grid item xs={2} textAlign="right">
                <MDTypography variant="body2">
                  ${parkingSession?.parkingSlot?.pricePerHour?.toFixed(2) || "0.00"}
                </MDTypography>
              </Grid>
              <Grid item xs={2} textAlign="right">
                <MDTypography variant="body2">${amount?.toFixed(2) || "0.00"}</MDTypography>
              </Grid>
            </Grid>
          </MDBox>

          <Divider sx={{ my: 3 }} />

          {/* Totals */}
          <MDBox sx={{ textAlign: "right" }}>
            <MDBox display="flex" justifyContent="flex-end" alignItems="center" my={1}>
              <MDTypography variant="h6" mr={2}>
                Subtotal:
              </MDTypography>
              <MDTypography variant="h6" fontWeight="bold">
                ${amount?.toFixed(2) || "0.00"}
              </MDTypography>
            </MDBox>
            <MDBox display="flex" justifyContent="flex-end" alignItems="center" my={1}>
              <MDTypography variant="h5" mr={2}>
                Amount Due:
              </MDTypography>
              <MDTypography variant="h5" color="info" fontWeight="bold">
                ${amount?.toFixed(2) || "0.00"}
              </MDTypography>
            </MDBox>
          </MDBox>

          <MDBox mt={4} textAlign="center">
            <MDTypography variant="body2" color="text">
              Thank you for your business. We look forward to serving you again!
            </MDTypography>
          </MDBox>
        </Card>
      </MDBox>
    </UserLayout>
  );
}

export default InvoicePage;
