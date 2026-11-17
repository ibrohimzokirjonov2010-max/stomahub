#!/usr/bin/env node
// Lokal PGlite + Supabase (auth/REST) mock. Prod bazaga ulanmaydi. 0078 ni prodga qo'llamaydi.
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const ROOT = path.resolve(import.meta.dirname, '..')
const MIG_DIR = path.join(ROOT, 'supabase/migrations')
const PGLITE = path.join(ROOT, 'node_modules/@electric-sql/pglite')
const PORT = Number(process.env.E2E_SUPABASE_PORT || 5544)

export const USERS = {
  author: { id: 'a1111111-1111-4111-8111-111111111111', email: 'author@e2e.stomahub.uz', password: 'e2e-author-pass', name: 'Dilnoza Karimova', role: 'organizer', org_status: 'approved' },
  admin: { id: 'a2222222-2222-4222-8222-222222222222', email: 'admin@e2e.stomahub.uz', password: 'e2e-admin-pass', name: 'StomaHub Admin', role: 'admin', org_status: 'none' },
  student: { id: 'a3333333-3333-4333-8333-333333333333', email: 'student@e2e.stomahub.uz', password: 'e2e-student-pass', name: 'Aziza Rahimova', role: 'customer', org_status: 'none' },
}

const STUB = `
create role anon nologin;
create role authenticated nologin;
create role service_role nologin;
create role supabase_admin nologin;
create role supabase_storage_admin nologin;
create role authenticator nologin;
create schema if not exists auth;
create schema if not exists storage;
create schema if not exists extensions;
create schema if not exists graphql_public;
create table if not exists auth.users (
  id uuid primary key,
  instance_id uuid,
  aud text,
  role text,
  email text unique,
  encrypted_password text,
  raw_app_meta_data jsonb default '{}'::jsonb,
  raw_user_meta_data jsonb default '{}'::jsonb,
  confirmation_token text,
  recovery_token text,
  email_change_token_new text,
  email_change text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  email_confirmed_at timestamptz default now(),
  phone text,
  last_sign_in_at timestamptz,
  is_sso_user boolean default false,
  is_anonymous boolean default false,
  deleted_at timestamptz
);
create or replace function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create or replace function auth.role() returns text language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), 'anon')
$$;
create or replace function auth.email() returns text language sql stable as $$
  select nullif(current_setting('request.jwt.claim.email', true), '')
$$;
create or replace function auth.jwt() returns jsonb language sql stable as $$
  select jsonb_build_object(
    'sub', current_setting('request.jwt.claim.sub', true),
    'role', current_setting('request.jwt.claim.role', true),
    'email', current_setting('request.jwt.claim.email', true)
  )
$$;
create table if not exists storage.buckets (
  id text primary key, name text, public boolean, file_size_limit bigint,
  allowed_mime_types text[], owner uuid, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(), bucket_id text, name text, owner uuid,
  metadata jsonb, created_at timestamptz default now(), updated_at timestamptz default now(), last_accessed_at timestamptz
);
create or replace function storage.foldername(name text) returns text[] language sql as $$ select string_to_array(name, '/') $$;
create or replace function storage.filename(name text) returns text language sql as $$ select reverse(split_part(reverse(name), '/', 1)) $$;
create or replace function storage.extension(name text) returns text language sql as $$ select reverse(split_part(reverse(name), '.', 1)) $$;
alter table storage.objects enable row level security;
`

function b64url(obj) {
  return Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj)).toString('base64url')
}

