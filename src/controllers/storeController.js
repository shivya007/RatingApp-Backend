const { validationResult } = require('express-validator');
const pool = require('../utils/db');

// Get all stores
exports.getStores = async (req, res) => {
    try {
        const [stores] = await pool.promise().query(`
            SELECT s.*, 
                   COALESCE(AVG(r.rating), 0) as average_rating,
                   COUNT(r.id) as total_ratings
            FROM stores s
            LEFT JOIN ratings r ON s.id = r.store_id
            GROUP BY s.id
        `);

        res.json(stores);
    } catch (error) {
        console.error('Get stores error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get store by ID
exports.getStoreById = async (req, res) => {
    try {
        const [stores] = await pool.promise().query(`
            SELECT s.*, 
                   COALESCE(AVG(r.rating), 0) as average_rating,
                   COUNT(r.id) as total_ratings
            FROM stores s
            LEFT JOIN ratings r ON s.id = r.store_id
            WHERE s.id = ?
            GROUP BY s.id
        `, [req.params.id]);

        if (stores.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Get user's rating if logged in
        if (req.user) {
            const [userRating] = await pool.promise().query(
                'SELECT rating FROM ratings WHERE user_id = ? AND store_id = ?',
                [req.user.userId, req.params.id]
            );
            stores[0].userRating = userRating[0]?.rating || null;
        }

        res.json(stores[0]);
    } catch (error) {
        console.error('Get store error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Create new store
exports.createStore = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, address } = req.body;

        // Check if store email already exists
        const [existingStores] = await pool.promise().query(
            'SELECT * FROM stores WHERE email = ?',
            [email]
        );

        if (existingStores.length > 0) {
            return res.status(400).json({ message: 'Store with this email already exists' });
        }

        // Create store
        const [result] = await pool.promise().query(
            'INSERT INTO stores (name, email, address, owner_id) VALUES (?, ?, ?, ?)',
            [name, email, address, req.user.userId]
        );

        res.status(201).json({
            message: 'Store created successfully',
            store: {
                id: result.insertId,
                name,
                email,
                address
            }
        });
    } catch (error) {
        console.error('Create store error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update store
exports.updateStore = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, address } = req.body;
        const storeId = req.params.id;

        // Check if store exists and user is owner
        const [stores] = await pool.promise().query(
            'SELECT * FROM stores WHERE id = ? AND owner_id = ?',
            [storeId, req.user.userId]
        );

        if (stores.length === 0) {
            return res.status(404).json({ message: 'Store not found or unauthorized' });
        }

        // Update store
        await pool.promise().query(
            'UPDATE stores SET name = ?, email = ?, address = ? WHERE id = ?',
            [name, email, address, storeId]
        );

        res.json({
            message: 'Store updated successfully',
            store: {
                id: storeId,
                name,
                email,
                address
            }
        });
    } catch (error) {
        console.error('Update store error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete store
exports.deleteStore = async (req, res) => {
    try {
        const storeId = req.params.id;

        // Check if store exists and user is owner
        const [stores] = await pool.promise().query(
            'SELECT * FROM stores WHERE id = ? AND owner_id = ?',
            [storeId, req.user.userId]
        );

        if (stores.length === 0) {
            return res.status(404).json({ message: 'Store not found or unauthorized' });
        }

        // Delete store
        await pool.promise().query('DELETE FROM stores WHERE id = ?', [storeId]);

        res.json({ message: 'Store deleted successfully' });
    } catch (error) {
        console.error('Delete store error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Submit rating
exports.submitRating = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { rating } = req.body;
        const storeId = req.params.id;

        // Check if store exists
        const [stores] = await pool.promise().query(
            'SELECT * FROM stores WHERE id = ?',
            [storeId]
        );

        if (stores.length === 0) {
            return res.status(404).json({ message: 'Store not found' });
        }

        // Check if user has already rated
        const [existingRatings] = await pool.promise().query(
            'SELECT * FROM ratings WHERE user_id = ? AND store_id = ?',
            [req.user.userId, storeId]
        );

        if (existingRatings.length > 0) {
            // Update existing rating
            await pool.promise().query(
                'UPDATE ratings SET rating = ? WHERE user_id = ? AND store_id = ?',
                [rating, req.user.userId, storeId]
            );
        } else {
            // Create new rating
            await pool.promise().query(
                'INSERT INTO ratings (user_id, store_id, rating) VALUES (?, ?, ?)',
                [req.user.userId, storeId, rating]
            );
        }

        res.json({ message: 'Rating submitted successfully' });
    } catch (error) {
        console.error('Submit rating error:', error);
        res.status(500).json({ message: 'Server error' });
    }
}; 