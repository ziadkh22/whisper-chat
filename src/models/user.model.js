const mongoose = require('mongoose')

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            unique: true,
            required: true
        },
        email: {
            type: String,
            unique: true,
            required: true,
            trim: true,
            minlength: 3,
            lowercase: true
        },
        password: {
            type: String,
            required: true,
            minlength: 8
        },
        displayname: {
            type: String,
            trim: true,
            default: ""
        },
        avatar: {
            type: String,
            default: ""
        }
    }, { timestamps: true }
)

const user = mongoose.model("user", userSchema)

module.exports = user