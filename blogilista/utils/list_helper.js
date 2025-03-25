const dummy = (blogs) => {
  console.log(blogs)
  return 1
}

const totalLikes = (blogs) => {
  const blogLikes = blogs.map(blog => blog.likes)
  const sum = blogLikes.reduce(
    (accumulator, currentValue) => accumulator + currentValue,
    0,
  )
  return sum
}

const favouriteBlog = (blogs) => {
  let i = 0
  let j = 0
  let maxLikes = 0
  blogs.forEach(blog => {
    if (blog.likes > maxLikes) {
      maxLikes = blog.likes
      i = j
    }
    j += 1
  }
  )
  return blogs[i]
}

const compareFn = (a, b) => {
  if (a.blogs > b.blogs) {
    return -1
  } else if (a.blogs < b.blogs) {
    return 1
  }
  return 0
}

const getNewList = (author, blogs, oldlist) => {
  const list = oldlist.concat([
    {
      author: author,
      blogs: blogs
    }
  ])
  return list
}

const mostBlogs = (blogs) => {
  let authorObjectList = []
  let authorList = blogs.map(blog => blog.author)
  const authors = authorList.sort()

  let i = 0
  let lastAuthor = authors[0]
  authors.forEach(author => {
    if (lastAuthor === author) {
      i += 1
    } else {
      authorObjectList = getNewList(lastAuthor, i, authorObjectList)
      i = 1
      lastAuthor = author
    }
  })
  authorObjectList = getNewList(lastAuthor, i, authorObjectList)
  authorObjectList.sort(compareFn)
  return authorObjectList[0]
}

module.exports = {
  dummy,
  totalLikes,
  favouriteBlog,
  mostBlogs
}