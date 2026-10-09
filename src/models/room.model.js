const mongoose = require('mongoose')
const User = require('./user.model')

const roomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            minlength: 3
        },
        description: {
            type: String,
            default: ""
        },
        createdby: {
            type: mongoose.Schema.Types.ObjectId,
            ref: User
        },
        isprivate: {
            type: Boolean,
            default: false
        },
        members: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: User,
        }]
    }, { timestamps: true }
)

const room = mongoose.models.room || mongoose.model("room", roomSchema)

module.exports = room