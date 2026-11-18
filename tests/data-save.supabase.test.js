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
