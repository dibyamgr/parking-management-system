import axiosInstance from "../utils/axiosInstance";

const invoicesService = {
  // Get all invoices for the admin
  getAllInvoices: async () => {
    try {
      const response = await axiosInstance.get("/invoices/admin/all");
      return response.data;
    } catch (error) {
      console.error("Error fetching all invoices:", error);
      throw error;
    }
  },

  // Get a single invoice by ID
  getInvoiceById: async (id) => {
    try {
      const response = await axiosInstance.get(`/invoices/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      throw error;
    }
  },
};

export default invoicesService;
