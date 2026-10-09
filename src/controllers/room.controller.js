const Room = require('../models/room.model')
const Message = require('../models/message.model')
const { validationResult } = require('express-validator')

const createRoom = async (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
    }

    try {

        const { name, isprivate, description } = req.body
        // Validations run Automatically ,check validators/room.validator.js

        const room = await Room.create({
            name: name.trim(),
            description: description.trim(),
            isprivate: isprivate,
            createdby: req.user._id, // From jwt
            members: [req.user._id]
        })

        const populated = await Room.findById(room._id)
            .populate('createdby', 'username displayname avatar')
            .lean()

        return res.status(201).json({
            message: 'room created successfully',
            room: room,
            created_By: populated
        })

    } catch (error) {
        next(error)
    }

}

const getRoom = async (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
    }

    try {

        const rooms = await Room.find()
            .populate('createdby', 'username displayname avatar')
            .sort({ createdAt: -1 })
            .lean()


        return res.status(201).json({
            message: 'Get rooms data successfully done',
            rooms: rooms
        })

    } catch (error) {
        next(error)
    }

}

const getMyRooms = async (req, res, next) => {
    try {
        const rooms = await Room.find({
            $or: [
                { members: req.user._id },
                { createdby: req.user._id }
            ]
        })
            .select('name createdby createdAt')
            .populate('createdby', 'username displayname avatar')
            .sort({ createdAt: -1 })
            .lean()

        return res.status(200).json({ rooms })
    } catch (error) {
        next(error)
    }
}

const getRoomById = async (req, res, next) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() })
    }

    try {

        const room = await Room.findById(req.params.id)
            .populate('createdby', 'username displayname avatar')
            .lean()

        if (!room) {
            return res.status(404).json({ message: 'The room is not found' })
        }

        return res.status(201).json({
            message: 'Get room_by_id data successfully done',
            room: room
        })

    } catch (error) {
        next(error)
    }

}

const getRoomMessages = async (req, res, next) => {
    try {
        const roomid = req.params.id // Gets roomid from the URL parameters
        const limit = Math.min(parseInt(req.query.limit) || 50, 100) //limit defaults to 50 and is capped at 100 , limit is the maximum number of messages to return.

        // to avoid negative numbers in skip
        const parsedSkip = parseInt(req.query.skip, 10) // parseInt("40", 10) = 40 , The 10 is the radix argument to parseInt ,In parseInt("12", 10), the 10 tells JavaScript: “Read this as a base-10 number,” so the result is twelve.
        const skip = Math.max(0, parsedSkip || 0) // skip is how many matching messages to pass over before returning results , in our example skip = 0 so no skips

        const messages = await Message.find({ room: roomid })
            .sort({ createdAt: -1 })
            .skip(skip) //skips a number of results.
            .limit(limit) //returns at most that many.
            .populate('user', 'username displayname avatar')//includes the sender avatar in chat messages.
            .lean()//returns plain JavaScript objects instead of full Mongoose documents.

        return res.status(200).json(messages)

    }
    catch (error) {
        console.error("error getting messages", error)
        next(error)
    }
}
module.exports = { createRoom, getRoom, getMyRooms, getRoomById, getRoomMessages }
