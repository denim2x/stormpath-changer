'use strict';

var assert = require('assert');
var express = require('express');


describe('init', function() {
  var opts = [
	'enablePasswordChange',
    'enablePasswordChangeAutoLogin',
	'passwordChangeView',
    'passwordChangeUrl',
    'postPasswordChangeRedirectUrl',
  ];

  it('should not require any options', function() {
    var app = express();

    assert.doesNotThrow(
      function() {
        settings.init(app);
      },
      TypeError
    );
  });

  it('should export options values on the app', function() {
    var app = express();
    var testOpts = {};

    for (var i = 0; i < opts.length; i++) {
      testOpts[opts[i]] = 'xxx';
    }

    settings.init(app, testOpts);

    for (var key in testOpts) {
      var exportedName = 'stormpath' + key.charAt(0).toUpperCase() + key.slice(1);
      assert.equal(app.get(exportedName), 'xxx');
    }
  });
});
