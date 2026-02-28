console.log("GROUP ROUTES FILE LOADED");
console.log(`[DEBUG] LOADED: ${__filename}`);
const express = require('express');
const router = express.Router();
const { createGroup, addMember, getGroupBalances } = require('../controllers/groupController');

router.post('/', createGroup);
router.post('/:groupId/add-member', addMember);
router.get('/:groupId/balances', getGroupBalances);

module.exports = router;