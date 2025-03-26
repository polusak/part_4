const { test, after, beforeEach } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')
const Blog = require('../models/blog')
const api = supertest(app)

beforeEach(async () => {
  await Blog.deleteMany({})

  let blogObject = new Blog(helper.initialBlogs[0])
  await blogObject.save()

  blogObject = new Blog(helper.initialBlogs[1])
  await blogObject.save()
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

test('blogs are identified with field `id` not `_id`', async () => {
  const response = await api.get('/api/blogs')
  const listOfBlogs = response.body
  listOfBlogs.forEach(blog => {
    assert(blog.id && !blog._id)
  })
})

test('blogs can be added to /api/blogs', async () => {
  const initialResponse = await api.get('/api/blogs')
  const initialLength = initialResponse.body.length

  const newBlog = {
    'title': 'Computer Science',
    'author': 'Linus Torvalds',
    'url': 'www.blog.fi',
    'likes': 100
  }

  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, initialLength + 1)
  const titles = response.body.map(r => r.title)
  assert(titles.includes('Computer Science'))
})

test('if likes are not provided, zero likes is added', async () => {
  const newBlog = {
    'title': 'Lions',
    'author': 'Lion',
    'url': 'www.lion.fi'
  }
  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)
  const response = await api.get('/api/blogs')
  const addedBlogs = response.body.filter(blog => blog.title === 'Lions')
  assert.strictEqual(addedBlogs.length, 1)
  assert.strictEqual(addedBlogs[0].likes, 0)
})

after(async () => {
  await mongoose.connection.close()
})