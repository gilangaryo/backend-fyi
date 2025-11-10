import { userService } from './user.service.js';

export const userController = {
    // ========== EMPLOYEE MANAGEMENT (Used by Admin) ==========
    async getAllEmployees(req, res, next) {
        try {
            const employees = await userService.getAllEmployees();
            res.json({
                success: true,
                data: employees,
            });
        } catch (err) {
            next(err);
        }
    },

    async createEmployee(req, res, next) {
        try {
            const { name, email, password } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: name, email, password',
                });
            }

            const employee = await userService.createEmployee({
                name,
                email,
                password,
            });

            res.status(201).json({
                success: true,
                message: 'Employee created successfully',
                data: employee,
            });
        } catch (err) {
            next(err);
        }
    },

    async deleteEmployee(req, res, next) {
        try {
            const { id } = req.params;

            await userService.deleteEmployee(id);

            res.json({
                success: true,
                message: 'Employee deleted successfully',
            });
        } catch (err) {
            next(err);
        }
    },

    // ========== GENERAL USER MANAGEMENT (Optional) ==========
    async getAll(req, res, next) {
        try {
            const users = await userService.getAllUsers();
            res.json({
                success: true,
                data: users,
            });
        } catch (err) {
            next(err);
        }
    },

    async create(req, res, next) {
        try {
            const { name, email, password, role } = req.body;

            if (!name || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Missing required fields: name, email, password',
                });
            }

            const user = await userService.createUser({
                name,
                email,
                password,
                role: role || 'USER',
            });

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: user,
            });
        } catch (err) {
            next(err);
        }
    },

    async updateRole(req, res, next) {
        try {
            const { id } = req.params;
            const { role } = req.body;

            if (!role) {
                return res.status(400).json({
                    success: false,
                    message: 'Role is required',
                });
            }

            const user = await userService.updateUserRole(id, role);

            res.json({
                success: true,
                message: 'Role updated successfully',
                data: user,
            });
        } catch (err) {
            next(err);
        }
    },

    async delete(req, res, next) {
        try {
            const { id } = req.params;

            await userService.deleteUser(id);

            res.json({
                success: true,
                message: 'User deleted successfully',
            });
        } catch (err) {
            next(err);
        }
    },
};