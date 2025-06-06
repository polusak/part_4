const { test, after, beforeEach, describe } = require('node:test')
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

  await User.deleteMany({})

  const user = {
    'username': 'testusername',
    'name': 'testname',
    'password': 'testpassword'
  }
  await api
    .post('/api/users')
    .send(user)
    .expect(201)
    .expect('Content-Type', /application\/json/)
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

test('a logged in user can add a blog to /api/blogs', async () => {
  const initialBlogs = await helper.blogsInDb()
  const initialLength = initialBlogs.length

  const loginInfo = {
    username: 'testusername',
    password: 'testpassword'
  }
  const loggedInUser = await api
    .post('/api/login')
    .send(loginInfo)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const token = loggedInUser.body.token

  const newBlog = {
    'title': 'Crocodiles',
    'author': 'Crocodile',
    'url': 'www.crocodile.fi',
    'likes': 100
  }
  await api
    .post('/api/blogs')
    .set({ Authorization: `Bearer ${token}` })
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')
  assert.strictEqual(response.body.length, initialLength + 1)
  const titles = response.body.map(r => r.title)
  assert(titles.includes('Crocodiles'))
})

test('if likes of a blog are not provided, zero likes is added', async () => {
  const loginInfo = {
    username: 'testusername',
    password: 'testpassword'
  }
  const loggedInUser = await api
    .post('/api/login')
    .send(loginInfo)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const token = loggedInUser.body.token

  const newBlog = {
    'title': 'Lions',
    'author': 'Lion',
    'url': 'www.lion.fi'
  }
  await api
    .post('/api/blogs')
    .set({ Authorization: `Bearer ${token}` })
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const response = await api.get('/api/blogs')
  const addedBlogs = response.body.filter(blog => blog.title === 'Lions')
  assert.strictEqual(addedBlogs.length, 1)
  assert.strictEqual(addedBlogs[0].likes, 0)
})

test('blog without title or url returns error code 400', async () => {
  const loginInfo = {
    username: 'testusername',
    password: 'testpassword'
  }
  const loggedInUser = await api
    .post('/api/login')
    .send(loginInfo)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const token = loggedInUser.body.token

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
    .set({ Authorization: `Bearer ${token}` })
    .send(blogNoTitle)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  await api
    .post('/api/blogs')
    .set({ Authorization: `Bearer ${token}` })
    .send(blogWithEmptyTitle)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  await api
    .post('/api/blogs')
    .set({ Authorization: `Bearer ${token}` })
    .send(blogNoUrl)
    .expect(400)
    .expect('Content-Type', /application\/json/)

  await api
    .post('/api/blogs')
    .set({ Authorization: `Bearer ${token}` })
    .send(blogWithEmptyUrl)
    .expect(400)
    .expect('Content-Type', /application\/json/)
})

test('blog with a creator can be deleted by who created it', async () => {

  const loginInfo = {
    username: 'testusername',
    password: 'testpassword'
  }
  const loggedInUser = await api
    .post('/api/login')
    .send(loginInfo)
    .expect(200)
    .expect('Content-Type', /application\/json/)

  const token = loggedInUser.body.token
  const newBlog = {
    'title': 'Crocodiles',
    'author': 'Crocodile',
    'url': 'www.crocodile.fi',
    'likes': 100
  }
  const addedBlog = await api
    .post('/api/blogs')
    .set({ Authorization: `Bearer ${token}` })
    .send(newBlog)
    .expect(201)
    .expect('Content-Type', /application\/json/)

  const initialResponse = await api.get('/api/blogs')

  await api
    .delete(`/api/blogs/${addedBlog.body.id}`)
    .set({ Authorization: `Bearer ${token}` })
    .expect(204)

  const response = await api.get('/api/blogs')
  assert.strictEqual(initialResponse.body.length, response.body.length + 1)
  const contents = response.body.map(r => r.title)
  assert(!contents.includes(addedBlog.body.title))
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

test('only a logged in user can create a blog and add it to db', async () => {
  const newBlog = {
    'title': 'Crocodiles',
    'author': 'Crocodile',
    'url': 'www.crocodile.fi',
    'likes': 100
  }
  await api
    .post('/api/blogs')
    .send(newBlog)
    .expect(401)
    .expect('Content-Type', /application\/json/)

})

const bcrypt = require('bcrypt')
const User = require('../models/user')

describe('user creation', async () => {
  beforeEach(async () => {
    //await User.deleteMany({})

    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'root', passwordHash })

    await user.save()
  })

  test('creation succeeds with a fresh username', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'mluukkai',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }

    await api
      .post('/api/users')
      .send(newUser)
      .expect(201)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length + 1)

    const usernames = usersAtEnd.map(u => u.username)
    assert(usernames.includes(newUser.username))
  })

  test('creation fails with proper statuscode and message if username already taken', async () => {
    const usersAtStart = await helper.usersInDb()

    const newUser = {
      username: 'root',
      name: 'Superuser',
      password: 'salainen',
    }

    const result = await api
      .post('/api/users')
      .send(newUser)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert(result.body.error.includes('expected `username` to be unique'))

    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})

describe('password and username validation', async () => {
  test('username of length under 3 is not accepted', async () => {
    const usersAtStart = await helper.usersInDb()

    const tooShortUsername = {
      username: 'ml',
      name: 'Matti Luukkainen',
      password: 'salainen',
    }
    const noUsername = {
      name: 'Matti Luukkainen',
      password: 'salainen',
    }
    await api
      .post('/api/users')
      .send(tooShortUsername)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    await api
      .post('/api/users')
      .send(noUsername)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)

  })
  test('password of length under 3 is not accepted', async () => {
    const usersAtStart = await helper.usersInDb()

    const tooShortPassword = {
      username: 'Cat',
      name: 'Kissa',
      password: 'sa',
    }
    const noPassword = {
      username: 'Dog',
      name: 'Koira'
    }
    await api
      .post('/api/users')
      .send(tooShortPassword)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    await api
      .post('/api/users')
      .send(noPassword)
      .expect(400)
      .expect('Content-Type', /application\/json/)

    const usersAtEnd = await helper.usersInDb()
    assert.strictEqual(usersAtEnd.length, usersAtStart.length)
  })
})



after(async () => {
  await mongoose.connection.close()
})