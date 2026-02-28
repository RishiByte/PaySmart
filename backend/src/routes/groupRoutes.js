console.log("GROUP ROUTES FILE LOADED");
console.log(`[DEBUG] LOADED: ${__filename}`);
const express = require('express');
const router = express.Router();
const { createGroup, addMember } = require('../controllers/groupController');

router.post('/', createGroup);
router.post('/:groupId/add-member', addMember);

module.exports = router;