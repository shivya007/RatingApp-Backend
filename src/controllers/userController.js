const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const pool = require('../utils/db');

// Get all users (admin only)
exports.getUsers = async (req, res) => {
    try {
        const [users] = await pool.promise().query(`
            SELECT id, name, email, address, role, created_at
            FROM users
            ORDER BY created_at DESC
        `);

        res.json(users);
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get user by ID (admin only)
exports.getUserById = async (req, res) => {
    try {
        const [users] = await pool.promise().query(`
            SELECT id, name, email, address, role, created_at
            FROM users
            WHERE id = ?
        `, [req.params.id]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If user is a store owner, get their store details
        if (users[0].role === 'store_owner') {
            const [stores] = await pool.promise().query(`
                SELECT s.*, 
                       COALESCE(AVG(r.rating), 0) as average_rating,
                       COUNT(r.id) as total_ratings
                FROM stores s
                LEFT JOIN ratings r ON s.id = r.store_id
                WHERE s.owner_id = ?
                GROUP BY s.id
            `, [req.params.id]);
            users[0].stores = stores;
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create new user (admin only)
exports.createUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, address, role } = req.body;

        // Check if user already exists
        const [existingUsers] = await pool.promise().query(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const [result] = await pool.promise().query(
            'INSERT INTO users (name, email, password, address, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, address, role]
        );

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: result.insertId,
                name,
                email,
                address,
                role
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user (admin only)
exports.updateUser = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, address, role } = req.body;
        const userId = req.params.id;

        // Check if user exists
        const [users] = await pool.promise().query(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user
        await pool.promise().query(
            'UPDATE users SET name = ?, email = ?, address = ?, role = ? WHERE id = ?',
            [name, email, address, role, userId]
        );

        res.json({
            message: 'User updated successfully',
            user: {
                id: userId,
                name,
                email,
                address,
                role
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete user (admin only)
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Check if user exists
        const [users] = await pool.promise().query(
            'SELECT * FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Delete user
        await pool.promise().query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get dashboard statistics (admin only)
exports.getDashboardStats = async (req, res) => {
    try {
        const [stats] = await pool.promise().query(`
            SELECT 
                (SELECT COUNT(*) FROM users) as total_users,
                (SELECT COUNT(*) FROM stores) as total_stores,
                (SELECT COUNT(*) FROM ratings) as total_ratings,
                (SELECT COUNT(*) FROM users WHERE role = 'admin') as total_admins,
                (SELECT COUNT(*) FROM users WHERE role = 'store_owner') as total_store_owners,
                (SELECT COUNT(*) FROM users WHERE role = 'user') as total_normal_users
        `);

        res.json(stats[0]);
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 