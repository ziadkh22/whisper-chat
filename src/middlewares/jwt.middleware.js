const jwt = require('jsonwebtoken')
const User = require('../models/user.model')



const authMiddleware = async (req, res, next) => {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer '))
        return res.status(400).json({
            success: false,
            message: 'Login Failed for security reasons'
        })

    try {
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        const user = await User.findById(decoded.userid)
        if (!user)
            return res.status(401).json({
                success: false,
                message: 'Login Failed for security reasons'
            })

        req.user = user // attaches the validated user information to the request object
        next()
    }
    catch (error) {
        next(error)
    }

}

module.exports = authMiddleware