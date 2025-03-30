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

blogsRouter.delete('/:id', async (request, response, next) => {
  const token = request.token
  let decodedToken = ''
  if (token !== null) {
    try {
      decodedToken = jwt.verify(token, process.env.SECRET)
    } catch (error) {
      next(error)
    }
  } else {
    const msg = 'Token missing. Only logged in users can delete blogs.'
    return response.status(401).json({ error: `${msg}` })
  }
  let user = ''
  let creator = ''
  try {
    user = await User.findById(decodedToken.id)
    if (user !== null) {
      const deletingUserId = user.id
      try {
        creator = await Blog.findById(request.params.id)
        const creatorInDb = await User.findById(creator.user.toString())
        if (creatorInDb !== null && creator.user !== undefined) {
          if (deletingUserId === creator.user.toString()) {
            const deletedBlog = await Blog.findByIdAndDelete(request.params.id)
            if (deletedBlog) {
              response.status(204).json(deletedBlog)
            } else {
              response.status(404).end()
            }
          } else {
            const errormsg1 = 'If blog has a creator in database,'
            const errormsg2 =  'only the creator can delete it.'
            return response.status(401).json({ error: `${errormsg1}${errormsg2}` })
          }
        } else {
          await Blog.findByIdAndDelete(request.params.id)
          return response.status(204)
        }
      } catch (error) {
        next(error)
      }
    } else {
      const msg = 'Cannot find user with token provided'
      return response.status(401).json({ error: `${msg}` })
    }
  } catch (error) {
    next(error)
  }
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