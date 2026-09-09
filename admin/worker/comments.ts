import { error, json } from './security';
import type { Env } from './types';

const encoder = new TextEncoder();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validPage = (value: unknown): value is string => typeof value === 'string' &&
  (value === '/guestbook/' || /^\/blog\/posts\/[^/?#\s]{1,240}\/$/.test(value));
const hex = (bytes: ArrayBuffer) => Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');

async function keyedHash(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
}

// Pepper stays in Worker secrets; a unique salt is stored per comment.
export async function passwordHash(password: string, salt: string, secret: string) {
  const material = await keyedHash(`password:${password}`, secret);
  const key = await crypto.subtle.importKey('raw', encoder.encode(material), 'PBKDF2', false, ['deriveBits']);
  return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: encoder.encode(salt), iterations: 100_000 }, key, 256));
}

function equalHash(a: string, b: string) {
  let difference = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ (b.charCodeAt(i) || 0);
  return difference === 0;
}

export function validComment(input: Record<string, unknown>) {
  return typeof input.nickname === 'string' && input.nickname.trim().length >= 1 && input.nickname.trim().length <= 30 &&
    typeof input.body === 'string' && input.body.trim().length >= 1 && input.body.trim().length <= 3000;
}
const validPassword = (value: unknown): value is string => typeof value === 'string' && value.length >= 4 && value.length <= 128;
const validVisibility = (value: unknown): value is 'public' | 'private' => value === 'public' || value === 'private';

async function rateLimit(env: Env, identity: string, scope: string, limit: number) {
  const minute = Math.floor(Date.now() / 60_000);
  const key = await keyedHash(`${scope}:${minute}:${identity}`, env.COMMENTS_SECRET!);
  const row = await env.DB.prepare(`INSERT INTO comment_rate_limits (key, count, expires_at) VALUES (?, 1, ?)
    ON CONFLICT(key) DO UPDATE SET count=count+1 RETURNING count`).bind(key, (minute + 2) * 60).first<{ count: number }>();
  return !!row && row.count <= limit;
}

const publicColumns = `c.id, c.page, c.parent_id AS parentId, CASE WHEN c.visibility='private' THEN NULL ELSE c.nickname END AS nickname,
  CASE WHEN c.visibility='private' THEN NULL ELSE c.body END AS body, c.visibility, c.version, c.created_at AS createdAt, c.updated_at AS updatedAt,
  (SELECT COUNT(*) FROM comment_likes l WHERE l.comment_id=c.id) AS likes,
  EXISTS(SELECT 1 FROM comment_likes l WHERE l.comment_id=c.id AND l.visitor_hash=?) AS liked`;

