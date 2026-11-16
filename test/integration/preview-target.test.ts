import { test } from 'node:test';
import assert from 'node:assert/strict';
import { previewTarget } from '../../src/database/preview-target';

test('compatibilidad Preview: no cambia development o CI', () => {
  assert.equal(previewTarget({}), undefined);
  assert.equal(previewTarget({ NP_ENV: 'development' }), undefined);
});
