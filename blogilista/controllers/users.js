const usersRouter = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../models/user')

usersRouter.get('/', async (request, response,) => {
  const users = await User
    .find({})
    .populate('blogs', { url: 1, title: 1, author: 1, id: 1 })
  response.json(users)
})

usersRouter.get('/:id', (request, response, next) => {
  console.log('reqparam ' + request.params.id)
  User
    .findById(request.params.id)
    .populate('blogs', { title: 1, author: 1, url: 1, id: 1 })
    .then(user => {
      if (user) {
        console.log('user ' + user)
        response.json(user)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

usersRouter.delete('/:id', async (request, response, next) => {
  try {
    const deletedBlog = await User.findByIdAndDelete(request.params.id)
    return response.status(204).json(deletedBlog)
  } catch (error) {
    next(error)
  }
})

usersRouter.post('/', async (request, response, next) => {
  const { username, name, password } = request.body


  if (!password) {
    return response.status(400).json({ error: 'Password must be provided' })
  } else if (password.length < 3) {
    return response.status(400).json({ error: 'Password must have length of at least 3' })
  }

  const saltRounds = 10
  const passwordHash = await bcrypt.hash(password, saltRounds)

  const user = new User({
    username,
    name,
    passwordHash,
  })

  try {
    const savedUser = await user.save()
    response.status(201).json(savedUser)
  } catch (error) {
    next(error)
  }
})

module.exports = usersRouter