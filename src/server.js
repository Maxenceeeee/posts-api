import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import posts from '../posts.seed.json' with { type: 'json' }

const app = new Koa()
const router = new Router()
const port = process.env.PORT ?? 3000
const postFields = ['postId', 'name', 'email', 'body']

function validatePost(input, partial = false) {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    return 'Le corps doit être un objet JSON'
  }

  const fields = Object.keys(input)
  if (fields.some((field) => !postFields.includes(field))) {
    return 'Le corps contient un champ inconnu'
  }

  if (partial && fields.length === 0) {
    return 'Au moins un champ doit être fourni'
  }

  if (!partial && postFields.some((field) => !Object.hasOwn(input, field))) {
    return 'Les champs postId, name, email et body sont obligatoires'
  }

  for (const field of fields) {
    if (field === 'postId' && (!Number.isInteger(input.postId) || input.postId < 1)) {
      return 'postId doit être un entier supérieur ou égal à 1'
    }

    if (
      field === 'name' &&
      (typeof input.name !== 'string' || input.name.trim().length === 0 || input.name.length > 100)
    ) {
      return 'name doit contenir entre 1 et 100 caractères'
    }

    if (
      field === 'email' &&
      (typeof input.email !== 'string' ||
        input.email.length > 100 ||
        input.email.trim() !== input.email ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email))
    ) {
      return 'email doit être une adresse e-mail valide de 100 caractères au plus'
    }

    if (
      field === 'body' &&
      (typeof input.body !== 'string' || input.body.trim().length === 0 || input.body.length > 500)
    ) {
      return 'body doit contenir entre 1 et 500 caractères'
    }
  }

  return null
}

router.get('/', (ctx) => {
  ctx.body = { message: 'Posts API est lancée' }
})

router.get('/posts', (ctx) => {
  const { postId } = ctx.query
  if (postId === undefined) {
    ctx.body = posts
    return
  }

  const parsedPostId = Number(postId)
  if (!Number.isInteger(parsedPostId) || parsedPostId < 1) {
    ctx.throw(400, 'le postId doit être un entier supérieur ou égal à 1')
  }

  ctx.body = posts.filter((post) => post.postId === parsedPostId)
})

router.get('/posts/:id', (ctx) => {
  const post = posts.find((p) => p.id === Number(ctx.params.id))
  if (!post) {
    ctx.throw(404, 'Post not found')
  }

  ctx.body = post
})

router.post('/posts', (ctx) => {
  const input = ctx.request.body
  const validationError = validatePost(input)
  if (validationError) ctx.throw(400, validationError)

  const newPost = {
    id: posts.reduce((highestId, post) => Math.max(highestId, post.id), 0) + 1,
    postId: input.postId,
    name: input.name,
    email: input.email,
    body: input.body,
  }
  posts.push(newPost)
  ctx.status = 201
  ctx.set('Location', `/posts/${newPost.id}`)
  ctx.body = newPost
})

router.put('/posts/:id', (ctx) => {
  const post = posts.find((item) => item.id === Number(ctx.params.id))
  if (!post) {
    ctx.throw(404, 'Post not found')
  }

  const input = ctx.request.body
  const validationError = validatePost(input)
  if (validationError) ctx.throw(400, validationError)

  Object.assign(post, input)
  ctx.body = post
})

router.patch('/posts/:id', (ctx) => {
  const post = posts.find((item) => item.id === Number(ctx.params.id))
  if (!post) {
    ctx.throw(404, 'Post not found')
  }

  const input = ctx.request.body
  const validationError = validatePost(input, true)
  if (validationError) ctx.throw(400, validationError)

  Object.assign(post, input)
  ctx.body = post
})

router.delete('/posts/:id', (ctx) => {
  const index = posts.findIndex((p) => p.id === Number(ctx.params.id))
  if (index === -1) {
    ctx.throw(404, 'Post not found')
  }
  posts.splice(index, 1)
  ctx.status = 204
})

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    const status = error.status || error.statusCode || 500
    ctx.status = status
    ctx.body = {
      error: status >= 500 ? 'Internal Server Error' : error.message || ctx.message,
    }

    if (status >= 500) {
      ctx.app.emit('error', error, ctx)
    }
  }

  console.log(`${ctx.method} ${ctx.url} ${ctx.status}`)
})

app.use(bodyParser({
  onerror: (_error, ctx) => {
    ctx.throw(400, 'Invalid JSON body')
  },
}))
app.use(router.routes())
app.use(router.allowedMethods({ throw: true }))
app.use(async (ctx, next) => {
  await next()
  if (ctx.status >= 400 && ctx.body == null) {
    ctx.throw(ctx.status, ctx.status === 404 ? 'Not Found' : 'Request failed')
  }
})

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`)
})
