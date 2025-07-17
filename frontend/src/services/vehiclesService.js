import axiosInstance from "../utils/axiosInstance";

const vehiclesService = {
  // Fetch all vehicles
  getAllVehicles: async () => {
    try {
      const response = await axiosInstance.get("/vehicles");
      return response.data;
    } catch (error) {
      console.error("Error fetching vehicles:", error);
      throw error;
    }
  },

  // Get vehicle by ID
  getVehicleById: async (id) => {
    try {
      const response = await axiosInstance.get(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching vehicle ${id}:`, error);
      throw error;
    }
  },

  // Create a new vehicle
  createVehicle: async (vehicleData) => {
    try {
      const response = await axiosInstance.post("/vehicles", vehicleData);
      return response.data;
    } catch (error) {
      console.error("Error creating vehicle:", error);
      throw error;
    }
  },

  // Update an existing vehicle
  updateVehicle: async (id, vehicleData) => {
    try {
      const response = await axiosInstance.put(`/vehicles/${id}`, vehicleData);
      return response.data;
    } catch (error) {
      console.error(`Error updating vehicle ${id}:`, error);
      throw error;
    }
  },

  // Delete a vehicle
  deleteVehicle: async (id) => {
    try {
      const response = await axiosInstance.delete(`/vehicles/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting vehicle ${id}:`, error);
      throw error;
    }
  },
};

export default vehiclesService;
