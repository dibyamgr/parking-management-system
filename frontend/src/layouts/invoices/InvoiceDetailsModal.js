import React from "react";
import PropTypes from "prop-types"; // Import PropTypes
import { format } from "date-fns";

// @mui material components
import Modal from "@mui/material/Modal";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Card from "@mui/material/Card";

// ParkSmart React components
import MDBox from "components/MDBox";
import MDTypography from "components/MDTypography";
import MDBadge from "components/MDBadge";

import Logo from "assets/images/logos/parksmart-logo.png";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

function InvoiceDetailsModal({ open, handleClose, invoice }) {
  if (!invoice) return null;

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

  const getParkingSessionInfo = () => {
    const session = invoice.parkingSession;
    if (!session) {
      return (
        <MDTypography variant="body2" color="text">
          No associated parking session.
        </MDTypography>
      );
    }
    return (
      <>
        <MDBox display="flex" justifyContent="space-between" mb={1}>
          <MDTypography variant="body2" fontWeight="bold">
            Vehicle:
          </MDTypography>
          <MDTypography variant="body2" color="text">
            {session.vehicle ? session.vehicle.licensePlate : "N/A"}
          </MDTypography>
        </MDBox>
        <MDBox display="flex" justifyContent="space-between" mb={1}>
          <MDTypography variant="body2" fontWeight="bold">
            Parking Slot:
          </MDTypography>
          <MDTypography variant="body2" color="text">
            {session.parkingSlot ? session.parkingSlot.slotId : "N/A"}
          </MDTypography>
        </MDBox>
        <MDBox display="flex" justifyContent="space-between" mb={1}>
          <MDTypography variant="body2" fontWeight="bold">
            Entry Time:
          </MDTypography>
          <MDTypography variant="body2" color="text">
            {format(new Date(session.entryTime), "Pp")}
          </MDTypography>
        </MDBox>
        <MDBox display="flex" justifyContent="space-between" mb={1}>
          <MDTypography variant="body2" fontWeight="bold">
            Exit Time:
          </MDTypography>
          <MDTypography variant="body2" color="text">
            {session.actualExitTime ? format(new Date(session.actualExitTime), "Pp") : "Active"}
          </MDTypography>
        </MDBox>
        <MDBox display="flex" justifyContent="space-between" mb={1}>
          <MDTypography variant="body2" fontWeight="bold">
            Duration:
          </MDTypography>
          <MDTypography variant="body2" color="text">
            {session.durationHours ? `${session.durationHours} hours` : "N/A"}
          </MDTypography>
        </MDBox>
      </>
    );
  };

  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="invoice-details-modal-title">
      <Box sx={style} component={Card}>
        <MDBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <MDTypography id="invoice-details-modal-title" variant="h5" fontWeight="medium">
            Invoice Details
          </MDTypography>
          <MDTypography variant="h6" color="info" fontWeight="bold">
            <img src={Logo} alt="logo" width={80} height={80} />
          </MDTypography>
          <IconButton onClick={handleClose}>
            <Icon>close</Icon>
          </IconButton>
        </MDBox>
        <Divider />
        <MDBox my={2}>
          <MDBox display="flex" justifyContent="space-between" mb={1}>
            <MDTypography variant="body2" fontWeight="bold">
              Invoice ID:
            </MDTypography>
            <MDTypography variant="body2" color="text">
              {invoice._id}
            </MDTypography>
          </MDBox>
          <MDBox display="flex" justifyContent="space-between" mb={1}>
            <MDTypography variant="body2" fontWeight="bold">
              User:
            </MDTypography>
            <MDTypography variant="body2" color="text">
              {invoice.user ? invoice.user.email : "N/A"}
            </MDTypography>
          </MDBox>
          <MDBox display="flex" justifyContent="space-between" mb={1}>
            <MDTypography variant="body2" fontWeight="bold">
              Issue Date:
            </MDTypography>
            <MDTypography variant="body2" color="text">
              {format(new Date(invoice.issueDate), "Pp")}
            </MDTypography>
          </MDBox>
          <MDBox display="flex" justifyContent="space-between" mb={1}>
            <MDTypography variant="body2" fontWeight="bold">
              Payment Status:
            </MDTypography>
            <MDTypography variant="body2" color="text">
              {invoice.paymentStatus ? getPaymentStatusBadge(invoice.paymentStatus.status) : "N/A"}
            </MDTypography>
          </MDBox>
          <MDBox display="flex" justifyContent="space-between" mb={1}>
            <MDTypography variant="body1" fontWeight="bold" color="dark">
              Total Amount:
            </MDTypography>
            <MDTypography variant="h6" fontWeight="bold" color="success">
              ${invoice.amount.toFixed(2)}
            </MDTypography>
          </MDBox>
        </MDBox>
        <Divider />
        <MDBox my={2}>
          <MDTypography variant="h6" fontWeight="medium">
            Parking Session Details
          </MDTypography>
          {getParkingSessionInfo()}
        </MDBox>
        <Divider />
        <MDBox my={2}>
          <MDTypography variant="h6" fontWeight="medium">
            Description
          </MDTypography>
          <MDTypography variant="body2" color="text">
            {invoice.description}
          </MDTypography>
        </MDBox>
      </Box>
    </Modal>
  );
}

// Add PropTypes here
InvoiceDetailsModal.propTypes = {
  open: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  invoice: PropTypes.object,
};

export default InvoiceDetailsModal;
