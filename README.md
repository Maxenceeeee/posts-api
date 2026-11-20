# Posts API

API REST de gestion de posts, écrite en Node.js avec [Koa](https://koajs.com/), `@koa/router` et `koa-bodyparser`. Les données sont stockées **en mémoire** : elles sont initialisées à partir de `posts.seed.json` et perdues à chaque redémarrage du serveur.

## Prérequis

- Node.js 20.10 ou supérieur (le code utilise les import attributes JSON et le mode `--watch`)
- npm

## Démarrer

```sh
npm install
npm start
```

Le serveur écoute sur `http://localhost:3000` par défaut. Pour changer le port, définir la variable d'environnement `PORT` :

```sh
PORT=4000 npm start
```

Pour relancer automatiquement le serveur à chaque modification du code :

```sh
npm run dev
```

## Structure du projet

```
posts-api/
├── src/
│   ├── server.js        # Application Koa : routes, validation, gestion des erreurs
│   └── posts-store.js   # Stockage en mémoire (lecture, création, modification, suppression)
├── posts.seed.json      # Jeu de données initial (10 posts)
├── recette.js           # Recette automatique des routes
└── package.json
```

## Le modèle Post

| Champ    | Type    | Contraintes                                   |
| -------- | ------- | --------------------------------------------- |
| `id`     | entier  | Généré par le serveur (plus grand id + 1)     |
| `postId` | entier  | Obligatoire, supérieur ou égal à 1            |
| `name`   | chaîne  | Obligatoire, 1 à 100 caractères, non vide     |
| `email`  | chaîne  | Obligatoire, adresse valide, 100 caractères max |
| `body`   | chaîne  | Obligatoire, 1 à 500 caractères, non vide     |

Exemple :

```json
{
  "id": 1,
  "postId": 1,
  "name": "id labore ex et quam laborum",
  "email": "Eliseo@gardner.biz",
  "body": "laudantium enim quasi est quidem magnam voluptate ipsam eos"
}
```

## Routes

| Méthode  | Route          | Description                                         | Succès                          |
| -------- | -------------- | --------------------------------------------------- | ------------------------------- |
| `GET`    | `/`            | Message de vérification que l'API est lancée        | `200`                           |
| `GET`    | `/posts`       | Liste des posts, filtrable avec `?postId=<n>`       | `200`                           |
| `GET`    | `/posts/:id`   | Détail d'un post                                    | `200`                           |
| `POST`   | `/posts`       | Crée un post (tous les champs sauf `id`)            | `201` + en-tête `Location`      |
| `PUT`    | `/posts/:id`   | Remplace un post (tous les champs sauf `id`)        | `200`                           |
| `PATCH`  | `/posts/:id`   | Modifie un ou plusieurs champs                      | `200`                           |
| `DELETE` | `/posts/:id`   | Supprime un post                                    | `204` (sans contenu)            |

Le corps des requêtes `POST`, `PUT` et `PATCH` doit être du JSON (`Content-Type: application/json`). Tout champ inconnu, y compris `id`, est refusé.

## Gestion des erreurs

Les erreurs sont renvoyées en JSON sous la forme `{ "error": "<message>" }`.

| Code  | Cas                                                                                  |
| ----- | ------------------------------------------------------------------------------------ |
| `400` | JSON invalide, champ manquant, inconnu ou invalide, `postId` de la requête incorrect |
| `404` | Post ou route inexistant                                                             |
| `405` | Méthode non autorisée sur une route existante                                        |
| `500` | Erreur interne du serveur (message générique, détail dans les logs)                  |

## Exemples

```sh
# Lister les posts du postId 1
curl "http://localhost:3000/posts?postId=1"

# Récupérer un post
curl http://localhost:3000/posts/1

# Créer un post
curl -X POST http://localhost:3000/posts \
  -H "Content-Type: application/json" \
  -d '{"postId": 1, "name": "Mon titre", "email": "moi@exemple.com", "body": "Mon contenu"}'

# Modifier partiellement un post
curl -X PATCH http://localhost:3000/posts/1 \
  -H "Content-Type: application/json" \
  -d '{"name": "Nouveau titre"}'

# Supprimer un post
curl -X DELETE http://localhost:3000/posts/1
```

## Recette automatique

Le script `recette.js` vérifie le comportement des routes. Le serveur doit être lancé au préalable :

```sh
node recette.js
# ou, sur un autre port :
API_URL=http://localhost:4000 node recette.js
```

Le script affiche le détail des contrôles réussis (✅) et en échec (❌) pour chaque section.