const { body } = require('express-validator');

exports.registerValidation = [
    body('name')
        .isLength({ min: 2, max: 60 })
        .withMessage('Name must be between 2 and 60 characters'),
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters long')
        .matches(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/)
        .withMessage('Password must contain at least one uppercase letter and one special character'),
    body('address')
        .optional()
        .isLength({ max: 400 })
        .withMessage('Address must not exceed 400 characters')
];

exports.loginValidation = [
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email'),
    body('password')
        .notEmpty()
        .withMessage('Password is required')
];

exports.storeValidation = [
    body('name')
        .notEmpty()
        .withMessage('Store name is required'),
    body('email')
        .isEmail()
        .withMessage('Please enter a valid email'),
    body('address')
        .isLength({ max: 400 })
        .withMessage('Address must not exceed 400 characters')
];

exports.ratingValidation = [
    body('rating')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5')
]; 