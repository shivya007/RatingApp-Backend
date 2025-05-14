const express = require('express');
const router = express.Router();
const {
    getStores,
    getStoreById,
    createStore,
    updateStore,
    deleteStore,
    submitRating
} = require('../controllers/storeController');
const { storeValidation, ratingValidation } = require('../middleware/validators');
const { protect, authorize } = require('../middleware/auth');

// Public routes
router.get('/', getStores);
router.get('/:id', getStoreById);

// Protected routes
router.post('/', protect, authorize('admin', 'store_owner'), storeValidation, createStore);
router.put('/:id', protect, authorize('admin', 'store_owner'), storeValidation, updateStore);
router.delete('/:id', protect, authorize('admin', 'store_owner'), deleteStore);
router.post('/:id/rate', protect, authorize('user'), ratingValidation, submitRating);

module.exports = router; 