const { body } = require('express-validator');

const roomValidator = [

    body('name').isString().trim().isLength({ min: 3 }).notEmpty().withMessage("Room's Name is Required"),
    body('isprivate').isBoolean().notEmpty().withMessage('Please select Room privacy : true or false')

]

module.exports = roomValidator