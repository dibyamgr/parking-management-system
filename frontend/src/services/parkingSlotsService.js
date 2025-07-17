import axiosInstance from "utils/axiosInstance";

const parkingSlotsService = {
  getAllParkingSlots: async () => {
    const response = await axiosInstance.get("/parking-slots");
    return response.data;
  },

  getParkingSlotById: async (id) => {
    const response = await axiosInstance.get(`/parking-slots/${id}`);
    return response.data;
  },

  createParkingSlot: async (slotData) => {
    const response = await axiosInstance.post("/parking-slots", slotData);
    return response.data;
  },

  updateParkingSlot: async (id, slotData) => {
    const response = await axiosInstance.put(`/parking-slots/${id}`, slotData);
    return response.data;
  },

  deleteParkingSlot: async (id) => {
    const response = await axiosInstance.delete(`/parking-slots/${id}`);
    return response.data;
  },

  searchParkingSlots: async (query) => {
    const response = await axiosInstance.get(`/parking-slots?q=${query}`);
    return response.data;
  },
};

export default parkingSlotsService;
