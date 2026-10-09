const mongoose = require('mongoose')

const databaseConnection = () => mongoose.connect(process.env.MONGO_URI, {
    dbName: 'whisper'
})
    .then(console.log("Database Connection Successed"))
    .catch(err => console.error("Database Connection failed : ", err))

module.exports = databaseConnection