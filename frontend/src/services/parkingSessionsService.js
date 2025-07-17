import axiosInstance from "../utils/axiosInstance";

const parkingSessionsService = {
  // Get all parking sessions for the admin
  getAllParkingSessions: async () => {
    try {
      const response = await axiosInstance.get("/parking-sessions/admin/all");
      return response.data;
    } catch (error) {
      console.error("Error fetching all parking sessions:", error);
      throw error;
    }
  },
};

export default parkingSessionsService;
