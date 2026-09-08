import { api } from './api';
import type { Post, ReportResponse } from './contracts';
import './styles.css';

const app = document.querySelector<HTMLDivElement>('#app')!;
let csrfToken = '';
let activePost: Post | undefined;

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
const today = new Date().toISOString().slice(0, 10);
const monthAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);

function shell(content: string) {
  app.innerHTML = `<main class="admin-shell"><header><a href="/" class="brand">itsdangerous · 서재 관리</a><nav><button data-view="analytics">통계</button><button data-view="posts">글 관리</button><button data-view="editor">새 글</button><button id="logout">로그아웃</button></nav></header><section id="content">${content}</section></main>`;
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button => button.onclick = () => renderView(button.dataset.view!));
  document.querySelector<HTMLButtonElement>('#logout')!.onclick = async () => { await api.logout(csrfToken); location.reload(); };
}

async function renderPosts() {
  const result = await api.posts();
  shell(`<div class="page-heading"><div><p class="eyebrow">MANUSCRIPTS</p><h1>글 관리</h1></div><button class="primary" data-view="editor">새 글 쓰기</button></div><div class="post-list">${result.items.map(post => `<button class="post-row" data-post="${escape(post.id)}"><span><strong>${escape(post.title)}</strong><small>${escape(post.category)} · ${escape(post.updatedAt.slice(0, 10))}</small></span><em class="status ${post.status}">${post.status === 'draft' ? '초안' : post.status === 'published_with_draft' ? '공개 · 수정본' : '공개'}</em></button>`).join('') || '<p class="empty">아직 관리할 글이 없습니다.</p>'}</div>`);
  document.querySelectorAll<HTMLButtonElement>('[data-post]').forEach(button => button.onclick = async () => renderEditor(await api.post(button.dataset.post!)));
  document.querySelector<HTMLButtonElement>('[data-view="editor"]')!.onclick = () => renderEditor();
}

async function renderAnalytics() {
  const reports = await Promise.allSettled(['overview', 'trend', 'posts', 'sources', 'countries', 'devices'].map(name => api.report(name, monthAgo, today)));
  const overview = reports[0].status === 'fulfilled' ? reports[0].value : undefined;
  const cards = ['totalUsers', 'screenPageViews', 'sessions'].map(key => `<article class="metric"><span>${key === 'totalUsers' ? '방문자' : key === 'screenPageViews' ? '페이지뷰' : '세션'}</span><strong>${overview?.totals[key] ?? '—'}</strong></article>`).join('');
  shell(`<div class="page-heading"><div><p class="eyebrow">OBSERVATORY</p><h1>사이트 통계</h1><p class="muted">${monthAgo} — ${today} · GA4 및 Search Console</p></div></div><div class="metrics">${cards}</div><div class="report-grid">${reports.map((result, index) => { const name = ['요약', '일별 추이', '인기 글', '유입 경로', '국가', '기기'][index]; if (result.status === 'rejected') return `<article class="panel"><h2>${name}</h2><p class="muted">통계를 불러오지 못했습니다.</p></article>`; return reportPanel(name, result.value); }).join('')}</div>`);
}

function reportPanel(title: string, report: ReportResponse) { return `<article class="panel"><div class="panel-heading"><h2>${title}</h2><span class="source ${report.status}">${report.status === 'ok' ? '연결됨' : report.status === 'unconfigured' ? '설정 필요' : '조회 불가'}</span></div>${report.rows.length ? `<table><tbody>${report.rows.slice(0, 8).map(row => `<tr>${Object.values(row).map(value => `<td>${escape(String(value))}</td>`).join('')}</tr>`).join('')}</tbody></table>` : `<p class="muted">${report.warnings[0] ?? '수집된 데이터가 없습니다.'}</p>`}</article>`; }

