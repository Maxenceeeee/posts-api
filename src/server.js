import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'
import posts from '../posts.seed.json' with { type: 'json' }

const app = new Koa()
const router = new Router()
const port = process.env.PORT ?? 3000

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

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    const status = error.status || error.statusCode || 500
    console.log(`${ctx.method} ${ctx.url} ${status}`)
    throw error
  }

  console.log(`${ctx.method} ${ctx.url} ${ctx.status}`)
})

app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`)
})
