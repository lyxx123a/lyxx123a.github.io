(() => {
  const API_URL = 'https://memos.logsth.com/api/v1/memos';
  const container = document.querySelector('#memos-talk');
  const moreButton = document.querySelector('#memos-more');

  let nextPageToken = '';

  function escapeAttribute(value = '') {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('"', '&quot;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');
  }

  function formatTime(value) {
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(value));
  }

  function renderMemo(memo) {
    const memoId = memo.name.split('/').pop();

    const content = DOMPurify.sanitize(
      marked.parse(memo.content || '')
    );

    const tags = (memo.tags || [])
      .map(tag => `<span class="memo-tag">#${escapeAttribute(tag)}</span>`)
      .join('');

    return `
      <article class="memo-card" data-memo-id="${escapeAttribute(memoId)}">
        <div class="memo-content">${content}</div>

        ${tags ? `<div class="memo-tags">${tags}</div>` : ''}

        <footer class="memo-footer">
          <time datetime="${escapeAttribute(memo.createTime)}">
            ${formatTime(memo.createTime)}
          </time>

          <button class="memo-comment-button" type="button">
            查看评论
          </button>
        </footer>
      </article>
    `;
  }

  async function loadMemos(append = false) {
    moreButton.disabled = true;

    const params = new URLSearchParams({
      pageSize: '10',
      orderBy: 'create_time desc',
      filter: 'visibility == "PUBLIC"'
    });

    if (nextPageToken) {
      params.set('pageToken', nextPageToken);
    }

    try {
      const response = await fetch(`${API_URL}?${params}`);

      if (!response.ok) {
        throw new Error(`请求失败：HTTP ${response.status}`);
      }

      const data = await response.json();
      const html = (data.memos || []).map(renderMemo).join('');

      if (append) {
        container.insertAdjacentHTML('beforeend', html);
      } else {
        container.innerHTML = html || '<p class="memos-empty">还没有公开说说。</p>';
      }

      nextPageToken = data.nextPageToken || '';
      moreButton.hidden = !nextPageToken;
    } catch (error) {
      console.error(error);
      container.innerHTML = `
        <div class="memos-error">
          说说加载失败，请稍后重试。
        </div>
      `;
    } finally {
      moreButton.disabled = false;
    }
  }

  moreButton.addEventListener('click', () => loadMemos(true));

  loadMemos();
})();