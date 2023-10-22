const router = require("express").Router();

router.use("/user", require("./user"));
router.use("/auth", require("./auth"));
router.use("/post", require("./post"));
router.use("/admin", require("./admin"));
router.use("/chat", require("./chat"));

module.exports = router;
