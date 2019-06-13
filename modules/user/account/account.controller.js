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
      array.forEach(token => {
        totalOccurences += token.positions.length;
      });
      array.forEach(token => {
        statistics.push({
          token: token.term,
          stat: ((token.positions.length / totalOccurences) * 100).toFixed(1)
        });
      });
      return statistics;
    };

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
  }
};
