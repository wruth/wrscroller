(function($) {
  /*
    ======== A Handy Little QUnit Reference ========
    http://api.qunitjs.com/

    Test methods:
      module(name, {[setup][ ,teardown]})
      test(name, callback)
      expect(numberOfAssertions)
      stop(increment)
      start(decrement)
    Test assertions:
      ok(value, [message])
      equal(actual, expected, [message])
      notEqual(actual, expected, [message])
      deepEqual(actual, expected, [message])
      notDeepEqual(actual, expected, [message])
      strictEqual(actual, expected, [message])
      notStrictEqual(actual, expected, [message])
      throws(block, [expected], [message])
  */

  module('jQuery#wrscroller', {
    // This will run before each test in this module.
    setup: function () {
      this.$wrscroller = $('#qunit-fixture .scroller').wrscroller();
      this.wrscroller = this.$wrscroller.data('wrscroller');
    },
    teardown: function () {
      this.wrscroller.destroy();
      this.$wrscroller = null;
    }
  });

  test('is chainable', function () {
    expect(1);
    var elems = $('#qunit-fixture').children();
    // Not a bad test to run on collection methods.
    strictEqual(elems.wrscroller(), elems, 'should be chainable');
  });

  test('endpoints', function() {
    expect(6);
    strictEqual(this.wrscroller.isAtStart, true, 'should initially be at start');
    strictEqual(this.wrscroller.isAtEnd, false, 'should not initially be at end');
    this.wrscroller.next();
    strictEqual(this.wrscroller.isAtStart, false, 'after next should not be at start');
    strictEqual(this.wrscroller.isAtEnd, true, 'after next should be at end');
    this.wrscroller.previous();
    strictEqual(this.wrscroller.isAtStart, true, 'after previous should be at start');
    strictEqual(this.wrscroller.isAtEnd, false, 'after previous should not be at end');
  });

}(jQuery));
