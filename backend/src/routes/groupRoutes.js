console.log("GROUP ROUTES FILE LOADED");
console.log(`[DEBUG] LOADED: ${__filename}`);
const express = require('express');
const router = express.Router();
const { createGroup, addMember, getGroups, getGroupById, deleteGroup } = require('../controllers/groupController');

router.post('/', createGroup);
router.get('/', getGroups);
router.get('/:groupId', getGroupById);
router.post('/:groupId/add-member', addMember);
router.delete('/:id', deleteGroup);

module.exports = router;