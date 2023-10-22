(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }
function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i]; return arr2; }
function _iterableToArrayLimit(arr, i) { var _i = null == arr ? null : "undefined" != typeof Symbol && arr[Symbol.iterator] || arr["@@iterator"]; if (null != _i) { var _s, _e, _x, _r, _arr = [], _n = !0, _d = !1; try { if (_x = (_i = _i.call(arr)).next, 0 === i) { if (Object(_i) !== _i) return; _n = !1; } else for (; !(_n = (_s = _x.call(_i)).done) && (_arr.push(_s.value), _arr.length !== i); _n = !0); } catch (err) { _d = !0, _e = err; } finally { try { if (!_n && null != _i["return"] && (_r = _i["return"](), Object(_r) !== _r)) return; } finally { if (_d) throw _e; } } return _arr; } }
function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }
/*
 * Federated Wiki : Chart Plugin
 *
 * Licensed under the MIT license.
 * https://github.com/fedwiki/wiki-plugin-chart/blob/master/LICENSE.txt
 */
var display, findData, formatTime, last;
last = function last(array) {
  return array[array.length - 1];
};
formatTime = function formatTime(time) {
  var am, d, h, mi, mo;
  d = new Date(time > 10000000000 ? time : time * 1000);
  mo = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()];
  h = d.getHours();
  am = h < 12 ? 'AM' : 'PM';
  h = h === 0 ? 12 : h > 12 ? h - 12 : h;
  mi = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes();
  return "".concat(h, ":").concat(mi, " ").concat(am, "<br>").concat(d.getDate(), " ").concat(mo, " ").concat(d.getFullYear());
};
display = function display($item, data) {
  var sample, time;
  var _data = _slicedToArray(data, 2);
  time = _data[0];
  sample = _data[1];
  $item.find('p:first').text(sample.toFixed(1));
  return $item.find('p:last').html(formatTime(time));
};
findData = function findData(item, thumb) {
  var data, i, len, ref;
  ref = item.data;
  for (i = 0, len = ref.length; i < len; i++) {
    data = ref[i];
    if (data[0] === thumb) {
      return data;
    }
  }
  return null;
};
window.plugins.chart = {
  emit: function emit($item, item) {
    var captionElement, chartElement, sample, time;
    var _last = last(item.data);
    var _last2 = _slicedToArray(_last, 2);
    time = _last2[0];
    sample = _last2[1];
    chartElement = $('<p />').addClass('readout').appendTo($item).text(sample);
    return captionElement = $('<p />').html(wiki.resolveLinks(item.caption)).appendTo($item);
  },
  bind: function bind($item, item) {
    var lastThumb;
    lastThumb = null;
    $item.find('p:first').on('mousemove', function (e) {
      var data, sample, time;
      if (typeof e.offsetX === "undefined") {
        e.offsetX = e.pageX - $(e.target).offset().left;
      }
      if ((data = item.data[Math.floor(item.data.length * e.offsetX / e.target.offsetWidth)]) == null) {
        return;
      }
      var _data2 = data;
      var _data3 = _slicedToArray(_data2, 2);
      time = _data3[0];
      sample = _data3[1];
      if (time === lastThumb || null === (lastThumb = time)) {
        return;
      }
      display($item, data);
      return $item.trigger('thumb', +time);
    }).on('dblclick', function () {
      return wiki.dialog("JSON for ".concat(item.caption), $('<pre/>').text(JSON.stringify(item.data, null, 2)));
    });
    return $('.main').on('thumb', function (evt, thumb) {
      var data;
      if (thumb !== lastThumb && (data = findData(item, thumb))) {
        lastThumb = thumb;
        return display($item, data);
      }
    });
  }
};

},{}]},{},[1]);
