const express = require('express')
const app = express()
const { Server } = require('socket.io')
const http = require('http')
require('dotenv').config()
const port = process.env.PORT || 3000
const mongoose = require('mongoose')
const dns = require("dns")
const databaseConnection = require('./database/mongodb')
const cors = require('cors')
const authRouter = require('./routes/auth.route')
const roomRouter = require('./routes/room.route')

dns.setServers(['1.1.1.1', '8.8.8.8'])
databaseConnection()

const server = http.createServer(app) // server creation for regular work depend on express 'app'

const io = new Server(server, { // // socket creation for realtime work depend on socket.io
    cors: {
        origin: '*'
    }
})
module.exports = io

app.use(express.json({ limit: '2mb' }))
app.use(cors())
app.use("/api/auth", authRouter)
app.use("/api/room", roomRouter)

//Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' })
})

app.get('/', (req, res) => {
    res.send("Hello VISITOR..")
})

app.set('io', io)

const connectionIo = require('./socket/io.socket')

io.on('connection', connectionIo)

// io.on('connection', (socket) => {
//     console.log('user connected : ' + socket.id)

//     socket.on('disconnect', (socket) => {
//         console.log('user Disconnected : ' + socket.id)
//     })
// })

// Error Handling
app.use((err, req, res, next) => {
    console.error(err)
    const status = err.status || err.statuscode || 500
    const message = err.message || "Internal Server Error"
    res.status(status).json({ message })
})

server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`)
})

