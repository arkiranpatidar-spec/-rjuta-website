import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

const ROOT = path.resolve(import.meta.dirname, '..');
const LIVE = process.argv.includes('--live');
const TODAY = new Date().toISOString().slice(0, 10);
const URLS = {
  registered: 'https://haryanarera.gov.in/admincontrol/registered_agents/2',
  revoked: 'https://haryanarera.gov.in/admincontrol/cancelled_agents/2',
  certificates: 'https://hareraggm.gov.in/app/Agent_signup/Registered_certificate'
};

const localFiles = {
  registered: path.join(ROOT, 'research', 'agents-registered-gurugram.html'),
  revoked: path.join(ROOT, 'research', 'agents-cancelled-gurugram.html'),
  certificates: path.join(ROOT, 'research', 'agent-certificates-gurugram.html')
};

const decodeHtml = value => value
  .replace(/<br\s*\/?>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
const clean = value => decodeHtml(value).replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
const normalizeRegistration = value => clean(value).toUpperCase().replace(/[^A-Z0-9]/g, '');
const stripHonorific = value => clean(value).replace(/^(M\/S\.?|MR\.?|MS\.?|MRS\.?)\s*/i, '');
const parseDate = value => {
  const match = clean(value).match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) return null;
  const months = {jan:'01',feb:'02',mar:'03',apr:'04',may:'05',jun:'06',jul:'07',aug:'08',sep:'09',oct:'10',nov:'11',dec:'12'};
  return `${match[3]}-${months[match[2].toLowerCase()]}-${match[1].padStart(2,'0')}`;
};
const getHtml = async key => {
  if (!LIVE) return fs.readFile(localFiles[key], 'utf8');
  const response = await fetch(URLS[key], { headers: { 'user-agent': 'RJUTA-Research/1.0 (+https://rjuta.com; daily public-record verification)' } });
  if (!response.ok) throw new Error(`${key} returned HTTP ${response.status}`);
  return response.text();
};
const parseRegistry = (html, sourceUrl) => {
  const table = html.match(/<table[^>]+id=["']compliant_hearing["'][\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i)?.[1] || '';
  return [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(match => {
    const rawCells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(cell => cell[1]);
    const cells = rawCells.map(clean);
    if (cells.length < 7) return null;
    const certificateUrl = rawCells[7]?.match(/href=["']([^"']+)["']/i)?.[1] || null;
    return {registration_number: cells[1], legal_name: cells[2], district: cells[3], agent_category: cells[4], certificate_issue_date: parseDate(cells[5]), certificate_expiry_date: parseDate(cells[6]), certificate_url: certificateUrl, source_url: sourceUrl};
  }).filter(Boolean);
};
const parseCertificates = html => {
  const map = new Map();
  const body = html.match(/<table[\s\S]*?<tbody>([\s\S]*?)<\/tbody>/i)?.[1] || '';
  for (const row of body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const rawCells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(cell => cell[1]);
    const cells = rawCells.map(clean);
    if (cells.length < 5 || !cells[2]) continue;
    const url = rawCells[4]?.match(/href=["']([^"']+)["']/i)?.[1] || null;
    map.set(normalizeRegistration(cells[2]), {certificate_id: cells[1], legal_name: cells[3], certificate_url: url});
  }
  return map;
};

const registered = parseRegistry(await getHtml('registered'), URLS.registered);
const revoked = parseRegistry(await getHtml('revoked'), URLS.revoked);
const certificates = parseCertificates(await getHtml('certificates'));
const revokedKeys = new Set(revoked.map(item => normalizeRegistration(item.registration_number)));
const seen = new Set();
const brokers = registered.map(record => {
  const normalized = normalizeRegistration(record.registration_number);
  const currentCertificate = certificates.get(normalized);
  const revokedMatch = revokedKeys.has(normalized);
  const expired = record.certificate_expiry_date && record.certificate_expiry_date < TODAY;
  let registrationStatus = 'STATUS_UNCERTAIN';
  if (revokedMatch) registrationStatus = 'REVOKED/CANCELLED';
  else if (expired) registrationStatus = 'EXPIRED';
  else if (record.certificate_expiry_date) registrationStatus = 'ACTIVE';
  const duplicate = seen.has(normalized);
  seen.add(normalized);
  return {
    broker_id: `hrera-${crypto.createHash('sha256').update(normalized).digest('hex').slice(0,12)}`,
    legal_name: record.legal_name,
    legal_name_normalized: stripHonorific(record.legal_name).toUpperCase(),
    agency_name: /COMPANY|LLP|PARTNERSHIP|PROPRIETORSHIP|SOCIETY/i.test(record.agent_category) ? record.legal_name : null,
    registration_number: record.registration_number,
    registration_number_normalized: normalized,
    authority: 'Haryana Real Estate Regulatory Authority, Gurugram',
    district: record.district || 'GURUGRAM',
    agent_category: record.agent_category || null,
    registration_date: record.certificate_issue_date,
    certificate_issue_date: record.certificate_issue_date,
    certificate_expiry_date: record.certificate_expiry_date,
    registration_status: duplicate ? 'STATUS_UNCERTAIN' : registrationStatus,
    revoked_status: revokedMatch ? 'LISTED BY AUTHORITY' : 'NOT LISTED IN REVOCATION SNAPSHOT',
    revocation_date: null,
    registered_address: null,
    certificate_url: currentCertificate?.certificate_url || record.certificate_url,
    source_url: record.source_url,
    source_type: 'OFFICIAL_PUBLIC_REGISTER',
    last_verified_at: TODAY,
    data_confidence: duplicate || !record.certificate_expiry_date ? 'REVIEW_REQUIRED' : 'HIGH',
    evidence_labels: {identity:'GOVERNMENT_VERIFIED',specialization:'INSUFFICIENT_EVIDENCE',transactions:'NOT_INDEPENDENTLY_VERIFIED',customer_experience:'INSUFFICIENT_EVIDENCE'}
  };
}).sort((a,b) => a.legal_name.localeCompare(b.legal_name));

const counts = brokers.reduce((acc, item) => { acc[item.registration_status] = (acc[item.registration_status] || 0) + 1; return acc; }, {});
const payload = {
  metadata: {
    title: 'RJUTA Gurugram Broker Regulatory Passport dataset',
    generated_at: new Date().toISOString(),
    last_verified_at: TODAY,
    authority: 'Haryana Real Estate Regulatory Authority, Gurugram',
    record_count: brokers.length,
    status_counts: counts,
    source_urls: URLS,
    status_logic: 'REVOKED/CANCELLED when present in the official revocation snapshot; otherwise EXPIRED when certificate expiry is before verification date; otherwise ACTIVE when an expiry date is present; duplicates or missing expiry are STATUS_UNCERTAIN.',
    limitations: ['RERA registration establishes regulatory registration, not broker quality.', 'The official public revocation endpoint returned no Gurugram rows on the verification date; absence is not proof that no adverse order exists.', 'Addresses, phone numbers, transactions, specialization and customer experience are not published in this dataset.', 'Haryana RERA terms state that reproduction requires permission; obtain written permission before publishing or scheduling the full register.']
  },
  brokers
};

await fs.mkdir(path.join(ROOT, 'data'), {recursive:true});
await fs.writeFile(path.join(ROOT, 'data', 'brokers.json'), JSON.stringify(payload) + '\n');
console.log(JSON.stringify(payload.metadata, null, 2));
