import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import posts from '../posts.seed.json' with { type: 'json' }

const app = new Koa()
const router = new Router()
const port = process.env.PORT ?? 3000
const postFields = ['postId', 'name', 'email', 'body']

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
    ctx.status = 400
    ctx.body = { error: 'le postId doit être un entier supérieur ou égal à 1' }
    return
  }

  ctx.body = posts.filter((post) => post.postId === parsedPostId)
})

router.get('/posts/:id', (ctx) => {
  const post = posts.find((p) => p.id === Number(ctx.params.id))
  if (!post) {
    ctx.status = 404
    ctx.body = { error: 'Post not found' }
    return
  }

  ctx.body = post
})

router.post('/posts', (ctx) => {
  const input = ctx.request.body
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    ctx.throw(400, 'Le corps doit être un objet JSON')
  }

  if (Object.keys(input).some((field) => !postFields.includes(field))) {
    ctx.throw(400, 'Le corps contient un champ inconnu')
  }

  if (postFields.some((field) => !Object.hasOwn(input, field))) {
    ctx.throw(400, 'Les champs postId, name, email et body sont obligatoires')
  }

  if (!Number.isInteger(input.postId) || input.postId < 1) {
    ctx.throw(400, 'postId doit être un entier supérieur ou égal à 1')
  }

  if (typeof input.name !== 'string' || input.name.trim().length === 0 || input.name.length > 100) {
    ctx.throw(400, 'name doit contenir entre 1 et 100 caractères')
  }

  if (
    typeof input.email !== 'string' ||
    input.email.length > 100 ||
    input.email.trim() !== input.email ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)
  ) {
    ctx.throw(400, 'email doit être une adresse e-mail valide de 100 caractères au plus')
  }

  if (typeof input.body !== 'string' || input.body.trim().length === 0 || input.body.length > 500) {
    ctx.throw(400, 'body doit contenir entre 1 et 500 caractères')
  }

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

router.delete('/posts/:id', (ctx) => {
  const index = posts.findIndex((p) => p.id === Number(ctx.params.id))
  if (index === -1) {
    ctx.status = 404
    ctx.body = { error: 'Post not found' }
    return
  }
  posts.splice(index, 1)
  ctx.status = 204
  ctx.body = { message: 'Post deleted successfully' }
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
    const status = ctx.status
    ctx.body = { error: ctx.status === 404 ? 'Not Found' : 'Request failed' }
    ctx.status = status
  }
})

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`)
})