async function handle(request: Request, env: Env): Promise<Response> {
  if (!env.DB || !env.COMMENTS_SECRET) return error('COMMENTS_UNAVAILABLE', '댓글 연결을 준비하고 있습니다. 잠시 후 다시 방문해 주세요.', 503);
  const url = new URL(request.url);
  const visitor = request.headers.get('X-Comment-Visitor');
  if (visitor && !uuid.test(visitor)) return error('INVALID_VISITOR', '브라우저 식별자가 올바르지 않습니다.', 400);
  const visitorHash = visitor ? await keyedHash(`visitor:${visitor}`, env.COMMENTS_SECRET) : '';
  if (url.pathname === '/api/comments' && request.method === 'GET') {
    const page = url.searchParams.get('page');
    if (!validPage(page)) return error('INVALID_PAGE', '댓글 페이지가 올바르지 않습니다.', 400);
    const after = url.searchParams.get('after');
    let cursor: { created_at: string; id: string } | null = null;
    if (after) {
      if (!uuid.test(after)) return error('INVALID_CURSOR', '목록 위치가 올바르지 않습니다.', 400);
      cursor = await env.DB.prepare('SELECT id, created_at FROM comments WHERE id=? AND page=? AND parent_id IS NULL').bind(after, page).first();
      if (!cursor) return error('INVALID_CURSOR', '목록이 변경되었습니다. 새로 불러와 주세요.', 409);
    }
    const rows = await env.DB.prepare(`SELECT ${publicColumns} FROM comments c WHERE page=? AND c.parent_id IS NULL
      ${cursor ? 'AND (c.created_at, c.id) < (?, ?)' : ''} ORDER BY c.created_at DESC, c.id DESC LIMIT 21`)
      .bind(visitorHash, page, ...(cursor ? [cursor.created_at, cursor.id] : [])).all();
    const total = await env.DB.prepare('SELECT COUNT(*) AS total FROM comments WHERE page=?').bind(page).first<{ total: number }>();
    const roots = rows.results.slice(0, 20) as Array<{ id: string }>;
    const placeholders = roots.map(() => '?').join(', ');
    const replies = roots.length
      ? await env.DB.prepare(`SELECT ${publicColumns} FROM comments c WHERE c.parent_id IN (${placeholders}) ORDER BY c.created_at ASC, c.id ASC`)
        .bind(visitorHash, ...roots.map(root => root.id)).all()
      : { results: [] };
    const items = [...roots, ...replies.results];
    return json({ items, total: total?.total ?? 0, next: rows.results.length > 20 ? roots[19].id : null });
  }

  const match = url.pathname.match(/^\/api\/comments\/([0-9a-f-]+)(\/(like|reveal))?$/i);
  const create = url.pathname === '/api/comments' && request.method === 'POST';
  const edit = match && !match[2] && request.method === 'PATCH';
  const remove = match && !match[2] && request.method === 'DELETE';
  const like = match && match[3] === 'like' && request.method === 'PUT';
  const reveal = match && match[3] === 'reveal' && request.method === 'POST';
  if (!create && !edit && !remove && !like && !reveal) return error('NOT_FOUND', '댓글 경로를 찾을 수 없습니다.', 404);
  if (match && !uuid.test(match[1])) return error('INVALID_ID', '댓글 ID가 올바르지 않습니다.', 400);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return error('INVALID_CONTENT_TYPE', 'JSON 요청이 필요합니다.', 415);
  if (Number(request.headers.get('Content-Length')) > 16_384) return error('TOO_LARGE', '입력 내용이 너무 깁니다.', 413);
  // Read with a hard byte limit, including chunked bodies.
  const reader = request.body?.getReader();
  if (!reader) return error('INVALID_BODY', '입력 내용을 확인해 주세요.', 400);
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const part = await reader.read();
    if (part.done) break;
    size += part.value.length;
    if (size > 16_384) { await reader.cancel(); return error('TOO_LARGE', '입력 내용이 너무 깁니다.', 413); }
    chunks.push(part.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(new TextDecoder().decode(bytes));
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error();
  } catch { return error('INVALID_BODY', '입력 내용을 확인해 주세요.', 400); }
  const ip = request.headers.get('CF-Connecting-IP') ?? 'local';
  if (!await rateLimit(env, ip, like ? 'likes' : create ? 'create' : 'password', like ? 60 : create ? 5 : 10)) {
    return json({ error: { code: 'RATE_LIMITED', message: '요청이 많습니다. 1분 후 다시 시도해 주세요.' } }, 429, { 'Retry-After': '60' });
  }
  if (create) {
    if (!validPage(input.page) || !validComment(input) || !validPassword(input.password) || !validVisibility(input.visibility)) return error('INVALID_INPUT', '닉네임 1~30자, 댓글 1~3,000자, 비밀번호 4~128자와 공개 범위를 입력해 주세요.', 422);
    if (input.website) return error('INVALID_INPUT', '등록 요청을 확인해 주세요.', 422);
    if (input.parentId !== undefined) {
      if (!uuid.test(String(input.parentId))) return error('INVALID_INPUT', '답글 위치가 올바르지 않습니다.', 422);
      const parent = await env.DB.prepare('SELECT page, parent_id FROM comments WHERE id=?').bind(input.parentId).first<{ page: string; parent_id: string | null }>();
      if (!parent || parent.page !== input.page || parent.parent_id) return error('INVALID_INPUT', '답글을 남길 수 없는 댓글입니다.', 422);
    }
    const id = crypto.randomUUID();
    const salt = crypto.randomUUID();
    const hash = await passwordHash(input.password, salt, env.COMMENTS_SECRET);
    const now = new Date().toISOString();
    await env.DB.prepare('INSERT INTO comments (id, page, parent_id, nickname, body, password_hash, password_salt, visibility, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, input.page, input.parentId ?? null, (input.nickname as string).trim(), (input.body as string).trim(), hash, salt, input.visibility, now, now).run();
    return json({ id }, 201);
  }
  const id = match![1];
  if (like) {
    if (!visitor || typeof input.liked !== 'boolean') return error('INVALID_INPUT', '좋아요 요청을 확인해 주세요.', 422);
    const exists = await env.DB.prepare('SELECT id FROM comments WHERE id=?').bind(id).first();
    if (!exists) return error('NOT_FOUND', '삭제되었거나 존재하지 않는 댓글입니다.', 404);
    const change = input.liked
      ? env.DB.prepare('INSERT OR IGNORE INTO comment_likes (comment_id, visitor_hash) SELECT id, ? FROM comments WHERE id=?').bind(visitorHash, id)
      : env.DB.prepare('DELETE FROM comment_likes WHERE comment_id=? AND visitor_hash=?').bind(id, visitorHash);
    const results = await env.DB.batch([change, env.DB.prepare(`SELECT ${publicColumns} FROM comments c WHERE c.id=?`).bind(visitorHash, id)]);
    return results[1].results[0] ? json(results[1].results[0]) : error('NOT_FOUND', '삭제된 댓글입니다.', 404);
  }
  if (!validPassword(input.password) || (!reveal && !Number.isInteger(input.version))) return error('INVALID_INPUT', '댓글 비밀번호를 입력해 주세요.', 422);
  if (edit && !validComment(input)) return error('INVALID_INPUT', '닉네임과 댓글 길이를 확인해 주세요.', 422);
  if (!await rateLimit(env, id, 'comment-password', 30)) return error('RATE_LIMITED', '이 댓글의 확인 요청이 많습니다. 잠시 후 다시 시도해 주세요.', 429);
  const stored = await env.DB.prepare('SELECT password_hash, password_salt, nickname, body, visibility, version FROM comments WHERE id=?').bind(id).first<{ password_hash: string; password_salt: string; nickname: string; body: string; visibility: string; version: number }>();
  if (!stored) return error('NOT_FOUND', '삭제되었거나 존재하지 않는 댓글입니다.', 404);
  const hash = await passwordHash(input.password, stored.password_salt, env.COMMENTS_SECRET);
  if (!equalHash(hash, stored.password_hash)) return error('WRONG_PASSWORD', '비밀번호가 맞지 않습니다.', 403);
  if (reveal) {
    if (stored.visibility !== 'private') return error('NOT_PRIVATE', '공개 댓글입니다.', 409);
    return json({ id, nickname: stored.nickname, body: stored.body, visibility: stored.visibility, version: stored.version });
  }
  const result = remove
    ? (await env.DB.batch([
        env.DB.prepare('DELETE FROM comment_likes WHERE comment_id IN (SELECT id FROM comments WHERE id=? OR parent_id=?)').bind(id, id),
        env.DB.prepare('DELETE FROM comments WHERE parent_id=?').bind(id),
        env.DB.prepare('DELETE FROM comments WHERE id=? AND version=?').bind(id, input.version),
      ]))[1]
    : await env.DB.prepare('UPDATE comments SET nickname=?, body=?, updated_at=?, version=version+1 WHERE id=? AND version=?')
      .bind((input.nickname as string).trim(), (input.body as string).trim(), new Date().toISOString(), id, input.version).run();
  if (!result.meta.changes) return error('VERSION_CONFLICT', '댓글이 변경되었습니다. 새로 불러온 뒤 다시 시도해 주세요.', 409);
  return json({ ok: true });
}

export async function commentsApi(request: Request, env: Env) {
  const origin = request.headers.get('Origin');
  const allowed = (env.COMMENTS_ORIGINS ?? 'https://itsdangerous.github.io').split(',').map(value => value.trim());
  if (origin && !allowed.includes(origin)) return error('ORIGIN_DENIED', '허용되지 않은 요청입니다.', 403);
  if (!origin && !['GET', 'HEAD'].includes(request.method)) return error('ORIGIN_REQUIRED', '사이트에서 다시 시도해 주세요.', 403);
  let response: Response;
  try { response = request.method === 'OPTIONS' ? new Response(null, { status: 204 }) : await handle(request, env); }
  catch { response = error('COMMENTS_UNAVAILABLE', '댓글 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.', 503); }
  const headers = new Headers(response.headers);
  headers.set('Vary', 'Origin');
  headers.set('Cache-Control', 'no-store');
  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, PUT, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, X-Comment-Visitor');
  }
  return new Response(response.body, { status: response.status, headers });
}
