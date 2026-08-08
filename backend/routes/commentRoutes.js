const express = require('express');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Add comment
router.post('/:postId', protect, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    const comment = await Comment.create({
      post: post._id,
      user: req.user._id,
      text: req.body.text
    });
    post.comments.push(comment._id);
    await post.save();
    await comment.populate('user', 'username profilePic');
    if (post.user.toString() !== req.user._id.toString()) {
      await Notification.create({
        user: post.user,
        fromUser: req.user._id,
        type: 'comment',
        post: post._id
      });
    }
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Delete comment
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await comment.remove();
    await Post.updateOne({ _id: comment.post }, { $pull: { comments: comment._id } });
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
