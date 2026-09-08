import type { Env } from './types';
import { repoParts } from './config';

async function githubAppToken(env: Env) {
  if (!env.GITHUB_APP_ID || !env.GITHUB_INSTALLATION_ID || !env.GITHUB_PRIVATE_KEY) throw new Error('GitHub App settings are missing');
  const header = { alg: 'RS256', typ: 'JWT' }; const payload = { iat: Math.floor(Date.now() / 1000) - 60, exp: Math.floor(Date.now() / 1000) + 540, iss: env.GITHUB_APP_ID };
  const enc = (value: unknown) => btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
  const data = `${enc(header)}.${enc(payload)}`; const key = await crypto.subtle.importKey('pkcs8', pemToDer(env.GITHUB_PRIVATE_KEY), { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']); const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(data));
  const jwt = `${data}.${btoa(String.fromCharCode(...new Uint8Array(signature))).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')}`;
  const response = await fetch(`https://api.github.com/app/installations/${env.GITHUB_INSTALLATION_ID}/access_tokens`, { method: 'POST', headers: ghHeaders(jwt) }); const result = await response.json() as { token?: string }; if (!result.token) throw new Error('GitHub installation token failed'); return result.token;
}
function pemToDer(pem: string) { const normalized = pem.replaceAll('\\n', '\n').replaceAll('\\r', '\r'); const raw = normalized.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, ''); const bin = atob(raw); return Uint8Array.from(bin, char => char.charCodeAt(0)); }
const ghHeaders = (token: string) => ({ Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'itsdangerous-admin' });
export async function githubRequest(env: Env, path: string, init: RequestInit = {}) { const token = await githubAppToken(env); return fetch(`https://api.github.com${path}`, { ...init, headers: { ...ghHeaders(token), ...(init.headers ?? {}) } }); }
export async function getRepoFile(env: Env, path: string) { const { owner, repo } = repoParts(env); const response = await githubRequest(env, `/repos/${owner}/${repo}/contents/${path}?ref=main`); if (response.status === 404) return null; if (!response.ok) throw new Error(`GitHub read failed: ${response.status}`); return response.json() as Promise<{ sha: string; content: string; path: string; encoding: string }>; }
export async function putRepoFile(env: Env, path: string, content: string, sha: string | undefined, message: string) { const { owner, repo } = repoParts(env); const body: Record<string, string> = { message, content: btoa(unescape(encodeURIComponent(content))), branch: 'main' }; if (sha) body.sha = sha; const response = await githubRequest(env, `/repos/${owner}/${repo}/contents/${path}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); if (!response.ok) throw new Error(`GitHub write failed: ${response.status}`); return response.json() as Promise<{ commit: { sha: string } }>; }
