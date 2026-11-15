import test from 'node:test';
import assert from 'node:assert/strict';
import { normalize } from '../dist/modules/shared/utils.js';
import { readSavedStories, writeSavedStories } from '../dist/modules/services/saved-stories.js';

test('búsqueda conserva equivalencia de mayúsculas y tildes', () => {
  assert.equal(normalize('Tecnología PÚBLICA'), normalize('tecnologia publica'));
});

test('guardados descarta datos corruptos, IDs desconocidos y duplicados', () => {
  const stories = [{ id: 'ciudad' }];
  for (const content of ['bad json', '{}', 'null']) {
    assert.deepEqual([...readSavedStories(stories, { getItem: () => content })], []);
  }
  assert.deepEqual(
    [...readSavedStories(stories, { getItem: () => '["ciudad","otro","ciudad"]' })],
    ['ciudad'],
  );
});

test('almacenamiento denegado no rompe la portada', () => {
  const blocked = {
    getItem() {
      throw new Error('denied');
    },
    setItem() {
      throw new Error('quota');
    },
  };
  assert.deepEqual([...readSavedStories([], blocked)], []);
  assert.equal(writeSavedStories(new Set(['ciudad']), blocked), false);
});
