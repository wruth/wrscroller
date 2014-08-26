# WRScroller

A very simple jQuery scroller. WRScroller has minimal requirements for structure and styling your content, preferring to be unobtrusive and just scroll the content! WRScroller doesn't have any detailed knowledge of what that content is: scrolling is performed in increments of it's viewport width. If the computed width of the scroll container content is not evenly divisible by the width of the viewport, the final scroll will be only just enough to fully show the last content. Scroll stops are computed from the start and the end on this basis, making scrolling groups of multiple items at a time easy.

## Getting Started
Download the [production version][min] or the [development version][max].

[min]: https://raw.github.com/wardmruth/wrscroller/master/dist/wrscroller.min.js
[max]: https://raw.github.com/wardmruth/wrscroller/master/dist/wrscroller.js
[transform]: https://github.com/louisremi/jquery.transform.js

In your web page:

```html
<script src="jquery.js"></script>
<script src="dist/wrscroller.min.js"></script>
<script>
	$(document).ready(function () {
		$('.scroller').wrscroller();
	});
</script>
```
And sample markup might be:
```html
<div class="scroller">
	<div class="viewport">
		<ul class="scrollContainer">
			<li>One</li>
			<li>Two</li>
			<li>Three</li>
			<li>Four</li>
			<li>Five</li>
		</ul>
	</div>
	<a href="#" clas="nav previous">previous</a>
	<a href="#" class="nav next">next</a>
</div>
```
And some simple example css to support this (assumes `box-sizing: border-box`, but that's not a requirement):
```css
.scroller {
	position: relative;
	width: 960px;
}

.scroller .viewport {
	position: relative;
	width: 100%;
	height: 300px;
}

.scroller .viewport .scrollContainer {
	list-style: none;
	padding: 0;
	position: absolute;
}

.scroller .viewport .scrollContainer li {
	display: block;
	float: left;
	margin: 0 10px;
	width: 220px;
	height: 300px;
}

.scroller .nav {
	position: absolute;
	display: block;
}

.scroller .previous {
	left: 0;
}

.scroller .next {
	right: 0;
}
```
## Documentation
### Assumptions
WRScroller has a few basic expectations about the structure of the div it is applied to (like the basic example shown above in Getting Started):

1. The root div (the one(s) the plugin is invoked on) contains a child div considered the 'viewport'.
2. Optionally (but very likely) the root div also has two child elements which it will listen for click events on that function as previous and next controls.
3. Whatever width the viewport div has will be used as the basic scrolling increment.
4. The viewport div uses relative postioning.
5. The viewport div's first child is considered the scroll container, and should be absolutely positioned at left: 0.
6. The scroll container contains some number of child block elements.

### Basic Structure and Behavior
A simplified view of this (omitting the nav elements) might look something like this:

```
+---------------------------+               
| wrscroller                |               
|+-------------------------+|               
|| .viewport               ||               
|| +---------------------------------------+
|| | $scrollContainer      |               |
|| | +---+   +---+   +---+ | +---+   +---+ |
|| | |   |   |   |   |   | | |   |   |   | |
|| | | 1 |   | 2 |   | 3 | | | 4 |   | 5 | |
|| | |   |   |   |   |   | | |   |   |   | |
|| | +---+   +---+   +---+ | +---+   +---+ |
|| +---------------------------------------+
||                         ||               
|+-------------------------+|               
+---------------------------+               
               

```
When it is initialized, the WRScroller sums the widths of the $scrollContainer's children, including their horizontal margins. This value is then assigned as the explicit style width of the $scrollContainer. Then, as you would expect, scrolling is achieved by animating the horizontal position of the $scrollContainer. 

The scroll animation is achieved using a CSS3 2D transform if possible, or failing that fallsback to animating the $scrollContainer's `left` value.

### Configuration
An options argument Object can be provided when invoking wrscroller. Configuration properties and their default values are:

* `scrollDuration`: `250` (milliseconds)
* `scrollEasing`: `'swing'`
* `viewportSelector`: `'.viewport'`
* `previousSelector`: `'.previous'`
* `nextSelector`: `'.next'`
* `completeCallback`: no op.

The `completeCallback` if provided will be called when scrolling animations are complete. A reference to the `WRScroller` instance itself is provided as the sole argument to the callback.

### Further Notes on Behavior and Functionality
* WRScroller will manage adding and removing a `.disabled` class to the previous and next controls (if they exist) when it determines the `$scrollContainer` will reach or leave it's leftmost or rightmost position.
* WRScroller will add and remove a `.mouse-enter` class on it's root element when the user's mouse enters or leaves the component. This can be useful if you want to modify the visual state of the nav elements or the scroller in response to this.
* The WRScroller is in fact implemented by creating instances of a `WRScroller` "class" for each matching wrapped element. This instance is stored in a `data-wrscroller` attribute on the scroller element, allowing you to retrieve a direct reference to the instance.
* `WRScroller` exposes two public methods you can call independently: `previous()` and `next()`. These each return a reference to the scroller itself.
* `WRScroller` maintains two public Boolean properties: `isAtStart` and `isAtEnd`. These properties are updated at _the beginning_ of a scroll that will complete with the scroller at either it's start or end position.

## Dependencies
* jQuery 1.4.3+
* [jquery.transform.js][transform] (augments jQuery to use CSS3 transforms)

## Installation
Manually of course by downloading the un-minified or minified source (and the noted dependencies above), _or_ as a bower package: `foo`

## Release History
_(Nothing yet)_

## License
Copyright (c) 2014 Ward Ruth

Licensed under the MIT License