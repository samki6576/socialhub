const express = require('express');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Get user profile
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('followers', 'username profilePic')
      .populate('following', 'username profilePic');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Follow / unfollow
router.put('/:id/follow', protect, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: 'User not found' });
    if (target._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }
    const me = await User.findById(req.user._id);
    const isFollowing = me.following.includes(target._id);
    if (isFollowing) {
      me.following.pull(target._id);
      target.followers.pull(req.user._id);
    } else {
      me.following.push(target._id);
      target.followers.push(req.user._id);
      await Notification.create({
        user: target._id,
        fromUser: req.user._id,
        type: 'follow'
      });
    }
    await me.save();
    await target.save();
    res.json({ following: !isFollowing });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update profile
router.put('/update', protect, async (req, res) => {
  try {
    const { bio, profilePic } = req.body;
    const user = await User.findById(req.user._id);
    if (bio !== undefined) user.bio = bio;
    if (profilePic) user.profilePic = profilePic;
    await user.save();
    res.json({ user: { username: user.username, bio: user.bio, profilePic: user.profilePic } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Follow suggestions – this endpoint is mounted at /api/users/suggestions
router.get('/suggestions', protect, async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const following = me.following.map(id => id.toString());
    const suggestions = await User.find({
      _id: { $ne: req.user._id, $nin: following }
    })
    .select('username profilePic')
    .limit(5);
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
