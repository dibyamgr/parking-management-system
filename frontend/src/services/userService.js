import axiosInstance from "../utils/axiosInstance";
const usersService = {
  // Fetch all users
  getAllUsers: async () => {
    try {
      const response = await axiosInstance.get("/auth/users");

      return response.data.users || response.data;
    } catch (error) {
      console.error("Error fetching users:", error);
      throw error;
    }
  },

  // Create a new user (no-op for this small-scale version)
  createUser: async (userData) => {
    try {
      const response = await axiosInstance.post("/auth/register", userData);
      console.log("User created successfully", response.data);
      return response.data;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  // Update an existing user (no-op for this small-scale version)
  updateUser: async (userId, userData) => {
    console.log(`Update user API call for ID ${userId} is not implemented.`);
    console.log("Simulating update for:", userData);
    return { _id: userId, ...userData };
  },

  // Delete a user (no-op for this small-scale version)
  deleteUser: async (userId) => {
    console.log(`Delete user API call for ID ${userId} is not implemented.`);
    console.log("Simulating deletion.");
    return true;
  },
};

export default usersService;