function renderEditor(post?: Post) {
  activePost = post;
  const value: Post = post ?? { id: '', slug: '', title: '', description: '', pubDate: today, category: 'Study', tags: [], body: '', version: 0, desiredVisibility: 'draft', status: 'draft', updatedAt: new Date().toISOString() };
  shell(`<div class="page-heading"><div><p class="eyebrow">WRITING DESK</p><h1>${post ? '글 수정' : '새 글'}</h1></div><span id="save-status" class="muted">저장되지 않음</span></div><form id="editor-form" class="editor"><label>제목<input name="title" required value="${escape(value.title)}"></label><label>설명<input name="description" value="${escape(value.description)}"></label><div class="form-row"><label>발행일<input name="pubDate" type="date" value="${value.pubDate.slice(0, 10)}"></label><label>카테고리<select name="category">${['Git','일상','project','Study','MacOS','Algorithm','uncategorized'].map(category => `<option ${category === value.category ? 'selected' : ''}>${category}</option>`).join('')}</select></label></div><label>태그<input name="tags" value="${escape(value.tags.join(', '))}" placeholder="쉼표로 구분"></label><label>본문 <textarea name="body" required>${escape(value.body)}</textarea></label><div class="editor-actions"><button type="button" id="back">목록</button><button type="submit" class="primary">저장</button><button type="button" id="publish" class="accent">${value.status === 'published' ? '초안으로 전환' : '발행'}</button></div></form><div class="preview"><p class="eyebrow">PREVIEW</p><div id="preview-body" class="preview-body"></div></div>`);
  const form = document.querySelector<HTMLFormElement>('#editor-form')!;
  const body = form.elements.namedItem('body') as HTMLTextAreaElement;
  const preview = () => { document.querySelector('#preview-body')!.innerHTML = escape(body.value).replace(/\n/g, '<br>'); };
  let saveTimer: number | undefined;
  body.oninput = () => { preview(); window.clearTimeout(saveTimer); saveTimer = window.setTimeout(() => saveForm(form), 2000); };
  form.querySelectorAll('input, select').forEach(field => field.addEventListener('input', () => { window.clearTimeout(saveTimer); saveTimer = window.setTimeout(() => saveForm(form), 2000); })); preview();
  document.querySelector('#back')!.addEventListener('click', renderPosts);
  form.onsubmit = async event => { event.preventDefault(); await saveForm(form); };
  document.querySelector('#publish')!.addEventListener('click', async () => { await saveForm(form); if (!activePost) return; try { const result = await api.publish(activePost, csrfToken, activePost.status === 'published'); document.querySelector('#save-status')!.textContent = `발행 작업 접수됨 (${result.state})`; } catch (error) { document.querySelector('#save-status')!.textContent = error instanceof Error ? error.message : '발행 실패'; } });
}

async function saveForm(form: HTMLFormElement) {
  const data = Object.fromEntries(new FormData(form));
  const input = { title: String(data.title), description: String(data.description), pubDate: String(data.pubDate), category: String(data.category), tags: String(data.tags).split(',').map(tag => tag.trim()).filter(Boolean), body: String(data.body) };
  try { if (activePost) { const result = await api.save({ ...activePost, ...input }, csrfToken); activePost = { ...activePost, ...input, version: result.version, updatedAt: result.savedAt }; } else { activePost = await api.create(input, csrfToken); } document.querySelector('#save-status')!.textContent = '저장됨'; } catch (error) { document.querySelector('#save-status')!.textContent = error instanceof Error ? error.message : '저장 실패'; }
}

async function renderView(view: string) { try { if (view === 'analytics') await renderAnalytics(); else if (view === 'editor') renderEditor(); else await renderPosts(); } catch { shell('<div class="login"><h1>관리자 연결이 필요합니다</h1><p>Worker 인증이 설정되면 GitHub 계정으로 로그인할 수 있습니다.</p><a class="primary link-button" href="/auth/github">GitHub로 로그인</a></div>'); } }

api.session().then(session => { csrfToken = session.csrfToken; renderAnalytics(); }).catch(() => { app.innerHTML = '<main class="login"><p class="eyebrow">PRIVATE ARCHIVE</p><h1>관리자 서재</h1><p>본인 GitHub 계정으로 로그인해 글과 통계를 관리합니다.</p><a class="primary link-button" href="/auth/github">GitHub로 로그인</a></main>'; });
