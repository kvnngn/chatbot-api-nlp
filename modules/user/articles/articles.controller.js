var bcrypt = require("bcrypt");
var jwtUtils = require('../../../utils/jwt.utils');
var models = require("../../../models/index");
const debug = require("debug")("app:articles.controller");
const path = require("path");
const mail = require(path.resolve("./libs/mail"));

//routes
module.exports = {
    getArticles: function (req, res, next) {
        debug("getArticles");

        let articles = [];

        return Promise.resolve()
            .then(getArticles)
            .then(() => {
                res.json(articles)
            })
            .catch(next);

        function getArticles() {
            return models.Article.findAll({
                    attributes: ['id', 'title', 'introduction', 'content', 'img', 'creation_date', 'type'],
                    include: [{model: models.User}]
                })
                .then((_articles) => {
                    _articles.forEach((article) => {
                        article.img = convertArrayBytesToBase64(article.img);
                    });
                    articles = _articles;
                })
        }

        function convertArrayBytesToBase64(img) {
            return new Uint8Array(img).reduce((data, byte) => data + String.fromCharCode(byte), '');
        }
    },
    getArticleById: function (req, res, next) {
        debug("getArticleById");

        let article;

        return Promise.resolve()
            .then(getArticle)
            .then(() => {
                res.json(article)
            })
            .catch(next);

        function getArticle() {
            return models.Article.findById(req.params.id,
                {
                    attributes: ['id', 'title', 'introduction', 'content', 'img', 'creation_date'],
                    include: [
                        {
                            model: models.Comment,
                            attributes: ['content', 'creation_date'],
                            include: [{
                                model: models.User
                            }]
                        },
                        {
                            model: models.User,
                        }
                    ]
                })
                .then((_article) => {
                    _article.img = convertArrayBytesToBase64(_article.img);
                    article = _article;
                })
        }

        function convertArrayBytesToBase64(img) {
            return new Uint8Array(img).reduce((data, byte) => data + String.fromCharCode(byte), '');
        }
    },
    getArticlesByCategorie: function (req, res, next) {
        debug("getArticleByCategorie");

        let article;
        let categorie = req.params.categorie;
        console.log(categorie);
        return Promise.resolve()
            .then(getArticles)
            .then(() => {
                res.json(article)
            })
            .catch(next);

        function getArticles() {
            return models.Article.findAll(
                {
                    where: {type: categorie},
                    attributes: ['id', 'title', 'introduction', 'content', 'img', 'creation_date', 'type'],
                    include: [
                        {
                            model: models.Comment,
                            attributes: ['content', 'creation_date'],
                            include: [{
                                model: models.User
                            }]
                        },
                        {
                            model: models.User,
                        }
                    ],

                })
                .then((_articles) => {
                    _articles.forEach((article) => {
                        article.img = convertArrayBytesToBase64(article.img);
                    });
                    article = _articles;
                })
        }

        function convertArrayBytesToBase64(img) {
            return new Uint8Array(img).reduce((data, byte) => data + String.fromCharCode(byte), '');
        }
    },
    create: function (req, res, next) {
        debug("create");
        console.log(req.body);
        var title = req.body.title;
        var introduction = req.body.introduction;
        var content = req.body.content;
        var type = req.body.type
        var img = req.body.img;
        var user_id = req.body.user_id;

        if (!title || !introduction || !content || !type || !img) {
            return res.status(400).json({'error': 'missing paramaters'});
        }

        return models.Article.create({
            title: title,
            introduction: introduction,
            content: content,
            type: type,
            img: img,
            user_id: user_id,
        })
            .then(function (newArticle) {
                return res.status(201).json({'articleId': newArticle.id})
            })
            .catch(function (err) {
                console.log('Error add article');
                console.log('Log : ' + err);
                return (res.status(500).json({'error': 'cannot add article'}));
            });
    }
};