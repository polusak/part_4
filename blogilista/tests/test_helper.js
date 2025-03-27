const Blog = require('../models/blog')
const User = require('../models/user')

const initialBlogs = [
  {
    'title': 'Cats',
    'author': 'Cat',
    'url': 'cats.com',
    'likes': 250
  },
  {
    'title': 'Dogs',
    'author': 'Dog',
    'url': 'dogs.com',
    'likes': 250
  },
]
const nonExistingId = async () => {
  const blog = new Blog({ title: 'willremovethissoon' })
  await blog.save()
  await blog.deleteOne()

  return blog._id.toString()
}

const notesInDb = async () => {
  const blogs = await Blog.find({})
  return blogs.map(blog => blog.toJSON())
}

const usersInDb = async () => {
  const users = await User.find({})
  return users.map(u => u.toJSON())
}

module.exports = {
  initialBlogs, nonExistingId, notesInDb, usersInDb
}