const express = require('express');
const aiController = require('../controllers/aiController');
const { wrap } = require('../common/Routes');

const router = express.Router();

router.post('/chat', wrap(aiController.chat));

module.exports = router;
