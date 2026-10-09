const authMiddleware = require('../middlewares/jwt.middleware')
const { registerValidator, loginValidator } = require('../validators/authValidator')
const { register, login, getMe } = require('../controllers/auth.controller')
const express = require('express')
const router = express.Router()

// router.use(authMiddleware)

router.post('/register', registerValidator, register)
router.post('/login', loginValidator, login)
router.get('/me', authMiddleware, getMe)

module.exports = router
