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

module.exports = {
  dummy, totalLikes, favouriteBlog
}