var bcrypt = require("bcrypt");
var jwtUtils = require("../../../utils/jwt.utils");
const getHTML = require("html-get");
var models = require("../../../models/index");
const debug = require("debug")("app:account.controller");
const htmlToText = require("html-to-text");
const tv = require("term-vector");
const urlExists = require("url-exists");

//routes
module.exports = {
  update: function(req, res, next) {
    debug("update");

    const updateUser = req.body;
    return models.User.update(updateUser, { where: { id: updateUser.id } })
      .then(function(user) {
        return res.json(user);
      })
      .catch(function(err) {
        console.log("Error verify user:");
        console.log("Log : " + err);
        return res.status(500).json({ error: "unable to verify user" });
      });
  },
  updateEmail: function(req, res, next) {
    debug("updateEmail");

    const email = req.body.email;

    return models.User.update(
      { email: email },
      { where: { id: req.body.user_id } }
    )
      .then(function() {
        return res.json({ res: "OK" });
      })
      .catch(function(err) {
        console.log("Error verify user:");
        console.log("Log : " + err);
        return res.status(500).json({ error: "unable to verify user" });
      });
  },
  updatePassword: function(req, res, next) {
    debug("updatePassword");
    bcrypt.hash(req.body.currentPassword, 5, function(err, bcryptedPassword) {
      return models.User.find({ where: { id: req.body.user_id } })
        .then(function(userFound) {
          bcrypt.compare(req.body.currentPassword, userFound.pass, function(
            errBycrypt,
            resBycrypt
          ) {
            if (resBycrypt) {
              bcrypt.hash(req.body.newPassword, 5, function(
                err,
                bcryptedPassword
              ) {
                return models.User.update(
                  { pass: bcryptedPassword },
                  { where: { id: req.body.user_id } }
                ).then(function() {
                  return res.json("OK");
                });
              });
            } else {
              return res.status(403).json({ error: "invalid password" });
            }
          });
        })
        .catch(next);
    });
  },
  getContentFromUrl: async function(req, res, next) {
    debug("getContentFromUrl");
    const deleteStopWordFromArray = array => {
      let stopWords = [
        "a",
        "about",
        "above",
        "after",
        "again",
        "against",
        "ain",
        "all",
        "am",
        "an",
        "and",
        "any",
        "are",
        "aren",
        "aren't",
        "as",
        "at",
        "be",
        "because",
        "been",
        "before",
        "being",
        "below",
        "between",
        "both",
        "but",
        "by",
        "can",
        "couldn",
        "couldn't",
        "d",
        "did",
        "didn",
        "didn't",
        "do",
        "does",
        "doesn",
        "doesn't",
        "doing",
        "don",
        "don't",
        "down",
        "during",
        "each",
        "few",
        "for",
        "from",
        "further",
        "had",
        "hadn",
        "hadn't",
        "has",
        "hasn",
        "hasn't",
        "have",
        "haven",
        "haven't",
        "having",
        "he",
        "her",
        "here",
        "hers",
        "herself",
        "him",
        "himself",
        "his",
        "how",
        "i",
        "if",
        "in",
        "into",
        "is",
        "isn",
        "isn't",
        "it",
        "it's",
        "its",
        "itself",
        "just",
        "ll",
        "m",
        "ma",
        "me",
        "mightn",
        "mightn't",
        "more",
        "most",
        "mustn",
        "mustn't",
        "my",
        "myself",
        "needn",
        "needn't",
        "no",
        "nor",
        "not",
        "now",
        "o",
        "of",
        "off",
        "on",
        "once",
        "only",
        "or",
        "other",
        "our",
        "ours",
        "ourselves",
        "out",
        "over",
        "own",
        "re",
        "s",
        "same",
        "shan",
        "shan't",
        "she",
        "she's",
        "should",
        "should've",
        "shouldn",
        "shouldn't",
        "so",
        "some",
        "such",
        "t",
        "than",
        "that",
        "that'll",
        "the",
        "their",
        "theirs",
        "them",
        "themselves",
        "then",
        "there",
        "these",
        "they",
        "this",
        "those",
        "through",
        "to",
        "too",
        "under",
        "until",
        "up",
        "ve",
        "very",
        "was",
        "wasn",
        "wasn't",
        "we",
        "were",
        "weren",
        "weren't",
        "what",
        "when",
        "where",
        "which",
        "while",
        "who",
        "whom",
        "why",
        "will",
        "with",
        "won",
        "won't",
        "wouldn",
        "wouldn't",
        "y",
        "you",
        "you'd",
        "you'll",
        "you're",
        "you've",
        "your",
        "yours",
        "yourself",
        "yourselves",
        "could",
        "he'd",
        "he'll",
        "he's",
        "here's",
        "how's",
        "i'd",
        "i'll",
        "i'm",
        "i've",
        "let's",
        "ought",
        "she'd",
        "she'll",
        "that's",
        "there's",
        "they'd",
        "they'll",
        "they're",
        "they've",
        "we'd",
        "we'll",
        "we're",
        "we've",
        "what's",
        "when's",
        "where's",
        "who's",
        "why's",
        "would"
      ];
      stopWords.forEach(stopWord => {
        array.forEach(token => {
          if (token === stopWord || token.length === 1 || token.length === 0) {
            delete array[array.indexOf(token)];
          }
        });
      });
      return array;
    };
    const rankOccurences = array => {
      let sortedArray = array.sort(
        (a, b) => b.positions.length - a.positions.length
      );
      return sortedArray.slice(0, 20);
    };

    const getWordStatistics = array => {
      const statistics = [];
      let totalOccurences = 0;
      console.log(array.length);
      array.forEach(token => {
        totalOccurences += token.positions.length;
      });
      console.log(totalOccurences);
      array.forEach(token => {
        statistics.push({
          token: token.term,
          stat: ((token.positions.length / totalOccurences) * 100).toFixed(1)
        });
      });
      console.log(statistics);
      return statistics;
    };

    (async () => {
      urlExists(req.body.url, function(err, exists) {
        if (exists === false) {
          return res.status(500).json({ error: "unable to find website" });
        }
      });
      const { url, html, stats } = await getHTML(req.body.url);
      const tokens = htmlToText
        .fromString(html)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\n/g, " ")
        .replace(/\[.*?\]/g, "")
        .replace(/[^a-z+]+/gi, " ")
        .toLowerCase()
        .split(" ");

      const cleanTokens = deleteStopWordFromArray(tokens);
      const mapOfTokens = tv(cleanTokens);
      const topTenOccurences = rankOccurences(mapOfTokens);
      const statistics = getWordStatistics(topTenOccurences);
      return res.json(statistics);
    })();
  }
};
