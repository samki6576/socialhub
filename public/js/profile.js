const params = new URLSearchParams(window.location.search);
const username = params.get('username') || '';

async function loadProfile() {
  const ok = await checkAuth();
  if (!ok) return;
  let targetUsername = username;
  if (!targetUsername) {
    const me = await fetch(`${API}/auth/me`, { headers: headers() });
    const data = await me.json();
    targetUsername = data.username;
    window.history.pushState({}, '', `/profile.html?username=${targetUsername}`);
  }
  try {
    const res = await fetch(`${API}/users/${targetUsername}`, { headers: headers() });
    if (!res.ok) throw new Error('User not found');
    const user = await res.json();
    renderProfile(user);
  } catch (err) {
    showToast('❌ ' + err.message);
  }
}

function renderProfile(user) {
  document.getElementById('profileUsername').textContent = user.username;
  document.getElementById('profileBio').textContent = user.bio || 'No bio yet.';
  document.getElementById('profilePic').src = user.profilePic || 'https://via.placeholder.com/150';
  document.getElementById('followStats').textContent = `${user.followers.length} followers · ${user.following.length} following`;

  const followBtn = document.getElementById('followBtn');
  const editBtn = document.getElementById('editProfileBtn');
  if (user._id !== currentUser._id) {
    followBtn.classList.remove('hidden');
    editBtn.classList.add('hidden');
    const isFollowing = user.followers.some(f => f._id === currentUser._id);
    followBtn.textContent = isFollowing ? 'Unfollow' : 'Follow';
    followBtn.onclick = async () => {
      try {
        const res = await fetch(`${API}/users/${user._id}/follow`, {
          method: 'PUT',
          headers: headers()
        });
        if (!res.ok) throw new Error('Action failed');
        const data = await res.json();
        followBtn.textContent = data.following ? 'Unfollow' : 'Follow';
        loadProfile();
      } catch (err) {
        showToast('❌ ' + err.message);
      }
    };
  } else {
    followBtn.classList.add('hidden');
    editBtn.classList.remove('hidden');
    editBtn.onclick = () => openEditModal(user);
  }

  loadUserPosts(user._id);
}

async function loadUserPosts(userId) {
  try {
    const res = await fetch(`${API}/posts/feed`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to load posts');
    const allPosts = await res.json();
    const userPosts = allPosts.filter(p => p.user._id === userId);
    const container = document.getElementById('userPosts');
    if (!userPosts.length) {
      container.innerHTML = '<p class="text-gray-500">No posts yet.</p>';
      return;
    }
    let html = '';
    userPosts.forEach(post => {
      html += `
        <div class="bg-gray-50 rounded p-3">
          <p>${post.content}</p>
          ${post.image ? `<img src="${post.image}" class="w-full rounded max-h-40 object-cover mt-2">` : ''}
          <div class="text-sm text-gray-500 mt-1">❤️ ${post.likes.length} · 💬 ${post.comments?.length || 0}</div>
        </div>
      `;
    });
    container.innerHTML = html;
  } catch (err) {
    // silent
  }
}

function openEditModal(user) {
  document.getElementById('editModal').classList.remove('hidden');
  document.getElementById('editBio').value = user.bio || '';
  document.getElementById('editProfilePic').value = '';
}

document.getElementById('editProfileForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const bio = document.getElementById('editBio').value.trim();
  const fileInput = document.getElementById('editProfilePic');
  const file = fileInput.files[0];
  let profilePic = '';
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    const uploadRes = await fetch(`${API}/upload`, {
      method: 'POST',
      body: formData
    });
    if (!uploadRes.ok) throw new Error('Upload failed');
    const uploadData = await uploadRes.json();
    profilePic = uploadData.url;
  }
  try {
    const res = await fetch(`${API}/users/update`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({ bio, profilePic })
    });
    if (!res.ok) throw new Error('Update failed');
    document.getElementById('editModal').classList.add('hidden');
    loadProfile();
    showToast('Profile updated!');
  } catch (err) {
    showToast('❌ ' + err.message);
  }
});

document.addEventListener('DOMContentLoaded', loadProfile);
