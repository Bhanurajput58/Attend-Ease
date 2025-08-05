const User = require('../models/User');


exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists with that email' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    res.status(201).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Don't allow password updates here
    if (req.body.password) {
      delete req.body.password;
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await user.remove();

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
}; 