function formatContent(text) {
  return text.replace(/#[\w\u0590-\u05fe]+/g, function(match) {
    const tag = match.slice(1);
    return `<a href="/explore.html?tag=${tag}" class="text-blue-500 hover:underline">${match}</a>`;
  });
}

async function loadExplore() {
  const ok = await checkAuth();
  if (!ok) return;
  try {
    console.log('📡 Fetching explore posts...');
    const res = await fetch(`${API}/posts/explore`, { headers: headers() });
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Explore fetch error:', res.status, errorText);
      throw new Error(`Server returned ${res.status}: ${errorText.slice(0, 100)}`);
    }
    const posts = await res.json();
    console.log(`✅ Received ${posts.length} explore posts.`);
    renderExplorePosts(posts);
  } catch (err) {
    console.error('❌ Explore load error:', err);
    showToast('❌ Failed to load explore: ' + err.message);
    document.getElementById('exploreFeed').innerHTML = `<p class="text-center text-gray-500">Unable to load explore. Please try again later.</p>`;
  }
}

function renderExplorePosts(posts) {
  const container = document.getElementById('exploreFeed');
  if (!container) return;
  if (!posts || posts.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center">No posts to explore yet. Be the first to post!</p>';
    return;
  }
  let html = '';
  posts.forEach(post => {
    const mediaHtml = post.image ? (
      post.image.match(/\.(mp4|webm|ogg|mov)$/i) ?
        `<video src="${post.image}" controls class="w-full rounded mb-2 max-h-96"></video>` :
        `<img src="${post.image}" alt="post image" class="w-full rounded mb-2 max-h-96 object-cover">`
    ) : '';
    html += `
      <div class="bg-white rounded shadow p-4">
        <div class="flex items-center gap-2 mb-2">
          <img src="${post.user.profilePic}" class="w-8 h-8 rounded-full object-cover">
          <a href="/profile.html?username=${post.user.username}" class="font-semibold hover:underline">${post.user.username}</a>
          <span class="text-xs text-gray-400">${new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        <p class="mb-2">${formatContent(post.content)}</p>
        ${mediaHtml}
        <div class="text-sm text-gray-500">❤️ ${post.likes.length} · 💬 ${post.comments?.length || 0}</div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// Handle hashtag query from URL
const urlParams = new URLSearchParams(window.location.search);
const tag = urlParams.get('tag');
if (tag) {
  async function loadHashtag() {
    try {
      const res = await fetch(`${API}/posts/hashtag/${tag}`, { headers: headers() });
      if (!res.ok) throw new Error('Failed to load hashtag');
      const posts = await res.json();
      renderExplorePosts(posts);
    } catch (err) {
      showToast('❌ ' + err.message);
    }
  }
  document.addEventListener('DOMContentLoaded', loadHashtag);
} else {
  document.addEventListener('DOMContentLoaded', loadExplore);
}
