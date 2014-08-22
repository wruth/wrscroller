/*
 * wrscroller
 * https://github.com/wardmruth/wrscroller
 *
 * Copyright (c) 2014 Ward Ruth
 * Licensed under the MIT license.
 */

(function($) {

  // Collection method.
  $.fn.wrscroller = function() {
    return this.each(function(i) {
      // Do something awesome to each selected element.
      $(this).html('awesome' + i);
    });
  };

  // Static method.
  $.wrscroller = function(options) {
    // Override default options with passed-in options.
    options = $.extend({}, $.wrscroller.options, options);
    // Return something awesome.
    return 'awesome' + options.punctuation;
  };

  // Static method default options.
  $.wrscroller.options = {
    punctuation: '.'
  };

  // Custom selector.
  $.expr[':'].wrscroller = function(elem) {
    // Is this element awesome?
    return $(elem).text().indexOf('awesome') !== -1;
  };

}(jQuery));
