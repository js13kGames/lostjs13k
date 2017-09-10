/* jshint node: true */
"use strict";

module.exports = function(seed) {
  /*function random() {
    var x = Math.sin(.8765111159592828 + seed++) * 1e4
    return x - Math.floor(x)
  }*/
  function random(){
    return Math.random();
  }
  
  var rng = {
    /**
     * Return an integer within [0, max).
     *
     * @param  {int} [max]
     * @return {int}
     * @api public
     */
    int: function(max) {
      return random() * (max || 0xfffffff) | 0;
    },
    /**
     * Return a float within [0.0, 1.0).
     *
     * @return {float}
     * @api public
     */
    float: function() {
      return random();
    },
    /**
     * Return a boolean.
     *
     * @return {Boolean}
     * @api public
     */
    bool: function() {
      return random() > 0.5;
    },
    /**
     * Return an integer within [min, max).
     *
     * @param  {int} min
     * @param  {int} max
     * @return {int}
     * @api public
     */
    range: function(min, max) {
      return rng.int(max - min) + min;
    },
    sign: function(){
      return rng.bool() ? 1 : -1;
    },
    chance: function(val) {
      return rng.range(0,100) <= val;
    },
    /**
     * Pick an element from the source.
     *
     * @param  {mixed[]} source
     * @return {mixed}
     * @api public
     */
    pick: function(source) {
      return source[rng.range(0, source.length)];
    },
    pickS: function(s) {
      return s.charAt(rng.range(0, s.length));
    }
  };

  return rng;
};
