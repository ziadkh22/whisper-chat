const authMiddleware = require('../middlewares/jwt.middleware')
const roomValidator = require('../validators/room.validator')
const { createRoom, getRoom, getMyRooms, getRoomById, getRoomMessages } = require('../controllers/room.controller')
const express = require('express')
const router = express.Router()

router.use(authMiddleware)

router.post('/create', roomValidator, createRoom)
router.get('/myRooms', getMyRooms)
router.get('/get', getRoom)
router.get('/getById/:id', getRoomById)
router.get('/roomMessages/:id', getRoomMessages)

module.exports = router
