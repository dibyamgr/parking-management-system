/**
=========================================================
* Parking Management System - ParkSmart
=========================================================

Coded by Dibya Rani Saru Magar (202487865) and Irin Sultana ()
*/

import Dashboard from "layouts/dashboard";
import Users from "layouts/users";
import Billing from "layouts/billing";
import RTL from "layouts/rtl";
import Notifications from "layouts/notifications";
import Profile from "layouts/profile";
import SignIn from "layouts/authentication/sign-in";
import SignUp from "layouts/authentication/sign-up";

import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import PeopleIcon from "@mui/icons-material/People";
import MapIcon from "@mui/icons-material/Map";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import DirectionsCarIcon from "@mui/icons-material/DirectionsCar";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import LogoutIcon from "@mui/icons-material/Logout";
import ListAltIcon from "@mui/icons-material/ListAlt";
import SettingsIcon from "@mui/icons-material/Settings";
import ParkingZones from "layouts/parking-zones";
import ParkingSlots from "layouts/parking-slots";
import Vehicles from "layouts/vehicles";
import ParkingSessions from "layouts/parkingSessions";
import Invoices from "layouts/invoices";

import FindParkingPage from "layouts/user-landing-page/find-parking";
import FindNearbyParkingZones from "layouts/user-landing-page/find-nearby-parking-zones";
import SearchResultsPage from "layouts/user-landing-page/searchResults";
import BookingPage from "layouts/user-landing-page/booking";
import BookingsList from "layouts/user-landing-page/booking/BookingsList";
import PaymentPage from "layouts/user-landing-page/payment";

const routes = [
  {
    type: "collapse",
    name: "Dashboard",
    key: "dashboard",
    icon: <SpaceDashboardIcon fontSize="small" />,
    route: "/dashboard",
    component: <Dashboard />,
  },
  { type: "divider", key: "management-divider" },
  {
    type: "collapse",
    name: "Users",
    key: "users",
    icon: <PeopleIcon fontSize="small" />,
    route: "/users",
    component: <Users />,
  },
  {
    type: "collapse",
    name: "Parking Zones",
    key: "parking-zones",
    icon: <MapIcon fontSize="small" />,
    route: "/parking-zones",
    component: <ParkingZones />,
  },
  {
    type: "collapse",
    name: "Parking Slots",
    key: "parking-slots",
    icon: <LocalParkingIcon fontSize="small" />,
    route: "/parking-slots",
    component: <ParkingSlots />,
  },
  {
    type: "collapse",
    name: "Vehicles",
    key: "vehicles",
    icon: <DirectionsCarIcon fontSize="small" />,
    route: "/vehicles",
    component: <Vehicles />,
  },
  {
    type: "collapse",
    name: "Parking Sessions",
    key: "parking-sessions",
    icon: <AccessTimeIcon fontSize="small" />,
    route: "/parking-sessions",
    component: <ParkingSessions />,
  },
  { type: "divider", key: "financial-divider" },
  {
    type: "collapse",
    name: "Invoices",
    key: "invoices",
    icon: <ReceiptLongIcon fontSize="small" />,
    route: "/invoices",
    component: <Invoices />,
  },
  {
    type: "collapse",
    name: "Activity Log",
    key: "activity-log",
    icon: <ListAltIcon fontSize="small" />,
    route: "/activity-log",
    noCollapse: true,
  },
  { type: "divider", key: "account-divider" },
  // {
  //   type: "collapse",
  //   name: "My Profile",
  //   key: "profile",
  //   icon: <AccountCircleIcon fontSize="small" />,
  //   route: "/my-profile",
  //   component: <SignUp />,
  // },
  {
    type: "collapse",
    name: "Settings",
    key: "settings",
    icon: <SettingsIcon fontSize="small" />,
    route: "/settings",
    noCollapse: true,
  },
  {
    type: "collapse",
    name: "Logout",
    key: "logout",
    icon: <LogoutIcon fontSize="small" />,
    route: "/authentication/sign-in",
    component: <SignIn />,
  },
  {
    type: "collapse",
    name: "Sign In",
    key: "sign-in",
    icon: <AccountCircleIcon fontSize="small" />,
    route: "/authentication/sign-in",
    component: <SignIn />,
  },
  {
    type: "collapse",
    name: "Sign Up",
    key: "sign-up",
    icon: <AccountCircleIcon fontSize="small" />,
    route: "/authentication/sign-up",
    component: <SignUp />,
  },
  {
    type: "route",
    name: "Find Nearby Parking Zones",
    key: "find-nearby-parking-zones",
    icon: <MapIcon fontSize="small" />,
    route: "/find-nearby-parking-zones",
    component: <FindNearbyParkingZones />,
    layout: "user-public",
    noCollapse: true,
  },
  {
    type: "route",
    name: "Find Parking",
    key: "find-parking",
    icon: <MapIcon fontSize="small" />,
    route: "/",
    component: <FindParkingPage />,
    layout: "user-public",
    noCollapse: true,
  },
  {
    type: "route",
    name: "Search Results",
    key: "search-results",
    route: "/search-results",
    component: <SearchResultsPage />,
    layout: "user-public",
    noCollapse: true,
  },
  {
    type: "route",
    name: "Search Results",
    key: "search-results",
    route: "/book/:parkingSlotId",
    component: <BookingPage />,
    layout: "user-public",
    noCollapse: true,
  },
  {
    type: "route",
    name: "My Bookings",
    key: "my-bookings",
    route: "/my-bookings",
    component: <BookingsList />,
    layout: "user-public",
    noCollapse: true,
  },
  {
    type: "route",
    name: "Payment",
    key: "payment",
    route: "/payment/:invoiceId",
    component: <PaymentPage />,
    layout: "user-public",
    noCollapse: true,
  },
];

export default routes;
