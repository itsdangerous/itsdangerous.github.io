import { error, json } from './security';
import type { ScheduledController, ExecutionContext } from '@cloudflare/workers-types/index';
import type { Env } from './types';
import { beginGithub, githubCallback, logout, sessionResponse } from './auth';
import { createPost, discardPost, getPost, importPosts, listPosts, publishPost, updatePost } from './posts';
import { analyticsReport } from './analytics';
import { commentsApi, adminCommentReply, adminComments } from './comments';

const configError = () => error('ADMIN_NOT_CONFIGURED', '관리자 Worker의 OAuth와 저장소 설정이 아직 완료되지 않았습니다.', 503);
function sessionCors(request: Request, response: Response) {
  const origin = request.headers.get('Origin');
  if (origin !== 'https://itsdangerous.github.io') return response;
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', origin);
  headers.set('Access-Control-Allow-Credentials', 'true');
  headers.set('Vary', 'Origin');
  return new Response(response.body, { status: response.status, headers });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === '/admin/comments' && request.method === 'GET') return adminComments(request, env);
    if (url.pathname === '/admin/comments/reply' && request.method === 'POST') return adminCommentReply(request, env);
    if (url.pathname === '/api/comments' || url.pathname.startsWith('/api/comments/')) return commentsApi(request, env);
    if (url.pathname === '/auth/github') return beginGithub(request, env);
    if (url.pathname === '/auth/callback') return githubCallback(request, env);
    if (url.pathname.startsWith('/api/')) {
      if (!env.DB) return configError();
      if (url.pathname === '/api/session' && request.method === 'GET') return sessionCors(request, await sessionResponse(request, env) ?? error('INTERNAL_ERROR', '관리자 응답을 생성하지 못했습니다.', 500));
      if (url.pathname === '/api/logout' && request.method === 'POST') return await logout(request, env) ?? error('INTERNAL_ERROR', '관리자 응답을 생성하지 못했습니다.', 500);
      if (url.pathname === '/api/posts' && request.method === 'GET') return await listPosts(request, env) ?? error('INTERNAL_ERROR', '관리자 응답을 생성하지 못했습니다.', 500);
      if (url.pathname === '/api/posts' && request.method === 'POST') return await createPost(request, env) ?? error('INTERNAL_ERROR', '관리자 응답을 생성하지 못했습니다.', 500);
      if (url.pathname === '/api/posts/import' && request.method === 'POST') return await importPosts(request, env) ?? error('INTERNAL_ERROR', '관리자 응답을 생성하지 못했습니다.', 500);
      const postMatch = url.pathname.match(/^\/api\/posts\/([^/]+)$/);
      if (postMatch && request.method === 'DELETE') return discardPost(request, env, decodeURIComponent(postMatch[1]));
      if (postMatch && request.method === 'GET') return await getPost(request, env, decodeURIComponent(postMatch[1])) ?? error('INTERNAL_ERROR', '관리자 응답을 생성하지 못했습니다.', 500);
      if (postMatch && request.method === 'PUT') return await updatePost(request, env, decodeURIComponent(postMatch[1])) ?? error('INTERNAL_ERROR', '관리자 응답을 생성하지 못했습니다.', 500);
      const publishMatch = url.pathname.match(/^\/api\/posts\/([^/]+)\/(publish|unpublish)$/);
      if (publishMatch && request.method === 'POST') return await publishPost(request, env, decodeURIComponent(publishMatch[1]), publishMatch[2] === 'unpublish') ?? error('INTERNAL_ERROR', '관리자 응답을 생성하지 못했습니다.', 500);
      const operationMatch = url.pathname.match(/^\/api\/operations\/([^/]+)$/);
      if (operationMatch && request.method === 'GET') {
        const auth = await (await import('./auth')).requireSession(request, env); if ('response' in auth) return auth.response ?? error('UNAUTHENTICATED', 'GitHub 로그인이 필요합니다.', 401);
        const operation = await env.DB.prepare('SELECT id, state, commit_sha, workflow_run_id, error_code FROM operations WHERE id=?').bind(operationMatch[1]).first();
        return operation ? json(operation) : error('NOT_FOUND', '발행 작업을 찾을 수 없습니다.', 404);
      }
      const analyticsMatch = url.pathname.match(/^\/api\/analytics\/([^/]+)$/);
      if (analyticsMatch && request.method === 'GET') return await analyticsReport(request, env, analyticsMatch[1]) ?? error('INTERNAL_ERROR', '관리자 응답을 생성하지 못했습니다.', 500);
      return error('NOT_FOUND', 'API 경로를 찾을 수 없습니다.', 404);
    }
    if (url.pathname === '/admin' || url.pathname === '/admin/') {
      return env.ASSETS?.fetch(new Request(new URL('/index.html', request.url), request)) ?? configError();
    }
    if (url.pathname.startsWith('/admin/')) return env.ASSETS?.fetch(request) ?? configError();
    return env.ASSETS?.fetch(request) ?? json({ ok: true });
  },
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    if (env.DB) ctx.waitUntil(env.DB.prepare('DELETE FROM comment_rate_limits WHERE expires_at < ?').bind(Math.floor(Date.now() / 1000)).run());
  },
};
