(function (root) {
  'use strict';
  var cfg = root.JURANDIR_CONFIG || { MODO: 'supabase', SUPABASE_URL: '', SUPABASE_ANON_KEY: '' };
  var KEY = 'jurandir_imoveis_mock_v1';
  var SESSION = 'jurandir_mock_session';
  var client = null;
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function now() { return new Date().toISOString(); }
  function id() { return crypto.randomUUID ? crypto.randomUUID() : 'mock-' + Date.now() + '-' + Math.random().toString(16).slice(2); }
  function mockSeed() { var stamp = now(); return [{ id: id(), codigo: 'JC-0001', titulo: 'Apartamento com varanda em Diadema', descricao: 'Uma opção confortável e bem localizada para sua família.', tipo: 'apartamento', finalidade: 'venda', situacao: 'pronto', status: 'disponivel', preco: 289900, condominio: 420, iptu: 95, bairro: 'Centro', cidade: 'Diadema', endereco: 'Uso interno', quartos: 2, suites: 1, banheiros: 2, vagas: 1, area_util_m2: 54, area_total_m2: 68, andar: 7, aceita_financiamento: true, minha_casa_minha_vida: true, aceita_fgts: true, diferenciais: ['varanda', 'elevador', 'portaria 24h'], fotos: [], destaque: true, publicado: true, created_at: stamp, updated_at: stamp }, { id: id(), codigo: 'JC-0002', titulo: 'Casa térrea para locação', descricao: 'Casa prática, iluminada e pronta para morar.', tipo: 'casa', finalidade: 'locacao', situacao: 'pronto', status: 'disponivel', preco: 1850, condominio: 0, iptu: 70, bairro: 'Vila Nogueira', cidade: 'Diadema', endereco: 'Uso interno', quartos: 2, suites: 0, banheiros: 1, vagas: 2, area_util_m2: 78, area_total_m2: 120, andar: 0, aceita_financiamento: false, minha_casa_minha_vida: false, aceita_fgts: false, diferenciais: ['churrasqueira', 'pet friendly'], fotos: [], destaque: false, publicado: true, created_at: stamp, updated_at: stamp }]; }
  function readMock() { var raw = localStorage.getItem(KEY); if (!raw) { var seed = mockSeed(); localStorage.setItem(KEY, JSON.stringify(seed)); return seed; } try { return JSON.parse(raw) || []; } catch (_) { return []; } }
  function writeMock(rows) { localStorage.setItem(KEY, JSON.stringify(rows)); return clone(rows); }
  function nextCode(rows) { var max = rows.reduce(function (n, x) { var m = /^JC-(\d+)$/.exec(x.codigo || ''); return Math.max(n, m ? Number(m[1]) : 0); }, 0); return 'JC-' + String(max + 1).padStart(4, '0'); }
  function requireSupabase() { if (cfg.MODO !== 'supabase') throw new Error('Modo de dados inválido.'); if (!cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) throw new Error('Configuração do Supabase incompleta.'); if (!root.supabase) throw new Error('Supabase não carregou.'); }
  function usingMock() { if (cfg.MODO === 'mock') return true; requireSupabase(); return false; }
  function getClient() { requireSupabase(); if (!client) client = root.supabase.createClient(cfg.SUPABASE_URL.replace(/\/$/, ''), cfg.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }); return client; }
  function checkError(result) { if (result.error) throw result.error; return result.data; }
  function errorMessage(error) { var message = error && error.message ? String(error.message) : 'Erro desconhecido.'; return cfg.SUPABASE_URL ? message.replace(cfg.SUPABASE_URL, 'o projeto Supabase') : message; }
  function publicQuery() { return getClient().from('imoveis_publicos').select('*').order('destaque', { ascending: false }).order('created_at', { ascending: false }); }
  function allQuery() { return getClient().from('imoveis').select('*').order('created_at', { ascending: false }); }
  function blobUrl(blob) { return new Promise(function (resolve, reject) { var reader = new FileReader(); reader.onload = function () { resolve(reader.result); }; reader.onerror = reject; reader.readAsDataURL(blob); }); }
  var api = {
    mode: function () { return cfg.MODO; }, errorMessage: errorMessage,
    isConnected: function () { return cfg.MODO === 'supabase' && !!cfg.SUPABASE_URL && !!cfg.SUPABASE_ANON_KEY && !!root.supabase; },
    listPublic: async function () { if (usingMock()) return readMock().filter(function (x) { return x.publicado; }).sort(function (a, b) { return Number(b.destaque) - Number(a.destaque) || String(b.created_at).localeCompare(String(a.created_at)); }); return checkError(await publicQuery()); },
    listAdmin: async function () { if (usingMock()) return readMock().sort(function (a, b) { return String(b.created_at).localeCompare(String(a.created_at)); }); return checkError(await allQuery()); },
    get: async function (propertyId) { if (usingMock()) return readMock().find(function (x) { return x.id === propertyId; }) || null; return checkError(await getClient().from('imoveis').select('*').eq('id', propertyId).single()); },
    save: async function (input) {
      var data = Object.assign({}, input, { updated_at: now() });
      var propertyId = data.id == null ? '' : String(data.id).trim();
      delete data.codigo;
      if (!propertyId) { if (usingMock()) { var rows = readMock(); data.id = id(); data.codigo = nextCode(rows); data.created_at = now(); rows.unshift(data); writeMock(rows); return clone(data); } return checkError(await getClient().from('imoveis').insert(data).select().single()); }
      delete data.created_at; data.id = propertyId;
      if (usingMock()) { var rows2 = readMock(); var index = rows2.findIndex(function (x) { return x.id === propertyId; }); if (index < 0) throw new Error('Imóvel não encontrado.'); rows2[index] = Object.assign({}, rows2[index], data, { id: propertyId, codigo: rows2[index].codigo }); writeMock(rows2); return clone(rows2[index]); }
      return checkError(await getClient().from('imoveis').update(data).eq('id', propertyId).select().single());
    },
    remove: async function (propertyId) { if (usingMock()) { writeMock(readMock().filter(function (x) { return x.id !== propertyId; })); return true; } return checkError(await getClient().from('imoveis').delete().eq('id', propertyId)); },
    duplicate: async function (propertyId) {
      var original = await api.get(propertyId); if (!original) throw new Error('Imóvel não encontrado.');
      var copy = Object.assign({}, original); delete copy.id; delete copy.codigo; copy.titulo = original.titulo + ' (cópia)'; copy.publicado = false; copy.destaque = false;
      if (usingMock()) return api.save(copy);
      copy.fotos = [];
      var created = await api.save(copy), storage = getClient().storage.from('imoveis-fotos'), copiedPaths = [], urls = [];
      try {
        for (var index = 0; index < (original.fotos || []).length; index += 1) { var url = original.fotos[index];
          var marker = '/storage/v1/object/public/imoveis-fotos/', value = String(url || ''), at = value.indexOf(marker);
          if (at < 0) throw new Error('Foto sem caminho válido para duplicação.');
          var source = decodeURIComponent(value.slice(at + marker.length)).replace(/[?#].*$/, ''), destination = 'imoveis/' + created.id + '/' + index + '.webp', thumbSource = source.replace(/\.webp$/, '_t.webp'), thumbDestination = 'imoveis/' + created.id + '/' + index + '_t.webp';
          copiedPaths.push(destination, thumbDestination); checkError(await storage.copy(source, destination)); checkError(await storage.copy(thumbSource, thumbDestination)); urls.push(storage.getPublicUrl(destination).data.publicUrl);
        }
        return api.save(Object.assign({}, created, { id: created.id, fotos: urls }));
      } catch (error) {
        if (copiedPaths.length) await storage.remove(copiedPaths);
        await api.remove(created.id);
        throw error;
      }
    },
    login: async function (email, password) { if (usingMock()) { if (email === 'corretor@jurandir.local' && password === 'mock-1234') { sessionStorage.setItem(SESSION, '1'); return { user: { email: email } }; } throw new Error('Não foi possível entrar.'); } return checkError(await getClient().auth.signInWithPassword({ email: email, password: password })); },
    logout: async function () { if (usingMock()) { sessionStorage.removeItem(SESSION); return; } checkError(await getClient().auth.signOut()); },
    session: async function () { if (usingMock()) return sessionStorage.getItem(SESSION) ? { user: { email: 'corretor@jurandir.local' } } : null; return checkError(await getClient().auth.getSession()).session; },
    upload: async function (propertyId, index, fullBlob, thumbBlob) { if (usingMock()) return { full: await blobUrl(fullBlob), thumb: await blobUrl(thumbBlob) }; var storage = getClient().storage.from('imoveis-fotos'); var base = 'imoveis/' + propertyId + '/' + index; var full = base + '.webp'; var thumb = base + '_t.webp'; checkError(await storage.upload(full, fullBlob, { upsert: true, contentType: fullBlob.type || 'image/webp' })); checkError(await storage.upload(thumb, thumbBlob, { upsert: true, contentType: thumbBlob.type || 'image/webp' })); return { full: storage.getPublicUrl(full).data.publicUrl, thumb: storage.getPublicUrl(thumb).data.publicUrl }; },
    removeFiles: async function (propertyId, count) { if (usingMock()) return; var paths = []; for (var i = 0; i < count; i += 1) paths.push('imoveis/' + propertyId + '/' + i + '.webp', 'imoveis/' + propertyId + '/' + i + '_t.webp'); if (paths.length) checkError(await getClient().storage.from('imoveis-fotos').remove(paths)); },
    removeExplicitFiles: async function (propertyId, urls) { if (usingMock() || !urls || !urls.length) return; var marker = '/storage/v1/object/public/imoveis-fotos/'; var paths = []; urls.forEach(function (url) { var value = String(url || ''); var at = value.indexOf(marker); if (at < 0) return; var path = decodeURIComponent(value.slice(at + marker.length)); paths.push(path, path.replace(/\.webp($|\?)/, '_t.webp$1')); }); if (paths.length) checkError(await getClient().storage.from('imoveis-fotos').remove(paths)); }
  };
  root.JurandirData = api;
})(window);
