async function loadNotifications() {
  const ok = await checkAuth();
  if (!ok) return;
  try {
    const res = await fetch(`${API}/notifications`, { headers: headers() });
    if (!res.ok) throw new Error('Failed to load notifications');
    const notifs = await res.json();
    renderNotifications(notifs);
  } catch (err) {
    showToast('❌ ' + err.message);
  }
}

function renderNotifications(notifs) {
  const container = document.getElementById('notificationsList');
  if (!container) return;
  if (!notifs.length) {
    container.innerHTML = '<p class="text-gray-500">No notifications yet.</p>';
    return;
  }
  let html = '';
  notifs.forEach(n => {
    const readClass = n.read ? 'opacity-60' : '';
    html += `
      <div class="bg-white rounded shadow p-3 ${readClass}">
        <div class="flex items-center gap-3">
          <img src="${n.fromUser.profilePic}" class="w-8 h-8 rounded-full object-cover">
          <div>
            <span class="font-semibold">${n.fromUser.username}</span>
            ${n.type === 'like' ? 'liked your post' : n.type === 'comment' ? 'commented on your post' : 'started following you'}
            ${n.post ? `: "${n.post.content.slice(0, 30)}..."` : ''}
            <span class="text-xs text-gray-400 block">${new Date(n.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', loadNotifications);
