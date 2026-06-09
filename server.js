/**
 * WANDERLUST — Servidor Local
 * Usa JSON como base de datos (sin compiladores requeridos)
 */

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const fs      = require('fs');

const app  = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, 'db', 'wanderlust.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── BASE DE DATOS JSON ───────────────────────────────────
function readDB() {
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch(e) {
    return {
      variantes: {
        A: { alpha: 1, beta: 1 },
        B: { alpha: 1, beta: 1 },
        C: { alpha: 1, beta: 1 }
      },
      eventos: [],
      leads: []
    };
  }
}
function writeDB(data) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ─── THOMPSON SAMPLING ────────────────────────────────────
function randn() {
  let u = 0, v = 0;
  while (!u) u = Math.random();
  while (!v) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
function gammaRng(shape) {
  if (shape < 1) return gammaRng(1 + shape) * Math.pow(Math.random(), 1 / shape);
  const d = shape - 1/3, c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x, v;
    do { x = randn(); v = 1 + c * x; } while (v <= 0);
    v = v * v * v;
    const u = Math.random();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}
function betaSample(a, b) {
  const x = gammaRng(a), y = gammaRng(b);
  return x / (x + y);
}
function elegirVariante(variantes) {
  const samples = {};
  ['A','B','C'].forEach(v => {
    samples[v] = betaSample(variantes[v].alpha, variantes[v].beta);
  });
  return Object.keys(samples).reduce((a, b) => samples[a] > samples[b] ? a : b);
}

// ══════════════════════════════════════════════════════════
//  API
// ══════════════════════════════════════════════════════════

app.get('/api/variante', (req, res) => {
  const db = readDB();
  const variante = elegirVariante(db.variantes);
  db.variantes[variante].beta++;
  db.eventos.push({ variante, tipo: 'impresion', ip: req.ip, created_at: new Date().toISOString() });
  writeDB(db);
  res.json({ variante });
});

app.post('/api/conversion', (req, res) => {
  const { variante, utm_source, utm_medium, utm_campaign } = req.body;
  if (!['A','B','C'].includes(variante)) return res.status(400).json({ error: 'Variante inválida' });
  const db = readDB();
  db.variantes[variante].alpha++;
  db.eventos.push({ variante, tipo: 'conversion', utm_source, utm_medium, utm_campaign, ip: req.ip, created_at: new Date().toISOString() });
  writeDB(db);
  res.json({ ok: true });
});

app.post('/api/lead', (req, res) => {
  const { nombre, email, destino, mensaje, variante, utm_source, utm_medium, utm_campaign, utm_content } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  const db = readDB();
  db.leads.push({ id: Date.now(), nombre, email, destino, mensaje, variante: variante||'B', utm_source, utm_medium, utm_campaign, utm_content, created_at: new Date().toISOString() });
  if (variante) {
    db.variantes[variante].alpha++;
    db.eventos.push({ variante, tipo: 'conversion', utm_source, ip: req.ip, created_at: new Date().toISOString() });
  }
  writeDB(db);
  res.json({ ok: true, mensaje: '¡Lead guardado!' });
});

app.get('/api/stats', (req, res) => {
  const db = readDB();
  const variantes = ['A','B','C'].map(v => {
    const imp  = db.eventos.filter(e => e.variante===v && e.tipo==='impresion').length;
    const conv = db.eventos.filter(e => e.variante===v && e.tipo==='conversion').length;
    const tasa = imp > 0 ? ((conv/imp)*100).toFixed(1) : '0.0';
    return { variante: v, alpha: db.variantes[v].alpha, beta: db.variantes[v].beta, impresiones: imp, conversiones: conv, tasa };
  });

  // Eventos por día
  const diasMap = {};
  db.eventos.forEach(e => {
    const fecha = e.created_at.split('T')[0];
    const key = fecha + '_' + e.tipo;
    diasMap[key] = (diasMap[key] || 0) + 1;
  });
  const eventosPorDia = Object.entries(diasMap).map(([k,total]) => {
    const [fecha, tipo] = k.split('_');
    return { fecha, tipo, total };
  });

  // UTM sources
  const utmMap = {};
  db.eventos.forEach(e => { if(e.utm_source) utmMap[e.utm_source] = (utmMap[e.utm_source]||0)+1; });
  const utmSources = Object.entries(utmMap).map(([utm_source,total]) => ({ utm_source, total })).sort((a,b)=>b.total-a.total);

  res.json({
    variantes,
    leads: db.leads.slice(-20).reverse(),
    eventosPorDia,
    utmSources,
    totalLeads: db.leads.length,
    totalImpresiones: db.eventos.filter(e=>e.tipo==='impresion').length,
    totalConversiones: db.eventos.filter(e=>e.tipo==='conversion').length,
  });
});

app.get('/api/leads', (req, res) => {
  const db = readDB();
  res.json(db.leads.reverse());
});

app.post('/api/reset', (req, res) => {
  writeDB({ variantes:{A:{alpha:1,beta:1},B:{alpha:1,beta:1},C:{alpha:1,beta:1}}, eventos:[], leads:[] });
  res.json({ ok: true });
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/dashboard', (req, res) => res.sendFile(path.join(__dirname, 'public', 'dashboard.html')));

app.listen(PORT, () => {
  console.log('\n🌍 WANDERLUST — Servidor corriendo');
  console.log(`   Sitio web:  http://localhost:${PORT}`);
  console.log(`   Dashboard:  http://localhost:${PORT}/dashboard`);
  console.log(`   API Stats:  http://localhost:${PORT}/api/stats`);
  console.log('\n   Presioná Ctrl+C para detener\n');
});
