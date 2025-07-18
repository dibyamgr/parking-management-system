import React, { useState, useEffect } from "react";
import { format } from "date-fns";

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
import invoicesService from "services/invoicesService";

// Custom components
import InvoiceDetailsModal from "./InvoiceDetailsModal";

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await invoicesService.getAllInvoices();
      setInvoices(data);
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch invoices:", err);
      setError("Failed to load invoices. Please try again later.");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleOpenModal = (invoice) => {
    setSelectedInvoice(invoice);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedInvoice(null);
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

  const columns = [
    { Header: "Invoice ID", accessor: "invoiceId" },
    { Header: "Amount", accessor: "amount" },
    { Header: "User", accessor: "user" },
    { Header: "Issue Date", accessor: "issueDate" },
    { Header: "Payment Status", accessor: "paymentStatus" },
  ];

  const rows = invoices.map((invoice) => ({
    invoiceId: (
      <MDBox display="flex" alignItems="center">
        <MDTypography variant="caption" color="text" fontWeight="medium" sx={{ mr: 1 }}>
          {invoice._id}
        </MDTypography>
        <MDBox onClick={() => handleOpenModal(invoice)} sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Icon fontSize="small">visibility</Icon>
        </MDBox>
      </MDBox>
    ),
    amount: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        ${invoice.amount.toFixed(2)}
      </MDTypography>
    ),
    user: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {invoice.user ? invoice.user.email : "N/A"}
      </MDTypography>
    ),
    issueDate: (
      <MDTypography variant="caption" color="text" fontWeight="medium">
        {format(new Date(invoice.issueDate), "Pp")}
      </MDTypography>
    ),
    paymentStatus: invoice.paymentStatus
      ? getPaymentStatusBadge(invoice.paymentStatus.status)
      : "N/A",
  }));

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3} textAlign="center">
          <MDTypography variant="h5">Loading invoices...</MDTypography>
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
                  All Invoices
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
      <InvoiceDetailsModal
        open={modalOpen}
        handleClose={handleCloseModal}
        invoice={selectedInvoice}
      />
    </DashboardLayout>
  );
}

export default Invoices;
