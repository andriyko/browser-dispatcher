const chai = require('chai');
const expect = chai.expect; // we are using the "expect" style of Chai
const proxyquire = require('proxyquire');
const open2 = proxyquire('../.././src/app/js/open2', {
  'child_process': {
    exec: function (cmd) { return cmd; }
  }
});

describe('open2', function () {
  it('open2() opens URL in a browser using its bundle identifier', function () {
    let result = open2('http://google.com', 'com.google.Chrome', '-b');
    expect(result).to.be.equal('open -b "com.google.Chrome" "http://google.com"');
  });

  it('open2() opens URL in a browser using its app identifier', function () {
    let result = open2('http://google.com', 'firefox', '-a');
    expect(result).to.be.equal('open -a "firefox" "http://google.com"');
  });

  it('open2() opens URL in a browser with a set of options', function () {
    let result = open2('http://google.com', 'com.google.Chrome', '-b', '-n -F');
    expect(result).to.be.equal('open -b "com.google.Chrome" -n -F "http://google.com"');
  });

  it('open2() opens URL in a browser with a set of additional arguments', function () {
    let result = open2('http://google.com', 'firefox', '-a', null, '-P "testProfile"');
    expect(result).to.be.equal('open -a "firefox" "http://google.com" −−args -P "testProfile"');
  });
});
