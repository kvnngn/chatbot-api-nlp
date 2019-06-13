const router = require("express").Router();
const proController = require("./account.controller");


router.route("/contentFromUrl").post(proController.getContentFromUrl);

module.exports = router;
