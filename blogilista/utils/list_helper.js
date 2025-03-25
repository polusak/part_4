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

module.exports = {
  dummy, totalLikes
}