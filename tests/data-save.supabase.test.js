const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const test = require('node:test');

test('editar no Supabase usa update/eq(id), nunca insert', async () => {
  const calls = [];
  const chain = {
    select() { return this; },
    single() { return Promise.resolve({ data: { id: 'imovel-123', titulo: 'Atualizado' }, error: null }); },
    eq(field, value) { calls.push(['eq', field, value]); return this; },
    update(data) { calls.push(['update', data]); return this; },
    insert(data) { calls.push(['insert', data]); return this; }
  };
  const context = {
    window: {
      JURANDIR_CONFIG: { MODO: 'supabase', SUPABASE_URL: 'https://example.test', SUPABASE_ANON_KEY: 'anon' },
      supabase: { createClient() { return { from() { return chain; } }; } }
    },
    crypto: { randomUUID: () => 'generated' },
    Date, JSON, Promise, String, Number, Math
  };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('data.js', 'utf8'), context);
  await context.window.JurandirData.save({ id: 'imovel-123', titulo: 'Atualizado', fotos: [] });
  assert.equal(calls.filter((call) => call[0] === 'update').length, 1);
  assert.deepEqual(calls.find((call) => call[0] === 'eq'), ['eq', 'id', 'imovel-123']);
  assert.equal(calls.filter((call) => call[0] === 'insert').length, 0);
});

test('ciclo mock: criar, editar, duplicar, editar cópia e excluir original', async () => {
  const storage = new Map([['jurandir_imoveis_mock_v1', '[]']]);
  const context = {
    window: { JURANDIR_CONFIG: { MODO: 'mock' } },
    localStorage: { getItem: (key) => storage.get(key) || null, setItem: (key, value) => storage.set(key, value) },
    sessionStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    crypto: { randomUUID: (() => { let n = 0; return () => `mock-${++n}`; })() },
    Date, JSON, Promise, String, Number, Math
  };
  context.window.localStorage = context.localStorage;
  context.window.sessionStorage = context.sessionStorage;
  vm.createContext(context);
  vm.runInContext(fs.readFileSync('data.js', 'utf8'), context);
  const api = context.window.JurandirData;
  const original = await api.save({ titulo: 'Casa teste', fotos: ['data:image/webp;base64,original'] });
  const edited = await api.save({ id: original.id, titulo: 'Casa editada', fotos: original.fotos });
  assert.equal(edited.id, original.id);
  assert.equal(edited.codigo, original.codigo);
  assert.equal((await api.listAdmin()).length, 1);
  const copy = await api.duplicate(original.id);
  assert.notEqual(copy.id, original.id);
  const copyEdited = await api.save({ id: copy.id, titulo: 'Cópia editada', fotos: copy.fotos });
  await api.remove(original.id);
  const remaining = await api.get(copyEdited.id);
  assert.equal((await api.listAdmin()).length, 1);
  assert.deepEqual(remaining.fotos, ['data:image/webp;base64,original']);
});
