const express = require('express');
const router = express.Router();
const {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    getDashboardStats
} = require('../controllers/userController');
const { registerValidation } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/auth');

// All routes are protected and admin-only
router.use(protect);
router.use(authorize('admin'));

// Dashboard stats
router.get('/dashboard/stats', getDashboardStats);

// User management
router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', registerValidation, createUser);
router.put('/:id', registerValidation, updateUser);
router.delete('/:id', deleteUser);

module.exports = router; 