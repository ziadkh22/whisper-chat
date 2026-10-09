const User = require("../models/user.model")
const Room = require("../models/room.model")
const Message = require("../models/message.model")
const io = require('../server')
const jwt = require('jsonwebtoken')
const onlineusers = new Set()

const updateRoomUsers = async (roomid) => {
    const roomSockets = await io.in(roomid).fetchSockets()
    const onlineUsers = new Map()

    for (const roomSocket of roomSockets) {
        const user = roomSocket.data.user
        if (user) {
            const userid = user._id.toString()
            onlineUsers.set(userid, {
                userid,
                username: user.username,
                displayname: user.displayname || user.username,
                isTyping: Boolean(roomSocket.data.typingRoom === roomid || onlineUsers.get(userid)?.isTyping)
            })
        }
    }

    const room = await Room.findById(roomid)
        .populate('members', 'username displayname avatar')
        .populate('createdby', 'username displayname avatar')
        .lean()

    if (!room) return

    const members = new Map()
    const addMember = (user) => {
        if (!user?._id) return
        const userid = user._id.toString()
        const onlineUser = onlineUsers.get(userid)
        members.set(userid, {
            userid,
            username: user.username,
            displayname: user.displayname || user.username,
            avatar: user.avatar || '',
            isOnline: Boolean(onlineUser),
            isTyping: Boolean(onlineUser?.isTyping)
        })
    }

    addMember(room.createdby)
    room.members.forEach(addMember)
    io.to(roomid).emit('room-users', [...members.values()])
}


const connectionIo = (socket) => {

    // Connecting socket with user
    const token = socket.handshake.query.token;

    if (!token) {
        socket.emit('error', 'Authentication error , probelm is session token')
        socket.disconnect();
        return;
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        User.findById(decoded.userid)
            .then((user) => {
                if (!user) {
                    socket.emit('error', 'user not found')
                    socket.disconnect();
                    return;
                }

                socket.data.userid = user._id
                socket.data.user = user

                console.log('user connected : ' + user.username)

                // to add online user when connected
                onlineusers.add(socket.data.userid);
                io.emit('user-online', { userid: socket.data.userid, username: user.username })

                // Connecting user to secured room

                socket.on('join-room', async (data) => {
                    const roomid = data.roomid

                    if (!roomid) {
                        socket.emit('error', 'Room not found')
                        return;
                    }

                    if (!socket.data.userid) {
                        socket.emit('error', 'Authentication error to join this room')
                        return;
                    }

                    try {
                        const room = await Room.findById(roomid)

                        if (!room) {
                            socket.emit('error', 'Room not found')
                            return;
                        }

                        if (
                            room.isprivate &&
                            room.createdby.toString() !== socket.data.userid.toString() &&
                            !room.members.some(member => member.toString() === socket.data.userid.toString())
                        ) {
                            socket.emit('error', 'This member is not authorized to join this room');
                            return;
                        }

                        await Room.updateOne({ _id: roomid }, { $addToSet: { members: socket.data.userid } })
                        await socket.join(roomid)
                        socket.emit('joined-room', { roomid })
                        await updateRoomUsers(roomid)
                        console.log(`User : ${socket.data.user.username} , Joined-room : ${room.name}`)

                    }
                    catch (error) {
                        socket.emit('error', 'Problem in joninig the room', error.message)
                    }
                }) // end of : Connecting user to secured room

                // Send & Recieve Messages System
                socket.on('send-message', async (data) => {
                    const { roomid, text } = data || {}

                    if (!roomid || !text?.trim()) {
                        socket.emit('error', 'Roomid or Message not found')
                        return;
                    }

                    if (!socket.data.userid) {
                        socket.emit('error', 'Authentication error to send the message')
                        return;
                    }

                    try {
                        const message = await Message.create({
                            room: roomid,
                            user: socket.data.userid,
                            text: text.trim()
                        })

                        const populated = await Message.findById(message._id)
                            .populate('user', 'username displayname avatar')
                            .lean()

                        io.to(roomid).emit('new-message', populated);

                    } catch (error) {
                        console.error('error sending message : ', error)
                        socket.emit('error', 'Authentication error : ', error.message)
                    }
                })

                socket.on('typing-start', (data) => {
                    const roomid = data.roomid

                    if (!roomid || !socket.data.userid) return;

                    socket.data.typingRoom = roomid;
                    updateRoomUsers(roomid).catch(console.error)

                    socket.to(roomid).emit('user-typing', {
                        userid: socket.data.userid,
                        username: socket.data.user.username,
                        roomid
                    })
                })

                socket.on('typing-stop', (data) => {
                    const roomid = data.roomid

                    if (!roomid || !socket.data.userid) return;

                    if (socket.data.typingRoom === roomid) delete socket.data.typingRoom
                    updateRoomUsers(roomid).catch(console.error)

                    socket.to(roomid).emit('user-stopped-typing', {
                        userid: socket.data.userid,
                        username: socket.data.user.username,
                        roomid
                    })
                })

                // Tell the client auth and event handlers are ready before it emits join-room.
                socket.emit('authenticated', {
                    userid: socket.data.userid.toString(),
                    username: socket.data.user.username
                })

            }).catch((err) => { // catch of then()
                socket.emit('error', 'Authentication error : ', err.message)
                socket.disconnect();
            })
    }
    catch (error) { // catch of main try{}
        socket.emit('error', 'Error in Starting connection');
        socket.disconnect();
    }

    socket.on('disconnect', () => {
        // to delete online user when disconnected
        if (socket.data.userid) {
            onlineusers.delete(socket.data.userid);
            io.emit('user-offline', { userid: socket.data.userid })
        }
        console.log('user Disconnected : ' + socket.id)
    })

    socket.on('disconnecting', () => {
        const roomids = [...socket.rooms].filter(roomid => roomid !== socket.id)
        for (const roomid of roomids) {
            setTimeout(() => updateRoomUsers(roomid).catch(console.error), 50)
        }
    })

}

module.exports = connectionIo
