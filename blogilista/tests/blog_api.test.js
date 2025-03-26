const { test, after } = require('node:test')
const assert = require('node:assert')
const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')

const api = supertest(app)

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

after(async () => {
  await mongoose.connection.close()
})