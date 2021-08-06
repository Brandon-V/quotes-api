const Quote = require("../models/Quote")

exports.apiCreate = function (req, res) {
  let quote = new Quote(req.body, req.apiUser._id)
  quote
    .create()
    .then(function (info) {
      res.json(info)
    })
    .catch(function (errors) {
      res.json(errors)
    })
}

exports.apiSendRandom = function (req, res) {
  Quote.grabRandom()
    .then(result => {
      /* console.log(result) */
      res.json(result)
      /* console.log(result) */
    })
    .catch(e => {
      res.json("Trouble accessing quotes. Try again later. " + e)
    })
}

exports.apiSendAll = function (req, res) {
  Quote.grabAll()
    .then(result => {
      /* console.log(result) */
      res.json(result)
      /* console.log(result) */
    })
    .catch(e => {
      res.json("Trouble accessing quotes. Try again later. " + e)
    })
}

exports.apiUpdate = function (req, res) {
  let quote = new Quote(req.body, req.apiUser._id, req.params.id)
  quote
    .update()
    .then(status => {
      // the post was successfully updated in the database
      // or user did have permission, but there were validation errors
      if (status == "success") {
        res.json(status)
      } else {
        res.json("failure")
        console.log("failure")
      }
    })
    .catch(e => {
      // a post with the requested id doesn't exist
      // or if the current visitor is not the owner of the requested post
      res.json("no permissions")
    })
}

exports.apiDelete = function (req, res) {
  Quote.delete(req.params.id, req.apiUser._id)
    .then(() => {
      res.json("Success")
    })
    .catch(e => {
      res.json("You do not have permission to perform that action.")
    })
}
