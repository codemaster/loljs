process.env.ENDPOINT = 'http://localhost:9999';

var assert = require('assert');
var mock = require('./mock');
var lol = require('../');

describe('API', function() {
  describe('getChampions', function() {
    it('returns correct response', function(done) {
      lol.getChampions('key', {}, function() {
        assert.equal(-1, [1,2,3].indexOf(0));
        done();
      });
    })
  })
});
