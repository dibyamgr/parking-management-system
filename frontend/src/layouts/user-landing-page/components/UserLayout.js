// prop-types is a library for typechecking of props
import PropTypes from "prop-types";

import Grid from "@mui/material/Grid";

// React components
import MDBox from "components/MDBox";
// import MDTypography from "components/MDTypography";

import DefaultNavbar from "examples/Navbars/DefaultNavbar";
import PageLayout from "examples/LayoutContainers/PageLayout";

// Authentication layout components
import Footer from "layouts/authentication/components/Footer";

import { ShareLocation } from "@mui/icons-material";
import { Box } from "@mui/material";

function UserLayout({ coverHeight, image, children }) {
  return (
    <PageLayout>
      <DefaultNavbar
        type="user"
        action={{
          type: "external",
          route: "/find-nearby-parking-zones",
          label: (
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ShareLocation sx={{ mr: 0.5 }} fontSize="small" />
              Find Nearby Parking Zones
            </Box>
          ),
        }}
        transparent
        light
      />
      <MDBox
        width="100%"
        minHeight={coverHeight}
        pt={6}
        pb={28}
        sx={{
          backgroundImage: ({ functions: { linearGradient, rgba }, palette: { gradients } }) =>
            image &&
            `${linearGradient(
              rgba(gradients.dark.main, 0.4),
              rgba(gradients.dark.state, 0.4)
            )}, url(${image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <MDBox m={10} style={{ height: "auto" }}>
          {children}
        </MDBox>
      </MDBox>

      <Footer />
    </PageLayout>
  );
}

// Setting default props for the UserLayout
UserLayout.defaultProps = {
  coverHeight: "50vh",
};

// Typechecking props for the UserLayout
UserLayout.propTypes = {
  coverHeight: PropTypes.string,
  image: PropTypes.string,
  children: PropTypes.node.isRequired,
};

export default UserLayout;
