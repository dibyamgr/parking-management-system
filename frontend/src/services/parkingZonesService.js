import axiosInstance from "utils/axiosInstance";

const parkingZonesService = {
  getAllParkingZones: async () => {
    try {
      const response = await axiosInstance.get("/parking-zones");
      return response.data;
    } catch (error) {
      console.error("Error fetching parking zones:", error);
      throw error;
    }
  },

  // Create a new parking zone
  createParkingZone: async (zoneData) => {
    try {
      const response = await axiosInstance.post("/parking-zones", zoneData);
      return response.data;
    } catch (error) {
      console.error("Error creating parking zone:", error);
      throw error;
    }
  },

  // Update an existing parking zone
  updateParkingZone: async (zoneId, zoneData) => {
    try {
      const response = await axiosInstance.put(`/parking-zones/${zoneId}`, zoneData);
      return response.data;
    } catch (error) {
      console.error("Error updating parking zone:", error);
      throw error;
    }
  },

  // Delete a parking zone
  deleteParkingZone: async (zoneId) => {
    try {
      const response = await axiosInstance.delete(`/parking-zones/${zoneId}`, zoneData);
      return response.data;
    } catch (error) {
      console.error("Error deleting parking zone:", error);
      throw error;
    }
  },
};

export default parkingZonesService;
