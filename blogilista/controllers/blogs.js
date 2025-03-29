const jwt = require('jsonwebtoken')
const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')

blogsRouter.get('/', (request, response) => {
  Blog.find({}).populate('user', { username: 1, name: 1, id: 1 })
    .then(blogs => {
      response.json(blogs)
    })
})

blogsRouter.get('/:id', (request, response, next) => {
  Blog.findById(request.params.id)
    .populate('user', { username: 1, name: 1, id: 1 })
    .then(blog => {
      if (blog) {
        response.json(blog)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

blogsRouter.post('/', async (request, response, next) => {
  const body = request.body
  const token = request.token
  let decodedToken = ''
  if (token !== null) {
    try {
      decodedToken = jwt.verify(token, process.env.SECRET)
    } catch (error) {
      next(error)
    }
  } else {
    return response.status(401).json({ error: 'token missing' })
  }
  try {
    const user = await User.findById(decodedToken.id)

    const blog = new Blog({
      title: body.title,
      author: body.author,
      url: body.url,
      likes: body.likes || 0,
      user: user._id

    })
    const savedBlog = await blog.save()
    user.blogs = user.blogs.concat(savedBlog._id)
    await user.save()
    return response.status(201).json(savedBlog)
  } catch (error) {
    next(error)
  }
})

blogsRouter.delete('/:id', (request, response, next) => {
  Blog.findByIdAndDelete(request.params.id)
    .then(blog => {
      if (blog) {
        response.status(204).json(blog)
      } else {
        response.status(404).end()
      }
    })
    .catch(error => next(error))
})

blogsRouter.put('/:id', (request, response, next) => {
  Blog.findById(request.params.id)
    .then(blog => {
      if (!blog) {
        return response.status(404).end()
      }

      blog.title = request.body.title
      blog.author = request.body.author
      blog.likes = request.body.likes
      blog.url = request.body.url

      return blog.save().then((updatedBlog) => {
        response.json(updatedBlog)
      })
    })
    .catch(error => next(error))
})
module.exports = blogsRouter