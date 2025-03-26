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
    'title': 'Crocodiles',
    'author': 'Crocodile',
    'url': 'www.crocodile.fi',
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
  assert(titles.includes('Crocodiles'))
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

test('blog without title or url returns error code 400', async () => {
  const blogNoTitle = {
    'author': 'Tiger',
    'url': 'www.tiger.fi'
  }
  const blogWithEmptyTitle = {
    'title': '',
    'author': 'Elephant',
    'url': 'www.elephantr.fi'
  }
  const blogNoUrl = {
    'title': 'Salmons',
    'author': 'Salmon'
  }
  const blogWithEmptyUrl = {
    'title': 'Bears',
    'author': 'Bear',
    'url': ''
  }
  await api
    .post('/api/blogs')
    .send(blogNoTitle)
    .expect(400)

  await api
    .post('/api/blogs')
    .send(blogNoUrl)
    .expect(400)

  await api
    .post('/api/blogs')
    .send(blogWithEmptyTitle)
    .expect(400)

  await api
    .post('/api/blogs')
    .send(blogWithEmptyUrl)
    .expect(400)
})

test('blog can be deleted', async () => {
  const initialResponse = await api.get('/api/blogs')
  const blogToDelete = initialResponse.body[0]
  const id = blogToDelete.id
  await api
    .delete(`/api/blogs/${id}`)
    .expect(204)
  const response = await api.get('/api/blogs')
  assert.strictEqual(initialResponse.body.length, response.body.length + 1)
  const contents = response.body.map(r => r.title)
  assert(!contents.includes(blogToDelete.title))
})

test('blog can be modified', async () => {
  const initialResponse = await api.get('/api/blogs')
  const blogToModify = initialResponse.body[0]
  const id = blogToModify.id
  const newBlog = {
    'title': 'Crocodiles',
    'author': 'Crocodile',
    'url': 'www.crocodile.fi',
    'likes': 100
  }
  await api
    .put(`/api/blogs/${id}`)
    .send(newBlog)
    .expect(200)

  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, initialResponse.body.length)
  const contents = response.body.map(r => r.title)
  assert(!contents.includes(blogToModify.title))
  assert(contents.includes(newBlog.title))
})

after(async () => {
  await mongoose.connection.close()
})