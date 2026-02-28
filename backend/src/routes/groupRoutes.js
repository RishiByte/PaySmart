console.log("GROUP ROUTES FILE LOADED");
console.log(`[DEBUG] LOADED: ${__filename}`);
const express = require('express');
const router = express.Router();
const { createGroup, addMember, getGroups } = require('../controllers/groupController');

router.post('/', createGroup);
router.get('/', getGroups);
router.post('/:groupId/add-member', addMember);

module.exports = router;