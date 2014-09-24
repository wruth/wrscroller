/*
 * WRScroller - v0.3.0-alpha - 2014-09-24
 * A very simple jQuery scroller.
 * https://github.com/wruth/wrscroller
 *
 * Copyright (c) 2014 Ward Ruth
 * Under MIT License
 */
;(function ($) {

    // used for jQuery event namespacing
    var ns = '.wrscroller';


    //--------------------------------------------------------------------------
    //
    // private functions (not scoped)
    //
    //--------------------------------------------------------------------------

    /**
     * Given a string with a list of comma delimited values within parentheses,
     * return an array of those values. For instance, 'matrix(1, 0, 0, 1, 0, 0)'
     * returns the Array ['1', '0', '0', '1', '0', '0'].
     *
     * @function _getMatrixFromString
     *
     * @param  {String} transformStr A formatted string: either the literal
     *                               value 'none', or expected to contain a list
     *                               of comma delimitted values, bounded by a
     *                               leading open paren ('('), and presumably a
     *                               final close paren (')').
     * @return {Array}               An Array of the Stringvalues which were
     *                               comma delimitted, or an Array representing
     *                               an identity matrix.
     */
    function _getMatrixFromString (transformStr) {

        if (transformStr === 'none') {
            return ['1', '0', '0', '1', '0', '0'];
        }

        var startIndex = transformStr.indexOf('(') + 1,
            arrStr = transformStr.slice(startIndex, -1),
            transformArr = arrStr.split(',');

        return transformArr;
    }

    /**
     * Given an Array of transform matrix values, return a properly formatted
     * String representatin for using in a CSS style:transform property.
     *
     * @function _getTransformStringFromMatrix
     *
     * @param  {Array} matrix An Array of values representing the components of
     *                        an affine transform.
     * @return {String}       A formatted String value, of the form
     *                        'matrix( a, c, b, d, tx, ty)'
     */
    function _getTransformStringFromMatrix (matrix) {
        return 'matrix(' + matrix.join(', ') + ')';
    }

    /**
     * Simple factory/utility function that copies the principle values of a
     * Touch object that the scroller is interested in into a fresh Object.
     *
     * @function _copyTouch
     *
     * @param  {Touch} touch A Touch object, from some TouchEvent.
     * @return {Object}      A simple Object, with copied values for identifier,
     *                       pageX, and pageY.
     */
    function _copyTouch (touch) {
        return {
            identifier: touch.identifier,
            pageX: touch.pageX,
            pageY: touch.pageY
        };
    }


    //--------------------------------------------------------------------------
    //
    // constructor
    //
    //--------------------------------------------------------------------------

    /**
     * WRScroller constructor. Internally to the plugin an instance is created
     * for each element.
     *
     * @constructor
     *
     * @param {DOM element} el  The DOM element constituting the root of a
     *                          scroller context
     *
     * @param {Object} settings Parameter object which can provide
     *                          initialization properties to override the
     *                          defaults.
     */
    $.WRScroller = function (el, settings) {
        this.el = el;
        this.$el = $(el);

        _init.call(this, settings);
    };

    //--------------------------------------------------------------------------
    //
    // public methods
    //
    //--------------------------------------------------------------------------

    /**
     * Scroll to previous (right) position if possible. Add 'disabled' class to
     * previous control if at the end of the scroll the scroller will be in the
     * rightmost or initial position.
     *
     * @method previous
     * @return {$.WRScroller} Returns the scroller instance to facilitate
     *                        chaining.
     */
    $.WRScroller.prototype.previous = function () {

       if (this.stepIndex > 0) {
            _stopScrolling.call(this);
            _scrollToPosition.call(this, this.stepPositions[--this.stepIndex]);
            _enableControls.call(this);

            if (this.stepIndex === 0) {
                this.$previous.addClass('disabled');
                this.isAtStart = true;
                _generateStepPositions.call(this, true);
            }
       }

       return this;
    };

    /**
     * Scroll to next (left) position if possible. Add 'disabled' class to next
     * control if at the end of the scroll the scroller will be in the leftmost
     * or final position.
     *
     * @method next
     * @return {$.WRScroller} Returns the scroller instance to facilitate
     *                        chaining.
     */
    $.WRScroller.prototype.next = function () {

       if (this.stepIndex < this.numSteps - 1) {
            _stopScrolling.call(this);
            _scrollToPosition.call(this, this.stepPositions[++this.stepIndex]);
            _enableControls.call(this);

            if (this.stepIndex === this.numSteps - 1) {
                this.$next.addClass('disabled');
                this.isAtEnd = true;
                _generateStepPositions.call(this, false);
            }
       }

       return this;
    };

    /**
     * Stop any scrolls in progress, remove any classes that have been added by
     * the plugin, remove all listeners added by this plug-in, and otherwise
     * return the main div and it's children to the state they were in before
     * this plugin was invoked on them.
     *
     * @method  destroy
     */
    $.WRScroller.prototype.destroy = function () {
        var $el = this.$el,
            $viewport = this.$viewport;

        _stopScrolling.call(this);
        _enableControls.call(this);

        if (this.$previous) {
            this.$previous.off('click' + ns);
        }

        if (this.$next) {
            this.$next.off('click' + ns);
        }

        $el.off('mouseenter' + ns);
        $el.off('mouseleave' + ns);

        $viewport.off('touchstart' + ns);
        $viewport.off('touchmove' + ns);
        $viewport.off('touchend' + ns);

        $el.removeClass('mouse-enter');
        $el.removeData('mouse-enter');
        $el.removeData('wrscroller');

        this.$scrollContainer.removeAttr('style');
    };


    //--------------------------------------------------------------------------
    //
    // private methods
    //
    //--------------------------------------------------------------------------

    /**
     * Discover internal elements, compute width of scrolling container,
     * determine number of scroll steps.
     *
     * @method _init
     * @param  {Object} settings Parameter object with initialization settings
     */
     function _init (settings) {
        var $el = this.$el;
        this.$previous = $el.find(settings.previouseSelector);
        this.$next = $el.find(settings.nextSelector);
        this.$viewport = $el.find(settings.viewportSelector);
        this.$scrollContainer = $(this.$viewport.children()[0]);
        this.settings = settings;
        this.viewportWidth = this.$viewport.outerWidth();
        this.scrollChildrenWidth = _computeAndApplyScrollContainerWidth.call(this);
        this.numSteps = Math.ceil(this.scrollChildrenWidth / this.viewportWidth);
        this.stepIndex = 0;
        this.isAtStart = true;
        this.isAtEnd = (this.scrollChildrenWidth <= this.viewportWidth);

        _generateStepPositions.call(this, true);

        //
        //  ensure left control starts out disabled, since the scroll container
        //  should initially be at it's rightmost position
        //
        if (this.$previous) {
            this.$previous.addClass('disabled');
        }

        if (this.isAtEnd && this.$next) {
          this.$next.addClass('disabled');
        }

        this.touch = null;
        _attachHandlers.call(this);

        //
        // :TODO: should probably add a check if scrolling is necessary at
        // all, and hide the scrolling ui if not
        //
    }

    /**
     * Iterate over each child in the $scrollContainer to sum up their widths
     * (including margins). Apply this summed width as the width of the
     * $scrollContainer (otherwise the $scrollContainer would naturally remain
     * width bound by it's parent container).
     *
     * @method _computeAndApplyScrollContainerWidth
     * @private
     * @return {Number} Summed width of the $scrollContainer's children.
     */
     function _computeAndApplyScrollContainerWidth () {
        var scrollChildrenWidth = 0;

        this.$scrollContainer.children().each(function () {
            scrollChildrenWidth += $(this).outerWidth(true);
        });

        this.$scrollContainer.css('width', scrollChildrenWidth + 'px');
        return scrollChildrenWidth;
    }

    /**
     * Creates an array of step positions, populated with the x coordinate of
     * each postion the scroller can scroll to. This is recalculated each time
     * the scroller reaches it's beginning or end position because the total
     * scroll content width may not be evenly divisible by the width of the
     * viewport. In conjunction with stepIndex this constitutes a simple kind of
     * model, allowing the scroller to gracefully handle multiple transition
     * requests in a row.
     *
     * @method _generateStepPositions
     * @private
     *
     * @param  {Boolean} fromStart Flag indicates if positions should be
     *                             calculated from the starting position.
     *                             Otherwise they are calculated from the
     *                             end postion.
     */
     function _generateStepPositions (fromStart) {
        var stepPositions = new Array(this.numSteps),
            stepMinX = this.viewportWidth - this.scrollChildrenWidth,
            lastIndex = this.numSteps - 1,
            i,
            j;

        stepPositions[0] = 0;
        stepPositions[lastIndex] = stepMinX;

        if (fromStart) {

            for (i = 1; i < lastIndex; i++) {
                stepPositions[i] = -(i * this.viewportWidth);
            }
        }
        // from end
        else {

            for (i = lastIndex - 1, j = 1; i > 0; i--, j++) {
                stepPositions[i] = stepMinX + j * this.viewportWidth;
            }
        }

        this.stepPositions = stepPositions;
    }

    /**
     * Attach event handlers to the previous and next controls if they exist,
     * and also to the root containing element for mouseenter and mouseleave
     * events in order to add or remove a 'mouse-enter' class for the scroller
     * denoting this state. Client code or css may employ the presence or
     * absense of the of the 'mouse-enter' class to do such things as hide and
     * show the ui controls for instance.
     *
     * @method _attachHandlers
     * @private
     */
     function _attachHandlers () {
        var $el = this.$el,
            $viewport = this.$viewport;

        if (this.$previous) {
            this.$previous.off('click' + ns);
            this.$previous.on('click' + ns, $.proxy(this.previous, this));
        }

        if (this.$next) {
            this.$next.off('click' + ns);
            this.$next.on('click' + ns, $.proxy(this.next, this));
        }

        $el.off('mouseenter' + ns);
        $el.off('mouseleave' + ns);

        $el.on('mouseenter' + ns, function () {
                $el.addClass('mouse-enter');
                $el.data('mouse-enter', 'yes');
            });

        $el.on('mouseleave' + ns, function () {
                $el.removeClass('mouse-enter');
                $el.removeData('mouse-enter');
            });

        $viewport.on('touchstart' + ns, $.proxy(_touchStartHandler, this));
        $viewport.on('touchcancel' + ns, $.proxy(_touchCancelHandler, this));
    }

    /**
     * Convenience method abstracting stopping $scrollContainer animation.
     *
     * @method _stopScrolling
     * @private
     */
    function _stopScrolling () {
        this.$scrollContainer.stop();
    }

    /**
     * Low level scroll method to move the $scrollContainer to a designated
     * horizontal pixel position.
     * Note this takes advantage of Louis-Rémi Babé's jquery.transform jQuery
     * animate extension:
     * http://louisremi.github.io/jquery.transform.js/index.html
     *
     * @method  _scrollToPosition
     * @private
     * @param  {String} position Should be a string value formatted as a valid
     *                           css scalar value, such as '123px'
     */
     function _scrollToPosition (position) {
        var _this = this;

        this.$scrollContainer.animate(
            {transform: 'translateX(' + position + ')'},
            this.isShortTouch ? this.settings.flickScrollDuration : this.settings.scrollDuration,
            this.settings.scrollEasing,
            function () {
                _this.settings.completeCallback(_this);
            });
    }

    /**
     * Convenience method for resetting from an aborted swipe.
     *
     * @method _scrollToCurrentIndex
     * @private
     */
    function _scrollToCurrentIndex () {
        _scrollToPosition.call(this, this.stepPositions[this.stepIndex]);
    }

    /**
     * Convenience method to remove a 'disabled' class from the ui controls.
     * This is done every time a scroll is successfully initiated, and prior
     * to determining if any control should be disabled.
     *
     * @method _enableControls
     * @private
     */
     function _enableControls () {

        if (this.$previous) {
            this.$previous.removeClass('disabled');
        }

        if (this.$next) {
            this.$next.removeClass('disabled');
        }

        this.isAtStart = this.isAtEnd = false;
    }

    /**
     * Get a transform scale value from the viewport element, if one has been
     * applied. This could be the case if the scroller is in a responsive
     * layout.
     *
     * @method _getScrollerScale
     * @private
     *
     * @return {Number} A float value representing any scale value that has been
     *                  applied to the viewport. Defaults to 1 (no scale).
     */
    function _getScrollerScale () {
        var scaleStr = this.$viewport.css('transform');

        if (scaleStr === 'none') {
            return 1;
        }
        else {
            return parseFloat(_getMatrixFromString(scaleStr)[0]);
        }
    }

    /**
     * On 'touchend' or 'touchcancel', remove 'touchmove' and 'touchend'
     * handlers, plus cleanup other touch monitoring properties, such as the
     * touch copy of the 'touchstart' Touch object.
     *
     * @method _cleanupTouch
     * @private
     */
    function _cleanupTouch () {
        this.$viewport.off('touchmove' + ns);
        this.$viewport.off('touchend' + ns);
        this.touch = null;
        clearTimeout(this.timeoutId);
        this.timeoutId = 0;
        this.isShortTouch = false;
    }

    /**
     * From among the Touches associated with a current TouchEvent, find the
     * Touch that corresponds to the initial cached copy of the 'touchstart'
     * Touch.
     *
     * @method _findMatchingTouch
     * @private
     *
     * @param  {Array} touches An Array of Touches from a current TouchEvent
     * @return {Touch}         A Touch with an identifier matching the
     *                         'touchstart' Touch, or null if no match.
     */
    function _findMatchingTouch (touches) {

        // shouldn't happen, but cheap insurance ;-)
        if (!this.touch) {
            return null;
        }

        var len = touches.length,
            i;

        for (i = 0; i < len; i++) {

            if (touches[i].identifier === this.touch.identifier) {
                return touches[i];
            }
        }

        return null;
    }

    /**
     * Get the pixel x distance of the supplied Touch from the pageX value of
     * the initial 'touchstart' Touch. This value is scaled to match the scaling
     * of the viewport so it can be used directly (otherwise pixel distances on
     * the device may not match pixel distances in a scale tranformed viewport).
     *
     * @method _getChangeX
     * @private
     *
     * @param  {Touch} changeTouch A current Touch object.
     * @return {Number}            A value representing the change in X
     *                             position. A negative value means the current
     *                             Touch is to the left of the original Touch,
     *                             a positive value means the current Touch is
     *                             to the right.
     */
    function _getChangeX (changeTouch) {
        return (changeTouch.pageX - this.touch.pageX) / _getScrollerScale.call(this);
    }


    //--------------------------------------------------------------------------
    //
    // event handlers (private)
    //
    //--------------------------------------------------------------------------

    /**
     * Handler for 'touchstart' events. If not currently tracking against a
     * 'touchstart' Touch, cache a copy of this Touch and the initial translate
     * transform on the scroll container to use for calculating 'touchmove'
     * offsets against. Also only add 'touchmove' and 'touchend' handlers at
     * this point. Also start a timeout to help in determining if the final
     * gesture should be interpreted as a flick or not.
     *
     * @method _touchStartHandler
     * @private
     *
     * @param  {$.Event} ev A jQuery Event object, wrapping a TouchEvent.
     */
    function _touchStartHandler (ev) {
        var $viewport = this.$viewport,
            _this = this;

        if (!this.touch) {
            _stopScrolling.call(this);
            this.touchStartMatrix = _getMatrixFromString(this.$scrollContainer.css('transform'));
            this.touch = _copyTouch(ev.originalEvent.changedTouches[0]);
            $viewport.on('touchmove' + ns, $.proxy(_touchMoveHandler, this));
            $viewport.on('touchend' + ns, $.proxy(_touchEndHandler, this));

            this.isShortTouch = true;
            this.timeoutId = setTimeout($.proxy(
                function () {
                    _this.isShortTouch = false;
                },
                _this),
                250);
        }
    }

    /**
     * Handler for 'touchmove' events. Try to match up one of the events Touches
     * with the original 'touchstart' Touch. If found, get the change value and
     * update the cached translation for the move and apply it to the scroll
     * container.
     *
     * @method _touchMoveHandler
     * @private
     *
     * @param  {$.Event} ev A jQuery Event object, wrapping a TouchEvent.
     */
    function _touchMoveHandler (ev) {
        var matchingTouch = _findMatchingTouch.call(this, ev.originalEvent.changedTouches);

        ev.preventDefault();

        if (matchingTouch) {
            var changeMatrix = this.touchStartMatrix.slice(0);

            changeMatrix[4] = parseInt(this.touchStartMatrix[4]) + _getChangeX.call(this, matchingTouch);

            this.$scrollContainer.css('transform', _getTransformStringFromMatrix(changeMatrix));
        }

    }

    /**
     * Handler for a 'touchend' event. If a Touch from the event matches the
     * cached 'touchstart' event, determine if this is considered an intentional
     * swipe or flick or not. If the determination is positive, invoke the
     * appropriate scroll navigation. If positive, ensure the scroller returns
     * to it's appropriate resting state (undo any 'touchmove' dragging of the
     * scroll container).
     *
     * @method _touchEndHandler
     * @private
     *
     * @param  {$.Event} ev A jQuery Event object, wrapping a TouchEvent.
     */
    function _touchEndHandler (ev) {
        var matchingTouch = _findMatchingTouch.call(this, ev.originalEvent.changedTouches);

        if (matchingTouch) {
            var changeX = _getChangeX.call(this, matchingTouch);

            //
            // if the user has swiped over half the width of the viewport,
            // consider it an intentional swipe. Or if this was a brief swipe
            // (less than a quarter second), test if the distance exceeds a
            // hysteresis limit.
            //
            if (Math.abs(changeX) >= this.viewportWidth / 2 ||
                    this.isShortTouch && Math.abs(changeX) >= this.settings.shortTouchXLimit) {

                // negative change means appear to be scrolling right
                if (changeX < 0) {

                    if (!this.isAtEnd) {
                        this.next();
                    }
                    else {
                        _scrollToCurrentIndex.call(this);
                    }
                }
                // positive change means appear to be scrolling left
                else {

                    if (!this.isAtStart) {
                        this.previous();
                    }
                    else {
                        _scrollToCurrentIndex.call(this);
                    }
                }
            }
            else {
                _scrollToCurrentIndex.call(this);
            }

            _cleanupTouch.call(this);
        }
    }

    /**
     * Handler for a 'touchcancel' event. If a Touch from the event matches the
     * original cached 'touchstart', no swipe-scrolling should be triggered,
     * and cleanup the touch tracking.
     *
     * @method _touchCancelHandler
     * @private
     *
     * @param  {$.Event} ev A jQuery Event object, wrapping a TouchEvent.
     */
    function _touchCancelHandler (ev) {
        var matchingTouch = _findMatchingTouch.call(this, ev.originalEvent.changedTouches);

        if (matchingTouch) {
            _cleanupTouch.call(this);
            _scrollToCurrentIndex.call(this);
        }
    }


    //--------------------------------------------------------------------------
    //
    // jQuery plugin method and defaults
    //
    //--------------------------------------------------------------------------

    /**
     * Factory or invocation function to create instances of WRScroller's for
     * each memeber of the wrapped set.
     *
     * @param  {Object} options Parameter type object with initialization
     *                          properties for the scrollers.
     * @return {jQuery}         Returns the jQuery wrapped set of matching
     *                          elements, as is customary.
     */
    $.fn.wrscroller = function (options) {

        var settings = $.extend(
                {},
                $.fn.wrscroller.defaults,
                options || {}
            );

       return this.each(function () {
            var $this = $(this);

            if (!$this.data('wrscroller')) {
                $this.data('wrscroller', new $.WRScroller(this, settings));
            }
       });
    };

    /**
     * Defaults parameter object for scroller initialization properties used in
     * lieu of any client defined initialization properties.
     *
     * @type {Object}
     * @property {Number} scrollDuration Duration of scroll transition, in ms.
     *                                   Default is 250.
     * @property {Number} flickScrollDuration Duration of 'flick' gesture
     *                                        initiated transition. Default is
     *                                        125.
     * @property {String} scrollEasing One of the jQuery animation easing types.
     *                                 Default is 'swing'.
     * @property {String} viewportSelector A selector for the viewport. Default
     *                                     is '.viewport'.
     * @property {String} previousSelector A selector for the previous control.
     *                                     Default is '.previous'.
     * @property {String} nextSelector A selector for the next control. Default
     *                                 is '.next'.
     * @property {Number} shortTouchXLimit A hysteresis limit to help filter out
     *                                     unintentional flicks.
     * @property {Function} completeCallback A callback to invoke once a scroll
     *                                       animation is completed. The
     *                                       WRScroller instance is passed in as
     *                                       an argument.
     */
    $.fn.wrscroller.defaults = {
        scrollDuration: 250,
        flickScrollDuration: 125,
        scrollEasing: 'swing',
        viewportSelector: '.viewport',
        previouseSelector: '.previous',
        nextSelector: '.next',
        shortTouchXLimit: 10,
        /* jshint unused: false */
        completeCallback: function (wrscroller) {}
    };

}(jQuery));
