const express = require('express');
const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const router = express.Router();

function extractHashtags(text) {
  return text.match(/#[\w\u0590-\u05fe]+/g) || [];
}

// Feed – posts from followed users + own
router.get('/feed', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const following = user.following || [];
    const posts = await Post.find({ user: { $in: [...following, req.user._id] } })
      .populate('user', 'username profilePic')
      .populate('comments')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Explore – all posts (latest first)
router.get('/explore', protect, async (req, res) => {
  try {
    console.log('📡 Fetching explore posts...');
    const posts = await Post.find({})
      .populate('user', 'username profilePic')
      .populate('comments')
      .sort({ createdAt: -1 })
      .limit(20);
    console.log(`✅ Found ${posts.length} posts for explore.`);
    res.json(posts);
  } catch (err) {
    console.error('❌ Explore error:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Hashtag filter
router.get('/hashtag/:tag', protect, async (req, res) => {
  try {
    const tag = '#' + req.params.tag;
    const posts = await Post.find({ hashtags: tag })
      .populate('user', 'username profilePic')
      .populate('comments')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create post
router.post('/', protect, async (req, res) => {
  try {
    const { content, image } = req.body;
    const hashtags = extractHashtags(content);
    const post = await Post.create({
      user: req.user._id,
      content,
      image,
      hashtags
    });
    await post.populate('user', 'username profilePic');
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like / unlike
router.put('/:id/like', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const index = post.likes.indexOf(req.user._id);
    let liked = false;
    if (index > -1) {
      post.likes.splice(index, 1);
      liked = false;
    } else {
      post.likes.push(req.user._id);
      liked = true;
      if (post.user.toString() !== req.user._id.toString()) {
        await Notification.create({
          user: post.user,
          fromUser: req.user._id,
          type: 'like',
          post: post._id
        });
      }
    }
    await post.save();
    res.json({ likes: post.likes.length, liked });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('user', 'username profilePic')
      .populate({ path: 'comments', populate: { path: 'user', select: 'username profilePic' } });
    if (!post) return res.status(404).json({ message: 'Post not found' });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
