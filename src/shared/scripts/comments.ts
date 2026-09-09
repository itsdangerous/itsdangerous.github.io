interface Comment {
  id: string; page: string; parentId: string | null; nickname: string | null; body: string | null; visibility: 'public' | 'private'; version: number;
  createdAt: string; updatedAt: string; likes: number; liked: boolean | number;
}
interface CommentList { items: Comment[]; total: number; next: string | null }

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const visitorKey = 'itsdangerous-comment-visitor';
let memoryVisitor: string | undefined;
function getVisitor() {
  if (memoryVisitor) return memoryVisitor;
  try {
    const stored = localStorage.getItem(visitorKey);
    memoryVisitor = stored && /^[0-9a-f-]{36}$/i.test(stored) ? stored : crypto.randomUUID();
    localStorage.setItem(visitorKey, memoryVisitor);
  } catch { memoryVisitor = crypto.randomUUID(); }
  return memoryVisitor;
}

export function initializeComments() {
  document.querySelectorAll<HTMLElement>('[data-comments]').forEach(root => {
    if (root.dataset.bound) return;
    root.dataset.bound = 'true';
    const api = root.dataset.api!.replace(/\/$/, '');
    const page = root.dataset.page!;
    const list = root.querySelector<HTMLElement>('[data-list]')!;
    const listStatus = root.querySelector<HTMLElement>('[data-list-status]')!;
    const compose = root.querySelector<HTMLFormElement>('[data-compose]')!;
    const composeStatus = root.querySelector<HTMLElement>('[data-compose-status]')!;
    const more = root.querySelector<HTMLButtonElement>('[data-more]')!;
    const reload = root.querySelector<HTMLButtonElement>('[data-reload]')!;
    let next: string | null = null;
    let loading = false;
    const items = new Map<string, Comment>();
    const message = (target: HTMLElement, text: string, failed = false) => { target.textContent = text; target.dataset.error = String(failed); };
    async function request<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 15_000);
      try {
        const response = await fetch(`${api}/api/comments${path}`, {
          method, mode: 'cors', credentials: 'omit', signal: controller.signal,
          headers: { 'X-Comment-Visitor': getVisitor(), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
          ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error?.message || '요청을 처리하지 못했습니다.');
        return result;
      } catch (cause) {
        if (cause instanceof Error && cause.name === 'AbortError') throw new Error('응답이 늦어지고 있습니다. 새로고침으로 반영 여부를 확인해 주세요.');
        if (cause instanceof TypeError) throw new Error('댓글 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        throw cause;
      } finally { window.clearTimeout(timer); }
    }
    function entry(item: Comment) {
      const node = document.createElement('article');
      node.className = 'comment-entry'; node.dataset.commentId = item.id;
      const date = new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(item.createdAt));
      const privateComment = item.visibility === 'private' && !item.body;
      node.innerHTML = `<div class="comment-meta"><strong>${privateComment ? '비공개' : escapeHtml(item.nickname ?? '')}</strong><time datetime="${escapeHtml(item.createdAt)}">${escapeHtml(date)}${item.version > 1 ? ' · 수정됨' : ''}</time></div>
        <p class="comment-text${privateComment ? ' comment-text--private' : ''}">${privateComment ? '🔒 비공개 댓글입니다.' : escapeHtml(item.body ?? '')}</p>
        <div class="comment-actions"><button class="comment-like" type="button" data-action="like" aria-pressed="${Boolean(item.liked)}" aria-label="좋아요 ${item.likes}개${item.liked ? ', 취소하기' : ''}"><span aria-hidden="true">${item.liked ? '♥' : '♡'}</span> 좋아요 <b>${item.likes}</b></button>${privateComment ? '<button type="button" data-action="reveal">내용 보기</button>' : ''}${!item.parentId ? '<button type="button" data-action="reply">답글</button>' : ''}<button type="button" data-action="edit">수정</button><button type="button" data-action="delete">삭제</button></div><p class="comment-status" data-entry-status role="status"></p><div class="comment-replies" data-replies></div>`;
      return node;
    }
    function render(itemsToRender: Comment[]) {
      for (const item of itemsToRender.filter(item => !item.parentId)) {
        if (items.has(item.id)) continue;
        items.set(item.id, item); list.append(entry(item));
      }
      for (const item of itemsToRender.filter(item => item.parentId)) {
        if (items.has(item.id)) continue;
        items.set(item.id, item);
        list.querySelector<HTMLElement>(`[data-comment-id="${item.parentId}"] [data-replies]`)?.append(entry(item));
      }
    }
    async function load(append = false) {
      if (loading) return;
      loading = true; more.disabled = true; reload.disabled = true;
      message(listStatus, '댓글을 불러오고 있습니다.');
      try {
        const result = await request<CommentList>(`?page=${encodeURIComponent(page)}${append && next ? `&after=${next}` : ''}`);
        if (!append) { items.clear(); list.replaceChildren(); }
        render(result.items);
        next = result.next; more.hidden = !next;
        root.querySelector('[data-count]')!.textContent = result.total ? String(result.total) : '';
        root.querySelector('[data-total]')!.textContent = `(${result.total})`;
        message(listStatus, result.total ? '' : '아직 남겨진 이야기가 없습니다. 첫 이야기를 들려주세요.');
      } catch (cause) { message(listStatus, (cause as Error).message, true); }
      finally { loading = false; more.disabled = false; reload.disabled = false; }
    }
    compose.addEventListener('submit', async event => {
      event.preventDefault();
      const submit = compose.querySelector<HTMLButtonElement>('[type=submit]')!;
      if (submit.disabled) return;
      const data = Object.fromEntries(new FormData(compose));
      submit.disabled = true; message(composeStatus, '이야기를 남기고 있습니다.');
      try {
        await request('', 'POST', { ...data, page });
        (compose.elements.namedItem('body') as HTMLTextAreaElement).value = '';
        (compose.elements.namedItem('password') as HTMLInputElement).value = '';
        message(composeStatus, '댓글을 남겼습니다.');
        await load();
      } catch (cause) { message(composeStatus, (cause as Error).message, true); }
      finally { submit.disabled = false; }
    });
    list.addEventListener('click', async event => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
      const node = button?.closest<HTMLElement>('[data-comment-id]');
      if (!button || !node || button.disabled) return;
      const item = items.get(node.dataset.commentId!)!;
      const action = button.dataset.action;
      if (action === 'like') {
        button.disabled = true;
        const status = node.querySelector<HTMLElement>('[data-entry-status]')!;
        try {
          const result = await request<Comment>(`/${item.id}/like`, 'PUT', { liked: !item.liked });
          items.set(item.id, result);
          const replacement = entry(result).querySelector<HTMLButtonElement>('[data-action=like]')!;
          button.replaceWith(replacement); replacement.focus({ preventScroll: true });
          message(status, '');
        } catch (cause) { message(status, (cause as Error).message, true); button.disabled = false; }
        return;
      }
      if (action === 'reveal') {
        list.querySelectorAll('.comment-editor').forEach(editor => editor.remove());
        const form = document.createElement('form'); form.className = 'comment-editor editorial-surface';
        form.innerHTML = '<label>댓글 비밀번호<input name="password" type="password" required minlength="4" maxlength="128" autocomplete="off" placeholder="작성할 때 정한 비밀번호"></label><p class="comment-status" role="status"></p><div class="comment-actions"><button type="button" data-cancel>취소</button><button class="comment-submit" type="submit">내용 보기</button></div>';
        node.append(form); form.querySelector<HTMLInputElement>('[name=password]')!.focus({ preventScroll: true });
        form.querySelector('[data-cancel]')!.addEventListener('click', () => form.remove());
        form.addEventListener('submit', async event => {
          event.preventDefault(); const submit = form.querySelector<HTMLButtonElement>('[type=submit]')!; submit.disabled = true;
          const status = form.querySelector<HTMLElement>('[role=status]')!;
          try {
            const data = Object.fromEntries(new FormData(form));
            const revealed = await request<Pick<Comment, 'id' | 'nickname' | 'body' | 'visibility' | 'version'>>(`/${item.id}/reveal`, 'POST', data);
            const visible = { ...item, ...revealed }; items.set(item.id, visible);
            const replacement = entry(visible);
            const replies = node.querySelector('[data-replies]');
            if (replies) replacement.querySelector('[data-replies]')!.replaceWith(replies);
            node.replaceWith(replacement);
          } catch (cause) { message(status, (cause as Error).message, true); submit.disabled = false; }
        });
        return;
      }
      if (action === 'reply') {
        list.querySelectorAll('.comment-editor').forEach(editor => editor.remove());
        const form = document.createElement('form'); form.className = 'comment-editor editorial-surface'; form.setAttribute('aria-label', '답글 작성');
        form.innerHTML = '<div class="comment-fields"><label>닉네임<input name="nickname" required maxlength="30" autocomplete="nickname"></label><label>비밀번호<input name="password" type="password" required minlength="4" maxlength="128" autocomplete="new-password"></label></div><fieldset class="comment-visibility"><legend>공개 범위</legend><label><input name="visibility" type="radio" value="public" checked> 공개</label><label><input name="visibility" type="radio" value="private"> 비공개</label></fieldset><label>답글<textarea name="body" required maxlength="3000" rows="3"></textarea></label><p class="comment-status" role="status"></p><div class="comment-actions"><button type="button" data-cancel>취소</button><button class="comment-submit" type="submit">답글 남기기</button></div>';
        node.append(form); form.querySelector<HTMLInputElement>('[name=nickname]')!.focus({ preventScroll: true });
        form.querySelector('[data-cancel]')!.addEventListener('click', () => form.remove());
        form.addEventListener('submit', async event => {
          event.preventDefault(); const submit = form.querySelector<HTMLButtonElement>('[type=submit]')!; submit.disabled = true;
          const status = form.querySelector<HTMLElement>('[role=status]')!;
          try {
            const data = Object.fromEntries(new FormData(form));
            await request('', 'POST', { ...data, page, parentId: item.id }); form.remove(); await load();
          } catch (cause) { message(status, (cause as Error).message, true); submit.disabled = false; }
        });
        return;
      }
      // Keep one inline editor open; passwords live only in the active form.
      list.querySelectorAll('.comment-editor').forEach(editor => editor.remove());
      const form = document.createElement('form'); form.className = 'comment-editor editorial-surface';
      form.setAttribute('aria-label', action === 'edit' ? '댓글 수정' : '댓글 삭제');
      form.innerHTML = `${action === 'edit' ? `<label>닉네임<input name="nickname" required maxlength="30" value="${escapeHtml(item.nickname ?? '')}"></label><label>댓글<textarea name="body" required maxlength="3000" rows="4">${escapeHtml(item.body ?? '')}</textarea></label>` : '<p>이 댓글을 삭제할까요? 삭제한 댓글은 복구할 수 없습니다.</p>'}
        <label>댓글 비밀번호<input name="password" type="password" required minlength="4" maxlength="128" autocomplete="off" placeholder="작성할 때 정한 비밀번호"></label>
        <p class="comment-status" role="status"></p><div class="comment-actions"><button type="button" data-cancel>취소</button><button class="comment-submit" type="submit">${action === 'edit' ? '수정 저장' : '댓글 삭제'}</button></div>`;
      node.append(form);
      const close = () => { form.remove(); button.focus({ preventScroll: true }); };
      form.querySelector('[data-cancel]')!.addEventListener('click', close);
      form.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
      form.querySelector<HTMLInputElement>('[name=password]')!.focus({ preventScroll: true });
      form.addEventListener('submit', async event => {
        event.preventDefault();
        const submit = form.querySelector<HTMLButtonElement>('[type=submit]')!;
        if (submit.disabled) return;
        submit.disabled = true;
        const status = form.querySelector<HTMLElement>('[role=status]')!;
        const data = Object.fromEntries(new FormData(form));
        message(status, '처리 중입니다.');
        try {
          await request(`/${item.id}`, action === 'edit' ? 'PATCH' : 'DELETE', { ...data, version: item.version });
          form.remove();
          message(composeStatus, action === 'edit' ? '댓글을 수정했습니다.' : '댓글을 삭제했습니다.');
          await load(); reload.focus({ preventScroll: true });
        } catch (cause) { message(status, (cause as Error).message, true); submit.disabled = false; }
      });
    });
    more.addEventListener('click', () => void load(true));
    reload.addEventListener('click', () => void load());
    void load();
  });
}
