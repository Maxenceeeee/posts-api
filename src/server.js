import Koa from 'koa'
import Router from '@koa/router'
import bodyParser from 'koa-bodyparser'

const app = new Koa()
const router = new Router()
const port = process.env.PORT ?? 3000

router.get('/', (ctx) => {
  ctx.body = { message: 'Posts API est lancée' }
})

app.use(bodyParser())
app.use(router.routes())
app.use(router.allowedMethods())

app.listen(port, () => {
  console.log(`Serveur démarré sur http://localhost:${port}`)
})
