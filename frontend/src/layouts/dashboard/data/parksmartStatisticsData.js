import React from "react";

// @mui icons
import PeopleIcon from "@mui/icons-material/People";
import LocalParkingIcon from "@mui/icons-material/LocalParking";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

const parksmartStatisticsData = [
  {
    color: "dark",
    icon: <PeopleIcon fontSize="medium" />,
    title: "Total Users",
    count: "1,250",
    percentage: {
      color: "success",
      amount: "+10%",
      label: "than last month",
    },
  },
  {
    icon: <LocalParkingIcon fontSize="medium" />,
    title: "Available Slots",
    count: "85 / 200", // Current available / Total capacity
    percentage: {
      color: "success",
      amount: "42.5%",
      label: "occupancy rate",
    },
  },
  {
    color: "success",
    icon: <AccessTimeIcon fontSize="medium" />,
    title: "Active Parking Sessions",
    count: "45",
    percentage: {
      color: "error",
      amount: "-5%",
      label: "vs. yesterday",
    },
  },
  {
    color: "primary",
    icon: <AttachMoneyIcon fontSize="medium" />,
    title: "Today's Revenue",
    count: "$2,800",
    percentage: {
      color: "success",
      amount: "+12%",
      label: "than yesterday",
    },
  },
];

export default parksmartStatisticsData;
