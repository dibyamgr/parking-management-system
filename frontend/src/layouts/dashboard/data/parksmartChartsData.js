const parksmartChartsData = {
  parkingSessionsChart: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: { label: "Sessions", data: [150, 200, 180, 250, 300, 280, 220] },
  },
  revenueTrendChart: {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
    datasets: { label: "Revenue ($)", data: [2000, 2500, 2300, 3000, 3500] },
  },
  newUsersChart: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: { label: "New Users", data: [20, 35, 40, 30, 50, 45] },
  },
};

export default parksmartChartsData;
