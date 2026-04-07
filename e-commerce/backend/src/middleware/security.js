/**
 * ─── CLOUDFLARE-STYLE SECURITY MIDDLEWARE ────────────────────────────────────
 *
 * Protects against:
 *  1. Brute-force login attempts  (IP lockout after N failures)
 *  2. Known scanner/bot user-agents (sqlmap, nikto, dirbuster, etc.)
 *  3. Suspicious path probing     (/wp-admin, /.env, /etc/passwd, etc.)
 *  4. Directory traversal attacks (../../)
 *  5. High 404 rate per IP        (scanner detection)
 *  6. Oversized payloads already blocked by express body limit, but we log
 */

const { invalidateProductCache } = require('../config/cache');

// ─── IN-MEMORY STORES (upgrade to Redis for multi-instance) ──────────────────
const failedLogins = new Map();   // ip -> { count, blockedUntil }
const notFoundHits = new Map();   // ip -> { count, firstHit }
const suspiciousIps = new Set();  // permanently flagged IPs this session

// ─── CONFIG ───────────────────────────────────────────────────────────────────
const LOGIN_FAIL_LIMIT   = 5;
const LOGIN_BLOCK_MS     = 30 * 60 * 1000;   // 30 minutes
const NOT_FOUND_LIMIT    = 20;               // 20 x 404s within window = scanner
const NOT_FOUND_WINDOW   = 2 * 60 * 1000;    // 2 minute window
const CLEANUP_INTERVAL   = 10 * 60 * 1000;   // clean maps every 10 min

// ─── BAD USER-AGENTS (exploit scanners / automated tools) ────────────────────
const BAD_AGENTS = [
  'sqlmap', 'nikto', 'dirbuster', 'dirb', 'gobuster', 'masscan',
  'nmap', 'zgrab', 'nuclei', 'hydra', 'medusa', 'burpsuite',
  'w3af', 'acunetix', 'nessus', 'openvas', 'appscan',
  'python-requests', 'go-http-client', 'java/', 'libwww-perl',
  'zgrab', 'httpclient', 'checkhost', 'zgrab2', 'censys',
];

// ─── SUSPICIOUS PATHS (any probe of these = instant 403) ─────────────────────
const SUSPICIOUS_PATHS = [
  '/wp-admin', '/wp-login', '/wordpress', '/xmlrpc',
  '/.env', '/.git', '/.htaccess', '/.htpasswd', '/.DS_Store',
  '/etc/passwd', '/etc/shadow', '/proc/self',
  '/phpmyadmin', '/pma', '/myadmin', '/mysqladmin',
  '/admin.php', '/admin.aspx', '/admin.jsp',
  '/shell', '/cmd', '/exec', '/eval',
  '/cgi-bin', '/cgi/', '/perl/',
  '/config.php', '/config.yml', '/config.json',
  '/backup', '/dump', '/db.sql', '/database.sql',
  '/setup', '/install', '/installer',
  '/actuator', '/metrics', '/env', '/beans', // Spring Boot probes
  '/console', '/manager',
  '///', '/..', '../',
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const getIp = (req) =>
  req.headers['cf-connecting-ip'] ||          // Cloudflare real IP
  req.headers['x-real-ip'] ||
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
  req.ip ||
  req.connection?.remoteAddress ||
  'unknown';

const logSecurityEvent = (type, ip, detail) => {
  const ts = new Date().toISOString();
  console.warn(`🚨 [SECURITY][${type}] ${ts} | IP: ${ip} | ${detail}`);
};

// ─── CLEANUP STALE ENTRIES ────────────────────────────────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of failedLogins.entries()) {
    if (data.blockedUntil && data.blockedUntil < now) failedLogins.delete(ip);
  }
  for (const [ip, data] of notFoundHits.entries()) {
    if (data.firstHit + NOT_FOUND_WINDOW < now) notFoundHits.delete(ip);
  }
}, CLEANUP_INTERVAL);


