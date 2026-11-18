(function (root) {
  'use strict';
  var cfg = root.JURANDIR_CONFIG || { MODO: 'mock' };
  var KEY = 'jurandir_imoveis_mock_v1';
  var SESSION = 'jurandir_mock_session';
  var client = null;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function now() { return new Date().toISOString(); }
  function id() { return crypto.randomUUID ? crypto.randomUUID() : 'mock-' + Date.now() + '-' + Math.random().toString(16).slice(2); }
  function mockSeed() {
    return [{ id: id(), codigo: 'JC-0001', titulo: 'Apartamento com varanda em Diadema', descricao: 'Uma opção confortável e bem localizada para sua família.', tipo: 'apartamento', finalidade: 'venda', situacao: 'pronto', status: 'disponivel', preco: 289900, condominio: 420, iptu: 95, bairro: 'Centro', cidade: 'Diadema', endereco: 'Uso interno', quartos: 2, suites: 1, banheiros: 2, vagas: 1, area_util_m2: 54, area_total_m2: 68, andar: 7, aceita_financiamento: true, minha_casa_minha_vida: true, aceita_fgts: true, diferenciais: ['varanda', 'elevador', 'portaria 24h'], fotos: [], destaque: true, publicado: true, created_at: now(), updated_at: now() }];
  }
  function readMock() { var raw = localStorage.getItem(KEY); if (!raw) { var seed = mockSeed(); localStorage.setItem(KEY, JSON.stringify(seed)); return seed; } try { return JSON.parse(raw) || []; } catch (_) { return []; } }
  function writeMock(rows) { localStorage.setItem(KEY, JSON.stringify(rows)); return clone(rows); }
  function nextCode(rows) { var max = rows.reduce(function (n, x) { var m = /^JC-(\d+)$/.exec(x.codigo || ''); return Math.max(n, m ? Number(m[1]) : 0); }, 0); return 'JC-' + String(max + 1).padStart(4, '0'); }
  function supabaseReady() { return cfg.MODO === 'supabase' && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && root.supabase; }
  function getClient() { if (!client && supabaseReady()) client = root.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); return client; }
  function checkError(result) { if (result.error) throw result.error; return result.data; }
  function publicQuery() { return getClient().from('imoveis_publicos').select('*').order('destaque', { ascending: false }).order('created_at', { ascending: false }); }
  function allQuery() { return getClient().from('imoveis').select('*').order('created_at', { ascending: false }); }

  var api = {
    mode: function () { return cfg.MODO; },
    listPublic: async function () { if (!supabaseReady()) return readMock().filter(function (x) { return x.publicado; }).sort(function (a, b) { return Number(b.destaque) - Number(a.destaque) || String(b.created_at).localeCompare(String(a.created_at)); }); return checkError(await publicQuery()); },
    listAdmin: async function () { if (!supabaseReady()) return readMock().sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); }); return checkError(await allQuery()); },
    get: async function (propertyId) { if (!supabaseReady()) return readMock().find(function (x) { return x.id === propertyId; }) || null; return checkError(await getClient().from('imoveis').select('*').eq('id', propertyId).single()); },
    save: async function (input) { var data = Object.assign({}, input, { updated_at: now() }); if (!data.id) { if (!supabaseReady()) { var rows = readMock(); data.id = id(); data.codigo = data.codigo || nextCode(rows); data.created_at = now(); rows.unshift(data); writeMock(rows); return clone(data); } data.codigo = data.codigo || 'TEMP-' + Date.now(); return checkError(await getClient().from('imoveis').insert(data).select().single()); } if (!supabaseReady()) { var rows2 = readMock(); var index = rows2.findIndex(function (x) { return x.id === data.id; }); if (index < 0) throw new Error('Imóvel não encontrado.'); rows2[index] = Object.assign({}, rows2[index], data); writeMock(rows2); return clone(rows2[index]); } return checkError(await getClient().from('imoveis').update(data).eq('id', data.id).select().single()); },
    remove: async function (propertyId) { if (!supabaseReady()) { writeMock(readMock().filter(function (x) { return x.id !== propertyId; })); return true; } return checkError(await getClient().from('imoveis').delete().eq('id', propertyId)); },
    duplicate: async function (propertyId) { var original = await api.get(propertyId); if (!original) throw new Error('Imóvel não encontrado.'); var copy = Object.assign({}, original); delete copy.id; delete copy.codigo; copy.titulo = original.titulo + ' (cópia)'; copy.publicado = false; copy.destaque = false; return api.save(copy); },
    login: async function (email, password) { if (!supabaseReady()) { if (email === 'corretor@jurandir.local' && password === 'mock-1234') { sessionStorage.setItem(SESSION, '1'); return { user: { email: email } }; } throw new Error('Não foi possível entrar. Confira seus dados.'); } return checkError(await getClient().auth.signInWithPassword({ email: email, password: password })); },
    logout: async function () { if (!supabaseReady()) { sessionStorage.removeItem(SESSION); return; } checkError(await getClient().auth.signOut()); },
    session: async function () { if (!supabaseReady()) return sessionStorage.getItem(SESSION) ? { user: { email: 'corretor@jurandir.local' } } : null; return checkError(await getClient().auth.getSession()).session; },
    upload: async function (propertyId, index, fullBlob, thumbBlob) { if (!supabaseReady()) return { full: await blobUrl(fullBlob), thumb: await blobUrl(thumbBlob) }; var storage = getClient().storage.from('imoveis-fotos'); var base = 'imoveis/' + propertyId + '/' + index; var full = base + '.webp'; var thumb = base + '_t.webp'; checkError(await storage.upload(full, fullBlob, { upsert: true, contentType: fullBlob.type || 'image/webp' })); checkError(await storage.upload(thumb, thumbBlob, { upsert: true, contentType: thumbBlob.type || 'image/webp' })); return { full: storage.getPublicUrl(full).data.publicUrl, thumb: storage.getPublicUrl(thumb).data.publicUrl }; },
    removeFiles: async function (propertyId, count) { if (!supabaseReady()) return; var paths = []; for (var i = 0; i < count; i += 1) { paths.push('imoveis/' + propertyId + '/' + i + '.webp', 'imoveis/' + propertyId + '/' + i + '_t.webp'); } if (paths.length) checkError(await getClient().storage.from('imoveis-fotos').remove(paths)); }
  };
  function blobUrl(blob) { return new Promise(function (resolve, reject) { var reader = new FileReader(); reader.onload = function () { resolve(reader.result); }; reader.onerror = reject; reader.readAsDataURL(blob); }); }
  root.JurandirData = api;
})(window);
