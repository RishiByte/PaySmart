const User = require('../models/User');

const createUser = async (req, res) => {
  try {
    const { name, email } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const user = new User({ name, email });
    await user.save();

    return res.status(201).json(user);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { createUser };