// ═════════════════════════════════════════════════════════════════════════════
// 1. MAIN GUARD — runs on every request
// ═════════════════════════════════════════════════════════════════════════════
const mainGuard = (req, res, next) => {
  const ip = getIp(req);
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const path = req.path.toLowerCase();
  const raw = req.originalUrl.toLowerCase();

  // ── a) Permanently suspicious IP (flagged earlier this session) ───────────
  if (suspiciousIps.has(ip)) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  // ── b) Bad user-agent check ───────────────────────────────────────────────
  const isBadAgent = BAD_AGENTS.some(agent => ua.includes(agent));
  if (isBadAgent) {
    logSecurityEvent('BAD_AGENT', ip, `UA: ${ua.slice(0, 80)}`);
    suspiciousIps.add(ip);
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  // ── c) Suspicious path probe ──────────────────────────────────────────────
  const isSuspiciousPath = SUSPICIOUS_PATHS.some(p => path.startsWith(p) || raw.includes(p));
  if (isSuspiciousPath) {
    logSecurityEvent('PATH_PROBE', ip, `Path: ${req.originalUrl.slice(0, 100)}`);
    suspiciousIps.add(ip);
    return res.status(403).json({ success: false, message: 'Forbidden.' });
  }

  // ── d) Directory traversal ────────────────────────────────────────────────
  if (raw.includes('../') || raw.includes('..%2f') || raw.includes('%2e%2e')) {
    logSecurityEvent('DIR_TRAVERSAL', ip, `URL: ${req.originalUrl.slice(0, 100)}`);
    suspiciousIps.add(ip);
    return res.status(400).json({ success: false, message: 'Bad request.' });
  }

  // ── e) Null byte injection ────────────────────────────────────────────────
  if (raw.includes('%00') || raw.includes('\x00')) {
    logSecurityEvent('NULL_BYTE', ip, `URL: ${req.originalUrl.slice(0, 100)}`);
    suspiciousIps.add(ip);
    return res.status(400).json({ success: false, message: 'Bad request.' });
  }

  next();
};


// ═════════════════════════════════════════════════════════════════════════════
// 2. 404 HONEYPOT — runs after route handlers to track scanners
// ═════════════════════════════════════════════════════════════════════════════
const honeypot404 = (req, res, next) => {
  const ip = getIp(req);
  const now = Date.now();

  // Track 404 hits per IP
  const existing = notFoundHits.get(ip) || { count: 0, firstHit: now };

  if (now - existing.firstHit > NOT_FOUND_WINDOW) {
    // Reset window
    notFoundHits.set(ip, { count: 1, firstHit: now });
  } else {
    existing.count++;
    notFoundHits.set(ip, existing);

    if (existing.count >= NOT_FOUND_LIMIT) {
      logSecurityEvent('SCANNER_DETECTED', ip, `${existing.count} x 404 in ${NOT_FOUND_WINDOW / 1000}s`);
      suspiciousIps.add(ip);
      notFoundHits.delete(ip);
    }
  }

  next();
};


// ═════════════════════════════════════════════════════════════════════════════
// 3. LOGIN GUARD — tracks failed logins per IP and blocks brute force
// ═════════════════════════════════════════════════════════════════════════════
const loginGuard = (req, res, next) => {
  const ip = getIp(req);
  const now = Date.now();
  const record = failedLogins.get(ip) || { count: 0, blockedUntil: null };

  if (record.blockedUntil && record.blockedUntil > now) {
    const remaining = Math.ceil((record.blockedUntil - now) / 60000);
    logSecurityEvent('BLOCKED_LOGIN', ip, `Blocked for ${remaining} more min`);
    return res.status(429).json({
      success: false,
      message: `Too many failed login attempts. Try again in ${remaining} minute(s).`,
    });
  }

  // Patch the response to track failures
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode === 401) {
      record.count++;
      if (record.count >= LOGIN_FAIL_LIMIT) {
        record.blockedUntil = now + LOGIN_BLOCK_MS;
        logSecurityEvent('LOGIN_LOCKOUT', ip, `${record.count} failures → locked 30min`);
      } else {
        logSecurityEvent('LOGIN_FAIL', ip, `${record.count}/${LOGIN_FAIL_LIMIT} failures`);
      }
      failedLogins.set(ip, record);
    } else if (res.statusCode === 200 && body?.success) {
      // Successful login → reset counter
      failedLogins.delete(ip);
    }
    return originalJson(body);
  };

  next();
};

// Export get-IP utility so other middleware can use it
module.exports = { mainGuard, honeypot404, loginGuard, getIp, suspiciousIps };
