function formatContent(text) {
  return text.replace(/#[\w\u0590-\u05fe]+/g, function(match) {
    const tag = match.slice(1);
    return `<a href="/explore.html?tag=${tag}" class="text-blue-500 hover:underline">${match}</a>`;
  });
}

async function loadFeed() {
  const ok = await checkAuth();
  if (!ok) return;
  try {
    const res = await fetch(`${API}/posts/feed`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to load feed');
    const posts = await res.json();
    renderFeed(posts);
  } catch (err) {
    showToast('❌ ' + err.message);
  }
}

function renderFeed(posts) {
  const feed = document.getElementById('feed');
  if (!feed) return;
  if (!posts.length) {
    feed.innerHTML = '<p class="text-gray-500 text-center">No posts yet. Follow someone or create a post!</p>';
    return;
  }
  let html = '';
  posts.forEach(post => {
    const isLiked = post.likes.includes(currentUser._id);
    const likeCount = post.likes.length;
    let mediaHtml = '';
    if (post.image) {
      if (post.image.match(/\.(mp4|webm|ogg|mov)$/i)) {
        mediaHtml = `<video src="${post.image}" controls class="w-full rounded mb-2 max-h-96"></video>`;
      } else {
        mediaHtml = `<img src="${post.image}" alt="post image" class="w-full rounded mb-2 max-h-96 object-cover">`;
      }
    }
    html += `
      <div class="post-card bg-white rounded shadow p-4">
        <div class="flex items-center gap-2 mb-2">
          <img src="${post.user.profilePic}" alt="${post.user.username}" class="w-8 h-8 rounded-full object-cover">
          <a href="/profile.html?username=${post.user.username}" class="font-semibold hover:underline">${post.user.username}</a>
          <span class="text-xs text-gray-400">${new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        <p class="mb-2">${formatContent(post.content)}</p>
        ${mediaHtml}
        <div class="flex items-center gap-4 text-sm">
          <button class="like-btn ${isLiked ? 'liked' : ''}" data-post="${post._id}">
            ${isLiked ? '❤️' : '🤍'} <span class="like-count">${likeCount}</span>
          </button>
          <button class="comment-toggle" data-post="${post._id}">💬 ${post.comments?.length || 0}</button>
        </div>
        <div id="comments-${post._id}" class="mt-3 border-t pt-3 hidden">
          <div class="comments-list space-y-2"></div>
          <div class="mt-2 flex gap-2">
            <input type="text" placeholder="Write a comment..." class="flex-1 p-2 border rounded text-sm comment-input" data-post="${post._id}">
            <button class="comment-submit bg-blue-600 text-white px-3 py-1 rounded text-sm" data-post="${post._id}">Post</button>
          </div>
        </div>
      </div>
    `;
  });
  feed.innerHTML = html;

  document.querySelectorAll('.like-btn').forEach(btn => {
    btn.addEventListener('click', async function() {
      const postId = this.dataset.post;
      try {
        const res = await fetch(`${API}/posts/${postId}/like`, {
          method: 'PUT',
          headers: headers()
        });
        if (!res.ok) throw new Error('Like failed');
        const data = await res.json();
        const countSpan = this.querySelector('.like-count');
        countSpan.textContent = data.likes;
        this.classList.toggle('liked');
        this.innerHTML = this.classList.contains('liked') ? '❤️ <span class="like-count">' + data.likes + '</span>' : '🤍 <span class="like-count">' + data.likes + '</span>';
      } catch (err) {
        showToast('❌ ' + err.message);
      }
    });
  });

  document.querySelectorAll('.comment-toggle').forEach(btn => {
    btn.addEventListener('click', function() {
      const postId = this.dataset.post;
      const section = document.getElementById(`comments-${postId}`);
      section.classList.toggle('hidden');
      if (!section.classList.contains('hidden')) {
        loadComments(postId);
      }
    });
  });

  document.querySelectorAll('.comment-submit').forEach(btn => {
    btn.addEventListener('click', async function() {
      const postId = this.dataset.post;
      const input = document.querySelector(`.comment-input[data-post="${postId}"]`);
      const text = input.value.trim();
      if (!text) return;
      try {
        const res = await fetch(`${API}/comments/${postId}`, {
          method: 'POST',
          headers: headers(),
          body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error('Comment failed');
        const comment = await res.json();
        input.value = '';
        loadComments(postId);
      } catch (err) {
        showToast('❌ ' + err.message);
      }
    });
  });
}

async function loadComments(postId) {
  try {
    const res = await fetch(`${API}/posts/${postId}`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to load comments');
    const post = await res.json();
    const container = document.querySelector(`#comments-${postId} .comments-list`);
    if (!container) return;
    if (!post.comments || !post.comments.length) {
      container.innerHTML = '<p class="text-gray-500 text-sm">No comments yet.</p>';
      return;
    }
    let html = '';
    post.comments.forEach(c => {
      html += `
        <div class="flex items-start gap-2 text-sm">
          <img src="${c.user.profilePic}" class="w-6 h-6 rounded-full object-cover">
          <div>
            <span class="font-semibold">${c.user.username}</span>
            <span class="text-gray-700">${c.text}</span>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (err) {
    // silent
  }
}

// Create post with file upload
document.getElementById('createPostBtn')?.addEventListener('click', async () => {
  const content = document.getElementById('postContent').value.trim();
  const fileInput = document.getElementById('postFile');
  const file = fileInput?.files[0];

  if (!content) {
    showToast('Please write something');
    return;
  }

  try {
    let imageUrl = '';
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch(`${API}/upload`, {
        method: 'POST',
        body: formData
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      imageUrl = uploadData.url;
    }

    const res = await fetch(`${API}/posts`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ content, image: imageUrl })
    });
    if (!res.ok) throw new Error('Failed to create post');
    const newPost = await res.json();
    document.getElementById('postContent').value = '';
    if (fileInput) fileInput.value = '';
    loadFeed();
    showToast('✅ Post created!');
  } catch (err) {
    showToast('❌ ' + err.message);
  }
});

async function loadSuggestions() {
  try {
    const res = await fetch(`${API}/users/suggestions`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to load suggestions');
    const users = await res.json();
    const list = document.getElementById('suggestionList');
    if (!list) return;
    if (!users.length) {
      list.innerHTML = '<p class="text-sm text-gray-500">No suggestions</p>';
      return;
    }
    let html = '';
    users.forEach(u => {
      html += `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <img src="${u.profilePic}" class="w-8 h-8 rounded-full object-cover">
            <a href="/profile.html?username=${u.username}" class="text-sm font-semibold hover:underline">${u.username}</a>
          </div>
          <button class="follow-suggestion text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700" data-id="${u._id}">Follow</button>
        </div>
      `;
    });
    list.innerHTML = html;
    document.querySelectorAll('.follow-suggestion').forEach(btn => {
      btn.addEventListener('click', async function() {
        const userId = this.dataset.id;
        try {
          const res = await fetch(`${API}/users/${userId}/follow`, {
            method: 'PUT',
            headers: headers()
          });
          if (!res.ok) throw new Error('Action failed');
          this.textContent = 'Following';
          this.disabled = true;
          showToast('Followed!');
        } catch (err) {
          showToast('❌ ' + err.message);
        }
      });
    });
  } catch (err) {
    // silent
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadFeed();
  loadSuggestions();
});