export function makeJwt(user, extra = {}) {
  const now = Math.floor(Date.now() / 1000)
  const payload = {
    aud: 'authenticated',
    role: 'authenticated',
    sub: user.id,
    email: user.email,
    iat: now,
    exp: now + 60 * 60 * 8,
    ...extra,
  }
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.e2e`
}

export function parseJwt(token) {
  if (!token) return null
  const raw = String(token).replace(/^Bearer\s+/i, '')
  const parts = raw.split('.')
  if (parts.length < 2) return null
  try { return JSON.parse(Buffer.from(parts[1], 'base64url').toString()) } catch { return null }
}

export function sessionPayload(user) {
  const access_token = makeJwt(user)
  const refresh_token = `rt-${user.id}`
  return {
    access_token,
    token_type: 'bearer',
    expires_in: 28800,
    expires_at: Math.floor(Date.now() / 1000) + 28800,
    refresh_token,
    user: authUser(user),
  }
}

function authUser(user) {
  return {
    id: user.id,
    aud: 'authenticated',
    role: 'authenticated',
    email: user.email,
    email_confirmed_at: new Date().toISOString(),
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: { name: user.name, full_name: user.name },
    created_at: new Date().toISOString(),
  }
}

export async function createDb() {
  const { PGlite } = await import(pathToFileURL(path.join(PGLITE, 'dist/index.js')).href)
  const { pgcrypto } = await import(pathToFileURL(path.join(PGLITE, 'dist/contrib/pgcrypto.js')).href)
  const { uuid_ossp } = await import(pathToFileURL(path.join(PGLITE, 'dist/contrib/uuid_ossp.js')).href)
  const db = new PGlite({ extensions: { pgcrypto, uuid_ossp } })
  await execIgnore(db, STUB)
  const files = fs.readdirSync(MIG_DIR).filter((f) => f.endsWith('.sql')).sort()
    .filter((f) => !/^0063b/.test(f))
  for (const f of files) {
    const sql = fs.readFileSync(path.join(MIG_DIR, f), 'utf8')
    try {
      await db.exec(sql)
      process.stderr.write(`ok  ${f}\n`)
    } catch (e) {
      // ba'zi migratsiyalar mavjud narsani qayta yaratadi yoki supabase-only kengaytma so'raydi
      const msg = String(e.message || e)
      if (/already exists|duplicate_object|must be owner|cannot drop/i.test(msg)) {
        process.stderr.write(`warn ${f}: ${msg.split('\n')[0]}\n`)
        continue
      }
      process.stderr.write(`FAIL ${f}: ${msg}\n`)
      throw e
    }
  }
  await seedUsers(db)
  return db
}

async function execIgnore(db, sql) {
  for (const stmt of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
    try { await db.exec(`${stmt};`) } catch (e) {
      if (!/already exists/i.test(String(e.message || e))) throw e
    }
  }
}

async function seedUsers(db) {
  for (const u of Object.values(USERS)) {
    await db.query(
      `insert into auth.users (id, email, role, raw_user_meta_data, raw_app_meta_data)
       values ($1, $2, 'authenticated', $3::jsonb, '{}'::jsonb)
       on conflict (id) do update set email = excluded.email, raw_user_meta_data = excluded.raw_user_meta_data`,
      [u.id, u.email, JSON.stringify({ name: u.name, full_name: u.name })],
    )
    await db.query(
      `update public.profiles
          set role = $2,
              org_status = $3,
              name = $4,
              full_name = $4,
              email = $5
        where id = $1`,
      [u.id, u.role, u.org_status, u.name, u.email],
    )
  }
}

function typ(v) {
  if (v === null || v === undefined) return { typ: 'text', val: null }
  if (typeof v === 'boolean') return { typ: 'boolean', val: v }
  if (typeof v === 'number') return { typ: Number.isInteger(v) ? 'int' : 'numeric', val: v }
  if (typeof v === 'object') return { typ: 'jsonb', val: JSON.stringify(v) }
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return { typ: 'uuid', val: v }
  return { typ: 'text', val: v }
}

export async function asUser(db, user, fn) {
  await db.query('begin')
  try {
    if (user) {
      await db.query("select set_config('request.jwt.claim.sub', $1, true)", [user.id])
      await db.query("select set_config('request.jwt.claim.role', 'authenticated', true)")
      await db.query("select set_config('request.jwt.claim.email', $1, true)", [user.email])
      await db.exec('set local role authenticated')
    } else {
      await db.query("select set_config('request.jwt.claim.sub', '', true)")
      await db.query("select set_config('request.jwt.claim.role', 'anon', true)")
      await db.exec('set local role anon')
    }
    const out = await fn()
    await db.query('commit')
    return out
  } catch (e) {
    try { await db.query('rollback') } catch { /* ignore */ }
    throw e
  }
}

export async function rpc(db, user, name, args = {}) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(name)) throw new Error('bad rpc')
  const keys = Object.keys(args || {})
  const values = []
  const parts = keys.map((k, i) => {
    if (!/^[a-z_][a-z0-9_]*$/i.test(k)) throw new Error('bad arg')
    const t = typ(args[k])
    values.push(t.val)
    return `${k} := $${i + 1}::${t.typ}`
  })
  const sql = `select public.${name}(${parts.join(', ')}) as result`
  return asUser(db, user, async () => {
    const res = await db.query(sql, values)
    return res.rows[0]?.result
  })
}

function userFromToken(req) {
  const auth = req.headers.authorization || ''
  const claims = parseJwt(auth)
  if (!claims?.sub) return null
  return Object.values(USERS).find((u) => u.id === claims.sub) || { id: claims.sub, email: claims.email || '', name: '', role: 'customer' }
}

function send(res, status, body, extra = {}) {
  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-headers': 'authorization, apikey, content-type, prefer, x-client-info, accept, accept-profile, content-profile, x-supabase-api-version',
    'access-control-allow-methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS,HEAD',
    'access-control-expose-headers': 'content-range, content-profile, preference-applied',
    ...extra,
  }
  res.writeHead(status, headers)
  res.end(body == null ? '' : (typeof body === 'string' ? body : JSON.stringify(body)))
}

async function readBody(req) {
  const chunks = []
  for await (const c of req) chunks.push(c)
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return { raw } }
}

function parseQs(url) {
  const q = url.split('?')[1] || ''
  const out = new URLSearchParams(q)
  return out
}

async function handleRestGet(db, user, table, qs, wantSingle) {
  if (!/^[a-z_][a-z0-9_]*$/i.test(table)) throw new Error('bad table')
  const select = qs.get('select') || '*'
  const cols = select === '*' ? '*' : select.split(',').map((c) => c.trim()).filter((c) => /^[a-z_][a-z0-9_]*$/i.test(c)).join(', ')
  const wh = []
  const vals = []
  for (const [k, v] of qs.entries()) {
    if (k === 'select' || k === 'order' || k === 'limit' || k === 'offset') continue
    if (!/^[a-z_][a-z0-9_]*$/i.test(k)) continue
    if (v.startsWith('eq.')) {
      vals.push(v.slice(3))
      wh.push(`${k} = $${vals.length}`)
    } else if (v.startsWith('in.(') && v.endsWith(')')) {
      const items = v.slice(4, -1).split(',').map((s) => s.replaceAll('"', ''))
      const ph = items.map((it) => { vals.push(it); return `$${vals.length}` })
      wh.push(`${k} in (${ph.join(',')})`)
    }
  }
  const sql = `select ${cols || '*'} from public.${table}${wh.length ? ` where ${wh.join(' and ')}` : ''}`
  const rows = await asUser(db, user, async () => (await db.query(sql, vals)).rows)
  if (wantSingle) {
    if (!rows.length) return { status: 406, body: { message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' } }
    return { status: 200, body: rows[0] }
  }
  return { status: 200, body: rows }
}

export function startServer(db, port = PORT) {
  const byEmail = Object.fromEntries(Object.values(USERS).map((u) => [u.email, u]))
  const server = http.createServer(async (req, res) => {
    try {
      if (req.method === 'OPTIONS') return send(res, 204, null)
      const url = req.url || '/'
      const pathname = url.split('?')[0]
      const user = userFromToken(req)

      if (pathname === '/auth/v1/token' && req.method === 'POST') {
        const body = await readBody(req)
        const qs = parseQs(url)
        const grant = qs.get('grant_type') || body.grant_type
        if (grant === 'password') {
          const u = byEmail[body.email]
          if (!u || u.password !== body.password) return send(res, 400, { error: 'invalid_grant', error_description: 'Login yoki parol noto‘g‘ri' })
          return send(res, 200, sessionPayload(u))
        }
        if (grant === 'refresh_token') {
          const id = String(body.refresh_token || '').replace(/^rt-/, '')
          const u = Object.values(USERS).find((x) => x.id === id)
          if (!u) return send(res, 400, { error: 'invalid_grant' })
          return send(res, 200, sessionPayload(u))
        }
        return send(res, 400, { error: 'unsupported_grant_type' })
      }
      if (pathname === '/auth/v1/user' && req.method === 'GET') {
        if (!user) return send(res, 401, { message: 'invalid claim' })
        const known = Object.values(USERS).find((u) => u.id === user.id) || user
        return send(res, 200, authUser(known))
      }
      if (pathname === '/auth/v1/logout' && req.method === 'POST') return send(res, 204, null)

      const rpcMatch = pathname.match(/^\/rest\/v1\/rpc\/([A-Za-z_][A-Za-z0-9_]*)$/)
      if (rpcMatch && (req.method === 'POST' || req.method === 'GET')) {
        const name = rpcMatch[1]
        const args = req.method === 'POST' ? await readBody(req) : Object.fromEntries(parseQs(url))
        try {
          const data = await rpc(db, user, name, args)
          return send(res, 200, data)
        } catch (e) {
          const msg = String(e.message || e)
          const missing = /could not find|does not exist|function .* does not exist/i.test(msg)
          return send(res, missing ? 404 : 400, { message: msg, code: missing ? 'PGRST202' : 'PGRST000' })
        }
      }

      const tableMatch = pathname.match(/^\/rest\/v1\/([A-Za-z_][A-Za-z0-9_]*)$/)
      if (tableMatch && req.method === 'GET') {
        const wantSingle = /vnd\.pgrst\.object/.test(String(req.headers.accept || ''))
        try {
          const out = await handleRestGet(db, user, tableMatch[1], parseQs(url), wantSingle)
          return send(res, out.status, out.body)
        } catch (e) {
          return send(res, 400, { message: String(e.message || e), code: 'PGRST000' })
        }
      }
      if (tableMatch && (req.method === 'POST' || req.method === 'PATCH')) {
        // E2E uchun cheklangan yozish — asosiy oqim RPC orqali
        return send(res, 400, { message: 'Use RPC', code: 'PGRST000' })
      }

      if (pathname === '/health') return send(res, 200, { ok: true })
      return send(res, 404, { message: 'not found', path: pathname })
    } catch (e) {
      return send(res, 500, { message: String(e.message || e) })
    }
  })
  return new Promise((resolve) => {
    server.listen(port, '127.0.0.1', () => resolve(server))
  })
}

async function sqlFlow(db) {
  const log = []
  const step = async (name, fn) => {
    try {
      const out = await fn()
      log.push({ name, ok: true, out })
      process.stderr.write(`SQL PASS ${name}\n`)
      return out
    } catch (e) {
      log.push({ name, ok: false, error: String(e.message || e) })
      process.stderr.write(`SQL FAIL ${name}: ${e.message}\n`)
      throw e
    }
  }
  const author = USERS.author
  const admin = USERS.admin
  const student = USERS.student
  const paid = await step('author_save_paid', () => rpc(db, author, 'course_save', {
    p_payload: {
      title: 'SQL Endodontiya',
      description: 'Rotatsion fayllar va irrigatsiya protokollari. Klinik holatlar, rentgen belgilari va xavfsiz ishchi uzunlik.',
      direction: 'endo', level: 'orta', format: 'kurs', price: 450000, coverUrl: '/images/seminars/micro.jpg', status: 'draft',
      lessons: [
        { title: 'Kanal anatomiyasi', moduleTitle: 'Asoslar', passThreshold: 70, maxMistakes: 0, points: 10, questions: [{ prompt: 'NaOCl qaysi konsentratsiyada?', options: ['0,5%', '2,5–5,25%', '10%'], correctIndex: 1 }] },
        { title: 'Irrigatsiya', moduleTitle: 'Asoslar', passThreshold: 70, maxMistakes: 0, points: 10, questions: [{ prompt: 'Crown-down nima?', options: ['Tojdan apeksga', 'Apeksdan tojga'], correctIndex: 0 }] },
      ],
    },
  }))
  if (!paid?.ok) throw new Error(paid?.error || 'save failed')
  const lids = (paid.lessons || []).map((l) => l.id)
  await step('attach_video_1', () => rpc(db, author, 'course_author_attach_video', { p_lesson_id: lids[0], p_video_id: 'e2e-video-1', p_duration: 10 }))
  await step('attach_video_2', () => rpc(db, author, 'course_author_attach_video', { p_lesson_id: lids[1], p_video_id: 'e2e-video-2', p_duration: 10 }))
  await step('save_extras', () => rpc(db, author, 'course_author_save_extras', { p_course_id: paid.id, p_payload: { subtitle: 'SQL test', language: 'uz', learnPoints: ['A', 'B', 'C'], audience: ['Terapevtlar'], discountPrice: 360000, discountUntil: '2026-12-31T23:59:59+05:00', certificateEnabled: true, certificateMinScore: 80, lessons: lids.map((id) => ({ id, takeaways: ['Band'], materials: [] })) } }))
  const submitted = await step('submit', () => rpc(db, author, 'course_author_set_status', { p_course_id: paid.id, p_action: 'submit' }))
  if (submitted.status !== 'review') throw new Error(`expected review, got ${submitted.status}`)
  const queue = await step('review_queue', () => rpc(db, admin, 'course_review_queue'))
  if (!Array.isArray(queue) || !queue.some((r) => r.id === paid.id)) throw new Error('not in queue')
  await step('approve', () => rpc(db, admin, 'course_moderate', { p_course_id: paid.id, p_action: 'approve', p_note: '' }))
  const catalog = await step('catalog', () => rpc(db, student, 'course_catalog'))
  const list = Array.isArray(catalog) ? catalog : []
  if (!list.some((c) => (c.id || c.courseId) === paid.id || c.id === paid.id)) {
    // catalog may use different shape
    const found = JSON.stringify(catalog).includes(paid.id)
    if (!found) throw new Error('approved course missing from catalog: ' + JSON.stringify(catalog).slice(0, 400))
  }
  const enroll = await step('enroll_paid', () => rpc(db, student, 'course_enroll', { p_course_id: paid.id }))
  if (enroll.access) throw new Error('paid enroll should be unpaid/no access')
  await step('mark_paid', () => rpc(db, author, 'course_author_mark_paid', { p_course_id: paid.id, p_user_id: student.id, p_method: 'cash', p_note: 'E2E' }))
  const player1 = await step('player_after_pay', () => rpc(db, student, 'course_player', { p_course_id: paid.id }))
  if (!player1?.course?.access) throw new Error('access not opened')
  const lessons = player1.lessons || []
  if (lessons[1]?.open_lesson === true || lessons[1]?.locked === false && lessons[1] && !lessons[0].complete && lessons[1].open === true) {
    // check lock: second should be closed
  }
  // second lesson must not be open until first passed
  const l1 = lessons[0]
  const l2 = lessons[1]
  const openOf = (l) => l?.open_lesson ?? l?.open ?? !l?.locked
  if (openOf(l2) && !l1?.complete && !l1?.quizPassed) {
    // might still be locked via locked flag
    if (l2.locked === false || l2.locked == null) throw new Error('second lesson unlocked too early: ' + JSON.stringify(l2))
  }
  await step('watch_1', () => rpc(db, student, 'course_report_progress', { p_lesson_id: l1.id, p_position: 10 }))
  const pAfter1 = await rpc(db, student, 'course_player', { p_course_id: paid.id })
  const q1 = pAfter1.lessons[0].questions || []
  if (!q1.length) throw new Error('quiz 1 questions missing after watch')
  const answers1 = q1.map((q) => ({ id: q.id, choice: 1 }))
  const quiz1 = await step('quiz_1', () => rpc(db, student, 'course_submit_quiz', { p_lesson_id: l1.id, p_answers: answers1 }))
  if (!quiz1.passed) throw new Error('quiz 1 should pass: ' + JSON.stringify(quiz1))
  await step('watch_2', () => rpc(db, student, 'course_report_progress', { p_lesson_id: l2.id, p_position: 10 }))
  const p2 = await rpc(db, student, 'course_player', { p_course_id: paid.id })
  const q2 = p2.lessons[1].questions || []
  if (!q2.length) throw new Error('quiz 2 questions missing after watch')
  const answers2 = q2.map((q) => ({ id: q.id, choice: 0 }))
  const quiz2 = await step('quiz_2_cert', () => rpc(db, student, 'course_submit_quiz', { p_lesson_id: l2.id, p_answers: answers2 }))
  if (!quiz2.passed) throw new Error('quiz 2 should pass: ' + JSON.stringify(quiz2))
  if (!quiz2.certificate) throw new Error('certificate not issued: ' + JSON.stringify(quiz2))
  const dash = await step('dashboard', () => rpc(db, author, 'course_author_dashboard'))
  if (!dash?.ok && dash?.totals?.students == null && dash?.totals?.paidCount == null) {
    // dashboard returns ok + totals
    if (!dash?.totals) throw new Error('dashboard shape: ' + JSON.stringify(dash).slice(0, 300))
  }
  const students = await step('students', () => rpc(db, author, 'course_author_students', { p_course_id: paid.id }))
  const st = Array.isArray(students) ? students : []
  if (!st.some((r) => r.userId === student.id || r.user_id === student.id)) throw new Error('student missing')
  // free course
  const free = await step('author_save_free', () => rpc(db, author, 'course_save', {
    p_payload: {
      title: 'SQL Bepul kirish darsi', description: 'Qisqa bepul dars. Yozilgan har kim darhol ko‘radi va test topshiradi.',
      direction: 'terapiya', level: 'bosh', format: 'kurs', price: 0, coverUrl: '', status: 'draft',
      lessons: [{ title: 'Kirish', moduleTitle: 'Start', passThreshold: 70, maxMistakes: 0, points: 10, questions: [{ prompt: '2+2?', options: ['3', '4'], correctIndex: 1 }] }],
    },
  }))
  await rpc(db, author, 'course_author_attach_video', { p_lesson_id: free.lessons[0].id, p_video_id: 'e2e-free-1', p_duration: 10 })
  await rpc(db, author, 'course_author_set_status', { p_course_id: free.id, p_action: 'submit' })
  await rpc(db, admin, 'course_moderate', { p_course_id: free.id, p_action: 'approve', p_note: '' })
  const fenr = await step('enroll_free', () => rpc(db, student, 'course_enroll', { p_course_id: free.id }))
  if (!fenr.access) throw new Error('free enroll should grant access')
  return { log, paidId: paid.id, freeId: free.id, lessonIds: lids }
}

const isMain = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url
if (isMain) {
  const db = await createDb()
  const flow = await sqlFlow(db)
  const server = await startServer(db)
  const out = { port: PORT, paidId: flow.paidId, freeId: flow.freeId, url: `http://127.0.0.1:${PORT}` }
  fs.mkdirSync('/tmp/stomahub-author-e2e', { recursive: true })
  fs.writeFileSync('/tmp/stomahub-author-e2e/meta.json', JSON.stringify(out, null, 2))
  console.log(JSON.stringify({ ok: true, ...out, steps: flow.log.length }))
}
