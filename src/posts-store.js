import seedPosts from '../posts.seed.json' with { type: 'json' }

const posts = seedPosts.map((post) => ({ ...post }))

export function getPosts(postId) {
  return postId === undefined ? posts : posts.filter((post) => post.postId === postId)
}

export function findPostById(id) {
  return posts.find((post) => post.id === id)
}

export function createPost(fields) {
  const id = posts.reduce((highestId, post) => Math.max(highestId, post.id), 0) + 1
  const post = { id, ...fields }
  posts.push(post)
  return post
}

export function updatePost(id, fields) {
  const post = findPostById(id)
  if (!post) return null

  Object.assign(post, fields)
  return post
}

export function deletePost(id) {
  const index = posts.findIndex((post) => post.id === id)
  if (index === -1) return false

  posts.splice(index, 1)
  return true
}
