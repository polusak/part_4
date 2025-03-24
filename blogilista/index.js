const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const { info, error } = require('./utils/logger')
const config = require('./utils/config')
const middleware = require('./utils/middleware')
const blogsRouter = require('./controllers/blogs')

const mongoUrl = config.MONGODB_URI
mongoose.connect(mongoUrl)
  .then(result => {
    if (result) {
      info('connected to MongoDB')
    }
  })
  .catch((err) => {
    error('error connecting to MongoDB:', err.message)
  })

app.use(cors())
app.use(express.json())
app.use(middleware.requestLogger)
app.use('/api/blogs', blogsRouter)
app.use(middleware.unknownEndpoint)
app.use(middleware.errorHandler)

const PORT = config.PORT
app.listen(PORT, () => {
  info(`Server running on port ${PORT}`)
})

