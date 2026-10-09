const mongoose = require('mongoose')
const User = require('./user.model')
const Room = require('./room.model')

const messageSchema = new mongoose.Schema(
    {
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: Room,
            required: true
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: User,
            required: true
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 5000
        }
    }, { timestamps: true }
)

const message = mongoose.model("message", messageSchema)

module.exports = message