const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const uri = process.env.MONGO_URI;

mongoose.connect(uri)
  .then(() => console.log("MongoDB connected!"))
  .catch(err => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  userId:    { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  age:       { type: Number, required: true },
  password:  { type: String },
  role:      { type: String }
});

const User = mongoose.model('User', userSchema);

app.post('/api/adduser', async (req, res) => {
  try {
    const { userId, firstName, lastName, email, age } = req.body;
    const newUser = new User({ userId, firstName, lastName, email, age });
    await newUser.save();
    res.status(201).json({ message: 'User created successfully!', user: newUser });
  } catch (err) {
    console.error('Error saving user:', err.message);
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      res.status(400).json({ error: `Duplicate value: ${field} already exists.` });
    } else {
      res.status(400).json({ error: err.message });
    }
  }
});

app.delete('/api/deleteuser/:userId', async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({ userId: req.params.userId });
    if (!deleted) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.status(200).json({ message: 'User deleted successfully!', user: deleted });
  } catch (err) {
    console.error('Error deleting user:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// Sort users by firstName ascending or descending
app.get('/api/users/sort', async (req, res) => {
  try {
    const order = req.query.order === 'desc' ? -1 : 1;
    const users = await User.find().sort({ firstName: order });
    res.status(200).json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Search users by firstName and/or lastName
app.get('/api/users/search', async (req, res) => {
  try {
    const { firstName, lastName } = req.query;
    const query = {};
    if (firstName) query.firstName = { $regex: firstName, $options: 'i' };
    if (lastName)  query.lastName  = { $regex: lastName,  $options: 'i' };
    const users = await User.find(query);
    res.status(200).json(users);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));