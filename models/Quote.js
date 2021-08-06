const quotesCollection = require("../db").db().collection("quotes")
const ObjectID = require("mongodb").ObjectID
const User = require("./User")
const sanitizeHTML = require("sanitize-html")

let Quote = function (data, userid, requestedPostId) {
  this.data = data
  this.errors = []
  this.userid = userid
  this.requestedPostId = requestedPostId
}

Quote.prototype.cleanUp = function () {
  if (typeof this.data.quote != "string") {
    this.data.quote = ""
  }
  if (typeof this.data.source != "string") {
    this.source = ""
  }

  // get rid of any bogus properties
  this.data = {
    quote: sanitizeHTML(this.data.quote.trim(), { allowedTags: [], allowedAttributes: {} }),
    source: sanitizeHTML(this.data.source.trim(), { allowedTags: [], allowedAttributes: {} }),
    createdDate: new Date(),
    author: ObjectID(this.userid)
  }
}

Quote.prototype.validate = function () {
  if (this.data.quote == "") {
    this.errors.push("You must provide a quote.")
  }
  if (this.data.source == "") {
    this.errors.push("You must provide an source.")
  }
}

Quote.prototype.create = function () {
  return new Promise((resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      // save post into database
      quotesCollection
        .insertOne(this.data)
        .then(info => {
          let infoObject = {
            _id: info.ops[0]._id,
            quote: info.ops[0].quote,
            source: info.ops[0].source,
            createdDate: info.ops[0].createdDate,
            author: info.ops[0].author
          }
          resolve(infoObject)
        })
        .catch(e => {
          this.errors.push("Please try again later.")
          reject(this.errors)
        })
    } else {
      reject(this.errors)
    }
  })
}

Quote.prototype.update = function () {
  return new Promise(async (resolve, reject) => {
    try {
      await Quote.findSingleById(this.requestedPostId, this.userid)
      // actually update the db
      let status = await this.actuallyUpdate()
      resolve(status)
    } catch (err) {
      reject("failed " + err)
    }
  })
}

Quote.prototype.actuallyUpdate = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp()
    this.validate()
    if (!this.errors.length) {
      await quotesCollection.findOneAndUpdate({ _id: new ObjectID(this.requestedPostId) }, { $set: { quote: this.data.quote, source: this.data.source } })
      resolve("success")
    } else {
      resolve("failure")
    }
  })
}

Quote.reusablePostQuery = function (uniqueOperations, visitorId, finalOperations = []) {
  return new Promise(async function (resolve, reject) {
    let aggOperations = uniqueOperations
      .concat([
        { $lookup: { from: "users", localField: "author", foreignField: "_id", as: "authorDocument" } },
        {
          $project: {
            quote: 1,
            source: 1,
            createdDate: 1,
            authorId: "$author",
            author: { $arrayElemAt: ["$authorDocument", 0] }
          }
        }
      ])
      .concat(finalOperations)

    let quotes = await quotesCollection.aggregate(aggOperations).toArray()

    // clean up author property in each post object
    quotes = quotes.map(function (quote) {
      quote.isVisitorOwner = quote.authorId.equals(visitorId)
      quote.authorId = undefined

      quote.author = {
        username: quote.author.username
      }

      return quote
    })

    resolve(quotes)
  })
}

Quote.findSingleById = function (id, visitorId) {
  return new Promise(async function (resolve, reject) {
    if (typeof id != "string" || !ObjectID.isValid(id)) {
      reject()
      return
    }

    let quotes = await Quote.reusablePostQuery([{ $match: { _id: new ObjectID(id) } }], visitorId)

    if (quotes.length) {
      resolve(quotes[0])
    } else {
      reject()
    }
  })
}

Quote.delete = function (quoteIdToDelete, currentUserId) {
  return new Promise(async (resolve, reject) => {
    try {
      let quote = await Quote.findSingleById(quoteIdToDelete, currentUserId)

      await quotesCollection.deleteOne({ _id: new ObjectID(quoteIdToDelete) })
      resolve()
    } catch (e) {
      reject()
    }
  })
}

Quote.grabRandom = function () {
  /*  console.log("grabRandom Ran.") */
  return new Promise((resolve, reject) => {
    quotesCollection
      .aggregate([{ $sample: { size: 1 } }])
      .toArray()
      .then(result => {
        /* console.log(result[0]) */
        if (result) {
          resolve(result[0])
        } else {
          reject("there was an error during the database action.")
        }
      })
      .catch(e => {
        reject("there was an error. " + e)
      })
  })
}

Quote.grabAll = function () {
  console.log("grabAll Ran.")
  return new Promise((resolve, reject) => {
    quotesCollection
      .find()
      .toArray()
      .then(result => {
        console.log(result)
        if (result) {
          resolve(result)
        } else {
          reject("there was an error during the database action.")
        }
      })
      .catch(e => {
        reject("there was an error. " + e)
      })
  })
}

module.exports = Quote
