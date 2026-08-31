// Bounded secret / PII detector.
// Returns findings with MASKED samples only — full secret values never leave this module.

const PATTERNS = [
  { type: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/g, severity: 'high' },
  { type: 'Private key block', re: /-----BEGIN (?:RSA |EC |OPENSSH |PGP |DSA )?PRIVATE KEY-----/g, severity: 'high' },
  { type: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}\b/g, severity: 'high' },
  { type: 'OpenAI API key', re: /\bsk-(?!ant-)[A-Za-z0-9]{20,}\b/g, severity: 'high' },
  { type: 'GitHub token', re: /\bgh[posru]_[A-Za-z0-9]{20,}\b/g, severity: 'high' },
  { type: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/g, severity: 'high' },
  { type: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{35}\b/g, severity: 'high' },
  { type: 'Stripe live key', re: /\b(?:sk|rk)_live_[A-Za-z0-9]{20,}\b/g, severity: 'high' },
  { type: 'JWT', re: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{6,}\b/g, severity: 'medium' },
  { type: 'Secret-like assignment', re: /(?:api[_-]?key|secret|token|password|passwd|credential)["'`\s]{0,3}[:=]["'`\s]{0,3}([A-Za-z0-9/+_.-]{16,})/gi, severity: 'low' },
];

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

export function mask(s) {
  if (s == null) return '';
  const str = String(s);
  if (str.length <= 8) return (str[0] || '') + '••••';
  return str.slice(0, 4) + '…' + str.slice(-4);
}

export function scanText(text, source) {
  const findings = [];
  if (!text) return findings;
  const seen = new Set();
  for (const p of PATTERNS) {
    p.re.lastIndex = 0;
    let m, count = 0;
    while ((m = p.re.exec(text)) !== null && count < 20) {
      const hit = m[1] || m[0];
      const key = p.type + '::' + hit;
      if (!seen.has(key)) {
        seen.add(key);
        findings.push({ type: p.type, severity: p.severity, source, sample: mask(hit) });
        count++;
      }
      if (m.index === p.re.lastIndex) p.re.lastIndex++;
    }
  }
  return findings;
}

export function countEmails(text) {
  if (!text) return 0;
  const m = text.match(EMAIL_RE);
  return m ? new Set(m.map((x) => x.toLowerCase())).size : 0;
}
