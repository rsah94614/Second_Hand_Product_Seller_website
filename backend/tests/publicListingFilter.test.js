const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { buildPublicListingFilter } = require('../src/modules/products/product.service');

describe('buildPublicListingFilter', () => {
  it('includes active unsold non-flagged listings with future or missing expiry', () => {
    const filter = buildPublicListingFilter();
    assert.equal(filter.isActive, true);
    assert.equal(filter.isSold, false);
    assert.deepEqual(filter.flagged, { $ne: true });
    assert.ok(Array.isArray(filter.$or));
    assert.equal(filter.$or.length, 3);
  });
});
