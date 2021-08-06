const apiRouter = require("express").Router()
const userController = require("./controllers/userController")
const quoteController = require("./controllers/quoteController")
const cors = require("cors")

apiRouter.use(cors())

apiRouter.get("/", (req, res) => res.json("API is up and running successfully"))

// check on the front-end token to log out front-end if expired
apiRouter.post("/checkToken", userController.checkToken)

//user related routes
apiRouter.post("/login", userController.apiLogin)

//quote related routes
//apiRouter.get("/quote/:id", quoteController.reactApiViewSingle)
apiRouter.post("/create-quote", userController.apiMustBeLoggedIn, quoteController.apiCreate)
apiRouter.get("/random-quote", quoteController.apiSendRandom)
apiRouter.post("/all-quotes", userController.apiMustBeLoggedIn, quoteController.apiSendAll)
apiRouter.post("/quote/:id/edit", userController.apiMustBeLoggedIn, quoteController.apiUpdate)
apiRouter.delete("/quote/:id", userController.apiMustBeLoggedIn, quoteController.apiDelete)

module.exports = apiRouter
