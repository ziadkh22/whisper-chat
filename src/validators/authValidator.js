const { body } = require('express-validator');

const registerValidator = [

    body('username').isString().trim().notEmpty().isLength({ min: 3 }).withMessage('Please Check Your username again , must be string and min length is 3 characters'),
    body('email').isEmail().notEmpty().trim().withMessage('please enter a correct email'),
    body('password').isString().isLength({ min: 8 }).notEmpty().withMessage("Password is Required OR must be more than 8 characters")

]


const loginValidator = [

    body('email').isEmail().notEmpty().trim().withMessage('please enter a correct email'),
    body('password').isString().isLength({ min: 8 }).notEmpty().withMessage("Password is Required OR must be more than 8 characters")

]

module.exports = { registerValidator, loginValidator }