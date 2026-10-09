const mongoose = require('mongoose')
const User = require('../models/user.model')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { validationResult } = require('express-validator');

const register = async (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
    }
    try {
        const { username, email, password, avatar = '' } = req.body

        if (avatar && (
            typeof avatar !== 'string' ||
            avatar.length > 1500000 ||
            !/^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/]+=*$/.test(avatar)
        )) {
            return res.status(422).json({ message: 'Avatar must be a PNG, JPEG, WebP, or GIF image no larger than 1 MB.' })
        }

        // Validations Run Automatically, check validators/auth.validator.js

        const isRegistered = await User.findOne({
            $or: [ // to check both email and username
                { email: email.trim() },
                { username: username.trim() },
            ]
        })
        if (isRegistered) {
            return res.status(409).json({
                message: 'This Email or UserName is already registered'
            })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await User.create({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password: hashedPassword,
            avatar
        })

        const userResponse = user.toObject();
        delete userResponse.password

        return res.status(201).json({
            success: true,
            message: 'Account Registration done',
            user: userResponse
        })
    }
    catch (error) {
        next(error)
    }
}

const login = async (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
    }
    try {
        const { email, password } = req.body

        // Validations Run Automatically, check middlewares/validator.js

        const users = await User.findOne({
            email: email.trim().toLowerCase()
        }).lean() // convert data into object

        if (!users) {
            return res.status(400).json({
                message: 'This Email or password is Invalid'
            })
        }

        const isCorrectPassword = await bcrypt.compare(password, users.password)
        if (!isCorrectPassword) {
            return res.status(400).json({
                message: 'This Email or password is Invalid'
            })
        }

        const token = jwt.sign(
            { userid: users._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
        )

        const userResponse = { ...users }
        delete userResponse.password

        return res.status(201).json({
            success: true,
            message: 'Account Login done',
            user: userResponse,
            Token: token
        })
    }
    catch (error) {
        next(error)
    }
}

const getMe = (req, res) => {
    const user = req.user
    return res.status(200).json({
        user: {
            _id: user._id,
            username: user.username,
            displayname: user.displayname,
            avatar: user.avatar || ''
        }
    })
}

module.exports = { register, login, getMe }
