import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDButton from "components/MDButton";
import { Card, CircularProgress } from "@mui/material";

import UserLayout from "../components/UserLayout";
import bgImage from "assets/images/parking-cover.jpg";
import axiosInstance from "utils/axiosInstance";

function PaymentPage() {
  const { invoiceId } = useParams(); // Get invoiceId from URL

  console.log(invoiceId, "invoiceId");
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch the invoice details
  const fetchInvoice = async () => {
    console.log("API caled");
    try {
      const response = await axiosInstance.get(`/invoices/${invoiceId}`);
      console.log("Fetched invoice:", response.data);
      setInvoice(response.data.invoice);
    } catch (err) {
      setError("Failed to load invoice details.");
      console.error("Error fetching invoice:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  // Function to handle the payment
  const handlePayNow = async () => {
    try {
      const authToken = localStorage.getItem("token");
      await axiosInstance.post(
        `/invoices/${invoiceId}/pay`,
        {},
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      alert("Payment successful!");
      // Optionally, navigate back to My Bookings or a confirmation page
      navigate("/my-bookings");
    } catch (err) {
      alert("Payment failed. Please try again.");
      console.error("Payment error:", err);
    }
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

  return (
    <UserLayout image={bgImage}>
      <MDBox py={5} px={3}>
        <Card sx={{ p: 4 }}>
          <MDTypography variant="h4" mb={2}>
            Invoice Details
          </MDTypography>
          <MDTypography variant="body1">**Invoice ID:** {invoice?._id}</MDTypography>
          <MDTypography variant="body1">**Amount Due:** ${invoice?.amount.toFixed(2)}</MDTypography>
          <MDTypography variant="body1">**Status:** {invoice?.paymentStatus}</MDTypography>
          <MDButton
            variant="gradient"
            color="info"
            fullWidth
            sx={{ mt: 3 }}
            onClick={handlePayNow}
            disabled={invoice?.paymentStatus === "PAID"}
          >
            {invoice?.paymentStatus === "PAID" ? "PAID" : "Pay Now"}
          </MDButton>
        </Card>
      </MDBox>
    </UserLayout>
  );
}

export default PaymentPage;
