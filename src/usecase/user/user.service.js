import { userRepository } from "./user.repository.js";
import bcrypt from "bcrypt";

// Helper function to remove sensitive data
const removeSensitiveData = (user) => {
    const { password, refreshToken, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData;
};

export const userService = {
    async getAllEmployees() {
        const employees = await userRepository.findByRole("EMPLOYEE");
        return employees.map(removeSensitiveData);
    },

    async createEmployee(payload) {
        const existingUser = await userRepository.findByEmail(payload.email);
        if (existingUser) {
            throw new Error("Email already exists");
        }

        const hashedPassword = await bcrypt.hash(payload.password, 10);

        const employee = await userRepository.create({
            name: payload.name,
            email: payload.email,
            password: hashedPassword,
            role: "EMPLOYEE",
        });

        return removeSensitiveData(employee);
    },

    async deleteEmployee(id) {
        // Check if user exists
        const user = await userRepository.findById(id);
        if (!user) {
            throw new Error("Employee not found");
        }

        // Verify it's an employee
        if (user.role !== "EMPLOYEE") {
            throw new Error("User is not an employee");
        }

        return await userRepository.delete(id);
    },

    async getAllUsers() {
        const users = await userRepository.findAll();
        return users.map(removeSensitiveData);
    },

    async createUser(payload) {
        const existingUser = await userRepository.findByEmail(payload.email);
        if (existingUser) {
            throw new Error("Email already exists");
        }

        const validRoles = ["USER", "ADMIN", "VENDOR", "EMPLOYEE"];
        if (!validRoles.includes(payload.role)) {
            throw new Error("Invalid role");
        }

        const hashedPassword = await bcrypt.hash(payload.password, 10);

        const user = await userRepository.create({
            ...payload,
            password: hashedPassword,
        });

        return removeSensitiveData(user);
    },

    async updateUserRole(id, role) {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new Error("User not found");
        }

        const validRoles = ["USER", "ADMIN", "VENDOR", "EMPLOYEE"];
        if (!validRoles.includes(role)) {
            throw new Error("Invalid role");
        }

        const updatedUser = await userRepository.updateRole(id, role);
        return removeSensitiveData(updatedUser);
    },

    async deleteUser(id) {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new Error("User not found");
        }

        return await userRepository.delete(id);
    },
};
