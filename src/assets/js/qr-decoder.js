(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define('qrcode', ['exports'], factory) :
  (global = global || self, factory(global.QRCode = {}));
}(this, function (exports) { 'use strict';

  /**
   * @module Mode
   * @author nuintun
   * @author Cosmo Wolfe
   * @author Kazuhiko Arase
   */

  (function (Mode) {
      Mode[Mode["Terminator"] = 0] = "Terminator";
      Mode[Mode["Numeric"] = 1] = "Numeric";
      Mode[Mode["Alphanumeric"] = 2] = "Alphanumeric";
      Mode[Mode["StructuredAppend"] = 3] = "StructuredAppend";
      Mode[Mode["Byte"] = 4] = "Byte";
      Mode[Mode["Kanji"] = 8] = "Kanji";
      Mode[Mode["ECI"] = 7] = "ECI";
      // FNC1FirstPosition = 0x5,
      // FNC1SecondPosition = 0x9
  })(exports.Mode || (exports.Mode = {}));

  /*! *****************************************************************************
  Copyright (c) Microsoft Corporation. All rights reserved.
  Licensed under the Apache License, Version 2.0 (the "License"); you may not use
  this file except in compliance with the License. You may obtain a copy of the
  License at http://www.apache.org/licenses/LICENSE-2.0

  THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
  KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
  WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
  MERCHANTABLITY OR NON-INFRINGEMENT.

  See the Apache Version 2.0 License for specific language governing permissions
  and limitations under the License.
  ***************************************************************************** */
  /* global Reflect, Promise */

  var extendStatics = function(d, b) {
      extendStatics = Object.setPrototypeOf ||
          ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
          function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
      return extendStatics(d, b);
  };

  function __extends(d, b) {
      extendStatics(d, b);
      function __() { this.constructor = d; }
      d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  }

  var __assign = function() {
      __assign = Object.assign || function __assign(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
              s = arguments[i];
              for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
          }
          return t;
      };
      return __assign.apply(this, arguments);
  };

  /**
   * @module QRData
   * @author nuintun
   * @author Kazuhiko Arase
   */
  var QRData = /*#__PURE__*/ (function () {
      function QRData(mode, data) {
          this.mode = mode;
          this.data = data;
      }
      QRData.prototype.getMode = function () {
          return this.mode;
      };
      QRData.prototype.getLengthInBits = function (version) {
          var mode = this.mode;
          var error = "illegal mode: " + mode;
          if (1 <= version && version < 10) {
              // 1 - 9
              switch (mode) {
                  case exports.Mode.Numeric:
                      return 10;
                  case exports.Mode.Alphanumeric:
                      return 9;
                  case exports.Mode.Byte:
                      return 8;
                  case exports.Mode.Kanji:
                      return 8;
                  default:
                      throw error;
              }
          }
          else if (version < 27) {
              // 10 - 26
              switch (mode) {
                  case exports.Mode.Numeric:
                      return 12;
                  case exports.Mode.Alphanumeric:
                      return 11;
                  case exports.Mode.Byte:
                      return 16;
                  case exports.Mode.Kanji:
                      return 10;
                  default:
                      throw error;
              }
          }
          else if (version < 41) {
              // 27 - 40
              switch (mode) {
                  case exports.Mode.Numeric:
                      return 14;
                  case exports.Mode.Alphanumeric:
                      return 13;
                  case exports.Mode.Byte:
                      return 16;
                  case exports.Mode.Kanji:
                      return 12;
                  default:
                      throw error;
              }
          }
          else {
              throw "illegal version: " + version;
          }
      };
      return QRData;
  }());

  /**
   * @module UTF8
   * @author nuintun
   */
  /**
   * @function UTF8
   * @param {string} str
   * @returns {number[]}
   * @see https://github.com/google/closure-library/blob/master/closure/goog/crypt/crypt.js
   */
  function UTF8(str) {
      var pos = 0;
      var bytes = [];
      var length = str.length;
      for (var i = 0; i < length; i++) {
          var code = str.charCodeAt(i);
          if (code < 128) {
              bytes[pos++] = code;
          }
          else if (code < 2048) {
              bytes[pos++] = (code >> 6) | 192;
              bytes[pos++] = (code & 63) | 128;
          }
          else if ((code & 0xfc00) === 0xd800 && i + 1 < length && (str.charCodeAt(i + 1) & 0xfc00) === 0xdc00) {
              // Surrogate Pair
              code = 0x10000 + ((code & 0x03ff) << 10) + (str.charCodeAt(++i) & 0x03ff);
              bytes[pos++] = (code >> 18) | 240;
              bytes[pos++] = ((code >> 12) & 63) | 128;
              bytes[pos++] = ((code >> 6) & 63) | 128;
              bytes[pos++] = (code & 63) | 128;
          }
          else {
              bytes[pos++] = (code >> 12) | 224;
              bytes[pos++] = ((code >> 6) & 63) | 128;
              bytes[pos++] = (code & 63) | 128;
          }
      }
      return bytes;
  }

  /**
   * @module QR8BitByte
   * @author nuintun
   * @author Kazuhiko Arase
   */
  var QRByte = /*#__PURE__*/ (function (_super) {
      __extends(QRByte, _super);
      /**
       * @constructor
       * @param {string} data
       */
      function QRByte(data, encode) {
          var _this = _super.call(this, exports.Mode.Byte, data) || this;
          _this.encoding = -1;
          if (typeof encode === 'function') {
              var _a = encode(data), encoding = _a.encoding, bytes = _a.bytes;
              _this.bytes = bytes;
              _this.encoding = encoding;
          }
          else {
              _this.bytes = UTF8(data);
              _this.encoding = 26 /* UTF8 */;
          }
          return _this;
      }
      /**
       * @public
       * @method write
       * @param {BitBuffer} buffer
       */
      QRByte.prototype.write = function (buffer) {
          var bytes = this.bytes;
          var length = bytes.length;
          for (var i = 0; i < length; i++) {
              buffer.put(bytes[i], 8);
          }
      };
      /**
       * @public
       * @method getLength
       * @returns {number}
       */
      QRByte.prototype.getLength = function () {
          return this.bytes.length;
      };
      return QRByte;
  }(QRData));

  /**
   * @module ErrorCorrectionLevel
   * @author nuintun
   * @author Cosmo Wolfe
   * @author Kazuhiko Arase
   */
  /**
   * @readonly
   * @enum {L, M, Q, H}
   */

  (function (ErrorCorrectionLevel) {
      // 7%
      ErrorCorrectionLevel[ErrorCorrectionLevel["L"] = 1] = "L";
      // 15%
      ErrorCorrectionLevel[ErrorCorrectionLevel["M"] = 0] = "M";
      // 25%
      ErrorCorrectionLevel[ErrorCorrectionLevel["Q"] = 3] = "Q";
      // 30%
      ErrorCorrectionLevel[ErrorCorrectionLevel["H"] = 2] = "H";
  })(exports.ErrorCorrectionLevel || (exports.ErrorCorrectionLevel = {}));

  /**
   * @module QRMath
   * @author nuintun
   * @author Kazuhiko Arase
   */
  var EXP_TABLE = [];
  var LOG_TABLE = [];
  for (var i = 0; i < 256; i++) {
      LOG_TABLE[i] = 0;
      EXP_TABLE[i] = i < 8 ? 1 << i : EXP_TABLE[i - 4] ^ EXP_TABLE[i - 5] ^ EXP_TABLE[i - 6] ^ EXP_TABLE[i - 8];
  }
  for (var i = 0; i < 255; i++) {
      LOG_TABLE[EXP_TABLE[i]] = i;
  }
  function glog(n) {
      if (n < 1) {
          throw "illegal log: " + n;
      }
      return LOG_TABLE[n];
  }
  function gexp(n) {
      while (n < 0) {
          n += 255;
      }
      while (n >= 256) {
          n -= 255;
      }
      return EXP_TABLE[n];
  }

  /**
   * @module Polynomial
   * @author nuintun
   * @author Kazuhiko Arase
   */
  var Polynomial = /*#__PURE__*/ (function () {
      function Polynomial(num, shift) {
          if (shift === void 0) { shift = 0; }
          this.num = [];
          var offset = 0;
          var length = num.length;
          while (offset < length && num[offset] === 0) {
              offset++;
          }
          length -= offset;
          for (var i = 0; i < length; i++) {
              this.num.push(num[offset + i]);
          }
          for (var i = 0; i < shift; i++) {
              this.num.push(0);
          }
      }
      Polynomial.prototype.getAt = function (index) {
          return this.num[index];
      };
      Polynomial.prototype.getLength = function () {
          return this.num.length;
      };
      Polynomial.prototype.multiply = function (e) {
          var num = [];
          var eLength = e.getLength();
          var tLength = this.getLength();
          var dLength = tLength + eLength - 1;
          for (var i = 0; i < dLength; i++) {
              num.push(0);
          }
          for (var i = 0; i < tLength; i++) {
              for (var j = 0; j < eLength; j++) {
                  num[i + j] ^= gexp(glog(this.getAt(i)) + glog(e.getAt(j)));
              }
          }
          return new Polynomial(num);
      };
      Polynomial.prototype.mod = function (e) {
          var eLength = e.getLength();
          var tLength = this.getLength();
          if (tLength - eLength < 0) {
              return this;
          }
          var ratio = glog(this.getAt(0)) - glog(e.getAt(0));
          // Create copy
          var num = [];
          for (var i = 0; i < tLength; i++) {
              num.push(this.getAt(i));
          }
          // Subtract and calc rest.
          for (var i = 0; i < eLength; i++) {
              num[i] ^= gexp(glog(e.getAt(i)) + ratio);
          }
          // Call recursively
          return new Polynomial(num).mod(e);
      };
      return Polynomial;
  }());

  /**
   * @module QRUtil
   * @author nuintun
   * @author Kazuhiko Arase
   */
  var N1 = 3;
  var N2 = 3;
  var N3 = 40;
  var N4 = 10;
  var ALIGNMENT_PATTERN_TABLE = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 48, 70],
      [6, 26, 50, 74],
      [6, 30, 54, 78],
      [6, 30, 56, 82],
      [6, 30, 58, 86],
      [6, 34, 62, 90],
      [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106],
      [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134],
      [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142],
      [6, 34, 62, 90, 118, 146],
      [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154],
      [6, 28, 54, 80, 106, 132, 158],
      [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166],
      [6, 30, 58, 86, 114, 142, 170]
  ];
  var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);
  var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
  var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
  function getAlignmentPattern(version) {
      return ALIGNMENT_PATTERN_TABLE[version - 1];
  }
  function getErrorCorrectionPolynomial(errorCorrectionLength) {
      var e = new Polynomial([1]);
      for (var i = 0; i < errorCorrectionLength; i++) {
          e = e.multiply(new Polynomial([1, gexp(i)]));
      }
      return e;
  }
  function getBCHDigit(data) {
      var digit = 0;
      while (data !== 0) {
          digit++;
          data >>>= 1;
      }
      return digit;
  }
  var G18_BCH = getBCHDigit(G18);
  function getBCHVersion(data) {
      var offset = data << 12;
      while (getBCHDigit(offset) - G18_BCH >= 0) {
          offset ^= G18 << (getBCHDigit(offset) - G18_BCH);
      }
      return (data << 12) | offset;
  }
  var G15_BCH = getBCHDigit(G15);
  function getBCHVersionInfo(data) {
      var offset = data << 10;
      while (getBCHDigit(offset) - G15_BCH >= 0) {
          offset ^= G15 << (getBCHDigit(offset) - G15_BCH);
      }
      return ((data << 10) | offset) ^ G15_MASK;
  }
  function applyMaskPenaltyRule1Internal(qrcode, isHorizontal) {
      var penalty = 0;
      var moduleCount = qrcode.getModuleCount();
      for (var i = 0; i < moduleCount; i++) {
          var prevBit = null;
          var numSameBitCells = 0;
          for (var j = 0; j < moduleCount; j++) {
              var bit = isHorizontal ? qrcode.isDark(i, j) : qrcode.isDark(j, i);
              if (bit === prevBit) {
                  numSameBitCells++;
                  if (numSameBitCells === 5) {
                      penalty += N1;
                  }
                  else if (numSameBitCells > 5) {
                      penalty++;
                  }
              }
              else {
                  // set prev bit
                  prevBit = bit;
                  // include the cell itself
                  numSameBitCells = 1;
              }
          }
      }
      return penalty;
  }
  function applyMaskPenaltyRule1(qrcode) {
      return applyMaskPenaltyRule1Internal(qrcode, true) + applyMaskPenaltyRule1Internal(qrcode, false);
  }
  function applyMaskPenaltyRule2(qrcode) {
      var penalty = 0;
      var moduleCount = qrcode.getModuleCount();
      for (var y = 0; y < moduleCount - 1; y++) {
          for (var x = 0; x < moduleCount - 1; x++) {
              var value = qrcode.isDark(y, x);
              if (value === qrcode.isDark(y, x + 1) && value === qrcode.isDark(y + 1, x) && value === qrcode.isDark(y + 1, x + 1)) {
                  penalty += N2;
              }
          }
      }
      return penalty;
  }
  function isFourWhite(qrcode, rangeIndex, from, to, isHorizontal) {
      from = Math.max(from, 0);
      to = Math.min(to, qrcode.getModuleCount());
      for (var i = from; i < to; i++) {
          var value = isHorizontal ? qrcode.isDark(rangeIndex, i) : qrcode.isDark(i, rangeIndex);
          if (value) {
              return false;
          }
      }
      return true;
  }
  function applyMaskPenaltyRule3(qrcode) {
      var penalty = 0;
      var moduleCount = qrcode.getModuleCount();
      for (var y = 0; y < moduleCount; y++) {
          for (var x = 0; x < moduleCount; x++) {
              if (x + 6 < moduleCount &&
                  qrcode.isDark(y, x) &&
                  !qrcode.isDark(y, x + 1) &&
                  qrcode.isDark(y, x + 2) &&
                  qrcode.isDark(y, x + 3) &&
                  qrcode.isDark(y, x + 4) &&
                  !qrcode.isDark(y, x + 5) &&
                  qrcode.isDark(y, x + 6) &&
                  (isFourWhite(qrcode, y, x - 4, x, true) || isFourWhite(qrcode, y, x + 7, x + 11, true))) {
                  penalty += N3;
              }
              if (y + 6 < moduleCount &&
                  qrcode.isDark(y, x) &&
                  !qrcode.isDark(y + 1, x) &&
                  qrcode.isDark(y + 2, x) &&
                  qrcode.isDark(y + 3, x) &&
                  qrcode.isDark(y + 4, x) &&
                  !qrcode.isDark(y + 5, x) &&
                  qrcode.isDark(y + 6, x) &&
                  (isFourWhite(qrcode, x, y - 4, y, false) || isFourWhite(qrcode, x, y + 7, y + 11, false))) {
                  penalty += N3;
              }
          }
      }
      return penalty;
  }
  function applyMaskPenaltyRule4(qrcode) {
      var numDarkCells = 0;
      var moduleCount = qrcode.getModuleCount();
      for (var y = 0; y < moduleCount; y++) {
          for (var x = 0; x < moduleCount; x++) {
              if (qrcode.isDark(y, x)) {
                  numDarkCells++;
              }
          }
      }
      var numTotalCells = moduleCount * moduleCount;
      var fivePercentVariances = Math.floor(Math.abs(numDarkCells * 20 - numTotalCells * 10) / numTotalCells);
      return fivePercentVariances * N4;
  }
  /**
   * @function calculateMaskPenalty
   * @param {Encoder} qrcode
   * @see https://www.thonky.com/qr-code-tutorial/data-masking
   * @see https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/qrcode/encoder/MaskUtil.java
   */
  function calculateMaskPenalty(qrcode) {
      return (applyMaskPenaltyRule1(qrcode) +
          applyMaskPenaltyRule2(qrcode) +
          applyMaskPenaltyRule3(qrcode) +
          applyMaskPenaltyRule4(qrcode));
  }

  /**
   * @module RSBlock
   * @author nuintun
   * @author Kazuhiko Arase
   */
  var RSBlock = /*#__PURE__*/ (function () {
      function RSBlock(totalCount, dataCount) {
          this.dataCount = dataCount;
          this.totalCount = totalCount;
      }
      RSBlock.prototype.getDataCount = function () {
          return this.dataCount;
      };
      RSBlock.prototype.getTotalCount = function () {
          return this.totalCount;
      };
      RSBlock.getRSBlocks = function (version, errorCorrectionLevel) {
          var rsBlocks = [];
          var rsBlock = RSBlock.getRSBlockTable(version, errorCorrectionLevel);
          var length = rsBlock.length / 3;
          for (var i = 0; i < length; i++) {
              var count = rsBlock[i * 3 + 0];
              var totalCount = rsBlock[i * 3 + 1];
              var dataCount = rsBlock[i * 3 + 2];
              for (var j = 0; j < count; j++) {
                  rsBlocks.push(new RSBlock(totalCount, dataCount));
              }
          }
          return rsBlocks;
      };
      RSBlock.getRSBlockTable = function (version, errorCorrectionLevel) {
          switch (errorCorrectionLevel) {
              case exports.ErrorCorrectionLevel.L:
                  return RSBlock.RS_BLOCK_TABLE[(version - 1) * 4 + 0];
              case exports.ErrorCorrectionLevel.M:
                  return RSBlock.RS_BLOCK_TABLE[(version - 1) * 4 + 1];
              case exports.ErrorCorrectionLevel.Q:
                  return RSBlock.RS_BLOCK_TABLE[(version - 1) * 4 + 2];
              case exports.ErrorCorrectionLevel.H:
                  return RSBlock.RS_BLOCK_TABLE[(version - 1) * 4 + 3];
              default:
                  throw "illegal error correction level: " + errorCorrectionLevel;
          }
      };
      RSBlock.RS_BLOCK_TABLE = [
          // L
          // M
          // Q
          // H
          // 1
          [1, 26, 19],
          [1, 26, 16],
          [1, 26, 13],
          [1, 26, 9],
          // 2
          [1, 44, 34],
          [1, 44, 28],
          [1, 44, 22],
          [1, 44, 16],
          // 3
          [1, 70, 55],
          [1, 70, 44],
          [2, 35, 17],
          [2, 35, 13],
          // 4
          [1, 100, 80],
          [2, 50, 32],
          [2, 50, 24],
          [4, 25, 9],
          // 5
          [1, 134, 108],
          [2, 67, 43],
          [2, 33, 15, 2, 34, 16],
          [2, 33, 11, 2, 34, 12],
          // 6
          [2, 86, 68],
          [4, 43, 27],
          [4, 43, 19],
          [4, 43, 15],
          // 7
          [2, 98, 78],
          [4, 49, 31],
          [2, 32, 14, 4, 33, 15],
          [4, 39, 13, 1, 40, 14],
          // 8
          [2, 121, 97],
          [2, 60, 38, 2, 61, 39],
          [4, 40, 18, 2, 41, 19],
          [4, 40, 14, 2, 41, 15],
          // 9
          [2, 146, 116],
          [3, 58, 36, 2, 59, 37],
          [4, 36, 16, 4, 37, 17],
          [4, 36, 12, 4, 37, 13],
          // 10
          [2, 86, 68, 2, 87, 69],
          [4, 69, 43, 1, 70, 44],
          [6, 43, 19, 2, 44, 20],
          [6, 43, 15, 2, 44, 16],
          // 11
          [4, 101, 81],
          [1, 80, 50, 4, 81, 51],
          [4, 50, 22, 4, 51, 23],
          [3, 36, 12, 8, 37, 13],
          // 12
          [2, 116, 92, 2, 117, 93],
          [6, 58, 36, 2, 59, 37],
          [4, 46, 20, 6, 47, 21],
          [7, 42, 14, 4, 43, 15],
          // 13
          [4, 133, 107],
          [8, 59, 37, 1, 60, 38],
          [8, 44, 20, 4, 45, 21],
          [12, 33, 11, 4, 34, 12],
          // 14
          [3, 145, 115, 1, 146, 116],
          [4, 64, 40, 5, 65, 41],
          [11, 36, 16, 5, 37, 17],
          [11, 36, 12, 5, 37, 13],
          // 15
          [5, 109, 87, 1, 110, 88],
          [5, 65, 41, 5, 66, 42],
          [5, 54, 24, 7, 55, 25],
          [11, 36, 12, 7, 37, 13],
          // 16
          [5, 122, 98, 1, 123, 99],
          [7, 73, 45, 3, 74, 46],
          [15, 43, 19, 2, 44, 20],
          [3, 45, 15, 13, 46, 16],
          // 17
          [1, 135, 107, 5, 136, 108],
          [10, 74, 46, 1, 75, 47],
          [1, 50, 22, 15, 51, 23],
          [2, 42, 14, 17, 43, 15],
          // 18
          [5, 150, 120, 1, 151, 121],
          [9, 69, 43, 4, 70, 44],
          [17, 50, 22, 1, 51, 23],
          [2, 42, 14, 19, 43, 15],
          // 19
          [3, 141, 113, 4, 142, 114],
          [3, 70, 44, 11, 71, 45],
          [17, 47, 21, 4, 48, 22],
          [9, 39, 13, 16, 40, 14],
          // 20
          [3, 135, 107, 5, 136, 108],
          [3, 67, 41, 13, 68, 42],
          [15, 54, 24, 5, 55, 25],
          [15, 43, 15, 10, 44, 16],
          // 21
          [4, 144, 116, 4, 145, 117],
          [17, 68, 42],
          [17, 50, 22, 6, 51, 23],
          [19, 46, 16, 6, 47, 17],
          // 22
          [2, 139, 111, 7, 140, 112],
          [17, 74, 46],
          [7, 54, 24, 16, 55, 25],
          [34, 37, 13],
          // 23
          [4, 151, 121, 5, 152, 122],
          [4, 75, 47, 14, 76, 48],
          [11, 54, 24, 14, 55, 25],
          [16, 45, 15, 14, 46, 16],
          // 24
          [6, 147, 117, 4, 148, 118],
          [6, 73, 45, 14, 74, 46],
          [11, 54, 24, 16, 55, 25],
          [30, 46, 16, 2, 47, 17],
          // 25
          [8, 132, 106, 4, 133, 107],
          [8, 75, 47, 13, 76, 48],
          [7, 54, 24, 22, 55, 25],
          [22, 45, 15, 13, 46, 16],
          // 26
          [10, 142, 114, 2, 143, 115],
          [19, 74, 46, 4, 75, 47],
          [28, 50, 22, 6, 51, 23],
          [33, 46, 16, 4, 47, 17],
          // 27
          [8, 152, 122, 4, 153, 123],
          [22, 73, 45, 3, 74, 46],
          [8, 53, 23, 26, 54, 24],
          [12, 45, 15, 28, 46, 16],
          // 28
          [3, 147, 117, 10, 148, 118],
          [3, 73, 45, 23, 74, 46],
          [4, 54, 24, 31, 55, 25],
          [11, 45, 15, 31, 46, 16],
          // 29
          [7, 146, 116, 7, 147, 117],
          [21, 73, 45, 7, 74, 46],
          [1, 53, 23, 37, 54, 24],
          [19, 45, 15, 26, 46, 16],
          // 30
          [5, 145, 115, 10, 146, 116],
          [19, 75, 47, 10, 76, 48],
          [15, 54, 24, 25, 55, 25],
          [23, 45, 15, 25, 46, 16],
          // 31
          [13, 145, 115, 3, 146, 116],
          [2, 74, 46, 29, 75, 47],
          [42, 54, 24, 1, 55, 25],
          [23, 45, 15, 28, 46, 16],
          // 32
          [17, 145, 115],
          [10, 74, 46, 23, 75, 47],
          [10, 54, 24, 35, 55, 25],
          [19, 45, 15, 35, 46, 16],
          // 33
          [17, 145, 115, 1, 146, 116],
          [14, 74, 46, 21, 75, 47],
          [29, 54, 24, 19, 55, 25],
          [11, 45, 15, 46, 46, 16],
          // 34
          [13, 145, 115, 6, 146, 116],
          [14, 74, 46, 23, 75, 47],
          [44, 54, 24, 7, 55, 25],
          [59, 46, 16, 1, 47, 17],
          // 35
          [12, 151, 121, 7, 152, 122],
          [12, 75, 47, 26, 76, 48],
          [39, 54, 24, 14, 55, 25],
          [22, 45, 15, 41, 46, 16],
          // 36
          [6, 151, 121, 14, 152, 122],
          [6, 75, 47, 34, 76, 48],
          [46, 54, 24, 10, 55, 25],
          [2, 45, 15, 64, 46, 16],
          // 37
          [17, 152, 122, 4, 153, 123],
          [29, 74, 46, 14, 75, 47],
          [49, 54, 24, 10, 55, 25],
          [24, 45, 15, 46, 46, 16],
          // 38
          [4, 152, 122, 18, 153, 123],
          [13, 74, 46, 32, 75, 47],
          [48, 54, 24, 14, 55, 25],
          [42, 45, 15, 32, 46, 16],
          // 39
          [20, 147, 117, 4, 148, 118],
          [40, 75, 47, 7, 76, 48],
          [43, 54, 24, 22, 55, 25],
          [10, 45, 15, 67, 46, 16],
          // 40
          [19, 148, 118, 6, 149, 119],
          [18, 75, 47, 31, 76, 48],
          [34, 54, 24, 34, 55, 25],
          [20, 45, 15, 61, 46, 16]
      ];
      return RSBlock;
  }());

  /**
   * @module BitBuffer
   * @author nuintun
   * @author Kazuhiko Arase
   */
  var BitBuffer = /*#__PURE__*/ (function () {
      function BitBuffer() {
          this.length = 0;
          this.buffer = [];
      }
      BitBuffer.prototype.getBuffer = function () {
          return this.buffer;
      };
      BitBuffer.prototype.getLengthInBits = function () {
          return this.length;
      };
      BitBuffer.prototype.getBit = function (index) {
          return ((this.buffer[(index / 8) >> 0] >>> (7 - (index % 8))) & 1) === 1;
      };
      BitBuffer.prototype.put = function (num, length) {
          for (var i = 0; i < length; i++) {
              this.putBit(((num >>> (length - i - 1)) & 1) === 1);
          }
      };
      BitBuffer.prototype.putBit = function (bit) {
          if (this.length === this.buffer.length * 8) {
              this.buffer.push(0);
          }
          if (bit) {
              this.buffer[(this.length / 8) >> 0] |= 0x80 >>> this.length % 8;
          }
          this.length++;
      };
      return BitBuffer;
  }());

  /**
   * @module OutputStream
   * @author nuintun
   * @author Kazuhiko Arase
   */
  var OutputStream = /*#__PURE__*/ (function () {
      function OutputStream() {
      }
      OutputStream.prototype.writeBytes = function (bytes) {
          var length = bytes.length;
          for (var i = 0; i < length; i++) {
              this.writeByte(bytes[i]);
          }
      };
      OutputStream.prototype.flush = function () {
          // The flush method
      };
      OutputStream.prototype.close = function () {
          this.flush();
      };
      return OutputStream;
  }());

  /**
   * @module ByteArrayOutputStream
   * @author nuintun
   * @author Kazuhiko Arase
   */
  var ByteArrayOutputStream = /*#__PURE__*/ (function (_super) {
      __extends(ByteArrayOutputStream, _super);
      function ByteArrayOutputStream() {
          var _this = _super !== null && _super.apply(this, arguments) || this;
          _this.bytes = [];
          return _this;
      }
      ByteArrayOutputStream.prototype.writeByte = function (byte) {
          this.bytes.push(byte);
      };
      ByteArrayOutputStream.prototype.toByteArray = function () {
          return this.bytes;
      };
      return ByteArrayOutputStream;
  }(OutputStream));

  /**
   * @module Base64EncodeOutputStream
   * @author nuintun
   * @author Kazuhiko Arase
   */
  function encode(ch) {
      if (ch >= 0) {
          if (ch < 26) {
              // A
              return 0x41 + ch;
          }
          else if (ch < 52) {
              // a
              return 0x61 + (ch - 26);
          }
          else if (ch < 62) {
              // 0
              return 0x30 + (ch - 52);
          }
          else if (ch === 62) {
              // +
              return 0x2b;
          }
          else if (ch === 63) {
              // /
              return 0x2f;
          }
      }
      throw "illegal char: " + String.fromCharCode(ch);
  }
  var Base64EncodeOutputStream = /*#__PURE__*/ (function (_super) {
      __extends(Base64EncodeOutputStream, _super);
      function Base64EncodeOutputStream(stream) {
          var _this = _super.call(this) || this;
          _this.buffer = 0;
          _this.length = 0;
          _this.bufLength = 0;
          _this.stream = stream;
          return _this;
      }
      Base64EncodeOutputStream.prototype.writeByte = function (byte) {
          this.buffer = (this.buffer << 8) | (byte & 0xff);
          this.bufLength += 8;
          this.length++;
          while (this.bufLength >= 6) {
              this.writeEncoded(this.buffer >>> (this.bufLength - 6));
              this.bufLength -= 6;
          }
      };
      /**
       * @override
       */
      Base64EncodeOutputStream.prototype.flush = function () {
          if (this.bufLength > 0) {
              this.writeEncoded(this.buffer << (6 - this.bufLength));
              this.buffer = 0;
              this.bufLength = 0;
          }
          if (this.length % 3 != 0) {
              // Padding
              var pad = 3 - (this.length % 3);
              for (var i = 0; i < pad; i++) {
                  // =
                  this.stream.writeByte(0x3d);
              }
          }
      };
      Base64EncodeOutputStream.prototype.writeEncoded = function (byte) {
          this.stream.writeByte(encode(byte & 0x3f));
      };
      return Base64EncodeOutputStream;
  }(OutputStream));

  /**
   * @module GIF Image (B/W)
   * @author nuintun
   * @author Kazuhiko Arase
   */
  function encodeToBase64(data) {
      var output = new ByteArrayOutputStream();
      var stream = new Base64EncodeOutputStream(output);
      try {
          stream.writeBytes(data);
      }
      finally {
          stream.close();
      }
      output.close();
      return output.toByteArray();
  }
  var LZWTable = /*#__PURE__*/ (function () {
      function LZWTable() {
          this.size = 0;
          this.map = {};
      }
      LZWTable.prototype.add = function (key) {
          if (!this.contains(key)) {
              this.map[key] = this.size++;
          }
      };
      LZWTable.prototype.getSize = function () {
          return this.size;
      };
      LZWTable.prototype.indexOf = function (key) {
          return this.map[key];
      };
      LZWTable.prototype.contains = function (key) {
          return this.map.hasOwnProperty(key);
      };
      return LZWTable;
  }());
  var BitOutputStream = /*#__PURE__*/ (function () {
      function BitOutputStream(output) {
          this.output = output;
          this.bitLength = 0;
      }
      BitOutputStream.prototype.write = function (data, length) {
          if (data >>> length !== 0) {
              throw 'length overflow';
          }
          while (this.bitLength + length >= 8) {
              this.output.writeByte(0xff & ((data << this.bitLength) | this.bitBuffer));
              length -= 8 - this.bitLength;
              data >>>= 8 - this.bitLength;
              this.bitBuffer = 0;
              this.bitLength = 0;
          }
          this.bitBuffer = (data << this.bitLength) | this.bitBuffer;
          this.bitLength = this.bitLength + length;
      };
      BitOutputStream.prototype.flush = function () {
          if (this.bitLength > 0) {
              this.output.writeByte(this.bitBuffer);
          }
          this.output.flush();
      };
      BitOutputStream.prototype.close = function () {
          this.flush();
          this.output.close();
      };
      return BitOutputStream;
  }());
  var GIFImage = /*#__PURE__*/ (function () {
      function GIFImage(width, height) {
          this.data = [];
          this.width = width;
          this.height = height;
          var size = width * height;
          for (var i = 0; i < size; i++) {
              this.data[i] = 0;
          }
      }
      GIFImage.prototype.getLZWRaster = function (lzwMinCodeSize) {
          var clearCode = 1 << lzwMinCodeSize;
          var endCode = (1 << lzwMinCodeSize) + 1;
          // Setup LZWTable
          var table = new LZWTable();
          for (var i = 0; i < clearCode; i++) {
              table.add(String.fromCharCode(i));
          }
          table.add(String.fromCharCode(clearCode));
          table.add(String.fromCharCode(endCode));
          var byteOutput = new ByteArrayOutputStream();
          var bitOutput = new BitOutputStream(byteOutput);
          var bitLength = lzwMinCodeSize + 1;
          try {
              // Clear code
              bitOutput.write(clearCode, bitLength);
              var dataIndex = 0;
              var s = String.fromCharCode(this.data[dataIndex++]);
              var length_1 = this.data.length;
              while (dataIndex < length_1) {
                  var c = String.fromCharCode(this.data[dataIndex++]);
                  if (table.contains(s + c)) {
                      s = s + c;
                  }
                  else {
                      bitOutput.write(table.indexOf(s), bitLength);
                      if (table.getSize() < 0xfff) {
                          if (table.getSize() === 1 << bitLength) {
                              bitLength++;
                          }
                          table.add(s + c);
                      }
                      s = c;
                  }
              }
              bitOutput.write(table.indexOf(s), bitLength);
              // End code
              bitOutput.write(endCode, bitLength);
          }
          finally {
              bitOutput.close();
          }
          return byteOutput.toByteArray();
      };
      GIFImage.prototype.writeWord = function (output, i) {
          output.writeByte(i & 0xff);
          output.writeByte((i >>> 8) & 0xff);
      };
      GIFImage.prototype.writeBytes = function (output, bytes, off, length) {
          for (var i = 0; i < length; i++) {
              output.writeByte(bytes[i + off]);
          }
      };
      GIFImage.prototype.setPixel = function (x, y, pixel) {
          if (x < 0 || this.width <= x)
              throw "illegal x axis: " + x;
          if (y < 0 || this.height <= y)
              throw "illegal y axis: " + y;
          this.data[y * this.width + x] = pixel;
      };
      GIFImage.prototype.getPixel = function (x, y) {
          if (x < 0 || this.width <= x)
              throw "illegal x axis: " + x;
          if (y < 0 || this.height <= y)
              throw "illegal x axis: " + y;
          return this.data[y * this.width + x];
      };
      GIFImage.prototype.write = function (output) {
          // GIF Signature
          output.writeByte(0x47); // G
          output.writeByte(0x49); // I
          output.writeByte(0x46); // F
          output.writeByte(0x38); // 8
          output.writeByte(0x37); // 7
          output.writeByte(0x61); // a
          // Screen Descriptor
          this.writeWord(output, this.width);
          this.writeWord(output, this.height);
          output.writeByte(0x80); // 2bit
          output.writeByte(0);
          output.writeByte(0);
          // Global Color Map
          // Black
          output.writeByte(0x00);
          output.writeByte(0x00);
          output.writeByte(0x00);
          // White
          output.writeByte(0xff);
          output.writeByte(0xff);
          output.writeByte(0xff);
          // Image Descriptor
          output.writeByte(0x2c); // ,
          this.writeWord(output, 0);
          this.writeWord(output, 0);
          this.writeWord(output, this.width);
          this.writeWord(output, this.height);
          output.writeByte(0);
          // Local Color Map
          // Raster Data
          var lzwMinCodeSize = 2;
          var raster = this.getLZWRaster(lzwMinCodeSize);
          var raLength = raster.length;
          output.writeByte(lzwMinCodeSize);
          var offset = 0;
          while (raLength - offset > 255) {
              output.writeByte(255);
              this.writeBytes(output, raster, offset, 255);
              offset += 255;
          }
          var length = raLength - offset;
          output.writeByte(length);
          this.writeBytes(output, raster, offset, length);
          output.writeByte(0x00);
          // GIF Terminator
          output.writeByte(0x3b); // ;
      };
      GIFImage.prototype.toDataURL = function () {
          var output = new ByteArrayOutputStream();
          this.write(output);
          var bytes = encodeToBase64(output.toByteArray());
          output.close();
          var url = 'data:image/gif;base64,';
          var length = bytes.length;
          for (var i = 0; i < length; i++) {
              url += String.fromCharCode(bytes[i]);
          }
          return url;
      };
      return GIFImage;
  }());

  /**
   * @module MaskPattern
   * @author nuintun
   * @author Cosmo Wolfe
   * @author Kazuhiko Arase
   */
  function getMaskFunc(maskPattern) {
      switch (maskPattern) {
          case 0 /* PATTERN000 */:
              return function (x, y) { return ((x + y) & 0x1) === 0; };
          case 1 /* PATTERN001 */:
              return function (x, y) { return (y & 0x1) === 0; };
          case 2 /* PATTERN010 */:
              return function (x, y) { return x % 3 === 0; };
          case 3 /* PATTERN011 */:
              return function (x, y) { return (x + y) % 3 === 0; };
          case 4 /* PATTERN100 */:
              return function (x, y) { return ((((x / 3) >> 0) + ((y / 2) >> 0)) & 0x1) === 0; };
          case 5 /* PATTERN101 */:
              return function (x, y) { return ((x * y) & 0x1) + ((x * y) % 3) === 0; };
          case 6 /* PATTERN110 */:
              return function (x, y) { return ((((x * y) & 0x1) + ((x * y) % 3)) & 0x1) === 0; };
          case 7 /* PATTERN111 */:
              return function (x, y) { return ((((x * y) % 3) + ((x + y) & 0x1)) & 0x1) === 0; };
          default:
              throw "illegal mask: " + maskPattern;
      }
  }

  /**
   * @module QRCode
   * @author nuintun
   * @author Kazuhiko Arase
   */
  var PAD0 = 0xec;
  var PAD1 = 0x11;
  var toString = Object.prototype.toString;
  /**
   * @function appendECI
   * @param {number} encoding
   * @param {BitBuffer} buffer
   * @see https://github.com/nayuki/QR-Code-generator/blob/master/typescript/qrcodegen.ts
   * @see https://github.com/zxing/zxing/blob/master/core/src/main/java/com/google/zxing/qrcode/encoder/Encoder.java
   */
  function appendECI(encoding, buffer) {
      if (encoding < 0 || encoding >= 1000000) {
          throw 'byte mode encoding hint out of range';
      }
      buffer.put(exports.Mode.ECI, 4);
      if (encoding < 1 << 7) {
          buffer.put(encoding, 8);
      }
      else if (encoding < 1 << 14) {
          buffer.put(2, 2);
          buffer.put(encoding, 14);
      }
      else {
          buffer.put(6, 3);
          buffer.put(encoding, 21);
      }
  }
  function prepareData(version, errorCorrectionLevel, hasEncodingHint, chunks) {
      var dLength = chunks.length;
      var buffer = new BitBuffer();
      var rsBlocks = RSBlock.getRSBlocks(version, errorCorrectionLevel);
      for (var i = 0; i < dLength; i++) {
          var data = chunks[i];
          var mode = data.getMode();
          // Default set encoding UTF-8 when has encoding hint
          if (hasEncodingHint && mode === exports.Mode.Byte) {
              appendECI(data.encoding, buffer);
          }
          buffer.put(mode, 4);
          buffer.put(data.getLength(), data.getLengthInBits(version));
          data.write(buffer);
      }
      // Calc max data count
      var maxDataCount = 0;
      var rLength = rsBlocks.length;
      for (var i = 0; i < rLength; i++) {
          maxDataCount += rsBlocks[i].getDataCount();
      }
      maxDataCount *= 8;
      return [buffer, rsBlocks, maxDataCount];
  }
  function createBytes(buffer, rsBlocks) {
      var offset = 0;
      var maxDcCount = 0;
      var maxEcCount = 0;
      var dcData = [];
      var ecData = [];
      var rsLength = rsBlocks.length;
      var bufferData = buffer.getBuffer();
      for (var r = 0; r < rsLength; r++) {
          var rsBlock = rsBlocks[r];
          var dcCount = rsBlock.getDataCount();
          var ecCount = rsBlock.getTotalCount() - dcCount;
          maxDcCount = Math.max(maxDcCount, dcCount);
          maxEcCount = Math.max(maxEcCount, ecCount);
          dcData[r] = [];
          for (var i = 0; i < dcCount; i++) {
              dcData[r][i] = 0xff & bufferData[i + offset];
          }
          offset += dcCount;
          var rsPoly = getErrorCorrectionPolynomial(ecCount);
          var ecLength = rsPoly.getLength() - 1;
          var rawPoly = new Polynomial(dcData[r], ecLength);
          var modPoly = rawPoly.mod(rsPoly);
          var mpLength = modPoly.getLength();
          ecData[r] = [];
          for (var i = 0; i < ecLength; i++) {
              var modIndex = i + mpLength - ecLength;
              ecData[r][i] = modIndex >= 0 ? modPoly.getAt(modIndex) : 0;
          }
      }
      buffer = new BitBuffer();
      for (var i = 0; i < maxDcCount; i++) {
          for (var r = 0; r < rsLength; r++) {
              if (i < dcData[r].length) {
                  buffer.put(dcData[r][i], 8);
              }
          }
      }
      for (var i = 0; i < maxEcCount; i++) {
          for (var r = 0; r < rsLength; r++) {
              if (i < ecData[r].length) {
                  buffer.put(ecData[r][i], 8);
              }
          }
      }
      return buffer;
  }
  function createData(buffer, rsBlocks, maxDataCount) {
      if (buffer.getLengthInBits() > maxDataCount) {
          throw "data overflow: " + buffer.getLengthInBits() + " > " + maxDataCount;
      }
      // End
      if (buffer.getLengthInBits() + 4 <= maxDataCount) {
          buffer.put(0, 4);
      }
      // Padding
      while (buffer.getLengthInBits() % 8 !== 0) {
          buffer.putBit(false);
      }
      // Padding
      while (true) {
          if (buffer.getLengthInBits() >= maxDataCount) {
              break;
          }
          buffer.put(PAD0, 8);
          if (buffer.getLengthInBits() >= maxDataCount) {
              break;
          }
          buffer.put(PAD1, 8);
      }
      return createBytes(buffer, rsBlocks);
  }
  var Encoder = /*#__PURE__*/ (function () {
      function Encoder() {
          this.version = 0;
          this.chunks = [];
          this.moduleCount = 0;
          this.modules = [];
          this.hasEncodingHint = false;
          this.autoVersion = this.version === 0;
          this.errorCorrectionLevel = exports.ErrorCorrectionLevel.L;
      }
      /**
       * @public
       * @method getModules
       * @returns {boolean[][]}
       */
      Encoder.prototype.getModules = function () {
          return this.modules;
      };
      /**
       * @public
       * @method getModuleCount
       */
      Encoder.prototype.getModuleCount = function () {
          return this.moduleCount;
      };
      /**
       * @public
       * @method getVersion
       * @returns {number}
       */
      Encoder.prototype.getVersion = function () {
          return this.version;
      };
      /**
       * @public
       * @method setVersion
       * @param {number} version
       */
      Encoder.prototype.setVersion = function (version) {
          this.version = Math.min(40, Math.max(0, version >> 0));
          this.autoVersion = this.version === 0;
      };
      /**
       * @public
       * @method getErrorCorrectionLevel
       * @returns {ErrorCorrectionLevel}
       */
      Encoder.prototype.getErrorCorrectionLevel = function () {
          return this.errorCorrectionLevel;
      };
      /**
       * @public
       * @method setErrorCorrectionLevel
       * @param {ErrorCorrectionLevel} errorCorrectionLevel
       */
      Encoder.prototype.setErrorCorrectionLevel = function (errorCorrectionLevel) {
          switch (errorCorrectionLevel) {
              case exports.ErrorCorrectionLevel.L:
              case exports.ErrorCorrectionLevel.M:
              case exports.ErrorCorrectionLevel.Q:
              case exports.ErrorCorrectionLevel.H:
                  this.errorCorrectionLevel = errorCorrectionLevel;
          }
      };
      /**
       * @public
       * @method getEncodingHint
       * @returns {boolean}
       */
      Encoder.prototype.getEncodingHint = function () {
          return this.hasEncodingHint;
      };
      /**
       * @public
       * @method setEncodingHint
       * @param {boolean} hasEncodingHint
       */
      Encoder.prototype.setEncodingHint = function (hasEncodingHint) {
          this.hasEncodingHint = hasEncodingHint;
      };
      /**
       * @public
       * @method write
       * @param {QRData} data
       */
      Encoder.prototype.write = function (data) {
          if (data instanceof QRData) {
              this.chunks.push(data);
          }
          else {
              var type = toString.call(data);
              if (type === '[object String]') {
                  this.chunks.push(new QRByte(data));
              }
              else {
                  throw "illegal data: " + data;
              }
          }
      };
      /**
       * @public
       * @method isDark
       * @param {number} row
       * @param {number} col
       * @returns {boolean}
       */
      Encoder.prototype.isDark = function (row, col) {
          if (this.modules[row][col] !== null) {
              return this.modules[row][col];
          }
          else {
              return false;
          }
      };
      Encoder.prototype.setupFinderPattern = function (row, col) {
          var moduleCount = this.moduleCount;
          for (var r = -1; r <= 7; r++) {
              for (var c = -1; c <= 7; c++) {
                  if (row + r <= -1 || moduleCount <= row + r || col + c <= -1 || moduleCount <= col + c) {
                      continue;
                  }
                  if ((0 <= r && r <= 6 && (c === 0 || c === 6)) ||
                      (0 <= c && c <= 6 && (r === 0 || r === 6)) ||
                      (2 <= r && r <= 4 && 2 <= c && c <= 4)) {
                      this.modules[row + r][col + c] = true;
                  }
                  else {
                      this.modules[row + r][col + c] = false;
                  }
              }
          }
      };
      Encoder.prototype.setupAlignmentPattern = function () {
          var pos = getAlignmentPattern(this.version);
          var length = pos.length;
          for (var i = 0; i < length; i++) {
              for (var j = 0; j < length; j++) {
                  var row = pos[i];
                  var col = pos[j];
                  if (this.modules[row][col] !== null) {
                      continue;
                  }
                  for (var r = -2; r <= 2; r++) {
                      for (var c = -2; c <= 2; c++) {
                          if (r === -2 || r === 2 || c === -2 || c === 2 || (r === 0 && c === 0)) {
                              this.modules[row + r][col + c] = true;
                          }
                          else {
                              this.modules[row + r][col + c] = false;
                          }
                      }
                  }
              }
          }
      };
      Encoder.prototype.setupTimingPattern = function () {
          var count = this.moduleCount - 8;
          for (var i = 8; i < count; i++) {
              var bit = i % 2 === 0;
              // vertical
              if (this.modules[i][6] === null) {
                  this.modules[i][6] = bit;
              }
              // horizontal
              if (this.modules[6][i] === null) {
                  this.modules[6][i] = bit;
              }
          }
      };
      Encoder.prototype.setupFormatInfo = function (maskPattern) {
          var data = (this.errorCorrectionLevel << 3) | maskPattern;
          var bits = getBCHVersionInfo(data);
          var moduleCount = this.moduleCount;
          for (var i = 0; i < 15; i++) {
              var bit = ((bits >> i) & 1) === 1;
              // Vertical
              if (i < 6) {
                  this.modules[i][8] = bit;
              }
              else if (i < 8) {
                  this.modules[i + 1][8] = bit;
              }
              else {
                  this.modules[moduleCount - 15 + i][8] = bit;
              }
              // Horizontal
              if (i < 8) {
                  this.modules[8][moduleCount - i - 1] = bit;
              }
              else if (i < 9) {
                  this.modules[8][15 - i - 1 + 1] = bit;
              }
              else {
                  this.modules[8][15 - i - 1] = bit;
              }
          }
          // Fixed point
          this.modules[moduleCount - 8][8] = true;
      };
      Encoder.prototype.setupVersionInfo = function () {
          if (this.version >= 7) {
              var moduleCount = this.moduleCount;
              var bits = getBCHVersion(this.version);
              for (var i = 0; i < 18; i++) {
                  var bit = ((bits >> i) & 1) === 1;
                  this.modules[(i / 3) >> 0][(i % 3) + moduleCount - 8 - 3] = bit;
                  this.modules[(i % 3) + moduleCount - 8 - 3][(i / 3) >> 0] = bit;
              }
          }
      };
      Encoder.prototype.setupCodewords = function (data, maskPattern) {
          // Bit index into the data
          var bitIndex = 0;
          var moduleCount = this.moduleCount;
          var bitLength = data.getLengthInBits();
          // Do the funny zigzag scan
          for (var right = moduleCount - 1; right >= 1; right -= 2) {
              // Index of right column in each column pair
              if (right === 6) {
                  right = 5;
              }
              for (var vert = 0; vert < moduleCount; vert++) {
                  // Vertical counter
                  for (var j = 0; j < 2; j++) {
                      // Actual x coordinate
                      var x = right - j;
                      var upward = ((right + 1) & 2) === 0;
                      // Actual y coordinate
                      var y = upward ? moduleCount - 1 - vert : vert;
                      if (this.modules[y][x] !== null) {
                          continue;
                      }
                      var bit = false;
                      if (bitIndex < bitLength) {
                          bit = data.getBit(bitIndex++);
                      }
                      var maskFunc = getMaskFunc(maskPattern);
                      var invert = maskFunc(x, y);
                      if (invert) {
                          bit = !bit;
                      }
                      this.modules[y][x] = bit;
                  }
              }
          }
      };
      Encoder.prototype.buildMatrix = function (data, maskPattern) {
          // Initialize modules
          this.modules = [];
          var moduleCount = this.moduleCount;
          for (var row = 0; row < moduleCount; row++) {
              this.modules[row] = [];
              for (var col = 0; col < moduleCount; col++) {
                  this.modules[row][col] = null;
              }
          }
          // Setup finder pattern
          this.setupFinderPattern(0, 0);
          this.setupFinderPattern(moduleCount - 7, 0);
          this.setupFinderPattern(0, moduleCount - 7);
          // Setup alignment pattern
          this.setupAlignmentPattern();
          // Setup timing pattern
          this.setupTimingPattern();
          // Setup format info
          this.setupFormatInfo(maskPattern);
          // Setup version info
          this.setupVersionInfo();
          // Setup codewords
          this.setupCodewords(data, maskPattern);
      };
      /**
       * @public
       * @method make
       */
      Encoder.prototype.make = function () {
          var _a, _b;
          var buffer;
          var rsBlocks;
          var maxDataCount;
          var chunks = this.chunks;
          var errorCorrectionLevel = this.errorCorrectionLevel;
          if (this.autoVersion) {
              for (this.version = 1; this.version <= 40; this.version++) {
                  _a = prepareData(this.version, errorCorrectionLevel, this.hasEncodingHint, chunks), buffer = _a[0], rsBlocks = _a[1], maxDataCount = _a[2];
                  if (buffer.getLengthInBits() <= maxDataCount)
                      break;
              }
          }
          else {
              _b = prepareData(this.version, errorCorrectionLevel, this.hasEncodingHint, chunks), buffer = _b[0], rsBlocks = _b[1], maxDataCount = _b[2];
          }
          // Calc module count
          this.moduleCount = this.version * 4 + 17;
          var matrices = [];
          var data = createData(buffer, rsBlocks, maxDataCount);
          var bestMaskPattern = -1;
          var minPenalty = Number.MAX_VALUE;
          // Choose best mask pattern
          for (var maskPattern = 0; maskPattern < 8; maskPattern++) {
              this.buildMatrix(data, maskPattern);
              matrices.push(this.modules);
              var penalty = calculateMaskPenalty(this);
              if (penalty < minPenalty) {
                  minPenalty = penalty;
                  bestMaskPattern = maskPattern;
              }
          }
          this.modules = matrices[bestMaskPattern];
      };
      /**
       * @public
       * @method toDataURL
       * @param {number} moduleSize
       * @param {number} margin
       * @returns {string}
       */
      Encoder.prototype.toDataURL = function (moduleSize, margin) {
          if (moduleSize === void 0) { moduleSize = 2; }
          if (margin === void 0) { margin = moduleSize * 4; }
          moduleSize = Math.max(1, moduleSize >> 0);
          margin = Math.max(0, margin >> 0);
          var moduleCount = this.moduleCount;
          var size = moduleSize * moduleCount + margin * 2;
          var gif = new GIFImage(size, size);
          for (var y = 0; y < size; y++) {
              for (var x = 0; x < size; x++) {
                  if (margin <= x &&
                      x < size - margin &&
                      margin <= y &&
                      y < size - margin &&
                      this.isDark(((y - margin) / moduleSize) >> 0, ((x - margin) / moduleSize) >> 0)) {
                      gif.setPixel(x, y, 0);
                  }
                  else {
                      gif.setPixel(x, y, 1);
                  }
              }
          }
          return gif.toDataURL();
      };
      return Encoder;
  }());

  /**
   * @module locator
   * @author nuintun
   * @author Cosmo Wolfe
   */
  var MIN_QUAD_RATIO = 0.5;
  var MAX_QUAD_RATIO = 1.5;
  var MAX_FINDERPATTERNS_TO_SEARCH = 4;
  function distance(a, b) {
      return Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2));
  }
  function sum(values) {
      return values.reduce(function (a, b) { return a + b; });
  }
  // Takes three finder patterns and organizes them into topLeft, topRight, etc
  function reorderFinderPatterns(pattern1, pattern2, pattern3) {
      var _a, _b, _c, _d;
      // Find distances between pattern centers
      var oneTwoDistance = distance(pattern1, pattern2);
      var twoThreeDistance = distance(pattern2, pattern3);
      var oneThreeDistance = distance(pattern1, pattern3);
      var topLeft;
      var topRight;
      var bottomLeft;
      // Assume one closest to other two is B; A and C will just be guesses at first
      if (twoThreeDistance >= oneTwoDistance && twoThreeDistance >= oneThreeDistance) {
          _a = [pattern2, pattern1, pattern3], bottomLeft = _a[0], topLeft = _a[1], topRight = _a[2];
      }
      else if (oneThreeDistance >= twoThreeDistance && oneThreeDistance >= oneTwoDistance) {
          _b = [pattern1, pattern2, pattern3], bottomLeft = _b[0], topLeft = _b[1], topRight = _b[2];
      }
      else {
          _c = [pattern1, pattern3, pattern2], bottomLeft = _c[0], topLeft = _c[1], topRight = _c[2];
      }
      // Use cross product to figure out whether bottomLeft (A) and topRight (C) are correct or flipped in relation to topLeft (B)
      // This asks whether BC x BA has a positive z component, which is the arrangement we want. If it's negative, then
      // we've got it flipped around and should swap topRight and bottomLeft.
      if ((topRight.x - topLeft.x) * (bottomLeft.y - topLeft.y) - (topRight.y - topLeft.y) * (bottomLeft.x - topLeft.x) < 0) {
          _d = [topRight, bottomLeft], bottomLeft = _d[0], topRight = _d[1];
      }
      return { bottomLeft: bottomLeft, topLeft: topLeft, topRight: topRight };
  }
  // Computes the dimension (number of modules on a side) of the QR Code based on the position of the finder patterns
  function computeDimension(topLeft, topRight, bottomLeft, matrix) {
      var moduleSize = (sum(countBlackWhiteRun(topLeft, bottomLeft, matrix, 5)) / 7 + // Divide by 7 since the ratio is 1:1:3:1:1
          sum(countBlackWhiteRun(topLeft, topRight, matrix, 5)) / 7 +
          sum(countBlackWhiteRun(bottomLeft, topLeft, matrix, 5)) / 7 +
          sum(countBlackWhiteRun(topRight, topLeft, matrix, 5)) / 7) /
          4;
      if (moduleSize < 1) {
          throw 'invalid module size';
      }
      var topDimension = Math.round(distance(topLeft, topRight) / moduleSize);
      var sideDimension = Math.round(distance(topLeft, bottomLeft) / moduleSize);
      var dimension = Math.floor((topDimension + sideDimension) / 2) + 7;
      switch (dimension % 4) {
          case 0:
              dimension++;
              break;
          case 2:
              dimension--;
              break;
      }
      return { dimension: dimension, moduleSize: moduleSize };
  }
  // Takes an origin point and an end point and counts the sizes of the black white run from the origin towards the end point.
  // Returns an array of elements, representing the pixel size of the black white run.
  // Uses a variant of http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
  function countBlackWhiteRunTowardsPoint(origin, end, matrix, length) {
      var switchPoints = [{ x: Math.floor(origin.x), y: Math.floor(origin.y) }];
      var steep = Math.abs(end.y - origin.y) > Math.abs(end.x - origin.x);
      var fromX;
      var fromY;
      var toX;
      var toY;
      if (steep) {
          fromX = Math.floor(origin.y);
          fromY = Math.floor(origin.x);
          toX = Math.floor(end.y);
          toY = Math.floor(end.x);
      }
      else {
          fromX = Math.floor(origin.x);
          fromY = Math.floor(origin.y);
          toX = Math.floor(end.x);
          toY = Math.floor(end.y);
      }
      var dx = Math.abs(toX - fromX);
      var dy = Math.abs(toY - fromY);
      var error = Math.floor(-dx / 2);
      var xStep = fromX < toX ? 1 : -1;
      var yStep = fromY < toY ? 1 : -1;
      var currentPixel = true;
      // Loop up until x == toX, but not beyond
      for (var x = fromX, y = fromY; x !== toX + xStep; x += xStep) {
          // Does current pixel mean we have moved white to black or vice versa?
          // Scanning black in state 0,2 and white in state 1, so if we find the wrong
          // color, advance to next state or end if we are in state 2 already
          var realX = steep ? y : x;
          var realY = steep ? x : y;
          if (matrix.get(realX, realY) !== currentPixel) {
              currentPixel = !currentPixel;
              switchPoints.push({ x: realX, y: realY });
              if (switchPoints.length === length + 1) {
                  break;
              }
          }
          error += dy;
          if (error > 0) {
              if (y === toY) {
                  break;
              }
              y += yStep;
              error -= dx;
          }
      }
      var distances = [];
      for (var i = 0; i < length; i++) {
          if (switchPoints[i] && switchPoints[i + 1]) {
              distances.push(distance(switchPoints[i], switchPoints[i + 1]));
          }
          else {
              distances.push(0);
          }
      }
      return distances;
  }
  // Takes an origin point and an end point and counts the sizes of the black white run in the origin point
  // along the line that intersects with the end point. Returns an array of elements, representing the pixel sizes
  // of the black white run. Takes a length which represents the number of switches from black to white to look for.
  function countBlackWhiteRun(origin, end, matrix, length) {
      var _a;
      var rise = end.y - origin.y;
      var run = end.x - origin.x;
      var towardsEnd = countBlackWhiteRunTowardsPoint(origin, end, matrix, Math.ceil(length / 2));
      var awayFromEnd = countBlackWhiteRunTowardsPoint(origin, { x: origin.x - run, y: origin.y - rise }, matrix, Math.ceil(length / 2));
      var middleValue = towardsEnd.shift() + awayFromEnd.shift() - 1; // Substract one so we don't double count a pixel
      return (_a = awayFromEnd.concat(middleValue)).concat.apply(_a, towardsEnd);
  }
  // Takes in a black white run and an array of expected ratios. Returns the average size of the run as well as the "error" -
  // that is the amount the run diverges from the expected ratio
  function scoreBlackWhiteRun(sequence, ratios) {
      var averageSize = sum(sequence) / sum(ratios);
      var error = 0;
      ratios.forEach(function (ratio, i) {
          error += Math.pow((sequence[i] - ratio * averageSize), 2);
      });
      return { averageSize: averageSize, error: error };
  }
  // Takes an X,Y point and an array of sizes and scores the point against those ratios.
  // For example for a finder pattern takes the ratio list of 1:1:3:1:1 and checks horizontal, vertical and diagonal ratios
  // against that.
  function scorePattern(point, ratios, matrix) {
      try {
          var horizontalRun = countBlackWhiteRun(point, { x: -1, y: point.y }, matrix, ratios.length);
          var verticalRun = countBlackWhiteRun(point, { x: point.x, y: -1 }, matrix, ratios.length);
          var topLeftPoint = {
              x: Math.max(0, point.x - point.y) - 1,
              y: Math.max(0, point.y - point.x) - 1
          };
          var topLeftBottomRightRun = countBlackWhiteRun(point, topLeftPoint, matrix, ratios.length);
          var bottomLeftPoint = {
              x: Math.min(matrix.width, point.x + point.y) + 1,
              y: Math.min(matrix.height, point.y + point.x) + 1
          };
          var bottomLeftTopRightRun = countBlackWhiteRun(point, bottomLeftPoint, matrix, ratios.length);
          var horzError = scoreBlackWhiteRun(horizontalRun, ratios);
          var vertError = scoreBlackWhiteRun(verticalRun, ratios);
          var diagDownError = scoreBlackWhiteRun(topLeftBottomRightRun, ratios);
          var diagUpError = scoreBlackWhiteRun(bottomLeftTopRightRun, ratios);
          var ratioError = Math.sqrt(horzError.error * horzError.error +
              vertError.error * vertError.error +
              diagDownError.error * diagDownError.error +
              diagUpError.error * diagUpError.error);
          var avgSize = (horzError.averageSize + vertError.averageSize + diagDownError.averageSize + diagUpError.averageSize) / 4;
          var sizeError = (Math.pow((horzError.averageSize - avgSize), 2) +
              Math.pow((vertError.averageSize - avgSize), 2) +
              Math.pow((diagDownError.averageSize - avgSize), 2) +
              Math.pow((diagUpError.averageSize - avgSize), 2)) /
              avgSize;
          return ratioError + sizeError;
      }
      catch (_a) {
          return Infinity;
      }
  }
  function locate(matrix) {
      var _a;
      var finderPatternQuads = [];
      var alignmentPatternQuads = [];
      var activeFinderPatternQuads = [];
      var activeAlignmentPatternQuads = [];
      var _loop_1 = function (y) {
          var length_1 = 0;
          var lastBit = false;
          var scans = [0, 0, 0, 0, 0];
          var _loop_2 = function (x) {
              var v = matrix.get(x, y);
              if (v === lastBit) {
                  length_1++;
              }
              else {
                  scans = [scans[1], scans[2], scans[3], scans[4], length_1];
                  length_1 = 1;
                  lastBit = v;
                  // Do the last 5 color changes ~ match the expected ratio for a finder pattern? 1:1:3:1:1 of b:w:b:w:b
                  var averageFinderPatternBlocksize = sum(scans) / 7;
                  var validFinderPattern = Math.abs(scans[0] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                      Math.abs(scans[1] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                      Math.abs(scans[2] - 3 * averageFinderPatternBlocksize) < 3 * averageFinderPatternBlocksize &&
                      Math.abs(scans[3] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                      Math.abs(scans[4] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                      !v; // And make sure the current pixel is white since finder patterns are bordered in white
                  // Do the last 3 color changes ~ match the expected ratio for an alignment pattern? 1:1:1 of w:b:w
                  var averageAlignmentPatternBlocksize = sum(scans.slice(-3)) / 3;
                  var validAlignmentPattern = Math.abs(scans[2] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
                      Math.abs(scans[3] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
                      Math.abs(scans[4] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
                      v; // Is the current pixel black since alignment patterns are bordered in black
                  if (validFinderPattern) {
                      // Compute the start and end x values of the large center black square
                      var endX_1 = x - scans[3] - scans[4];
                      var startX_1 = endX_1 - scans[2];
                      var line = { startX: startX_1, endX: endX_1, y: y };
                      // Is there a quad directly above the current spot? If so, extend it with the new line. Otherwise, create a new quad with
                      // that line as the starting point.
                      var matchingQuads = activeFinderPatternQuads.filter(function (q) {
                          return (startX_1 >= q.bottom.startX && startX_1 <= q.bottom.endX) ||
                              (endX_1 >= q.bottom.startX && startX_1 <= q.bottom.endX) ||
                              (startX_1 <= q.bottom.startX &&
                                  endX_1 >= q.bottom.endX &&
                                  (scans[2] / (q.bottom.endX - q.bottom.startX) < MAX_QUAD_RATIO &&
                                      scans[2] / (q.bottom.endX - q.bottom.startX) > MIN_QUAD_RATIO));
                      });
                      if (matchingQuads.length > 0) {
                          matchingQuads[0].bottom = line;
                      }
                      else {
                          activeFinderPatternQuads.push({ top: line, bottom: line });
                      }
                  }
                  if (validAlignmentPattern) {
                      // Compute the start and end x values of the center black square
                      var endX_2 = x - scans[4];
                      var startX_2 = endX_2 - scans[3];
                      var line = { startX: startX_2, y: y, endX: endX_2 };
                      // Is there a quad directly above the current spot? If so, extend it with the new line. Otherwise, create a new quad with
                      // that line as the starting point.
                      var matchingQuads = activeAlignmentPatternQuads.filter(function (q) {
                          return (startX_2 >= q.bottom.startX && startX_2 <= q.bottom.endX) ||
                              (endX_2 >= q.bottom.startX && startX_2 <= q.bottom.endX) ||
                              (startX_2 <= q.bottom.startX &&
                                  endX_2 >= q.bottom.endX &&
                                  (scans[2] / (q.bottom.endX - q.bottom.startX) < MAX_QUAD_RATIO &&
                                      scans[2] / (q.bottom.endX - q.bottom.startX) > MIN_QUAD_RATIO));
                      });
                      if (matchingQuads.length > 0) {
                          matchingQuads[0].bottom = line;
                      }
                      else {
                          activeAlignmentPatternQuads.push({ top: line, bottom: line });
                      }
                  }
              }
          };
          for (var x = -1; x <= matrix.width; x++) {
              _loop_2(x);
          }
          finderPatternQuads.push.apply(finderPatternQuads, activeFinderPatternQuads.filter(function (q) { return q.bottom.y !== y && q.bottom.y - q.top.y >= 2; }));
          activeFinderPatternQuads = activeFinderPatternQuads.filter(function (q) { return q.bottom.y === y; });
          alignmentPatternQuads.push.apply(alignmentPatternQuads, activeAlignmentPatternQuads.filter(function (q) { return q.bottom.y !== y; }));
          activeAlignmentPatternQuads = activeAlignmentPatternQuads.filter(function (q) { return q.bottom.y === y; });
      };
      for (var y = 0; y <= matrix.height; y++) {
          _loop_1(y);
      }
      finderPatternQuads.push.apply(finderPatternQuads, activeFinderPatternQuads.filter(function (q) { return q.bottom.y - q.top.y >= 2; }));
      alignmentPatternQuads.push.apply(alignmentPatternQuads, activeAlignmentPatternQuads);
      var finderPatternGroups = finderPatternQuads
          .filter(function (q) { return q.bottom.y - q.top.y >= 2; }) // All quads must be at least 2px tall since the center square is larger than a block
          .map(function (q) {
          // Initial scoring of finder pattern quads by looking at their ratios, not taking into account position
          var x = (q.top.startX + q.top.endX + q.bottom.startX + q.bottom.endX) / 4;
          var y = (q.top.y + q.bottom.y + 1) / 2;
          if (!matrix.get(Math.round(x), Math.round(y))) {
              return;
          }
          var lengths = [q.top.endX - q.top.startX, q.bottom.endX - q.bottom.startX, q.bottom.y - q.top.y + 1];
          var size = sum(lengths) / lengths.length;
          var score = scorePattern({ x: Math.round(x), y: Math.round(y) }, [1, 1, 3, 1, 1], matrix);
          return { score: score, x: x, y: y, size: size };
      })
          .filter(function (q) { return !!q; }) // Filter out any rejected quads from above
          .sort(function (a, b) { return a.score - b.score; })
          // Now take the top finder pattern options and try to find 2 other options with a similar size.
          .map(function (point, i, finderPatterns) {
          if (i > MAX_FINDERPATTERNS_TO_SEARCH) {
              return null;
          }
          var otherPoints = finderPatterns
              .filter(function (p, ii) { return i !== ii; })
              .map(function (p) { return ({ x: p.x, y: p.y, score: p.score + Math.pow((p.size - point.size), 2) / point.size, size: p.size }); })
              .sort(function (a, b) { return a.score - b.score; });
          if (otherPoints.length < 2) {
              return null;
          }
          var score = point.score + otherPoints[0].score + otherPoints[1].score;
          return { points: [point].concat(otherPoints.slice(0, 2)), score: score };
      })
          .filter(function (q) { return !!q; }) // Filter out any rejected finder patterns from above
          .sort(function (a, b) { return a.score - b.score; });
      if (finderPatternGroups.length === 0) {
          return null;
      }
      var _b = reorderFinderPatterns(finderPatternGroups[0].points[0], finderPatternGroups[0].points[1], finderPatternGroups[0].points[2]), topRight = _b.topRight, topLeft = _b.topLeft, bottomLeft = _b.bottomLeft;
      // Now that we've found the three finder patterns we can determine the blockSize and the size of the QR code.
      // We'll use these to help find the alignment pattern but also later when we do the extraction.
      var dimension;
      var moduleSize;
      try {
          (_a = computeDimension(topLeft, topRight, bottomLeft, matrix), dimension = _a.dimension, moduleSize = _a.moduleSize);
      }
      catch (e) {
          return null;
      }
      // Now find the alignment pattern
      var bottomRightFinderPattern = {
          // Best guess at where a bottomRight finder pattern would be
          x: topRight.x - topLeft.x + bottomLeft.x,
          y: topRight.y - topLeft.y + bottomLeft.y
      };
      var modulesBetweenFinderPatterns = (distance(topLeft, bottomLeft) + distance(topLeft, topRight)) / 2 / moduleSize;
      var correctionToTopLeft = 1 - 3 / modulesBetweenFinderPatterns;
      var expectedAlignmentPattern = {
          x: topLeft.x + correctionToTopLeft * (bottomRightFinderPattern.x - topLeft.x),
          y: topLeft.y + correctionToTopLeft * (bottomRightFinderPattern.y - topLeft.y)
      };
      var alignmentPatterns = alignmentPatternQuads
          .map(function (q) {
          var x = (q.top.startX + q.top.endX + q.bottom.startX + q.bottom.endX) / 4;
          var y = (q.top.y + q.bottom.y + 1) / 2;
          if (!matrix.get(Math.floor(x), Math.floor(y))) {
              return;
          }
          var sizeScore = scorePattern({ x: Math.floor(x), y: Math.floor(y) }, [1, 1, 1], matrix);
          var score = sizeScore + distance({ x: x, y: y }, expectedAlignmentPattern);
          return { x: x, y: y, score: score };
      })
          .filter(function (v) { return !!v; })
          .sort(function (a, b) { return a.score - b.score; });
      // If there are less than 15 modules between finder patterns it's a version 1 QR code and as such has no alignmemnt pattern
      // so we can only use our best guess.
      var hasAlignmentPatterns = modulesBetweenFinderPatterns >= 15 && alignmentPatterns.length;
      var alignmentPattern = hasAlignmentPatterns ? alignmentPatterns[0] : expectedAlignmentPattern;
      return {
          dimension: dimension,
          topLeft: { x: topLeft.x, y: topLeft.y },
          topRight: { x: topRight.x, y: topRight.y },
          bottomLeft: { x: bottomLeft.x, y: bottomLeft.y },
          alignmentPattern: { x: alignmentPattern.x, y: alignmentPattern.y }
      };
  }

  /**
   * @module GenericGFPoly
   * @author nuintun
   * @author Cosmo Wolfe
   */
  var GenericGFPoly = /*#__PURE__*/ (function () {
      function GenericGFPoly(field, coefficients) {
          if (coefficients.length === 0) {
              throw 'no coefficients';
          }
          this.field = field;
          var coefficientsLength = coefficients.length;
          if (coefficientsLength > 1 && coefficients[0] === 0) {
              // Leading term must be non-zero for anything except the constant polynomial "0"
              var firstNonZero = 1;
              while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
                  firstNonZero++;
              }
              if (firstNonZero === coefficientsLength) {
                  this.coefficients = field.zero.coefficients;
              }
              else {
                  this.coefficients = new Uint8ClampedArray(coefficientsLength - firstNonZero);
                  for (var i = 0; i < this.coefficients.length; i++) {
                      this.coefficients[i] = coefficients[firstNonZero + i];
                  }
              }
          }
          else {
              this.coefficients = coefficients;
          }
      }
      GenericGFPoly.prototype.degree = function () {
          return this.coefficients.length - 1;
      };
      GenericGFPoly.prototype.isZero = function () {
          return this.coefficients[0] === 0;
      };
      GenericGFPoly.prototype.getCoefficient = function (degree) {
          return this.coefficients[this.coefficients.length - 1 - degree];
      };
      GenericGFPoly.prototype.addOrSubtract = function (other) {
          var _a;
          if (this.isZero()) {
              return other;
          }
          if (other.isZero()) {
              return this;
          }
          var smallerCoefficients = this.coefficients;
          var largerCoefficients = other.coefficients;
          if (smallerCoefficients.length > largerCoefficients.length) {
              _a = [largerCoefficients, smallerCoefficients], smallerCoefficients = _a[0], largerCoefficients = _a[1];
          }
          var sumDiff = new Uint8ClampedArray(largerCoefficients.length);
          var lengthDiff = largerCoefficients.length - smallerCoefficients.length;
          for (var i = 0; i < lengthDiff; i++) {
              sumDiff[i] = largerCoefficients[i];
          }
          for (var i = lengthDiff; i < largerCoefficients.length; i++) {
              sumDiff[i] = addOrSubtractGF(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
          }
          return new GenericGFPoly(this.field, sumDiff);
      };
      GenericGFPoly.prototype.multiply = function (scalar) {
          if (scalar === 0) {
              return this.field.zero;
          }
          if (scalar === 1) {
              return this;
          }
          var size = this.coefficients.length;
          var product = new Uint8ClampedArray(size);
          for (var i = 0; i < size; i++) {
              product[i] = this.field.multiply(this.coefficients[i], scalar);
          }
          return new GenericGFPoly(this.field, product);
      };
      GenericGFPoly.prototype.multiplyPoly = function (other) {
          if (this.isZero() || other.isZero()) {
              return this.field.zero;
          }
          var aCoefficients = this.coefficients;
          var aLength = aCoefficients.length;
          var bCoefficients = other.coefficients;
          var bLength = bCoefficients.length;
          var product = new Uint8ClampedArray(aLength + bLength - 1);
          for (var i = 0; i < aLength; i++) {
              var aCoeff = aCoefficients[i];
              for (var j = 0; j < bLength; j++) {
                  product[i + j] = addOrSubtractGF(product[i + j], this.field.multiply(aCoeff, bCoefficients[j]));
              }
          }
          return new GenericGFPoly(this.field, product);
      };
      GenericGFPoly.prototype.multiplyByMonomial = function (degree, coefficient) {
          if (degree < 0) {
              throw 'invalid degree less than 0';
          }
          if (coefficient === 0) {
              return this.field.zero;
          }
          var size = this.coefficients.length;
          var product = new Uint8ClampedArray(size + degree);
          for (var i = 0; i < size; i++) {
              product[i] = this.field.multiply(this.coefficients[i], coefficient);
          }
          return new GenericGFPoly(this.field, product);
      };
      GenericGFPoly.prototype.evaluateAt = function (a) {
          var result = 0;
          if (a === 0) {
              // Just return the x^0 coefficient
              return this.getCoefficient(0);
          }
          var size = this.coefficients.length;
          if (a === 1) {
              // Just the sum of the coefficients
              this.coefficients.forEach(function (coefficient) {
                  result = addOrSubtractGF(result, coefficient);
              });
              return result;
          }
          result = this.coefficients[0];
          for (var i = 1; i < size; i++) {
              result = addOrSubtractGF(this.field.multiply(a, result), this.coefficients[i]);
          }
          return result;
      };
      return GenericGFPoly;
  }());

  /**
   * @module GenericGF
   * @author nuintun
   * @author Cosmo Wolfe
   */
  function addOrSubtractGF(a, b) {
      return a ^ b;
  }
  var GenericGF = /*#__PURE__*/ (function () {
      function GenericGF(primitive, size, generatorBase) {
          this.primitive = primitive;
          this.size = size;
          this.generatorBase = generatorBase;
          this.expTable = [];
          this.logTable = [];
          var x = 1;
          for (var i = 0; i < this.size; i++) {
              this.logTable[i] = 0;
              this.expTable[i] = x;
              x = x * 2;
              if (x >= this.size) {
                  x = (x ^ this.primitive) & (this.size - 1);
              }
          }
          for (var i = 0; i < this.size - 1; i++) {
              this.logTable[this.expTable[i]] = i;
          }
          this.zero = new GenericGFPoly(this, Uint8ClampedArray.from([0]));
          this.one = new GenericGFPoly(this, Uint8ClampedArray.from([1]));
      }
      GenericGF.prototype.multiply = function (a, b) {
          if (a === 0 || b === 0) {
              return 0;
          }
          return this.expTable[(this.logTable[a] + this.logTable[b]) % (this.size - 1)];
      };
      GenericGF.prototype.inverse = function (a) {
          if (a === 0) {
              throw "can't invert 0";
          }
          return this.expTable[this.size - this.logTable[a] - 1];
      };
      GenericGF.prototype.buildMonomial = function (degree, coefficient) {
          if (degree < 0) {
              throw 'invalid monomial degree less than 0';
          }
          if (coefficient === 0) {
              return this.zero;
          }
          var coefficients = new Uint8ClampedArray(degree + 1);
          coefficients[0] = coefficient;
          return new GenericGFPoly(this, coefficients);
      };
      GenericGF.prototype.log = function (a) {
          if (a === 0) {
              throw "can't take log(0)";
          }
          return this.logTable[a];
      };
      GenericGF.prototype.exp = function (a) {
          return this.expTable[a];
      };
      return GenericGF;
  }());

  /**
   * @module index
   * @author nuintun
   * @author Cosmo Wolfe
   */
  function runEuclideanAlgorithm(field, a, b, R) {
      var _a;
      // Assume a's degree is >= b's
      if (a.degree() < b.degree()) {
          _a = [b, a], a = _a[0], b = _a[1];
      }
      var rLast = a;
      var r = b;
      var tLast = field.zero;
      var t = field.one;
      // Run Euclidean algorithm until r's degree is less than R/2
      while (r.degree() >= R / 2) {
          var rLastLast = rLast;
          var tLastLast = tLast;
          rLast = r;
          tLast = t;
          // Divide rLastLast by rLast, with quotient in q and remainder in r
          if (rLast.isZero()) {
              // Euclidean algorithm already terminated?
              return null;
          }
          r = rLastLast;
          var q = field.zero;
          var denominatorLeadingTerm = rLast.getCoefficient(rLast.degree());
          var dltInverse = field.inverse(denominatorLeadingTerm);
          while (r.degree() >= rLast.degree() && !r.isZero()) {
              var degreeDiff = r.degree() - rLast.degree();
              var scale = field.multiply(r.getCoefficient(r.degree()), dltInverse);
              q = q.addOrSubtract(field.buildMonomial(degreeDiff, scale));
              r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
          }
          t = q.multiplyPoly(tLast).addOrSubtract(tLastLast);
          if (r.degree() >= rLast.degree()) {
              return null;
          }
      }
      var sigmaTildeAtZero = t.getCoefficient(0);
      if (sigmaTildeAtZero === 0) {
          return null;
      }
      var inverse = field.inverse(sigmaTildeAtZero);
      return [t.multiply(inverse), r.multiply(inverse)];
  }
  function findErrorLocations(field, errorLocator) {
      // This is a direct application of Chien's search
      var numErrors = errorLocator.degree();
      if (numErrors === 1) {
          return [errorLocator.getCoefficient(1)];
      }
      var errorCount = 0;
      var result = new Array(numErrors);
      for (var i = 1; i < field.size && errorCount < numErrors; i++) {
          if (errorLocator.evaluateAt(i) === 0) {
              result[errorCount] = field.inverse(i);
              errorCount++;
          }
      }
      if (errorCount !== numErrors) {
          return null;
      }
      return result;
  }
  function findErrorMagnitudes(field, errorEvaluator, errorLocations) {
      // This is directly applying Forney's Formula
      var s = errorLocations.length;
      var result = new Array(s);
      for (var i = 0; i < s; i++) {
          var denominator = 1;
          var xiInverse = field.inverse(errorLocations[i]);
          for (var j = 0; j < s; j++) {
              if (i !== j) {
                  denominator = field.multiply(denominator, addOrSubtractGF(1, field.multiply(errorLocations[j], xiInverse)));
              }
          }
          result[i] = field.multiply(errorEvaluator.evaluateAt(xiInverse), field.inverse(denominator));
          if (field.generatorBase !== 0) {
              result[i] = field.multiply(result[i], xiInverse);
          }
      }
      return result;
  }
  function rsDecode(bytes, twoS) {
      var outputBytes = new Uint8ClampedArray(bytes.length);
      outputBytes.set(bytes);
      var field = new GenericGF(0x011d, 256, 0); // x^8 + x^4 + x^3 + x^2 + 1
      var poly = new GenericGFPoly(field, outputBytes);
      var syndromeCoefficients = new Uint8ClampedArray(twoS);
      var error = false;
      for (var s = 0; s < twoS; s++) {
          var evaluation = poly.evaluateAt(field.exp(s + field.generatorBase));
          syndromeCoefficients[syndromeCoefficients.length - 1 - s] = evaluation;
          if (evaluation !== 0) {
              error = true;
          }
      }
      if (!error) {
          return outputBytes;
      }
      var syndrome = new GenericGFPoly(field, syndromeCoefficients);
      var sigmaOmega = runEuclideanAlgorithm(field, field.buildMonomial(twoS, 1), syndrome, twoS);
      if (sigmaOmega === null) {
          return null;
      }
      var errorLocations = findErrorLocations(field, sigmaOmega[0]);
      if (errorLocations == null) {
          return null;
      }
      var errorMagnitudes = findErrorMagnitudes(field, sigmaOmega[1], errorLocations);
      for (var i = 0; i < errorLocations.length; i++) {
          var position = outputBytes.length - 1 - field.log(errorLocations[i]);
          if (position < 0) {
              return null;
          }
          outputBytes[position] = addOrSubtractGF(outputBytes[position], errorMagnitudes[i]);
      }
      return outputBytes;
  }

  /**
   * @module BitMatrix
   * @author nuintun
   * @author Cosmo Wolfe
   */
  var BitMatrix = /*#__PURE__*/ (function () {
      function BitMatrix(data, width) {
          this.data = data;
          this.width = width;
          this.height = data.length / width;
      }
      BitMatrix.createEmpty = function (width, height) {
          return new BitMatrix(new Uint8ClampedArray(width * height), width);
      };
      BitMatrix.prototype.get = function (x, y) {
          if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
              return false;
          }
          return !!this.data[y * this.width + x];
      };
      BitMatrix.prototype.set = function (x, y, v) {
          this.data[y * this.width + x] = v ? 1 : 0;
      };
      BitMatrix.prototype.setRegion = function (left, top, width, height, v) {
          for (var y = top; y < top + height; y++) {
              for (var x = left; x < left + width; x++) {
                  this.set(x, y, !!v);
              }
          }
      };
      return BitMatrix;
  }());

  /**
   * @module BitStream
   * @author nuintun
   * @author Cosmo Wolfe
   */
  var BitStream = /*#__PURE__*/ (function () {
      function BitStream(bytes) {
          this.byteOffset = 0;
          this.bitOffset = 0;
          this.bytes = bytes;
      }
      BitStream.prototype.readBits = function (numBits) {
          if (numBits < 1 || numBits > 32 || numBits > this.available()) {
              throw "can't read " + numBits + " bits";
          }
          var result = 0;
          // First, read remainder from current byte
          if (this.bitOffset > 0) {
              var bitsLeft = 8 - this.bitOffset;
              var toRead = numBits < bitsLeft ? numBits : bitsLeft;
              var bitsToNotRead = bitsLeft - toRead;
              var mask = (0xff >> (8 - toRead)) << bitsToNotRead;
              result = (this.bytes[this.byteOffset] & mask) >> bitsToNotRead;
              numBits -= toRead;
              this.bitOffset += toRead;
              if (this.bitOffset === 8) {
                  this.bitOffset = 0;
                  this.byteOffset++;
              }
          }
          // Next read whole bytes
          if (numBits > 0) {
              while (numBits >= 8) {
                  result = (result << 8) | (this.bytes[this.byteOffset] & 0xff);
                  this.byteOffset++;
                  numBits -= 8;
              }
              // Finally read a partial byte
              if (numBits > 0) {
                  var bitsToNotRead = 8 - numBits;
                  var mask = (0xff >> bitsToNotRead) << bitsToNotRead;
                  result = (result << numBits) | ((this.bytes[this.byteOffset] & mask) >> bitsToNotRead);
                  this.bitOffset += numBits;
              }
          }
          return result;
      };
      BitStream.prototype.available = function () {
          return 8 * (this.bytes.length - this.byteOffset) - this.bitOffset;
      };
      return BitStream;
  }());

  /**
   * @module SJIS
   * @author nuintun
   * @author soldair
   * @author Kazuhiko Arase
   * @see https://github.com/soldair/node-qrcode/blob/master/helper/to-sjis.js
   */
  // prettier-ignore
  var SJIS_UTF8_TABLE = [
      [0x8140, 'ã€€ã€ã€‚ï¼Œï¼Žãƒ»ï¼šï¼›ï¼Ÿï¼ã‚›ã‚œÂ´ï½€Â¨ï¼¾ï¿£ï¼¿ãƒ½ãƒ¾ã‚ã‚žã€ƒä»ã€…ã€†ã€‡ãƒ¼â€•â€ï¼ï¼¼ï½žâˆ¥ï½œâ€¦â€¥â€˜â€™â€œâ€ï¼ˆï¼‰ã€”ã€•ï¼»ï¼½ï½›ï½ã€ˆã€‰ã€Šã€‹ã€Œã€ã€Žã€ã€ã€‘ï¼‹ï¼Â±Ã—'],
      [0x8180, 'Ã·ï¼â‰ ï¼œï¼ž'],
      [0x818f, 'ï¿¥ï¼„ï¿ ï¿¡ï¼…ï¼ƒï¼†ï¼Šï¼ Â§â˜†â˜…'],
      [0x81a6, 'â€»ã€’â†’â†â†‘â†“ã€“'],
      [0x81ca, 'ï¿¢'],
      [0x824f, 'ï¼ï¼‘ï¼’ï¼“ï¼”ï¼•ï¼–ï¼—ï¼˜ï¼™'],
      [0x8260, 'ï¼¡ï¼¢ï¼£ï¼¤ï¼¥ï¼¦ï¼§ï¼¨ï¼©ï¼ªï¼«ï¼¬ï¼­ï¼®ï¼¯ï¼°ï¼±ï¼²ï¼³ï¼´ï¼µï¼¶ï¼·ï¼¸ï¼¹ï¼º'],
      [0x8281, 'ï½ï½‚ï½ƒï½„ï½…ï½†ï½‡ï½ˆï½‰ï½Šï½‹ï½Œï½ï½Žï½ï½ï½‘ï½’ï½“ï½”ï½•ï½–ï½—ï½˜ï½™ï½š'],
      [0x829f, 'ãã‚ãƒã„ã…ã†ã‡ãˆã‰ãŠã‹ãŒããŽããã‘ã’ã“ã”ã•ã–ã—ã˜ã™ãšã›ãœããžãŸã ã¡ã¢ã£ã¤ã¥ã¦ã§ã¨ã©ãªã«ã¬ã­ã®ã¯ã°ã±ã²ã³ã´ãµã¶ã·ã¸ã¹ãºã»ã¼ã½ã¾ã¿ã‚€ã‚ã‚‚ã‚ƒã‚„ã‚…ã‚†ã‚‡ã‚ˆã‚‰ã‚Šã‚‹ã‚Œã‚ã‚Žã‚ã‚ã‚‘ã‚’ã‚“'],
      [0x8340, 'ã‚¡ã‚¢ã‚£ã‚¤ã‚¥ã‚¦ã‚§ã‚¨ã‚©ã‚ªã‚«ã‚¬ã‚­ã‚®ã‚¯ã‚°ã‚±ã‚²ã‚³ã‚´ã‚µã‚¶ã‚·ã‚¸ã‚¹ã‚ºã‚»ã‚¼ã‚½ã‚¾ã‚¿ãƒ€ãƒãƒ‚ãƒƒãƒ„ãƒ…ãƒ†ãƒ‡ãƒˆãƒ‰ãƒŠãƒ‹ãƒŒãƒãƒŽãƒãƒãƒ‘ãƒ’ãƒ“ãƒ”ãƒ•ãƒ–ãƒ—ãƒ˜ãƒ™ãƒšãƒ›ãƒœãƒãƒžãƒŸ'],
      [0x8380, 'ãƒ ãƒ¡ãƒ¢ãƒ£ãƒ¤ãƒ¥ãƒ¦ãƒ§ãƒ¨ãƒ©ãƒªãƒ«ãƒ¬ãƒ­ãƒ®ãƒ¯ãƒ°ãƒ±ãƒ²ãƒ³ãƒ´ãƒµãƒ¶'],
      [0x839f, 'Î‘Î’Î“Î”Î•Î–Î—Î˜Î™ÎšÎ›ÎœÎÎžÎŸÎ Î¡Î£Î¤Î¥Î¦Î§Î¨Î©'],
      [0x83bf, 'Î±Î²Î³Î´ÎµÎ¶Î·Î¸Î¹ÎºÎ»Î¼Î½Î¾Î¿Ï€ÏÏƒÏ„Ï…Ï†Ï‡ÏˆÏ‰'],
      [0x8440, 'ÐÐ‘Ð’Ð“Ð”Ð•ÐÐ–Ð—Ð˜Ð™ÐšÐ›ÐœÐÐžÐŸÐ Ð¡Ð¢Ð£Ð¤Ð¥Ð¦Ð§Ð¨Ð©ÐªÐ«Ð¬Ð­Ð®Ð¯'],
      [0x8470, 'Ð°Ð±Ð²Ð³Ð´ÐµÑ‘Ð¶Ð·Ð¸Ð¹ÐºÐ»Ð¼Ð½'],
      [0x8480, 'Ð¾Ð¿Ñ€ÑÑ‚ÑƒÑ„Ñ…Ñ†Ñ‡ÑˆÑ‰ÑŠÑ‹ÑŒÑÑŽÑ'],
      [0x8780, 'ã€ã€Ÿ'],
      [0x8940, 'é™¢é™°éš éŸ»å‹å³å®‡çƒç¾½è¿‚é›¨å¯éµœçªºä¸‘ç¢“è‡¼æ¸¦å˜˜å”„æ¬è”šé°»å§¥åŽ©æµ¦ç“œé–å™‚äº‘é‹é›²èé¤Œå¡å–¶å¬°å½±æ˜ æ›³æ „æ°¸æ³³æ´©ç‘›ç›ˆç©Žé ´è‹±è¡›è© é‹­æ¶²ç–«ç›Šé§…æ‚¦è¬è¶Šé–²æ¦ŽåŽ­å††'],
      [0x8980, 'åœ’å °å¥„å®´å»¶æ€¨æŽ©æ´æ²¿æ¼”ç‚Žç„”ç…™ç‡•çŒ¿ç¸è‰¶è‹‘è–—é é‰›é´›å¡©æ–¼æ±šç”¥å‡¹å¤®å¥¥å¾€å¿œæŠ¼æ—ºæ¨ªæ¬§æ®´çŽ‹ç¿è¥–é´¬é´Žé»„å²¡æ²–è»å„„å±‹æ†¶è‡†æ¡¶ç‰¡ä¹™ä¿ºå¸æ©æ¸©ç©éŸ³ä¸‹åŒ–ä»®ä½•ä¼½ä¾¡ä½³åŠ å¯å˜‰å¤å«å®¶å¯¡ç§‘æš‡æžœæž¶æ­Œæ²³ç«ç‚ç¦ç¦¾ç¨¼ç®‡èŠ±è‹›èŒ„è·è¯è“è¦èª²å˜©è²¨è¿¦éŽéœžèšŠä¿„å³¨æˆ‘ç‰™ç”»è‡¥èŠ½è›¾è³€é›…é¤“é§•ä»‹ä¼šè§£å›žå¡Šå£Šå»»å¿«æ€ªæ‚”æ¢æ‡æˆ’æ‹æ”¹'],
      [0x8a40, 'é­æ™¦æ¢°æµ·ç°ç•Œçš†çµµèŠ¥èŸ¹é–‹éšŽè²å‡±åŠ¾å¤–å’³å®³å´–æ…¨æ¦‚æ¶¯ç¢è“‹è¡—è©²éŽ§éª¸æµ¬é¦¨è›™åž£æŸ¿è›ŽéˆŽåŠƒåš‡å„å»“æ‹¡æ’¹æ ¼æ ¸æ®»ç²ç¢ºç©«è¦šè§’èµ«è¼ƒéƒ­é–£éš”é©å­¦å²³æ¥½é¡é¡ŽæŽ›ç¬ æ¨«'],
      [0x8a80, 'æ©¿æ¢¶é°æ½Ÿå‰²å–æ°æ‹¬æ´»æ¸‡æ»‘è‘›è¤è½„ä¸”é°¹å¶æ¤›æ¨ºéž„æ ªå…œç«ƒè’²é‡œéŽŒå™›é´¨æ ¢èŒ…è±ç²¥åˆˆè‹…ç“¦ä¹¾ä¾ƒå† å¯’åˆŠå‹˜å‹§å·»å–šå ªå§¦å®Œå®˜å¯›å¹²å¹¹æ‚£æ„Ÿæ…£æ†¾æ›æ•¢æŸ‘æ¡“æ£ºæ¬¾æ­“æ±—æ¼¢æ¾—æ½…ç’°ç”˜ç›£çœ‹ç«¿ç®¡ç°¡ç·©ç¼¶ç¿°è‚è‰¦èŽžè¦³è«Œè²«é‚„é‘‘é–“é–‘é–¢é™¥éŸ“é¤¨èˆ˜ä¸¸å«å²¸å·ŒçŽ©ç™Œçœ¼å²©ç¿«è´‹é›é ‘é¡”é¡˜ä¼ä¼Žå±å–œå™¨åŸºå¥‡å¬‰å¯„å²å¸Œå¹¾å¿Œæ®æœºæ——æ—¢æœŸæ£‹æ£„'],
      [0x8b40, 'æ©Ÿå¸°æ¯…æ°—æ±½ç•¿ç¥ˆå­£ç¨€ç´€å¾½è¦è¨˜è²´èµ·è»Œè¼é£¢é¨Žé¬¼äº€å½å„€å¦“å®œæˆ¯æŠ€æ“¬æ¬ºçŠ ç–‘ç¥‡ç¾©èŸ»èª¼è­°æŽ¬èŠéž å‰åƒå–«æ¡”æ©˜è©°ç §æµé»å´å®¢è„šè™é€†ä¸˜ä¹…ä»‡ä¼‘åŠå¸å®®å¼“æ€¥æ•‘'],
      [0x8b80, 'æœ½æ±‚æ±²æ³£ç¸çƒç©¶çª®ç¬ˆç´šç³¾çµ¦æ—§ç‰›åŽ»å±…å·¨æ‹’æ‹ æŒ™æ¸ è™šè¨±è·é‹¸æ¼ç¦¦é­šäº¨äº«äº¬ä¾›ä¾ åƒ‘å…‡ç«¶å…±å‡¶å”åŒ¡å¿å«å–¬å¢ƒå³¡å¼·å½Šæ€¯ææ­æŒŸæ•™æ©‹æ³ç‹‚ç‹­çŸ¯èƒ¸è„…èˆˆè•Žéƒ·é¡éŸ¿é¥—é©šä»°å‡å°­æšæ¥­å±€æ›²æ¥µçŽ‰æ¡ç²åƒ…å‹¤å‡å·¾éŒ¦æ–¤æ¬£æ¬½ç´ç¦ç¦½ç­‹ç·ŠèŠ¹èŒè¡¿è¥Ÿè¬¹è¿‘é‡‘åŸéŠ€ä¹å€¶å¥åŒºç‹—çŽ–çŸ©è‹¦èº¯é§†é§ˆé§’å…·æ„šè™žå–°ç©ºå¶å¯“é‡éš…ä¸²æ«›é‡§å±‘å±ˆ'],
      [0x8c40, 'æŽ˜çªŸæ²“é´è½¡çªªç†Šéšˆç²‚æ —ç¹°æ¡‘é¬å‹²å›è–«è¨“ç¾¤è»éƒ¡å¦è¢ˆç¥ä¿‚å‚¾åˆ‘å…„å•“åœ­çªåž‹å¥‘å½¢å¾„æµæ…¶æ…§æ†©æŽ²æºæ•¬æ™¯æ¡‚æ¸“ç•¦ç¨½ç³»çµŒç¶™ç¹‹ç½«èŒŽèŠè›è¨ˆè©£è­¦è»½é šé¶èŠ¸è¿Žé¯¨'],
      [0x8c80, 'åŠ‡æˆŸæ’ƒæ¿€éš™æ¡å‚‘æ¬ æ±ºæ½”ç©´çµè¡€è¨£æœˆä»¶å€¹å€¦å¥å…¼åˆ¸å‰£å–§åœå …å«Œå»ºæ†²æ‡¸æ‹³æ²æ¤œæ¨©ç‰½çŠ¬çŒ®ç ”ç¡¯çµ¹çœŒè‚©è¦‹è¬™è³¢è»’é£éµé™ºé¡•é¨“é¹¸å…ƒåŽŸåŽ³å¹»å¼¦æ¸›æºçŽ„ç¾çµƒèˆ·è¨€è«ºé™ä¹Žå€‹å¤å‘¼å›ºå§‘å­¤å·±åº«å¼§æˆ¸æ•…æž¯æ¹–ç‹ç³Šè¢´è‚¡èƒ¡è°è™Žèª‡è·¨éˆ·é›‡é¡§é¼“äº”äº’ä¼åˆå‘‰å¾å¨¯å¾Œå¾¡æ‚Ÿæ¢§æªŽç‘šç¢èªžèª¤è­·é†ä¹žé¯‰äº¤ä½¼ä¾¯å€™å€–å…‰å…¬åŠŸåŠ¹å‹¾åŽšå£å‘'],
      [0x8d40, 'åŽå–‰å‘åž¢å¥½å­”å­å®å·¥å·§å··å¹¸åºƒåºšåº·å¼˜æ’æ…ŒæŠ—æ‹˜æŽ§æ”»æ˜‚æ™ƒæ›´æ­æ ¡æ¢—æ§‹æ±Ÿæ´ªæµ©æ¸¯æºç”²çš‡ç¡¬ç¨¿ç³ ç´…ç´˜çµžç¶±è€•è€ƒè‚¯è‚±è…”è†èˆªè’è¡Œè¡¡è¬›è²¢è³¼éƒŠé…µé‰±ç ¿é‹¼é–¤é™'],
      [0x8d80, 'é …é¦™é«˜é´»å‰›åŠ«å·åˆå£•æ‹·æ¿ è±ªè½Ÿéº¹å…‹åˆ»å‘Šå›½ç©€é…·éµ é»’ç„æ¼‰è…°ç”‘å¿½æƒšéª¨ç‹›è¾¼æ­¤é ƒä»Šå›°å¤å¢¾å©šæ¨æ‡‡æ˜æ˜†æ ¹æ¢±æ··ç—•ç´ºè‰®é­‚äº›ä½å‰å”†åµ¯å·¦å·®æŸ»æ²™ç‘³ç ‚è©éŽ–è£Ÿååº§æŒ«å‚µå‚¬å†æœ€å“‰å¡žå¦»å®°å½©æ‰æŽ¡æ ½æ­³æ¸ˆç½é‡‡çŠ€ç •ç ¦ç¥­æ–Žç´°èœè£è¼‰éš›å‰¤åœ¨æç½ªè²¡å†´å‚é˜ªå ºæ¦Šè‚´å’²å´ŽåŸ¼ç¢•é·ºä½œå‰Šå’‹æ¾æ˜¨æœ”æŸµçª„ç­–ç´¢éŒ¯æ¡œé®­ç¬¹åŒ™å†Šåˆ·'],
      [0x8e40, 'å¯Ÿæ‹¶æ’®æ“¦æœ­æ®ºè–©é›‘çšé¯–æŒéŒ†é®«çš¿æ™’ä¸‰å‚˜å‚å±±æƒ¨æ’’æ•£æ¡Ÿç‡¦çŠç”£ç®—çº‚èš•è®ƒè³›é…¸é¤æ–¬æš«æ®‹ä»•ä»”ä¼ºä½¿åˆºå¸å²å—£å››å£«å§‹å§‰å§¿å­å±å¸‚å¸«å¿—æ€æŒ‡æ”¯å­œæ–¯æ–½æ—¨æžæ­¢'],
      [0x8e80, 'æ­»æ°ç…ç¥‰ç§ç³¸ç´™ç´«è‚¢è„‚è‡³è¦–è©žè©©è©¦èªŒè«®è³‡è³œé›Œé£¼æ­¯äº‹ä¼¼ä¾å…å­—å¯ºæ…ˆæŒæ™‚æ¬¡æ»‹æ²»çˆ¾ç’½ç—”ç£ç¤ºè€Œè€³è‡ªè’”è¾žæ±é¹¿å¼è­˜é´«ç«ºè»¸å®é›«ä¸ƒå±åŸ·å¤±å«‰å®¤æ‚‰æ¹¿æ¼†ç–¾è³ªå®Ÿè”€ç¯ å²æŸ´èŠå±¡è•Šç¸žèˆŽå†™å°„æ¨èµ¦æ–œç…®ç¤¾ç´—è€…è¬è»Šé®è›‡é‚ªå€Ÿå‹ºå°ºæ“ç¼çˆµé…Œé‡ˆéŒ«è‹¥å¯‚å¼±æƒ¹ä¸»å–å®ˆæ‰‹æœ±æ®Šç‹©ç ç¨®è…«è¶£é…’é¦–å„’å—å‘ªå¯¿æŽˆæ¨¹ç¶¬éœ€å›šåŽå‘¨'],
      [0x8f40, 'å®—å°±å·žä¿®æ„æ‹¾æ´²ç§€ç§‹çµ‚ç¹ç¿’è‡­èˆŸè’è¡†è¥²è®è¹´è¼¯é€±é…‹é…¬é›†é†œä»€ä½å……åå¾“æˆŽæŸ”æ±æ¸‹ç£ç¸¦é‡éŠƒå”å¤™å®¿æ·‘ç¥ç¸®ç²›å¡¾ç†Ÿå‡ºè¡“è¿°ä¿Šå³»æ˜¥çž¬ç«£èˆœé§¿å‡†å¾ªæ—¬æ¥¯æ®‰æ·³'],
      [0x8f80, 'æº–æ½¤ç›¾ç´”å·¡éµé†‡é †å‡¦åˆæ‰€æš‘æ›™æ¸šåº¶ç·’ç½²æ›¸è–¯è—·è«¸åŠ©å™å¥³åºå¾æ•é‹¤é™¤å‚·å„Ÿå‹åŒ å‡å¬å“¨å•†å”±å˜—å¥¨å¦¾å¨¼å®µå°†å°å°‘å°šåº„åºŠå» å½°æ‰¿æŠ„æ‹›æŽŒæ·æ˜‡æ˜Œæ˜­æ™¶æ¾æ¢¢æ¨Ÿæ¨µæ²¼æ¶ˆæ¸‰æ¹˜ç„¼ç„¦ç…§ç—‡çœç¡ç¤ç¥¥ç§°ç« ç¬‘ç²§ç´¹è‚–è–è’‹è•‰è¡è£³è¨Ÿè¨¼è©”è©³è±¡è³žé†¤é‰¦é¾é˜éšœéž˜ä¸Šä¸ˆä¸žä¹—å†—å‰°åŸŽå ´å£Œå¬¢å¸¸æƒ…æ“¾æ¡æ–æµ„çŠ¶ç•³ç©£è’¸è­²é†¸éŒ å˜±åŸ´é£¾'],
      [0x9040, 'æ‹­æ¤æ®–ç‡­ç¹”è·è‰²è§¦é£Ÿè•è¾±å°»ä¼¸ä¿¡ä¾µå”‡å¨ å¯å¯©å¿ƒæ…ŽæŒ¯æ–°æ™‹æ£®æ¦›æµ¸æ·±ç”³ç–¹çœŸç¥žç§¦ç´³è‡£èŠ¯è–ªè¦ªè¨ºèº«è¾›é€²é‡éœ‡äººä»åˆƒå¡µå£¬å°‹ç”šå°½è…Žè¨Šè¿…é™£é­ç¬¥è«é ˆé…¢å›³åŽ¨'],
      [0x9080, 'é€—å¹åž‚å¸¥æŽ¨æ°´ç‚Šç¡ç²‹ç¿ è¡°é‚é…”éŒéŒ˜éšç‘žé«„å´‡åµ©æ•°æž¢è¶¨é››æ®æ‰æ¤™è…é —é›€è£¾æ¾„æ‘ºå¯¸ä¸–ç€¬ç•æ˜¯å‡„åˆ¶å‹¢å§“å¾æ€§æˆæ”¿æ•´æ˜Ÿæ™´æ£²æ –æ­£æ¸…ç‰²ç”Ÿç››ç²¾è–å£°è£½è¥¿èª èª“è«‹é€é†’é’é™æ–‰ç¨Žè„†éš»å¸­æƒœæˆšæ–¥æ˜”æžçŸ³ç©ç±ç¸¾è„Šè²¬èµ¤è·¡è¹Ÿç¢©åˆ‡æ‹™æŽ¥æ‘‚æŠ˜è¨­çªƒç¯€èª¬é›ªçµ¶èˆŒè‰ä»™å…ˆåƒå å®£å°‚å°–å·æˆ¦æ‰‡æ’°æ “æ ´æ³‰æµ…æ´—æŸ“æ½œç…Žç…½æ—‹ç©¿ç®­ç·š'],
      [0x9140, 'ç¹Šç¾¨è…ºèˆ›èˆ¹è–¦è©®è³Žè·µé¸é·éŠ­éŠ‘é–ƒé®®å‰å–„æ¼¸ç„¶å…¨ç¦…ç¹•è†³ç³Žå™Œå¡‘å²¨æŽªæ›¾æ›½æ¥šç‹™ç–ç–Žç¤Žç¥–ç§Ÿç²—ç´ çµ„è˜‡è¨´é˜»é¡é¼ åƒ§å‰µåŒå¢å€‰å–ªå£®å¥çˆ½å®‹å±¤åŒæƒ£æƒ³æœæŽƒæŒ¿æŽ»'],
      [0x9180, 'æ“æ—©æ›¹å·£æ§æ§½æ¼•ç‡¥äº‰ç—©ç›¸çª“ç³Ÿç·ç¶œè¡è‰è˜è‘¬è’¼è—»è£…èµ°é€é­éŽ—éœœé¨’åƒå¢—æ†Žè‡“è”µè´ˆé€ ä¿ƒå´å‰‡å³æ¯æ‰æŸæ¸¬è¶³é€Ÿä¿—å±žè³Šæ—ç¶šå’è¢–å…¶æƒå­˜å­«å°Šææ‘éœä»–å¤šå¤ªæ±°è©‘å”¾å •å¦¥æƒ°æ‰“æŸèˆµæ¥•é™€é§„é¨¨ä½“å †å¯¾è€å²±å¸¯å¾…æ€ æ…‹æˆ´æ›¿æ³°æ»žèƒŽè…¿è‹”è¢‹è²¸é€€é€®éšŠé»›é¯›ä»£å°å¤§ç¬¬é†é¡Œé·¹æ»ç€§å“å•„å®…æ‰˜æŠžæ‹“æ²¢æ¿¯ç¢è¨—é¸æ¿è«¾èŒ¸å‡§è›¸åª'],
      [0x9240, 'å©ä½†é”è¾°å¥ªè„±å·½ç«ªè¾¿æ£šè°·ç‹¸é±ˆæ¨½èª°ä¸¹å˜å˜†å¦æ‹…æŽ¢æ—¦æ­Žæ·¡æ¹›ç‚­çŸ­ç«¯ç®ªç¶»è€½èƒ†è›‹èª•é›å›£å£‡å¼¾æ–­æš–æª€æ®µç”·è«‡å€¤çŸ¥åœ°å¼›æ¥æ™ºæ± ç—´ç¨šç½®è‡´èœ˜é…é¦³ç¯‰ç•œç«¹ç­‘è“„'],
      [0x9280, 'é€ç§©çª’èŒ¶å«¡ç€ä¸­ä»²å®™å¿ æŠ½æ˜¼æŸ±æ³¨è™«è¡·è¨»é…Žé‹³é§æ¨—ç€¦çŒªè‹§è‘—è²¯ä¸å…†å‡‹å–‹å¯µå¸–å¸³åºå¼”å¼µå½«å¾´æ‡²æŒ‘æš¢æœæ½®ç‰’ç”ºçœºè´è„¹è…¸è¶èª¿è«œè¶…è·³éŠšé•·é ‚é³¥å‹…æ—ç›´æœ•æ²ˆçè³ƒéŽ®é™³æ´¥å¢œæ¤Žæ§Œè¿½éŽšç—›é€šå¡šæ ‚æŽ´æ§»ä½ƒæ¼¬æŸ˜è¾»è”¦ç¶´é”æ¤¿æ½°åªå£·å¬¬ç´¬çˆªåŠé‡£é¶´äº­ä½Žåœåµå‰ƒè²žå‘ˆå ¤å®šå¸åº•åº­å»·å¼Ÿæ‚ŒæŠµæŒºææ¢¯æ±€ç¢‡ç¦Žç¨‹ç· è‰‡è¨‚è«¦è¹„é€“'],
      [0x9340, 'é‚¸é„­é‡˜é¼Žæ³¥æ‘˜æ“¢æ•µæ»´çš„ç¬›é©é‘æººå“²å¾¹æ’¤è½è¿­é‰„å…¸å¡«å¤©å±•åº—æ·»çºç”œè²¼è»¢é¡›ç‚¹ä¼æ®¿æ¾±ç”°é›»å…Žåå µå¡—å¦¬å± å¾’æ–—æœæ¸¡ç™»èŸè³­é€”éƒ½éç ¥ç ºåŠªåº¦åœŸå¥´æ€’å€’å…šå†¬'],
      [0x9380, 'å‡åˆ€å”å¡”å¡˜å¥—å®•å³¶å¶‹æ‚¼æŠ•æ­æ±æ¡ƒæ¢¼æ£Ÿç›—æ·˜æ¹¯æ¶›ç¯ç‡ˆå½“ç—˜ç¥·ç­‰ç­”ç­’ç³–çµ±åˆ°è‘£è•©è—¤è¨Žè¬„è±†è¸é€ƒé€é™é™¶é ­é¨°é—˜åƒå‹•åŒå ‚å°Žæ†§æ’žæ´žçž³ç«¥èƒ´è„é“éŠ…å³ é´‡åŒ¿å¾—å¾³æ¶œç‰¹ç£ç¦¿ç¯¤æ¯’ç‹¬èª­æ ƒæ©¡å‡¸çªæ¤´å±Šé³¶è‹«å¯…é…‰ç€žå™¸å±¯æƒ‡æ•¦æ²Œè±šéé “å‘‘æ›‡éˆå¥ˆé‚£å†…ä¹å‡ªè–™è¬Žç˜æºé‹æ¥¢é¦´ç¸„ç•·å—æ¥ è»Ÿé›£æ±äºŒå°¼å¼è¿©åŒ‚è³‘è‚‰è™¹å»¿æ—¥ä¹³å…¥'],
      [0x9440, 'å¦‚å°¿éŸ®ä»»å¦Šå¿èªæ¿¡ç¦°ç¥¢å¯§è‘±çŒ«ç†±å¹´å¿µæ»æ’šç‡ƒç²˜ä¹ƒå»¼ä¹‹åŸœåš¢æ‚©æ¿ƒç´èƒ½è„³è†¿è¾²è¦—èš¤å·´æŠŠæ’­è¦‡æ·æ³¢æ´¾ç¶ç ´å©†ç½µèŠ­é¦¬ä¿³å»ƒæ‹æŽ’æ•—æ¯ç›ƒç‰ŒèƒŒè‚ºè¼©é…å€åŸ¹åª’æ¢…'],
      [0x9480, 'æ¥³ç…¤ç‹½è²·å£²è³ é™ªé€™è¿ç§¤çŸ§è©ä¼¯å‰¥åšæ‹æŸæ³Šç™½ç®”ç²•èˆ¶è–„è¿«æ›æ¼ çˆ†ç¸›èŽ«é§éº¦å‡½ç®±ç¡²ç®¸è‚‡ç­ˆæ«¨å¹¡è‚Œç•‘ç• å…«é‰¢æºŒç™ºé†—é«ªä¼ç½°æŠœç­é–¥é³©å™ºå¡™è›¤éš¼ä¼´åˆ¤åŠåå›å¸†æ¬æ–‘æ¿æ°¾æ±Žç‰ˆçŠ¯ç­ç•”ç¹èˆ¬è—©è²©ç¯„é‡†ç…©é ’é£¯æŒ½æ™©ç•ªç›¤ç£è•ƒè›®åŒªå‘å¦å¦ƒåº‡å½¼æ‚²æ‰‰æ‰¹æŠ«æ–æ¯”æ³Œç–²çš®ç¢‘ç§˜ç·‹ç½·è‚¥è¢«èª¹è²»é¿éžé£›æ¨‹ç°¸å‚™å°¾å¾®æž‡æ¯˜çµçœ‰ç¾Ž'],
      [0x9540, 'é¼»æŸŠç¨—åŒ¹ç–‹é«­å½¦è†è±è‚˜å¼¼å¿…ç•¢ç­†é€¼æ¡§å§«åª›ç´ç™¾è¬¬ä¿µå½ªæ¨™æ°·æ¼‚ç“¢ç¥¨è¡¨è©•è±¹å»Ÿæç—…ç§’è‹—éŒ¨é‹²è’œè›­é°­å“å½¬æ–Œæµœç€•è²§è³“é »æ•ç“¶ä¸ä»˜åŸ å¤«å©¦å¯Œå†¨å¸ƒåºœæ€–æ‰¶æ•·'],
      [0x9580, 'æ–§æ™®æµ®çˆ¶ç¬¦è…è†šèŠ™è­œè² è³¦èµ´é˜œé™„ä¾®æ’«æ­¦èˆžè‘¡è•ªéƒ¨å°æ¥“é¢¨è‘ºè•—ä¼å‰¯å¾©å¹…æœç¦è…¹è¤‡è¦†æ·µå¼—æ‰•æ²¸ä»ç‰©é®’åˆ†å»å™´å¢³æ†¤æ‰®ç„šå¥®ç²‰ç³žç´›é›°æ–‡èžä¸™ä½µå…µå¡€å¹£å¹³å¼ŠæŸ„ä¸¦è”½é–‰é™›ç±³é åƒ»å£ç™–ç¢§åˆ¥çž¥è”‘ç®†åå¤‰ç‰‡ç¯‡ç·¨è¾ºè¿”éä¾¿å‹‰å¨©å¼éž­ä¿èˆ—é‹ªåœƒæ•æ­©ç”«è£œè¼”ç©‚å‹Ÿå¢“æ…•æˆŠæš®æ¯ç°¿è©å€£ä¿¸åŒ…å‘†å ±å¥‰å®å³°å³¯å´©åº–æŠ±æ§æ”¾æ–¹æœ‹'],
      [0x9640, 'æ³•æ³¡çƒ¹ç ²ç¸«èƒžèŠ³èŒè“¬èœ‚è¤’è¨ªè±Šé‚¦é‹’é£½é³³éµ¬ä¹äº¡å‚å‰–åŠå¦¨å¸½å¿˜å¿™æˆ¿æš´æœ›æŸæ£’å†’ç´¡è‚ªè†¨è¬€è²Œè²¿é‰¾é˜²å é ¬åŒ—åƒ•åœå¢¨æ’²æœ´ç‰§ç¦ç©†é‡¦å‹ƒæ²¡æ®†å €å¹Œå¥”æœ¬ç¿»å‡¡ç›†'],
      [0x9680, 'æ‘©ç£¨é­”éº»åŸ‹å¦¹æ˜§æžšæ¯Žå“©æ§™å¹•è†œæž•é®ªæŸ¾é±’æ¡äº¦ä¿£åˆæŠ¹æœ«æ²«è¿„ä¾­ç¹­éº¿ä¸‡æ…¢æº€æ¼«è”“å‘³æœªé­…å·³ç®•å²¬å¯†èœœæ¹Šè“‘ç¨”è„ˆå¦™ç²æ°‘çœ å‹™å¤¢ç„¡ç‰ŸçŸ›éœ§éµ¡æ¤‹å©¿å¨˜å†¥åå‘½æ˜Žç›Ÿè¿·éŠ˜é³´å§ªç‰æ»…å…æ£‰ç¶¿ç·¬é¢éººæ‘¸æ¨¡èŒ‚å¦„å­Ÿæ¯›çŒ›ç›²ç¶²è€—è’™å„²æœ¨é»™ç›®æ¢å‹¿é¤…å°¤æˆ»ç±¾è²°å•æ‚¶ç´‹é–€åŒä¹Ÿå†¶å¤œçˆºè€¶é‡Žå¼¥çŸ¢åŽ„å½¹ç´„è–¬è¨³èºé–æŸ³è–®é‘“æ„‰æ„ˆæ²¹ç™’'],
      [0x9740, 'è«­è¼¸å”¯ä½‘å„ªå‹‡å‹å®¥å¹½æ‚ æ†‚æ–æœ‰æŸšæ¹§æ¶ŒçŒ¶çŒ·ç”±ç¥è£•èª˜éŠé‚‘éƒµé›„èžå¤•äºˆä½™ä¸Žèª‰è¼¿é å‚­å¹¼å¦–å®¹åº¸æšæºæ“æ›œæ¥Šæ§˜æ´‹æº¶ç†”ç”¨çª¯ç¾Šè€€è‘‰è“‰è¦è¬¡è¸Šé¥é™½é¤Šæ…¾æŠ‘æ¬²'],
      [0x9780, 'æ²ƒæµ´ç¿Œç¿¼æ·€ç¾…èžºè£¸æ¥èŽ±é ¼é›·æ´›çµ¡è½é…ªä¹±åµåµæ¬„æ¿«è—è˜­è¦§åˆ©åå±¥æŽæ¢¨ç†ç’ƒç—¢è£è£¡é‡Œé›¢é™¸å¾‹çŽ‡ç«‹è‘ŽæŽ ç•¥åŠ‰æµæºœç‰ç•™ç¡«ç²’éš†ç«œé¾ä¾¶æ…®æ—…è™œäº†äº®åƒšä¸¡å‡Œå¯®æ–™æ¢æ¶¼çŒŸç™‚çž­ç¨œç³§è‰¯è«’é¼é‡é™µé ˜åŠ›ç·‘å€«åŽ˜æž—æ·‹ç‡ç³è‡¨è¼ªéš£é±—éºŸç‘ å¡æ¶™ç´¯é¡žä»¤ä¼¶ä¾‹å†·åŠ±å¶ºæ€œçŽ²ç¤¼è‹“éˆ´éš·é›¶éœŠéº—é½¢æš¦æ­´åˆ—åŠ£çƒˆè£‚å»‰æ‹æ†æ¼£ç…‰ç°¾ç·´è¯'],
      [0x9840, 'è“®é€£éŒ¬å‘‚é­¯æ«“ç‚‰è³‚è·¯éœ²åŠ´å©å»Šå¼„æœ—æ¥¼æ¦”æµªæ¼ç‰¢ç‹¼ç¯­è€è¾è‹éƒŽå…­éº“ç¦„è‚‹éŒ²è«–å€­å’Œè©±æ­ªè³„è„‡æƒ‘æž é·²äº™äº˜é°è©«è—è•¨æ¤€æ¹¾ç¢—è…•'],
      [0x989f, 'å¼Œä¸ä¸•ä¸ªä¸±ä¸¶ä¸¼ä¸¿ä¹‚ä¹–ä¹˜äº‚äº…è±«äºŠèˆ’å¼äºŽäºžäºŸäº äº¢äº°äº³äº¶ä»Žä»ä»„ä»†ä»‚ä»—ä»žä»­ä»Ÿä»·ä¼‰ä½šä¼°ä½›ä½ä½—ä½‡ä½¶ä¾ˆä¾ä¾˜ä½»ä½©ä½°ä¾‘ä½¯ä¾†ä¾–å„˜ä¿”ä¿Ÿä¿Žä¿˜ä¿›ä¿‘ä¿šä¿ä¿¤ä¿¥å€šå€¨å€”å€ªå€¥å€…ä¼œä¿¶å€¡å€©å€¬ä¿¾ä¿¯å€‘å€†åƒå‡æœƒå•ååˆåšå–å¬å¸å‚€å‚šå‚…å‚´å‚²'],
      [0x9940, 'åƒ‰åƒŠå‚³åƒ‚åƒ–åƒžåƒ¥åƒ­åƒ£åƒ®åƒ¹åƒµå„‰å„å„‚å„–å„•å„”å„šå„¡å„ºå„·å„¼å„»å„¿å…€å…’å…Œå…”å…¢ç«¸å…©å…ªå…®å†€å†‚å›˜å†Œå†‰å†å†‘å†“å†•å†–å†¤å†¦å†¢å†©å†ªå†«å†³å†±å†²å†°å†µå†½å‡…å‡‰å‡›å‡ è™•å‡©å‡­'],
      [0x9980, 'å‡°å‡µå‡¾åˆ„åˆ‹åˆ”åˆŽåˆ§åˆªåˆ®åˆ³åˆ¹å‰å‰„å‰‹å‰Œå‰žå‰”å‰ªå‰´å‰©å‰³å‰¿å‰½åŠåŠ”åŠ’å‰±åŠˆåŠ‘è¾¨è¾§åŠ¬åŠ­åŠ¼åŠµå‹å‹å‹—å‹žå‹£å‹¦é£­å‹ å‹³å‹µå‹¸å‹¹åŒ†åŒˆç”¸åŒåŒåŒåŒ•åŒšåŒ£åŒ¯åŒ±åŒ³åŒ¸å€å†å…ä¸—å‰åå‡–åžå©å®å¤˜å»å·åŽ‚åŽ–åŽ åŽ¦åŽ¥åŽ®åŽ°åŽ¶åƒç°’é›™åŸæ›¼ç‡®å®å¨å­åºåå½å‘€å¬å­å¼å®å¶å©åå‘Žå’å‘µå’Žå‘Ÿå‘±å‘·å‘°å’’å‘»å’€å‘¶å’„å’å’†å“‡å’¢å’¸å’¥å’¬å“„å“ˆå’¨'],
      [0x9a40, 'å’«å“‚å’¤å’¾å’¼å“˜å“¥å“¦å”å””å“½å“®å“­å“ºå“¢å”¹å•€å•£å•Œå”®å•œå•…å•–å•—å”¸å”³å•å–™å–€å’¯å–Šå–Ÿå•»å•¾å–˜å–žå–®å•¼å–ƒå–©å–‡å–¨å—šå—…å—Ÿå—„å—œå—¤å—”å˜”å—·å˜–å—¾å—½å˜›å—¹å™Žå™ç‡Ÿå˜´å˜¶å˜²å˜¸'],
      [0x9a80, 'å™«å™¤å˜¯å™¬å™ªåš†åš€åšŠåš åš”åšåš¥åš®åš¶åš´å›‚åš¼å›å›ƒå›€å›ˆå›Žå›‘å›“å›—å›®å›¹åœ€å›¿åœ„åœ‰åœˆåœ‹åœåœ“åœ˜åœ–å—‡åœœåœ¦åœ·åœ¸åŽåœ»å€åå©åŸ€åžˆå¡å¿åž‰åž“åž åž³åž¤åžªåž°åŸƒåŸ†åŸ”åŸ’åŸ“å ŠåŸ–åŸ£å ‹å ™å å¡²å ¡å¡¢å¡‹å¡°æ¯€å¡’å ½å¡¹å¢…å¢¹å¢Ÿå¢«å¢ºå£žå¢»å¢¸å¢®å£…å£“å£‘å£—å£™å£˜å£¥å£œå£¤å£Ÿå£¯å£ºå£¹å£»å£¼å£½å¤‚å¤Šå¤å¤›æ¢¦å¤¥å¤¬å¤­å¤²å¤¸å¤¾ç«’å¥•å¥å¥Žå¥šå¥˜å¥¢å¥ å¥§å¥¬å¥©'],
      [0x9b40, 'å¥¸å¦å¦ä½žä¾«å¦£å¦²å§†å§¨å§œå¦å§™å§šå¨¥å¨Ÿå¨‘å¨œå¨‰å¨šå©€å©¬å©‰å¨µå¨¶å©¢å©ªåªšåª¼åª¾å«‹å«‚åª½å«£å«—å«¦å«©å«–å«ºå«»å¬Œå¬‹å¬–å¬²å«å¬ªå¬¶å¬¾å­ƒå­…å­€å­‘å­•å­šå­›å­¥å­©å­°å­³å­µå­¸æ–ˆå­ºå®€'],
      [0x9b80, 'å®ƒå®¦å®¸å¯ƒå¯‡å¯‰å¯”å¯å¯¤å¯¦å¯¢å¯žå¯¥å¯«å¯°å¯¶å¯³å°…å°‡å°ˆå°å°“å° å°¢å°¨å°¸å°¹å±å±†å±Žå±“å±å±å­±å±¬å±®ä¹¢å±¶å±¹å²Œå²‘å²”å¦›å²«å²»å²¶å²¼å²·å³…å²¾å³‡å³™å³©å³½å³ºå³­å¶Œå³ªå´‹å´•å´—åµœå´Ÿå´›å´‘å´”å´¢å´šå´™å´˜åµŒåµ’åµŽåµ‹åµ¬åµ³åµ¶å¶‡å¶„å¶‚å¶¢å¶å¶¬å¶®å¶½å¶å¶·å¶¼å·‰å·å·“å·’å·–å·›å·«å·²å·µå¸‹å¸šå¸™å¸‘å¸›å¸¶å¸·å¹„å¹ƒå¹€å¹Žå¹—å¹”å¹Ÿå¹¢å¹¤å¹‡å¹µå¹¶å¹ºéº¼å¹¿åº å»å»‚å»ˆå»å»'],
      [0x9c40, 'å»–å»£å»å»šå»›å»¢å»¡å»¨å»©å»¬å»±å»³å»°å»´å»¸å»¾å¼ƒå¼‰å½å½œå¼‹å¼‘å¼–å¼©å¼­å¼¸å½å½ˆå½Œå½Žå¼¯å½‘å½–å½—å½™å½¡å½­å½³å½·å¾ƒå¾‚å½¿å¾Šå¾ˆå¾‘å¾‡å¾žå¾™å¾˜å¾ å¾¨å¾­å¾¼å¿–å¿»å¿¤å¿¸å¿±å¿æ‚³å¿¿æ€¡æ '],
      [0x9c80, 'æ€™æ€æ€©æ€Žæ€±æ€›æ€•æ€«æ€¦æ€æ€ºæšææªæ·æŸæŠæ†ææ£æƒæ¤æ‚æ¬æ«æ™æ‚æ‚æƒ§æ‚ƒæ‚šæ‚„æ‚›æ‚–æ‚—æ‚’æ‚§æ‚‹æƒ¡æ‚¸æƒ æƒ“æ‚´å¿°æ‚½æƒ†æ‚µæƒ˜æ…æ„•æ„†æƒ¶æƒ·æ„€æƒ´æƒºæ„ƒæ„¡æƒ»æƒ±æ„æ„Žæ…‡æ„¾æ„¨æ„§æ…Šæ„¿æ„¼æ„¬æ„´æ„½æ…‚æ…„æ…³æ…·æ…˜æ…™æ…šæ…«æ…´æ…¯æ…¥æ…±æ…Ÿæ…æ…“æ…µæ†™æ†–æ†‡æ†¬æ†”æ†šæ†Šæ†‘æ†«æ†®æ‡Œæ‡Šæ‡‰æ‡·æ‡ˆæ‡ƒæ‡†æ†ºæ‡‹ç½¹æ‡æ‡¦æ‡£æ‡¶æ‡ºæ‡´æ‡¿æ‡½æ‡¼æ‡¾æˆ€æˆˆæˆ‰æˆæˆŒæˆ”æˆ›'],
      [0x9d40, 'æˆžæˆ¡æˆªæˆ®æˆ°æˆ²æˆ³æ‰æ‰Žæ‰žæ‰£æ‰›æ‰ æ‰¨æ‰¼æŠ‚æŠ‰æ‰¾æŠ’æŠ“æŠ–æ‹”æŠƒæŠ”æ‹—æ‹‘æŠ»æ‹æ‹¿æ‹†æ“”æ‹ˆæ‹œæ‹Œæ‹Šæ‹‚æ‹‡æŠ›æ‹‰æŒŒæ‹®æ‹±æŒ§æŒ‚æŒˆæ‹¯æ‹µææŒ¾ææœææŽ–æŽŽæŽ€æŽ«æ¶æŽ£æŽæŽ‰æŽŸæŽµæ«'],
      [0x9d80, 'æ©æŽ¾æ©æ€æ†æ£æ‰æ’æ¶æ„æ–æ´æ†æ“æ¦æ¶æ”æ—æ¨ææ‘§æ‘¯æ‘¶æ‘Žæ”ªæ’•æ’“æ’¥æ’©æ’ˆæ’¼æ“šæ“’æ“…æ“‡æ’»æ“˜æ“‚æ“±æ“§èˆ‰æ“ æ“¡æŠ¬æ“£æ“¯æ”¬æ“¶æ“´æ“²æ“ºæ”€æ“½æ”˜æ”œæ”…æ”¤æ”£æ”«æ”´æ”µæ”·æ”¶æ”¸ç•‹æ•ˆæ•–æ••æ•æ•˜æ•žæ•æ•²æ•¸æ–‚æ–ƒè®Šæ–›æ–Ÿæ–«æ–·æ—ƒæ—†æ—æ—„æ—Œæ—’æ—›æ—™æ— æ—¡æ—±æ²æ˜Šæ˜ƒæ—»æ³æ˜µæ˜¶æ˜´æ˜œæ™æ™„æ™‰æ™æ™žæ™æ™¤æ™§æ™¨æ™Ÿæ™¢æ™°æšƒæšˆæšŽæš‰æš„æš˜æšæ›æš¹æ›‰æš¾æš¼'],
      [0x9e40, 'æ›„æš¸æ›–æ›šæ› æ˜¿æ›¦æ›©æ›°æ›µæ›·æœæœ–æœžæœ¦æœ§éœ¸æœ®æœ¿æœ¶ææœ¸æœ·æ†æžæ æ™æ£æ¤æž‰æ°æž©æ¼æªæžŒæž‹æž¦æž¡æž…æž·æŸ¯æž´æŸ¬æž³æŸ©æž¸æŸ¤æŸžæŸæŸ¢æŸ®æž¹æŸŽæŸ†æŸ§æªœæ žæ¡†æ ©æ¡€æ¡æ ²æ¡Ž'],
      [0x9e80, 'æ¢³æ «æ¡™æ¡£æ¡·æ¡¿æ¢Ÿæ¢æ¢­æ¢”æ¢æ¢›æ¢ƒæª®æ¢¹æ¡´æ¢µæ¢ æ¢ºæ¤æ¢æ¡¾æ¤æ£Šæ¤ˆæ£˜æ¤¢æ¤¦æ£¡æ¤Œæ£æ£”æ£§æ£•æ¤¶æ¤’æ¤„æ£—æ££æ¤¥æ£¹æ£ æ£¯æ¤¨æ¤ªæ¤šæ¤£æ¤¡æ£†æ¥¹æ¥·æ¥œæ¥¸æ¥«æ¥”æ¥¾æ¥®æ¤¹æ¥´æ¤½æ¥™æ¤°æ¥¡æ¥žæ¥æ¦æ¥ªæ¦²æ¦®æ§æ¦¿æ§æ§“æ¦¾æ§Žå¯¨æ§Šæ§æ¦»æ§ƒæ¦§æ¨®æ¦‘æ¦ æ¦œæ¦•æ¦´æ§žæ§¨æ¨‚æ¨›æ§¿æ¬Šæ§¹æ§²æ§§æ¨…æ¦±æ¨žæ§­æ¨”æ§«æ¨Šæ¨’æ«æ¨£æ¨“æ©„æ¨Œæ©²æ¨¶æ©¸æ©‡æ©¢æ©™æ©¦æ©ˆæ¨¸æ¨¢æªæªæª æª„æª¢æª£'],
      [0x9f40, 'æª—è˜—æª»æ«ƒæ«‚æª¸æª³æª¬æ«žæ«‘æ«Ÿæªªæ«šæ«ªæ«»æ¬…è˜–æ«ºæ¬’æ¬–é¬±æ¬Ÿæ¬¸æ¬·ç›œæ¬¹é£®æ­‡æ­ƒæ­‰æ­æ­™æ­”æ­›æ­Ÿæ­¡æ­¸æ­¹æ­¿æ®€æ®„æ®ƒæ®æ®˜æ®•æ®žæ®¤æ®ªæ®«æ®¯æ®²æ®±æ®³æ®·æ®¼æ¯†æ¯‹æ¯“æ¯Ÿæ¯¬æ¯«æ¯³æ¯¯'],
      [0x9f80, 'éº¾æ°ˆæ°“æ°”æ°›æ°¤æ°£æ±žæ±•æ±¢æ±ªæ²‚æ²æ²šæ²æ²›æ±¾æ±¨æ±³æ²’æ²æ³„æ³±æ³“æ²½æ³—æ³…æ³æ²®æ²±æ²¾æ²ºæ³›æ³¯æ³™æ³ªæ´Ÿè¡æ´¶æ´«æ´½æ´¸æ´™æ´µæ´³æ´’æ´Œæµ£æ¶“æµ¤æµšæµ¹æµ™æ¶Žæ¶•æ¿¤æ¶…æ·¹æ¸•æ¸Šæ¶µæ·‡æ·¦æ¶¸æ·†æ·¬æ·žæ·Œæ·¨æ·’æ·…æ·ºæ·™æ·¤æ·•æ·ªæ·®æ¸­æ¹®æ¸®æ¸™æ¹²æ¹Ÿæ¸¾æ¸£æ¹«æ¸«æ¹¶æ¹æ¸Ÿæ¹ƒæ¸ºæ¹Žæ¸¤æ»¿æ¸æ¸¸æº‚æºªæº˜æ»‰æº·æ»“æº½æº¯æ»„æº²æ»”æ»•æºæº¥æ»‚æºŸæ½æ¼‘çŒæ»¬æ»¸æ»¾æ¼¿æ»²æ¼±æ»¯æ¼²æ»Œ'],
      [0xe040, 'æ¼¾æ¼“æ»·æ¾†æ½ºæ½¸æ¾æ¾€æ½¯æ½›æ¿³æ½­æ¾‚æ½¼æ½˜æ¾Žæ¾‘æ¿‚æ½¦æ¾³æ¾£æ¾¡æ¾¤æ¾¹æ¿†æ¾ªæ¿Ÿæ¿•æ¿¬æ¿”æ¿˜æ¿±æ¿®æ¿›ç€‰ç€‹æ¿ºç€‘ç€ç€æ¿¾ç€›ç€šæ½´ç€ç€˜ç€Ÿç€°ç€¾ç€²ç‘ç£ç‚™ç‚’ç‚¯çƒ±ç‚¬ç‚¸ç‚³ç‚®çƒŸçƒ‹çƒ'],
      [0xe080, 'çƒ™ç„‰çƒ½ç„œç„™ç…¥ç…•ç†ˆç…¦ç…¢ç…Œç…–ç…¬ç†ç‡»ç†„ç†•ç†¨ç†¬ç‡—ç†¹ç†¾ç‡’ç‡‰ç‡”ç‡Žç‡ ç‡¬ç‡§ç‡µç‡¼ç‡¹ç‡¿çˆçˆçˆ›çˆ¨çˆ­çˆ¬çˆ°çˆ²çˆ»çˆ¼çˆ¿ç‰€ç‰†ç‰‹ç‰˜ç‰´ç‰¾çŠ‚çŠçŠ‡çŠ’çŠ–çŠ¢çŠ§çŠ¹çŠ²ç‹ƒç‹†ç‹„ç‹Žç‹’ç‹¢ç‹ ç‹¡ç‹¹ç‹·å€çŒ—çŒŠçŒœçŒ–çŒçŒ´çŒ¯çŒ©çŒ¥çŒ¾çŽçé»˜ç—çªç¨ç°ç¸çµç»çºçˆçŽ³çŽçŽ»ç€ç¥ç®çžç’¢ç…ç‘¯ç¥ç¸ç²çºç‘•ç¿ç‘Ÿç‘™ç‘ç‘œç‘©ç‘°ç‘£ç‘ªç‘¶ç‘¾ç’‹ç’žç’§ç“Šç“ç“”ç±'],
      [0xe140, 'ç“ ç“£ç“§ç“©ç“®ç“²ç“°ç“±ç“¸ç“·ç”„ç”ƒç”…ç”Œç”Žç”ç”•ç”“ç”žç”¦ç”¬ç”¼ç•„ç•ç•Šç•‰ç•›ç•†ç•šç•©ç•¤ç•§ç•«ç•­ç•¸ç•¶ç–†ç–‡ç•´ç–Šç–‰ç–‚ç–”ç–šç–ç–¥ç–£ç—‚ç–³ç—ƒç–µç–½ç–¸ç–¼ç–±ç—ç—Šç—’ç—™ç—£ç—žç—¾ç—¿'],
      [0xe180, 'ç—¼ç˜ç—°ç—ºç—²ç—³ç˜‹ç˜ç˜‰ç˜Ÿç˜§ç˜ ç˜¡ç˜¢ç˜¤ç˜´ç˜°ç˜»ç™‡ç™ˆç™†ç™œç™˜ç™¡ç™¢ç™¨ç™©ç™ªç™§ç™¬ç™°ç™²ç™¶ç™¸ç™¼çš€çšƒçšˆçš‹çšŽçš–çš“çš™çššçš°çš´çš¸çš¹çšºç›‚ç›ç›–ç›’ç›žç›¡ç›¥ç›§ç›ªè˜¯ç›»çœˆçœ‡çœ„çœ©çœ¤çœžçœ¥çœ¦çœ›çœ·çœ¸ç‡çšç¨ç«ç›ç¥ç¿ç¾ç¹çžŽçž‹çž‘çž çžžçž°çž¶çž¹çž¿çž¼çž½çž»çŸ‡çŸçŸ—çŸšçŸœçŸ£çŸ®çŸ¼ç Œç ’ç¤¦ç  ç¤ªç¡…ç¢Žç¡´ç¢†ç¡¼ç¢šç¢Œç¢£ç¢µç¢ªç¢¯ç£‘ç£†ç£‹ç£”ç¢¾ç¢¼ç£…ç£Šç£¬'],
      [0xe240, 'ç£§ç£šç£½ç£´ç¤‡ç¤’ç¤‘ç¤™ç¤¬ç¤«ç¥€ç¥ ç¥—ç¥Ÿç¥šç¥•ç¥“ç¥ºç¥¿ç¦Šç¦ç¦§é½‹ç¦ªç¦®ç¦³ç¦¹ç¦ºç§‰ç§•ç§§ç§¬ç§¡ç§£ç¨ˆç¨ç¨˜ç¨™ç¨ ç¨Ÿç¦€ç¨±ç¨»ç¨¾ç¨·ç©ƒç©—ç©‰ç©¡ç©¢ç©©é¾ç©°ç©¹ç©½çªˆçª—çª•çª˜çª–çª©ç«ˆçª°'],
      [0xe280, 'çª¶ç«…ç«„çª¿é‚ƒç«‡ç«Šç«ç«ç«•ç«“ç«™ç«šç«ç«¡ç«¢ç«¦ç«­ç«°ç¬‚ç¬ç¬Šç¬†ç¬³ç¬˜ç¬™ç¬žç¬µç¬¨ç¬¶ç­ç­ºç¬„ç­ç¬‹ç­Œç­…ç­µç­¥ç­´ç­§ç­°ç­±ç­¬ç­®ç®ç®˜ç®Ÿç®ç®œç®šç®‹ç®’ç®ç­ç®™ç¯‹ç¯ç¯Œç¯ç®´ç¯†ç¯ç¯©ç°‘ç°”ç¯¦ç¯¥ç± ç°€ç°‡ç°“ç¯³ç¯·ç°—ç°ç¯¶ç°£ç°§ç°ªç°Ÿç°·ç°«ç°½ç±Œç±ƒç±”ç±ç±€ç±ç±˜ç±Ÿç±¤ç±–ç±¥ç±¬ç±µç²ƒç²ç²¤ç²­ç²¢ç²«ç²¡ç²¨ç²³ç²²ç²±ç²®ç²¹ç²½ç³€ç³…ç³‚ç³˜ç³’ç³œç³¢é¬»ç³¯ç³²ç³´ç³¶ç³ºç´†'],
      [0xe340, 'ç´‚ç´œç´•ç´Šçµ…çµ‹ç´®ç´²ç´¿ç´µçµ†çµ³çµ–çµŽçµ²çµ¨çµ®çµçµ£ç¶“ç¶‰çµ›ç¶çµ½ç¶›ç¶ºç¶®ç¶£ç¶µç·‡ç¶½ç¶«ç¸½ç¶¢ç¶¯ç·œç¶¸ç¶Ÿç¶°ç·˜ç·ç·¤ç·žç·»ç·²ç·¡ç¸…ç¸Šç¸£ç¸¡ç¸’ç¸±ç¸Ÿç¸‰ç¸‹ç¸¢ç¹†ç¹¦ç¸»ç¸µç¸¹ç¹ƒç¸·'],
      [0xe380, 'ç¸²ç¸ºç¹§ç¹ç¹–ç¹žç¹™ç¹šç¹¹ç¹ªç¹©ç¹¼ç¹»çºƒç·•ç¹½è¾®ç¹¿çºˆçº‰çºŒçº’çºçº“çº”çº–çºŽçº›çºœç¼¸ç¼ºç½…ç½Œç½ç½Žç½ç½‘ç½•ç½”ç½˜ç½Ÿç½ ç½¨ç½©ç½§ç½¸ç¾‚ç¾†ç¾ƒç¾ˆç¾‡ç¾Œç¾”ç¾žç¾ç¾šç¾£ç¾¯ç¾²ç¾¹ç¾®ç¾¶ç¾¸è­±ç¿…ç¿†ç¿Šç¿•ç¿”ç¿¡ç¿¦ç¿©ç¿³ç¿¹é£œè€†è€„è€‹è€’è€˜è€™è€œè€¡è€¨è€¿è€»èŠè†è’è˜èšèŸè¢è¨è³è²è°è¶è¹è½è¿è‚„è‚†è‚…è‚›è‚“è‚šè‚­å†è‚¬èƒ›èƒ¥èƒ™èƒèƒ„èƒšèƒ–è„‰èƒ¯èƒ±è„›è„©è„£è„¯è…‹'],
      [0xe440, 'éš‹è…†è„¾è…“è…‘èƒ¼è…±è…®è…¥è…¦è…´è†ƒè†ˆè†Šè†€è†‚è† è†•è†¤è†£è…Ÿè†“è†©è†°è†µè†¾è†¸è†½è‡€è‡‚è†ºè‡‰è‡è‡‘è‡™è‡˜è‡ˆè‡šè‡Ÿè‡ è‡§è‡ºè‡»è‡¾èˆèˆ‚èˆ…èˆ‡èˆŠèˆèˆèˆ–èˆ©èˆ«èˆ¸èˆ³è‰€è‰™è‰˜è‰è‰šè‰Ÿè‰¤'],
      [0xe480, 'è‰¢è‰¨è‰ªè‰«èˆ®è‰±è‰·è‰¸è‰¾èŠèŠ’èŠ«èŠŸèŠ»èŠ¬è‹¡è‹£è‹Ÿè‹’è‹´è‹³è‹ºèŽ“èŒƒè‹»è‹¹è‹žèŒ†è‹œèŒ‰è‹™èŒµèŒ´èŒ–èŒ²èŒ±è€èŒ¹èè…èŒ¯èŒ«èŒ—èŒ˜èŽ…èŽšèŽªèŽŸèŽ¢èŽ–èŒ£èŽŽèŽ‡èŽŠè¼èŽµè³èµèŽ èŽ‰èŽ¨è´è“è«èŽè½èƒè˜è‹èè·è‡è è²èè¢è èŽ½è¸è”†è»è‘­èªè¼è•šè’„è‘·è‘«è’­è‘®è’‚è‘©è‘†è¬è‘¯è‘¹èµè“Šè‘¢è’¹è’¿è’Ÿè“™è“è’»è“šè“è“è“†è“–è’¡è”¡è“¿è“´è”—è”˜è”¬è”Ÿè”•è””è“¼è•€è•£è•˜è•ˆ'],
      [0xe540, 'è•è˜‚è•‹è••è–€è–¤è–ˆè–‘è–Šè–¨è•­è–”è–›è—ªè–‡è–œè•·è•¾è–è—‰è–ºè—è–¹è—è—•è—è—¥è—œè—¹è˜Šè˜“è˜‹è—¾è—ºè˜†è˜¢è˜šè˜°è˜¿è™ä¹•è™”è™Ÿè™§è™±èš“èš£èš©èšªèš‹èšŒèš¶èš¯è›„è›†èš°è›‰è £èš«è›”è›žè›©è›¬'],
      [0xe580, 'è›Ÿè››è›¯èœ’èœ†èœˆèœ€èœƒè›»èœ‘èœ‰èœè›¹èœŠèœ´èœ¿èœ·èœ»èœ¥èœ©èœšè èŸè¸èŒèŽè´è—è¨è®è™è“è£èªè …èž¢èžŸèž‚èž¯èŸ‹èž½èŸ€èŸé›–èž«èŸ„èž³èŸ‡èŸ†èž»èŸ¯èŸ²èŸ è è èŸ¾èŸ¶èŸ·è ŽèŸ’è ‘è –è •è ¢è ¡è ±è ¶è ¹è §è »è¡„è¡‚è¡’è¡™è¡žè¡¢è¡«è¢è¡¾è¢žè¡µè¡½è¢µè¡²è¢‚è¢—è¢’è¢®è¢™è¢¢è¢è¢¤è¢°è¢¿è¢±è£ƒè£„è£”è£˜è£™è£è£¹è¤‚è£¼è£´è£¨è£²è¤„è¤Œè¤Šè¤“è¥ƒè¤žè¤¥è¤ªè¤«è¥è¥„è¤»è¤¶è¤¸è¥Œè¤è¥ è¥ž'],
      [0xe640, 'è¥¦è¥¤è¥­è¥ªè¥¯è¥´è¥·è¥¾è¦ƒè¦ˆè¦Šè¦“è¦˜è¦¡è¦©è¦¦è¦¬è¦¯è¦²è¦ºè¦½è¦¿è§€è§šè§œè§è§§è§´è§¸è¨ƒè¨–è¨è¨Œè¨›è¨è¨¥è¨¶è©è©›è©’è©†è©ˆè©¼è©­è©¬è©¢èª…èª‚èª„èª¨èª¡èª‘èª¥èª¦èªšèª£è«„è«è«‚è«šè««è«³è«§'],
      [0xe680, 'è«¤è«±è¬”è« è«¢è«·è«žè«›è¬Œè¬‡è¬šè«¡è¬–è¬è¬—è¬ è¬³éž«è¬¦è¬«è¬¾è¬¨è­è­Œè­è­Žè­‰è­–è­›è­šè­«è­Ÿè­¬è­¯è­´è­½è®€è®Œè®Žè®’è®“è®–è®™è®šè°ºè±è°¿è±ˆè±Œè±Žè±è±•è±¢è±¬è±¸è±ºè²‚è²‰è²…è²Šè²è²Žè²”è±¼è²˜æˆè²­è²ªè²½è²²è²³è²®è²¶è³ˆè³è³¤è³£è³šè³½è³ºè³»è´„è´…è´Šè´‡è´è´è´é½Žè´“è³è´”è´–èµ§èµ­èµ±èµ³è¶è¶™è·‚è¶¾è¶ºè·è·šè·–è·Œè·›è·‹è·ªè·«è·Ÿè·£è·¼è¸ˆè¸‰è·¿è¸è¸žè¸è¸Ÿè¹‚è¸µè¸°è¸´è¹Š'],
      [0xe740, 'è¹‡è¹‰è¹Œè¹è¹ˆè¹™è¹¤è¹ è¸ªè¹£è¹•è¹¶è¹²è¹¼èºèº‡èº…èº„èº‹èºŠèº“èº‘èº”èº™èºªèº¡èº¬èº°è»†èº±èº¾è»…è»ˆè»‹è»›è»£è»¼è»»è»«è»¾è¼Šè¼…è¼•è¼’è¼™è¼“è¼œè¼Ÿè¼›è¼Œè¼¦è¼³è¼»è¼¹è½…è½‚è¼¾è½Œè½‰è½†è½Žè½—è½œ'],
      [0xe780, 'è½¢è½£è½¤è¾œè¾Ÿè¾£è¾­è¾¯è¾·è¿šè¿¥è¿¢è¿ªè¿¯é‚‡è¿´é€…è¿¹è¿ºé€‘é€•é€¡é€é€žé€–é€‹é€§é€¶é€µé€¹è¿¸ééé‘é’é€Žé‰é€¾é–é˜éžé¨é¯é¶éš¨é²é‚‚é½é‚é‚€é‚Šé‚‰é‚é‚¨é‚¯é‚±é‚µéƒ¢éƒ¤æ‰ˆéƒ›é„‚é„’é„™é„²é„°é…Šé…–é…˜é…£é…¥é…©é…³é…²é†‹é†‰é†‚é†¢é†«é†¯é†ªé†µé†´é†ºé‡€é‡é‡‰é‡‹é‡é‡–é‡Ÿé‡¡é‡›é‡¼é‡µé‡¶éˆžé‡¿éˆ”éˆ¬éˆ•éˆ‘é‰žé‰—é‰…é‰‰é‰¤é‰ˆéŠ•éˆ¿é‰‹é‰éŠœéŠ–éŠ“éŠ›é‰šé‹éŠ¹éŠ·é‹©éŒé‹ºé„éŒ®'],
      [0xe840, 'éŒ™éŒ¢éŒšéŒ£éŒºéŒµéŒ»éœé é¼é®é–éŽ°éŽ¬éŽ­éŽ”éŽ¹é–é—é¨é¥é˜éƒéééˆé¤éšé”é“éƒé‡éé¶é«éµé¡éºé‘é‘’é‘„é‘›é‘ é‘¢é‘žé‘ªéˆ©é‘°é‘µé‘·é‘½é‘šé‘¼é‘¾é’é‘¿é–‚é–‡é–Šé–”é––é–˜é–™'],
      [0xe880, 'é– é–¨é–§é–­é–¼é–»é–¹é–¾é—Šæ¿¶é—ƒé—é—Œé—•é—”é—–é—œé—¡é—¥é—¢é˜¡é˜¨é˜®é˜¯é™‚é™Œé™é™‹é™·é™œé™žé™é™Ÿé™¦é™²é™¬éšéš˜éš•éš—éšªéš§éš±éš²éš°éš´éš¶éš¸éš¹é›Žé›‹é›‰é›è¥é›œéœé›•é›¹éœ„éœ†éœˆéœ“éœŽéœ‘éœéœ–éœ™éœ¤éœªéœ°éœ¹éœ½éœ¾é„é†éˆé‚é‰éœé é¤é¦é¨å‹’é«é±é¹éž…é¼éžéºéž†éž‹éžéžéžœéž¨éž¦éž£éž³éž´éŸƒéŸ†éŸˆéŸ‹éŸœéŸ­é½éŸ²ç«ŸéŸ¶éŸµé é Œé ¸é ¤é ¡é ·é ½é¡†é¡é¡‹é¡«é¡¯é¡°'],
      [0xe940, 'é¡±é¡´é¡³é¢ªé¢¯é¢±é¢¶é£„é£ƒé£†é£©é£«é¤ƒé¤‰é¤’é¤”é¤˜é¤¡é¤é¤žé¤¤é¤ é¤¬é¤®é¤½é¤¾é¥‚é¥‰é¥…é¥é¥‹é¥‘é¥’é¥Œé¥•é¦—é¦˜é¦¥é¦­é¦®é¦¼é§Ÿé§›é§é§˜é§‘é§­é§®é§±é§²é§»é§¸é¨é¨é¨…é§¢é¨™é¨«é¨·é©…é©‚é©€é©ƒ'],
      [0xe980, 'é¨¾é©•é©é©›é©—é©Ÿé©¢é©¥é©¤é©©é©«é©ªéª­éª°éª¼é«€é«é«‘é«“é«”é«žé«Ÿé«¢é«£é«¦é«¯é««é«®é«´é«±é«·é«»é¬†é¬˜é¬šé¬Ÿé¬¢é¬£é¬¥é¬§é¬¨é¬©é¬ªé¬®é¬¯é¬²é­„é­ƒé­é­é­Žé­‘é­˜é­´é®“é®ƒé®‘é®–é®—é®Ÿé® é®¨é®´é¯€é¯Šé®¹é¯†é¯é¯‘é¯’é¯£é¯¢é¯¤é¯”é¯¡é°ºé¯²é¯±é¯°é°•é°”é°‰é°“é°Œé°†é°ˆé°’é°Šé°„é°®é°›é°¥é°¤é°¡é°°é±‡é°²é±†é°¾é±šé± é±§é±¶é±¸é³§é³¬é³°é´‰é´ˆé³«é´ƒé´†é´ªé´¦é¶¯é´£é´Ÿéµ„é´•é´’éµé´¿é´¾éµ†éµˆ'],
      [0xea40, 'éµéµžéµ¤éµ‘éµéµ™éµ²é¶‰é¶‡é¶«éµ¯éµºé¶šé¶¤é¶©é¶²é·„é·é¶»é¶¸é¶ºé·†é·é·‚é·™é·“é·¸é·¦é·­é·¯é·½é¸šé¸›é¸žé¹µé¹¹é¹½éºéºˆéº‹éºŒéº’éº•éº‘éºéº¥éº©éº¸éºªéº­é¡é»Œé»Žé»é»é»”é»œé»žé»é» é»¥é»¨é»¯'],
      [0xea80, 'é»´é»¶é»·é»¹é»»é»¼é»½é¼‡é¼ˆçš·é¼•é¼¡é¼¬é¼¾é½Šé½’é½”é½£é½Ÿé½ é½¡é½¦é½§é½¬é½ªé½·é½²é½¶é¾•é¾œé¾ å ¯æ§‡é™ç‘¤å‡œç†™']
  ];
  var tables;
  /**
   * @function getTables
   * @returns {SJISTables}
   */
  function getTables() {
      if (!tables) {
          var UTF8_TO_SJIS = {};
          var SJIS_TO_UTF8 = {};
          var tLength = SJIS_UTF8_TABLE.length;
          for (var i = 0; i < tLength; i++) {
              var mapItem = SJIS_UTF8_TABLE[i];
              var kanji = mapItem[1];
              var kLength = kanji.length;
              for (var j = 0; j < kLength; j++) {
                  var kCode = mapItem[0] + j;
                  var uCode = kanji.charAt(j).charCodeAt(0);
                  UTF8_TO_SJIS[uCode] = kCode;
                  SJIS_TO_UTF8[kCode] = uCode;
              }
          }
          tables = { UTF8_TO_SJIS: UTF8_TO_SJIS, SJIS_TO_UTF8: SJIS_TO_UTF8 };
      }
      return tables;
  }
  /**
   * @function SJIS
   * @param {string} str
   * @returns {number[]}
   */
  function SJIS(str) {
      var bytes = [];
      var length = str.length;
      var UTF8_TO_SJIS = getTables().UTF8_TO_SJIS;
      for (var i = 0; i < length; i++) {
          var code = str.charCodeAt(i);
          var byte = UTF8_TO_SJIS[code];
          if (byte != null) {
              // 2 bytes
              bytes.push(byte >> 8);
              bytes.push(byte & 0xff);
          }
          else {
              throw "illegal char: " + String.fromCharCode(code);
          }
      }
      return bytes;
  }

  /**
   * @module index
   * @author nuintun
   * @author Cosmo Wolfe
   */
  function decodeNumeric(stream, size) {
      var data = '';
      var bytes = [];
      var characterCountSize = [10, 12, 14][size];
      var length = stream.readBits(characterCountSize);
      // Read digits in groups of 3
      while (length >= 3) {
          var num = stream.readBits(10);
          if (num >= 1000) {
              throw 'invalid numeric value above 999';
          }
          var a = Math.floor(num / 100);
          var b = Math.floor(num / 10) % 10;
          var c = num % 10;
          bytes.push(48 + a, 48 + b, 48 + c);
          data += a.toString() + b.toString() + c.toString();
          length -= 3;
      }
      // If the number of digits aren't a multiple of 3, the remaining digits are special cased.
      if (length === 2) {
          var num = stream.readBits(7);
          if (num >= 100) {
              throw 'invalid numeric value above 99';
          }
          var a = Math.floor(num / 10);
          var b = num % 10;
          bytes.push(48 + a, 48 + b);
          data += a.toString() + b.toString();
      }
      else if (length === 1) {
          var num = stream.readBits(4);
          if (num >= 10) {
              throw 'invalid numeric value above 9';
          }
          bytes.push(48 + num);
          data += num.toString();
      }
      return { bytes: bytes, data: data };
  }
  // prettier-ignore
  var AlphanumericCharacterCodes = [
      '0', '1', '2', '3', '4', '5', '6', '7', '8',
      '9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H',
      'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q',
      'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      ' ', '$', '%', '*', '+', '-', '.', '/', ':'
  ];
  function decodeAlphanumeric(stream, size) {
      var data = '';
      var bytes = [];
      var characterCountSize = [9, 11, 13][size];
      var length = stream.readBits(characterCountSize);
      while (length >= 2) {
          var v = stream.readBits(11);
          var a = Math.floor(v / 45);
          var b = v % 45;
          bytes.push(AlphanumericCharacterCodes[a].charCodeAt(0), AlphanumericCharacterCodes[b].charCodeAt(0));
          data += AlphanumericCharacterCodes[a] + AlphanumericCharacterCodes[b];
          length -= 2;
      }
      if (length === 1) {
          var a = stream.readBits(6);
          bytes.push(AlphanumericCharacterCodes[a].charCodeAt(0));
          data += AlphanumericCharacterCodes[a];
      }
      return { bytes: bytes, data: data };
  }
  /**
   * @function decodeByteAsUTF8
   * @param {number[]} bytes
   * @returns {string}
   * @see https://github.com/google/closure-library/blob/master/closure/goog/crypt/crypt.js
   */
  function decodeByteAsUTF8(bytes) {
      // TODO(user): Use native implementations if/when available
      var pos = 0;
      var output = '';
      var length = bytes.length;
      while (pos < length) {
          var c1 = bytes[pos++];
          if (c1 < 128) {
              output += String.fromCharCode(c1);
          }
          else if (c1 > 191 && c1 < 224) {
              var c2 = bytes[pos++];
              output += String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
          }
          else if (c1 > 239 && c1 < 365) {
              // Surrogate Pair
              var c2 = bytes[pos++];
              var c3 = bytes[pos++];
              var c4 = bytes[pos++];
              var u = (((c1 & 7) << 18) | ((c2 & 63) << 12) | ((c3 & 63) << 6) | (c4 & 63)) - 0x10000;
              output += String.fromCharCode(0xd800 + (u >> 10));
              output += String.fromCharCode(0xdc00 + (u & 1023));
          }
          else {
              var c2 = bytes[pos++];
              var c3 = bytes[pos++];
              output += String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
          }
      }
      return output;
  }
  /**
   * @function decodeByteAsUTF8
   * @param {number[]} bytes
   * @returns {string}
   * @see https://github.com/narirou/jconv/blob/master/jconv.js
   */
  function decodeByteAsSJIS(bytes) {
      var pos = 0;
      var output = '';
      var length = bytes.length;
      var SJIS_TO_UTF8 = getTables().SJIS_TO_UTF8;
      while (pos < length) {
          var byte = bytes[pos++];
          if (byte < 0x80) {
              // ASCII
              output += String.fromCharCode(byte);
          }
          else if (0xa0 <= byte && byte <= 0xdf) {
              // HALFWIDTH_KATAKANA
              output += String.fromCharCode(byte + 0xfec0);
          }
          else {
              // KANJI
              var code = (byte << 8) + bytes[pos++];
              code = SJIS_TO_UTF8[code];
              output += code != null ? String.fromCharCode(code) : '?';
          }
      }
      return output;
  }
  function decodeByte(stream, size, encoding) {
      var bytes = [];
      var characterCountSize = [8, 16, 16][size];
      var length = stream.readBits(characterCountSize);
      for (var i = 0; i < length; i++) {
          bytes.push(stream.readBits(8));
      }
      return { bytes: bytes, data: encoding === 20 /* SJIS */ ? decodeByteAsSJIS(bytes) : decodeByteAsUTF8(bytes) };
  }
  function decodeKanji(stream, size) {
      var data = '';
      var bytes = [];
      var SJIS_TO_UTF8 = getTables().SJIS_TO_UTF8;
      var characterCountSize = [8, 10, 12][size];
      var length = stream.readBits(characterCountSize);
      for (var i = 0; i < length; i++) {
          var k = stream.readBits(13);
          var c = (Math.floor(k / 0xc0) << 8) | k % 0xc0;
          if (c < 0x1f00) {
              c += 0x8140;
          }
          else {
              c += 0xc140;
          }
          bytes.push(c >> 8, c & 0xff);
          var b = SJIS_TO_UTF8[c];
          data += String.fromCharCode(b != null ? b : c);
      }
      return { bytes: bytes, data: data };
  }
  function bytesDecode(data, version, errorCorrectionLevel) {
      var _a, _b, _c, _d;
      var encoding = 26 /* UTF8 */;
      var stream = new BitStream(data);
      // There are 3 'sizes' based on the version. 1-9 is small (0), 10-26 is medium (1) and 27-40 is large (2).
      var size = version <= 9 ? 0 : version <= 26 ? 1 : 2;
      var result = { data: '', bytes: [], chunks: [], version: version, errorCorrectionLevel: errorCorrectionLevel };
      while (stream.available() >= 4) {
          var mode = stream.readBits(4);
          if (mode === exports.Mode.Terminator) {
              return result;
          }
          else if (mode === exports.Mode.ECI) {
              if (stream.readBits(1) === 0) {
                  encoding = stream.readBits(7);
                  result.chunks.push({ mode: exports.Mode.ECI, encoding: encoding });
              }
              else if (stream.readBits(1) === 0) {
                  encoding = stream.readBits(14);
                  result.chunks.push({ mode: exports.Mode.ECI, encoding: encoding });
              }
              else if (stream.readBits(1) === 0) {
                  encoding = stream.readBits(21);
                  result.chunks.push({ mode: exports.Mode.ECI, encoding: encoding });
              }
              else {
                  // ECI data seems corrupted
                  result.chunks.push({ mode: exports.Mode.ECI, encoding: -1 });
              }
          }
          else if (mode === exports.Mode.Numeric) {
              var numericResult = decodeNumeric(stream, size);
              result.data += numericResult.data;
              result.chunks.push({
                  mode: exports.Mode.Numeric,
                  data: numericResult.data,
                  bytes: numericResult.bytes
              });
              (_a = result.bytes).push.apply(_a, numericResult.bytes);
          }
          else if (mode === exports.Mode.Alphanumeric) {
              var alphanumericResult = decodeAlphanumeric(stream, size);
              result.data += alphanumericResult.data;
              result.chunks.push({
                  mode: exports.Mode.Alphanumeric,
                  data: alphanumericResult.data,
                  bytes: alphanumericResult.bytes
              });
              (_b = result.bytes).push.apply(_b, alphanumericResult.bytes);
          }
          else if (mode === exports.Mode.StructuredAppend) {
              // QR Standard section 9.2
              var structuredAppend = {
                  // [current, total]
                  symbols: [stream.readBits(4), stream.readBits(4)],
                  parity: stream.readBits(8)
              };
              result.chunks.push(__assign({ mode: exports.Mode.StructuredAppend }, structuredAppend));
          }
          else if (mode === exports.Mode.Byte) {
              var byteResult = decodeByte(stream, size, encoding);
              result.data += byteResult.data;
              result.chunks.push({
                  mode: exports.Mode.Byte,
                  data: byteResult.data,
                  bytes: byteResult.bytes
              });
              (_c = result.bytes).push.apply(_c, byteResult.bytes);
          }
          else if (mode === exports.Mode.Kanji) {
              var kanjiResult = decodeKanji(stream, size);
              result.data += kanjiResult.data;
              result.chunks.push({
                  mode: exports.Mode.Kanji,
                  data: kanjiResult.data,
                  bytes: kanjiResult.bytes
              });
              (_d = result.bytes).push.apply(_d, kanjiResult.bytes);
          }
      }
      // If there is no data left, or the remaining bits are all 0, then that counts as a termination marker
      if (stream.available() === 0 || stream.readBits(stream.available()) === 0) {
          return result;
      }
  }

  /**
   * @module Version
   * @author nuintun
   * @author Cosmo Wolfe
   */
  var VERSIONS = [
      {
          infoBits: null,
          versionNumber: 1,
          alignmentPatternCenters: [],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 10,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 7,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 19 }]
              },
              {
                  ecCodewordsPerBlock: 17,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 9 }]
              },
              {
                  ecCodewordsPerBlock: 13,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 13 }]
              }
          ]
      },
      {
          infoBits: null,
          versionNumber: 2,
          alignmentPatternCenters: [6, 18],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 16,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 28 }]
              },
              {
                  ecCodewordsPerBlock: 10,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 34 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 22 }]
              }
          ]
      },
      {
          infoBits: null,
          versionNumber: 3,
          alignmentPatternCenters: [6, 22],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 44 }]
              },
              {
                  ecCodewordsPerBlock: 15,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 55 }]
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 13 }]
              },
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 17 }]
              }
          ]
      },
      {
          infoBits: null,
          versionNumber: 4,
          alignmentPatternCenters: [6, 26],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 32 }]
              },
              {
                  ecCodewordsPerBlock: 20,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 80 }]
              },
              {
                  ecCodewordsPerBlock: 16,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 9 }]
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 24 }]
              }
          ]
      },
      {
          infoBits: null,
          versionNumber: 5,
          alignmentPatternCenters: [6, 30],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 43 }]
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 108 }]
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 11 }, { numBlocks: 2, dataCodewordsPerBlock: 12 }]
              },
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 15 }, { numBlocks: 2, dataCodewordsPerBlock: 16 }]
              }
          ]
      },
      {
          infoBits: null,
          versionNumber: 6,
          alignmentPatternCenters: [6, 34],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 16,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 27 }]
              },
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 68 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 15 }]
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 19 }]
              }
          ]
      },
      {
          infoBits: 0x07c94,
          versionNumber: 7,
          alignmentPatternCenters: [6, 22, 38],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 31 }]
              },
              {
                  ecCodewordsPerBlock: 20,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 78 }]
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 13 }, { numBlocks: 1, dataCodewordsPerBlock: 14 }]
              },
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 14 }, { numBlocks: 4, dataCodewordsPerBlock: 15 }]
              }
          ]
      },
      {
          infoBits: 0x085bc,
          versionNumber: 8,
          alignmentPatternCenters: [6, 24, 42],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 38 }, { numBlocks: 2, dataCodewordsPerBlock: 39 }]
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 97 }]
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 14 }, { numBlocks: 2, dataCodewordsPerBlock: 15 }]
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 18 }, { numBlocks: 2, dataCodewordsPerBlock: 19 }]
              }
          ]
      },
      {
          infoBits: 0x09a99,
          versionNumber: 9,
          alignmentPatternCenters: [6, 26, 46],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [{ numBlocks: 3, dataCodewordsPerBlock: 36 }, { numBlocks: 2, dataCodewordsPerBlock: 37 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 116 }]
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 12 }, { numBlocks: 4, dataCodewordsPerBlock: 13 }]
              },
              {
                  ecCodewordsPerBlock: 20,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 16 }, { numBlocks: 4, dataCodewordsPerBlock: 17 }]
              }
          ]
      },
      {
          infoBits: 0x0a4d3,
          versionNumber: 10,
          alignmentPatternCenters: [6, 28, 50],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 43 }, { numBlocks: 1, dataCodewordsPerBlock: 44 }]
              },
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 68 }, { numBlocks: 2, dataCodewordsPerBlock: 69 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 6, dataCodewordsPerBlock: 15 }, { numBlocks: 2, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 6, dataCodewordsPerBlock: 19 }, { numBlocks: 2, dataCodewordsPerBlock: 20 }]
              }
          ]
      },
      {
          infoBits: 0x0bbf6,
          versionNumber: 11,
          alignmentPatternCenters: [6, 30, 54],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 50 }, { numBlocks: 4, dataCodewordsPerBlock: 51 }]
              },
              {
                  ecCodewordsPerBlock: 20,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 81 }]
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 3, dataCodewordsPerBlock: 12 }, { numBlocks: 8, dataCodewordsPerBlock: 13 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 22 }, { numBlocks: 4, dataCodewordsPerBlock: 23 }]
              }
          ]
      },
      {
          infoBits: 0x0c762,
          versionNumber: 12,
          alignmentPatternCenters: [6, 32, 58],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [{ numBlocks: 6, dataCodewordsPerBlock: 36 }, { numBlocks: 2, dataCodewordsPerBlock: 37 }]
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 92 }, { numBlocks: 2, dataCodewordsPerBlock: 93 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 7, dataCodewordsPerBlock: 14 }, { numBlocks: 4, dataCodewordsPerBlock: 15 }]
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 20 }, { numBlocks: 6, dataCodewordsPerBlock: 21 }]
              }
          ]
      },
      {
          infoBits: 0x0d847,
          versionNumber: 13,
          alignmentPatternCenters: [6, 34, 62],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [{ numBlocks: 8, dataCodewordsPerBlock: 37 }, { numBlocks: 1, dataCodewordsPerBlock: 38 }]
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 107 }]
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [{ numBlocks: 12, dataCodewordsPerBlock: 11 }, { numBlocks: 4, dataCodewordsPerBlock: 12 }]
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 8, dataCodewordsPerBlock: 20 }, { numBlocks: 4, dataCodewordsPerBlock: 21 }]
              }
          ]
      },
      {
          infoBits: 0x0e60d,
          versionNumber: 14,
          alignmentPatternCenters: [6, 26, 46, 66],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 40 }, { numBlocks: 5, dataCodewordsPerBlock: 41 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 3, dataCodewordsPerBlock: 115 }, { numBlocks: 1, dataCodewordsPerBlock: 116 }]
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 11, dataCodewordsPerBlock: 12 }, { numBlocks: 5, dataCodewordsPerBlock: 13 }]
              },
              {
                  ecCodewordsPerBlock: 20,
                  ecBlocks: [{ numBlocks: 11, dataCodewordsPerBlock: 16 }, { numBlocks: 5, dataCodewordsPerBlock: 17 }]
              }
          ]
      },
      {
          infoBits: 0x0f928,
          versionNumber: 15,
          alignmentPatternCenters: [6, 26, 48, 70],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 5, dataCodewordsPerBlock: 41 }, { numBlocks: 5, dataCodewordsPerBlock: 42 }]
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [{ numBlocks: 5, dataCodewordsPerBlock: 87 }, { numBlocks: 1, dataCodewordsPerBlock: 88 }]
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 11, dataCodewordsPerBlock: 12 }, { numBlocks: 7, dataCodewordsPerBlock: 13 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 5, dataCodewordsPerBlock: 24 }, { numBlocks: 7, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x10b78,
          versionNumber: 16,
          alignmentPatternCenters: [6, 26, 50, 74],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 7, dataCodewordsPerBlock: 45 }, { numBlocks: 3, dataCodewordsPerBlock: 46 }]
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 5, dataCodewordsPerBlock: 98 }, { numBlocks: 1, dataCodewordsPerBlock: 99 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 3, dataCodewordsPerBlock: 15 }, { numBlocks: 13, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 15, dataCodewordsPerBlock: 19 }, { numBlocks: 2, dataCodewordsPerBlock: 20 }]
              }
          ]
      },
      {
          infoBits: 0x1145d,
          versionNumber: 17,
          alignmentPatternCenters: [6, 30, 54, 78],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 10, dataCodewordsPerBlock: 46 }, { numBlocks: 1, dataCodewordsPerBlock: 47 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 107 }, { numBlocks: 5, dataCodewordsPerBlock: 108 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 14 }, { numBlocks: 17, dataCodewordsPerBlock: 15 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 22 }, { numBlocks: 15, dataCodewordsPerBlock: 23 }]
              }
          ]
      },
      {
          infoBits: 0x12a17,
          versionNumber: 18,
          alignmentPatternCenters: [6, 30, 56, 82],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 9, dataCodewordsPerBlock: 43 }, { numBlocks: 4, dataCodewordsPerBlock: 44 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 5, dataCodewordsPerBlock: 120 }, { numBlocks: 1, dataCodewordsPerBlock: 121 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 14 }, { numBlocks: 19, dataCodewordsPerBlock: 15 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 22 }, { numBlocks: 1, dataCodewordsPerBlock: 23 }]
              }
          ]
      },
      {
          infoBits: 0x13532,
          versionNumber: 19,
          alignmentPatternCenters: [6, 30, 58, 86],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 3, dataCodewordsPerBlock: 44 }, { numBlocks: 11, dataCodewordsPerBlock: 45 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 3, dataCodewordsPerBlock: 113 }, { numBlocks: 4, dataCodewordsPerBlock: 114 }]
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 9, dataCodewordsPerBlock: 13 }, { numBlocks: 16, dataCodewordsPerBlock: 14 }]
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 21 }, { numBlocks: 4, dataCodewordsPerBlock: 22 }]
              }
          ]
      },
      {
          infoBits: 0x149a6,
          versionNumber: 20,
          alignmentPatternCenters: [6, 34, 62, 90],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 3, dataCodewordsPerBlock: 41 }, { numBlocks: 13, dataCodewordsPerBlock: 42 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 3, dataCodewordsPerBlock: 107 }, { numBlocks: 5, dataCodewordsPerBlock: 108 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 15, dataCodewordsPerBlock: 15 }, { numBlocks: 10, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 15, dataCodewordsPerBlock: 24 }, { numBlocks: 5, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x15683,
          versionNumber: 21,
          alignmentPatternCenters: [6, 28, 50, 72, 94],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 42 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 116 }, { numBlocks: 4, dataCodewordsPerBlock: 117 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 19, dataCodewordsPerBlock: 16 }, { numBlocks: 6, dataCodewordsPerBlock: 17 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 22 }, { numBlocks: 6, dataCodewordsPerBlock: 23 }]
              }
          ]
      },
      {
          infoBits: 0x168c9,
          versionNumber: 22,
          alignmentPatternCenters: [6, 26, 50, 74, 98],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 46 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 111 }, { numBlocks: 7, dataCodewordsPerBlock: 112 }]
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 34, dataCodewordsPerBlock: 13 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 7, dataCodewordsPerBlock: 24 }, { numBlocks: 16, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x177ec,
          versionNumber: 23,
          alignmentPatternCenters: [6, 30, 54, 74, 102],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 47 }, { numBlocks: 14, dataCodewordsPerBlock: 48 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 121 }, { numBlocks: 5, dataCodewordsPerBlock: 122 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 16, dataCodewordsPerBlock: 15 }, { numBlocks: 14, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 11, dataCodewordsPerBlock: 24 }, { numBlocks: 14, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x18ec4,
          versionNumber: 24,
          alignmentPatternCenters: [6, 28, 54, 80, 106],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 6, dataCodewordsPerBlock: 45 }, { numBlocks: 14, dataCodewordsPerBlock: 46 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 6, dataCodewordsPerBlock: 117 }, { numBlocks: 4, dataCodewordsPerBlock: 118 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 30, dataCodewordsPerBlock: 16 }, { numBlocks: 2, dataCodewordsPerBlock: 17 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 11, dataCodewordsPerBlock: 24 }, { numBlocks: 16, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x191e1,
          versionNumber: 25,
          alignmentPatternCenters: [6, 32, 58, 84, 110],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 8, dataCodewordsPerBlock: 47 }, { numBlocks: 13, dataCodewordsPerBlock: 48 }]
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 8, dataCodewordsPerBlock: 106 }, { numBlocks: 4, dataCodewordsPerBlock: 107 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 22, dataCodewordsPerBlock: 15 }, { numBlocks: 13, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 7, dataCodewordsPerBlock: 24 }, { numBlocks: 22, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x1afab,
          versionNumber: 26,
          alignmentPatternCenters: [6, 30, 58, 86, 114],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 19, dataCodewordsPerBlock: 46 }, { numBlocks: 4, dataCodewordsPerBlock: 47 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 10, dataCodewordsPerBlock: 114 }, { numBlocks: 2, dataCodewordsPerBlock: 115 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 33, dataCodewordsPerBlock: 16 }, { numBlocks: 4, dataCodewordsPerBlock: 17 }]
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 28, dataCodewordsPerBlock: 22 }, { numBlocks: 6, dataCodewordsPerBlock: 23 }]
              }
          ]
      },
      {
          infoBits: 0x1b08e,
          versionNumber: 27,
          alignmentPatternCenters: [6, 34, 62, 90, 118],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 22, dataCodewordsPerBlock: 45 }, { numBlocks: 3, dataCodewordsPerBlock: 46 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 8, dataCodewordsPerBlock: 122 }, { numBlocks: 4, dataCodewordsPerBlock: 123 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 12, dataCodewordsPerBlock: 15 }, { numBlocks: 28, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 8, dataCodewordsPerBlock: 23 }, { numBlocks: 26, dataCodewordsPerBlock: 24 }]
              }
          ]
      },
      {
          infoBits: 0x1cc1a,
          versionNumber: 28,
          alignmentPatternCenters: [6, 26, 50, 74, 98, 122],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 3, dataCodewordsPerBlock: 45 }, { numBlocks: 23, dataCodewordsPerBlock: 46 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 3, dataCodewordsPerBlock: 117 }, { numBlocks: 10, dataCodewordsPerBlock: 118 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 11, dataCodewordsPerBlock: 15 }, { numBlocks: 31, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 24 }, { numBlocks: 31, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x1d33f,
          versionNumber: 29,
          alignmentPatternCenters: [6, 30, 54, 78, 102, 126],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 21, dataCodewordsPerBlock: 45 }, { numBlocks: 7, dataCodewordsPerBlock: 46 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 7, dataCodewordsPerBlock: 116 }, { numBlocks: 7, dataCodewordsPerBlock: 117 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 19, dataCodewordsPerBlock: 15 }, { numBlocks: 26, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 23 }, { numBlocks: 37, dataCodewordsPerBlock: 24 }]
              }
          ]
      },
      {
          infoBits: 0x1ed75,
          versionNumber: 30,
          alignmentPatternCenters: [6, 26, 52, 78, 104, 130],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 19, dataCodewordsPerBlock: 47 }, { numBlocks: 10, dataCodewordsPerBlock: 48 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 5, dataCodewordsPerBlock: 115 }, { numBlocks: 10, dataCodewordsPerBlock: 116 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 23, dataCodewordsPerBlock: 15 }, { numBlocks: 25, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 15, dataCodewordsPerBlock: 24 }, { numBlocks: 25, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x1f250,
          versionNumber: 31,
          alignmentPatternCenters: [6, 30, 56, 82, 108, 134],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 46 }, { numBlocks: 29, dataCodewordsPerBlock: 47 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 13, dataCodewordsPerBlock: 115 }, { numBlocks: 3, dataCodewordsPerBlock: 116 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 23, dataCodewordsPerBlock: 15 }, { numBlocks: 28, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 42, dataCodewordsPerBlock: 24 }, { numBlocks: 1, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x209d5,
          versionNumber: 32,
          alignmentPatternCenters: [6, 34, 60, 86, 112, 138],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 10, dataCodewordsPerBlock: 46 }, { numBlocks: 23, dataCodewordsPerBlock: 47 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 115 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 19, dataCodewordsPerBlock: 15 }, { numBlocks: 35, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 10, dataCodewordsPerBlock: 24 }, { numBlocks: 35, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x216f0,
          versionNumber: 33,
          alignmentPatternCenters: [6, 30, 58, 86, 114, 142],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 14, dataCodewordsPerBlock: 46 }, { numBlocks: 21, dataCodewordsPerBlock: 47 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 115 }, { numBlocks: 1, dataCodewordsPerBlock: 116 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 11, dataCodewordsPerBlock: 15 }, { numBlocks: 46, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 29, dataCodewordsPerBlock: 24 }, { numBlocks: 19, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x228ba,
          versionNumber: 34,
          alignmentPatternCenters: [6, 34, 62, 90, 118, 146],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 14, dataCodewordsPerBlock: 46 }, { numBlocks: 23, dataCodewordsPerBlock: 47 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 13, dataCodewordsPerBlock: 115 }, { numBlocks: 6, dataCodewordsPerBlock: 116 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 59, dataCodewordsPerBlock: 16 }, { numBlocks: 1, dataCodewordsPerBlock: 17 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 44, dataCodewordsPerBlock: 24 }, { numBlocks: 7, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x2379f,
          versionNumber: 35,
          alignmentPatternCenters: [6, 30, 54, 78, 102, 126, 150],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 12, dataCodewordsPerBlock: 47 }, { numBlocks: 26, dataCodewordsPerBlock: 48 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 12, dataCodewordsPerBlock: 121 }, { numBlocks: 7, dataCodewordsPerBlock: 122 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 22, dataCodewordsPerBlock: 15 }, { numBlocks: 41, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 39, dataCodewordsPerBlock: 24 }, { numBlocks: 14, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x24b0b,
          versionNumber: 36,
          alignmentPatternCenters: [6, 24, 50, 76, 102, 128, 154],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 6, dataCodewordsPerBlock: 47 }, { numBlocks: 34, dataCodewordsPerBlock: 48 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 6, dataCodewordsPerBlock: 121 }, { numBlocks: 14, dataCodewordsPerBlock: 122 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 15 }, { numBlocks: 64, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 46, dataCodewordsPerBlock: 24 }, { numBlocks: 10, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x2542e,
          versionNumber: 37,
          alignmentPatternCenters: [6, 28, 54, 80, 106, 132, 158],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 29, dataCodewordsPerBlock: 46 }, { numBlocks: 14, dataCodewordsPerBlock: 47 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 122 }, { numBlocks: 4, dataCodewordsPerBlock: 123 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 24, dataCodewordsPerBlock: 15 }, { numBlocks: 46, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 49, dataCodewordsPerBlock: 24 }, { numBlocks: 10, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x26a64,
          versionNumber: 38,
          alignmentPatternCenters: [6, 32, 58, 84, 110, 136, 162],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 13, dataCodewordsPerBlock: 46 }, { numBlocks: 32, dataCodewordsPerBlock: 47 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 122 }, { numBlocks: 18, dataCodewordsPerBlock: 123 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 42, dataCodewordsPerBlock: 15 }, { numBlocks: 32, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 48, dataCodewordsPerBlock: 24 }, { numBlocks: 14, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x27541,
          versionNumber: 39,
          alignmentPatternCenters: [6, 26, 54, 82, 110, 138, 166],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 40, dataCodewordsPerBlock: 47 }, { numBlocks: 7, dataCodewordsPerBlock: 48 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 20, dataCodewordsPerBlock: 117 }, { numBlocks: 4, dataCodewordsPerBlock: 118 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 10, dataCodewordsPerBlock: 15 }, { numBlocks: 67, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 43, dataCodewordsPerBlock: 24 }, { numBlocks: 22, dataCodewordsPerBlock: 25 }]
              }
          ]
      },
      {
          infoBits: 0x28c69,
          versionNumber: 40,
          alignmentPatternCenters: [6, 30, 58, 86, 114, 142, 170],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 18, dataCodewordsPerBlock: 47 }, { numBlocks: 31, dataCodewordsPerBlock: 48 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 19, dataCodewordsPerBlock: 118 }, { numBlocks: 6, dataCodewordsPerBlock: 119 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 20, dataCodewordsPerBlock: 15 }, { numBlocks: 61, dataCodewordsPerBlock: 16 }]
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 34, dataCodewordsPerBlock: 24 }, { numBlocks: 34, dataCodewordsPerBlock: 25 }]
              }
          ]
      }
  ];

  /**
   * @module index
   * @author nuintun
   * @author Cosmo Wolfe
   */
  function numBitsDiffering(x, y) {
      var z = x ^ y;
      var bitCount = 0;
      while (z) {
          bitCount++;
          z &= z - 1;
      }
      return bitCount;
  }
  function pushBit(bit, byte) {
      return (byte << 1) | bit;
  }
  var FORMAT_INFO_TABLE = [
      { bits: 0x5412, formatInfo: { errorCorrectionLevel: 0, dataMask: 0 } },
      { bits: 0x5125, formatInfo: { errorCorrectionLevel: 0, dataMask: 1 } },
      { bits: 0x5e7c, formatInfo: { errorCorrectionLevel: 0, dataMask: 2 } },
      { bits: 0x5b4b, formatInfo: { errorCorrectionLevel: 0, dataMask: 3 } },
      { bits: 0x45f9, formatInfo: { errorCorrectionLevel: 0, dataMask: 4 } },
      { bits: 0x40ce, formatInfo: { errorCorrectionLevel: 0, dataMask: 5 } },
      { bits: 0x4f97, formatInfo: { errorCorrectionLevel: 0, dataMask: 6 } },
      { bits: 0x4aa0, formatInfo: { errorCorrectionLevel: 0, dataMask: 7 } },
      { bits: 0x77c4, formatInfo: { errorCorrectionLevel: 1, dataMask: 0 } },
      { bits: 0x72f3, formatInfo: { errorCorrectionLevel: 1, dataMask: 1 } },
      { bits: 0x7daa, formatInfo: { errorCorrectionLevel: 1, dataMask: 2 } },
      { bits: 0x789d, formatInfo: { errorCorrectionLevel: 1, dataMask: 3 } },
      { bits: 0x662f, formatInfo: { errorCorrectionLevel: 1, dataMask: 4 } },
      { bits: 0x6318, formatInfo: { errorCorrectionLevel: 1, dataMask: 5 } },
      { bits: 0x6c41, formatInfo: { errorCorrectionLevel: 1, dataMask: 6 } },
      { bits: 0x6976, formatInfo: { errorCorrectionLevel: 1, dataMask: 7 } },
      { bits: 0x1689, formatInfo: { errorCorrectionLevel: 2, dataMask: 0 } },
      { bits: 0x13be, formatInfo: { errorCorrectionLevel: 2, dataMask: 1 } },
      { bits: 0x1ce7, formatInfo: { errorCorrectionLevel: 2, dataMask: 2 } },
      { bits: 0x19d0, formatInfo: { errorCorrectionLevel: 2, dataMask: 3 } },
      { bits: 0x0762, formatInfo: { errorCorrectionLevel: 2, dataMask: 4 } },
      { bits: 0x0255, formatInfo: { errorCorrectionLevel: 2, dataMask: 5 } },
      { bits: 0x0d0c, formatInfo: { errorCorrectionLevel: 2, dataMask: 6 } },
      { bits: 0x083b, formatInfo: { errorCorrectionLevel: 2, dataMask: 7 } },
      { bits: 0x355f, formatInfo: { errorCorrectionLevel: 3, dataMask: 0 } },
      { bits: 0x3068, formatInfo: { errorCorrectionLevel: 3, dataMask: 1 } },
      { bits: 0x3f31, formatInfo: { errorCorrectionLevel: 3, dataMask: 2 } },
      { bits: 0x3a06, formatInfo: { errorCorrectionLevel: 3, dataMask: 3 } },
      { bits: 0x24b4, formatInfo: { errorCorrectionLevel: 3, dataMask: 4 } },
      { bits: 0x2183, formatInfo: { errorCorrectionLevel: 3, dataMask: 5 } },
      { bits: 0x2eda, formatInfo: { errorCorrectionLevel: 3, dataMask: 6 } },
      { bits: 0x2bed, formatInfo: { errorCorrectionLevel: 3, dataMask: 7 } }
  ];
  function buildFunctionPatternMask(version) {
      var dimension = 17 + 4 * version.versionNumber;
      var matrix = BitMatrix.createEmpty(dimension, dimension);
      matrix.setRegion(0, 0, 9, 9, true); // Top left finder pattern + separator + format
      matrix.setRegion(dimension - 8, 0, 8, 9, true); // Top right finder pattern + separator + format
      matrix.setRegion(0, dimension - 8, 9, 8, true); // Bottom left finder pattern + separator + format
      // Alignment patterns
      for (var _i = 0, _a = version.alignmentPatternCenters; _i < _a.length; _i++) {
          var x = _a[_i];
          for (var _b = 0, _c = version.alignmentPatternCenters; _b < _c.length; _b++) {
              var y = _c[_b];
              if (!((x === 6 && y === 6) || (x === 6 && y === dimension - 7) || (x === dimension - 7 && y === 6))) {
                  matrix.setRegion(x - 2, y - 2, 5, 5, true);
              }
          }
      }
      matrix.setRegion(6, 9, 1, dimension - 17, true); // Vertical timing pattern
      matrix.setRegion(9, 6, dimension - 17, 1, true); // Horizontal timing pattern
      if (version.versionNumber > 6) {
          matrix.setRegion(dimension - 11, 0, 3, 6, true); // Version info, top right
          matrix.setRegion(0, dimension - 11, 6, 3, true); // Version info, bottom left
      }
      return matrix;
  }
  function readCodewords(matrix, version, formatInfo) {
      var dimension = matrix.height;
      var maskFunc = getMaskFunc(formatInfo.dataMask);
      var functionPatternMask = buildFunctionPatternMask(version);
      var bitsRead = 0;
      var currentByte = 0;
      var codewords = [];
      // Read columns in pairs, from right to left
      var readingUp = true;
      for (var columnIndex = dimension - 1; columnIndex > 0; columnIndex -= 2) {
          if (columnIndex === 6) {
              // Skip whole column with vertical alignment pattern;
              columnIndex--;
          }
          for (var i = 0; i < dimension; i++) {
              var y = readingUp ? dimension - 1 - i : i;
              for (var columnOffset = 0; columnOffset < 2; columnOffset++) {
                  var x = columnIndex - columnOffset;
                  if (!functionPatternMask.get(x, y)) {
                      bitsRead++;
                      var bit = matrix.get(x, y);
                      if (maskFunc(x, y)) {
                          bit = !bit;
                      }
                      currentByte = pushBit(bit, currentByte);
                      if (bitsRead === 8) {
                          // Whole bytes
                          codewords.push(currentByte);
                          bitsRead = 0;
                          currentByte = 0;
                      }
                  }
              }
          }
          readingUp = !readingUp;
      }
      return codewords;
  }
  function readVersion(matrix) {
      var dimension = matrix.height;
      var provisionalVersion = Math.floor((dimension - 17) / 4);
      if (provisionalVersion <= 6) {
          // 6 and under dont have version info in the QR code
          return VERSIONS[provisionalVersion - 1];
      }
      var topRightVersionBits = 0;
      for (var y = 5; y >= 0; y--) {
          for (var x = dimension - 9; x >= dimension - 11; x--) {
              topRightVersionBits = pushBit(matrix.get(x, y), topRightVersionBits);
          }
      }
      var bottomLeftVersionBits = 0;
      for (var x = 5; x >= 0; x--) {
          for (var y = dimension - 9; y >= dimension - 11; y--) {
              bottomLeftVersionBits = pushBit(matrix.get(x, y), bottomLeftVersionBits);
          }
      }
      var bestVersion;
      var bestDifference = Infinity;
      for (var _i = 0, VERSIONS_1 = VERSIONS; _i < VERSIONS_1.length; _i++) {
          var version = VERSIONS_1[_i];
          if (version.infoBits === topRightVersionBits || version.infoBits === bottomLeftVersionBits) {
              return version;
          }
          var difference = numBitsDiffering(topRightVersionBits, version.infoBits);
          if (difference < bestDifference) {
              bestVersion = version;
              bestDifference = difference;
          }
          difference = numBitsDiffering(bottomLeftVersionBits, version.infoBits);
          if (difference < bestDifference) {
              bestVersion = version;
              bestDifference = difference;
          }
      }
      // We can tolerate up to 3 bits of error since no two version info codewords will
      // differ in less than 8 bits.
      if (bestDifference <= 3) {
          return bestVersion;
      }
  }
  function readFormatInformation(matrix) {
      var topLeftFormatInfoBits = 0;
      for (var x = 0; x <= 8; x++) {
          if (x !== 6) {
              // Skip timing pattern bit
              topLeftFormatInfoBits = pushBit(matrix.get(x, 8), topLeftFormatInfoBits);
          }
      }
      for (var y = 7; y >= 0; y--) {
          if (y !== 6) {
              // Skip timing pattern bit
              topLeftFormatInfoBits = pushBit(matrix.get(8, y), topLeftFormatInfoBits);
          }
      }
      var dimension = matrix.height;
      var topRightBottomRightFormatInfoBits = 0;
      for (var y = dimension - 1; y >= dimension - 7; y--) {
          // bottom left
          topRightBottomRightFormatInfoBits = pushBit(matrix.get(8, y), topRightBottomRightFormatInfoBits);
      }
      for (var x = dimension - 8; x < dimension; x++) {
          // top right
          topRightBottomRightFormatInfoBits = pushBit(matrix.get(x, 8), topRightBottomRightFormatInfoBits);
      }
      var bestDifference = Infinity;
      var bestFormatInfo = null;
      for (var _i = 0, FORMAT_INFO_TABLE_1 = FORMAT_INFO_TABLE; _i < FORMAT_INFO_TABLE_1.length; _i++) {
          var _a = FORMAT_INFO_TABLE_1[_i], bits = _a.bits, formatInfo = _a.formatInfo;
          if (bits === topLeftFormatInfoBits || bits === topRightBottomRightFormatInfoBits) {
              return formatInfo;
          }
          var difference = numBitsDiffering(topLeftFormatInfoBits, bits);
          if (difference < bestDifference) {
              bestFormatInfo = formatInfo;
              bestDifference = difference;
          }
          if (topLeftFormatInfoBits !== topRightBottomRightFormatInfoBits) {
              // also try the other option
              difference = numBitsDiffering(topRightBottomRightFormatInfoBits, bits);
              if (difference < bestDifference) {
                  bestFormatInfo = formatInfo;
                  bestDifference = difference;
              }
          }
      }
      // Hamming distance of the 32 masked codes is 7, by construction, so <= 3 bits differing means we found a match
      if (bestDifference <= 3) {
          return bestFormatInfo;
      }
      return null;
  }
  function getDataBlocks(codewords, version, errorCorrectionLevel) {
      var dataBlocks = [];
      var ecInfo = version.errorCorrectionLevels[errorCorrectionLevel];
      var totalCodewords = 0;
      ecInfo.ecBlocks.forEach(function (block) {
          for (var i = 0; i < block.numBlocks; i++) {
              dataBlocks.push({ numDataCodewords: block.dataCodewordsPerBlock, codewords: [] });
              totalCodewords += block.dataCodewordsPerBlock + ecInfo.ecCodewordsPerBlock;
          }
      });
      // In some cases the QR code will be malformed enough that we pull off more or less than we should.
      // If we pull off less there's nothing we can do.
      // If we pull off more we can safely truncate
      if (codewords.length < totalCodewords) {
          return null;
      }
      codewords = codewords.slice(0, totalCodewords);
      var shortBlockSize = ecInfo.ecBlocks[0].dataCodewordsPerBlock;
      // Pull codewords to fill the blocks up to the minimum size
      for (var i = 0; i < shortBlockSize; i++) {
          for (var _i = 0, dataBlocks_1 = dataBlocks; _i < dataBlocks_1.length; _i++) {
              var dataBlock = dataBlocks_1[_i];
              dataBlock.codewords.push(codewords.shift());
          }
      }
      // If there are any large blocks, pull codewords to fill the last element of those
      if (ecInfo.ecBlocks.length > 1) {
          var smallBlockCount = ecInfo.ecBlocks[0].numBlocks;
          var largeBlockCount = ecInfo.ecBlocks[1].numBlocks;
          for (var i = 0; i < largeBlockCount; i++) {
              dataBlocks[smallBlockCount + i].codewords.push(codewords.shift());
          }
      }
      // Add the rest of the codewords to the blocks. These are the error correction codewords.
      while (codewords.length > 0) {
          for (var _a = 0, dataBlocks_2 = dataBlocks; _a < dataBlocks_2.length; _a++) {
              var dataBlock = dataBlocks_2[_a];
              dataBlock.codewords.push(codewords.shift());
          }
      }
      return dataBlocks;
  }
  function decodeMatrix(matrix) {
      var version = readVersion(matrix);
      if (!version) {
          return null;
      }
      var formatInfo = readFormatInformation(matrix);
      if (!formatInfo) {
          return null;
      }
      var codewords = readCodewords(matrix, version, formatInfo);
      var dataBlocks = getDataBlocks(codewords, version, formatInfo.errorCorrectionLevel);
      if (!dataBlocks) {
          return null;
      }
      // Count total number of data bytes
      var totalBytes = dataBlocks.reduce(function (a, b) { return a + b.numDataCodewords; }, 0);
      var resultBytes = new Uint8ClampedArray(totalBytes);
      var resultIndex = 0;
      for (var _i = 0, dataBlocks_3 = dataBlocks; _i < dataBlocks_3.length; _i++) {
          var dataBlock = dataBlocks_3[_i];
          var correctedBytes = rsDecode(dataBlock.codewords, dataBlock.codewords.length - dataBlock.numDataCodewords);
          if (!correctedBytes) {
              return null;
          }
          for (var i = 0; i < dataBlock.numDataCodewords; i++) {
              resultBytes[resultIndex++] = correctedBytes[i];
          }
      }
      try {
          return bytesDecode(resultBytes, version.versionNumber, formatInfo.errorCorrectionLevel);
      }
      catch (_a) {
          return null;
      }
  }
  function decode(matrix) {
      if (matrix == null) {
          return null;
      }
      var result = decodeMatrix(matrix);
      if (result) {
          return result;
      }
      // Decoding didn't work, try mirroring the QR across the topLeft -> bottomRight line.
      for (var x = 0; x < matrix.width; x++) {
          for (var y = x + 1; y < matrix.height; y++) {
              if (matrix.get(x, y) !== matrix.get(y, x)) {
                  matrix.set(x, y, !matrix.get(x, y));
                  matrix.set(y, x, !matrix.get(y, x));
              }
          }
      }
      return decodeMatrix(matrix);
  }

  /**
   * @module extractor
   * @author nuintun
   * @author Cosmo Wolfe
   */
  function squareToQuadrilateral(p1, p2, p3, p4) {
      var dx3 = p1.x - p2.x + p3.x - p4.x;
      var dy3 = p1.y - p2.y + p3.y - p4.y;
      if (dx3 === 0 && dy3 === 0) {
          // Affine
          return {
              a11: p2.x - p1.x,
              a12: p2.y - p1.y,
              a13: 0,
              a21: p3.x - p2.x,
              a22: p3.y - p2.y,
              a23: 0,
              a31: p1.x,
              a32: p1.y,
              a33: 1
          };
      }
      else {
          var dx1 = p2.x - p3.x;
          var dx2 = p4.x - p3.x;
          var dy1 = p2.y - p3.y;
          var dy2 = p4.y - p3.y;
          var denominator = dx1 * dy2 - dx2 * dy1;
          var a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
          var a23 = (dx1 * dy3 - dx3 * dy1) / denominator;
          return {
              a11: p2.x - p1.x + a13 * p2.x,
              a12: p2.y - p1.y + a13 * p2.y,
              a13: a13,
              a21: p4.x - p1.x + a23 * p4.x,
              a22: p4.y - p1.y + a23 * p4.y,
              a23: a23,
              a31: p1.x,
              a32: p1.y,
              a33: 1
          };
      }
  }
  function quadrilateralToSquare(p1, p2, p3, p4) {
      // Here, the adjoint serves as the inverse:
      var sToQ = squareToQuadrilateral(p1, p2, p3, p4);
      return {
          a11: sToQ.a22 * sToQ.a33 - sToQ.a23 * sToQ.a32,
          a12: sToQ.a13 * sToQ.a32 - sToQ.a12 * sToQ.a33,
          a13: sToQ.a12 * sToQ.a23 - sToQ.a13 * sToQ.a22,
          a21: sToQ.a23 * sToQ.a31 - sToQ.a21 * sToQ.a33,
          a22: sToQ.a11 * sToQ.a33 - sToQ.a13 * sToQ.a31,
          a23: sToQ.a13 * sToQ.a21 - sToQ.a11 * sToQ.a23,
          a31: sToQ.a21 * sToQ.a32 - sToQ.a22 * sToQ.a31,
          a32: sToQ.a12 * sToQ.a31 - sToQ.a11 * sToQ.a32,
          a33: sToQ.a11 * sToQ.a22 - sToQ.a12 * sToQ.a21
      };
  }
  function times(a, b) {
      return {
          a11: a.a11 * b.a11 + a.a21 * b.a12 + a.a31 * b.a13,
          a12: a.a12 * b.a11 + a.a22 * b.a12 + a.a32 * b.a13,
          a13: a.a13 * b.a11 + a.a23 * b.a12 + a.a33 * b.a13,
          a21: a.a11 * b.a21 + a.a21 * b.a22 + a.a31 * b.a23,
          a22: a.a12 * b.a21 + a.a22 * b.a22 + a.a32 * b.a23,
          a23: a.a13 * b.a21 + a.a23 * b.a22 + a.a33 * b.a23,
          a31: a.a11 * b.a31 + a.a21 * b.a32 + a.a31 * b.a33,
          a32: a.a12 * b.a31 + a.a22 * b.a32 + a.a32 * b.a33,
          a33: a.a13 * b.a31 + a.a23 * b.a32 + a.a33 * b.a33
      };
  }
  function extract(image, location) {
      var qToS = quadrilateralToSquare({ x: 3.5, y: 3.5 }, { x: location.dimension - 3.5, y: 3.5 }, { x: location.dimension - 6.5, y: location.dimension - 6.5 }, { x: 3.5, y: location.dimension - 3.5 });
      var sToQ = squareToQuadrilateral(location.topLeft, location.topRight, location.alignmentPattern, location.bottomLeft);
      var transform = times(sToQ, qToS);
      var matrix = BitMatrix.createEmpty(location.dimension, location.dimension);
      var mappingFunction = function (x, y) {
          var denominator = transform.a13 * x + transform.a23 * y + transform.a33;
          return {
              x: Math.max(0, (transform.a11 * x + transform.a21 * y + transform.a31) / denominator),
              y: Math.max(0, (transform.a12 * x + transform.a22 * y + transform.a32) / denominator)
          };
      };
      for (var y = 0; y < location.dimension; y++) {
          for (var x = 0; x < location.dimension; x++) {
              var xValue = x + 0.5;
              var yValue = y + 0.5;
              var sourcePixel = mappingFunction(xValue, yValue);
              matrix.set(x, y, image.get(Math.floor(sourcePixel.x), Math.floor(sourcePixel.y)));
          }
      }
      return {
          matrix: matrix,
          mappingFunction: mappingFunction
      };
  }

  /**
   * @module binarizer
   * @author nuintun
   * @author Cosmo Wolfe
   */
  var REGION_SIZE = 8;
  var MIN_DYNAMIC_RANGE = 24;
  function numBetween(value, min, max) {
      return value < min ? min : value > max ? max : value;
  }
  // Like BitMatrix but accepts arbitry Uint8 values
  var Matrix = /*#__PURE__*/ (function () {
      function Matrix(width, height) {
          this.width = width;
          this.data = new Uint8ClampedArray(width * height);
      }
      Matrix.prototype.get = function (x, y) {
          return this.data[y * this.width + x];
      };
      Matrix.prototype.set = function (x, y, value) {
          this.data[y * this.width + x] = value;
      };
      return Matrix;
  }());
  function binarize(data, width, height, returnInverted) {
      if (data.length !== width * height * 4) {
          throw 'malformed data passed to binarizer';
      }
      // Convert image to greyscale
      var greyscalePixels = new Matrix(width, height);
      for (var x = 0; x < width; x++) {
          for (var y = 0; y < height; y++) {
              var r = data[(y * width + x) * 4 + 0];
              var g = data[(y * width + x) * 4 + 1];
              var b = data[(y * width + x) * 4 + 2];
              greyscalePixels.set(x, y, 0.2126 * r + 0.7152 * g + 0.0722 * b);
          }
      }
      var horizontalRegionCount = Math.ceil(width / REGION_SIZE);
      var verticalRegionCount = Math.ceil(height / REGION_SIZE);
      var blackPoints = new Matrix(horizontalRegionCount, verticalRegionCount);
      for (var verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
          for (var hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
              var sum = 0;
              var min = Infinity;
              var max = 0;
              for (var y = 0; y < REGION_SIZE; y++) {
                  for (var x = 0; x < REGION_SIZE; x++) {
                      var pixelLumosity = greyscalePixels.get(hortizontalRegion * REGION_SIZE + x, verticalRegion * REGION_SIZE + y);
                      sum += pixelLumosity;
                      min = Math.min(min, pixelLumosity);
                      max = Math.max(max, pixelLumosity);
                  }
              }
              var average = sum / Math.pow(REGION_SIZE, 2);
              if (max - min <= MIN_DYNAMIC_RANGE) {
                  // If variation within the block is low, assume this is a block with only light or only
                  // dark pixels. In that case we do not want to use the average, as it would divide this
                  // low contrast area into black and white pixels, essentially creating data out of noise.
                  //
                  // Default the blackpoint for these blocks to be half the min - effectively white them out
                  average = min / 2;
                  if (verticalRegion > 0 && hortizontalRegion > 0) {
                      // Correct the "white background" assumption for blocks that have neighbors by comparing
                      // the pixels in this block to the previously calculated black points. This is based on
                      // the fact that dark barcode symbology is always surrounded by some amount of light
                      // background for which reasonable black point estimates were made. The bp estimated at
                      // the boundaries is used for the interior.
                      // The (min < bp) is arbitrary but works better than other heuristics that were tried.
                      var averageNeighborBlackPoint = (blackPoints.get(hortizontalRegion, verticalRegion - 1) +
                          2 * blackPoints.get(hortizontalRegion - 1, verticalRegion) +
                          blackPoints.get(hortizontalRegion - 1, verticalRegion - 1)) /
                          4;
                      if (min < averageNeighborBlackPoint) {
                          average = averageNeighborBlackPoint;
                      }
                  }
              }
              blackPoints.set(hortizontalRegion, verticalRegion, average);
          }
      }
      var inverted = null;
      var binarized = BitMatrix.createEmpty(width, height);
      if (returnInverted) {
          inverted = BitMatrix.createEmpty(width, height);
      }
      for (var verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
          for (var hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
              var left = numBetween(hortizontalRegion, 2, horizontalRegionCount - 3);
              var top_1 = numBetween(verticalRegion, 2, verticalRegionCount - 3);
              var sum = 0;
              for (var xRegion = -2; xRegion <= 2; xRegion++) {
                  for (var yRegion = -2; yRegion <= 2; yRegion++) {
                      sum += blackPoints.get(left + xRegion, top_1 + yRegion);
                  }
              }
              var threshold = sum / 25;
              for (var xRegion = 0; xRegion < REGION_SIZE; xRegion++) {
                  for (var yRegion = 0; yRegion < REGION_SIZE; yRegion++) {
                      var x = hortizontalRegion * REGION_SIZE + xRegion;
                      var y = verticalRegion * REGION_SIZE + yRegion;
                      var lum = greyscalePixels.get(x, y);
                      binarized.set(x, y, lum <= threshold);
                      if (returnInverted) {
                          inverted.set(x, y, !(lum <= threshold));
                      }
                  }
              }
          }
      }
      if (returnInverted) {
          return { binarized: binarized, inverted: inverted };
      }
      return { binarized: binarized };
  }

  /**
   * @module QRCode
   * @author nuintun
   * @author Cosmo Wolfe
   */
  function scan(matrix) {
      var location = locate(matrix);
      if (!location) {
          return null;
      }
      var extracted = extract(matrix, location);
      var decoded = decode(extracted.matrix);
      if (!decoded) {
          return null;
      }
      var dimension = location.dimension;
      return __assign({}, decoded, { location: {
              topLeft: extracted.mappingFunction(0, 0),
              topRight: extracted.mappingFunction(dimension, 0),
              bottomLeft: extracted.mappingFunction(0, dimension),
              bottomRight: extracted.mappingFunction(dimension, dimension),
              topLeftFinder: location.topLeft,
              topRightFinder: location.topRight,
              bottomLeftFinder: location.bottomLeft,
              bottomRightAlignment: decoded.version > 1 ? location.alignmentPattern : null
          } });
  }
  var defaultOptions = {
      inversionAttempts: 'attemptBoth'
  };
  function disposeImageEvents(image) {
      image.onload = null;
      image.onerror = null;
  }
  var Decoder = /*#__PURE__*/ (function () {
      function Decoder() {
          this.options = defaultOptions;
      }
      /**
       * @public
       * @method setOptions
       * @param {object} options
       */
      Decoder.prototype.setOptions = function (options) {
          if (options === void 0) { options = {}; }
          options = options || {};
          this.options = __assign({}, defaultOptions, options);
      };
      /**
       * @public
       * @method decode
       * @param {Uint8ClampedArray} data
       * @param {number} width
       * @param {number} height
       * @returns {DecoderResult}
       */
      Decoder.prototype.decode = function (data, width, height) {
          var options = this.options;
          var shouldInvert = options.inversionAttempts === 'attemptBoth' || options.inversionAttempts === 'invertFirst';
          var tryInvertedFirst = options.inversionAttempts === 'onlyInvert' || options.inversionAttempts === 'invertFirst';
          var _a = binarize(data, width, height, shouldInvert), binarized = _a.binarized, inverted = _a.inverted;
          var result = scan(tryInvertedFirst ? inverted : binarized);
          if (!result && (options.inversionAttempts === 'attemptBoth' || options.inversionAttempts === 'invertFirst')) {
              result = scan(tryInvertedFirst ? binarized : inverted);
          }
          return result;
      };
      /**
       * @public
       * @method scan
       * @param {string} src
       * @returns {Promise}
       */
      Decoder.prototype.scan = function (src) {
          var _this = this;
          return new Promise(function (resolve, reject) {
              var image = new Image();
              // Image cross origin
              image.crossOrigin = 'anonymous';
              image.onload = function () {
                  disposeImageEvents(image);
                  var width = image.width;
                  var height = image.height;
                  var canvas = document.createElement('canvas');
                  var context = canvas.getContext('2d');
                  canvas.width = width;
                  canvas.height = height;
                  context.drawImage(image, 0, 0);
                  var data = context.getImageData(0, 0, width, height).data;
                  var result = _this.decode(data, width, height);
                  if (result) {
                      return resolve(result);
                  }
                  return reject('failed to decode image');
              };
              image.onerror = function () {
                  disposeImageEvents(image);
                  reject("failed to load image: " + src);
              };
              image.src = src;
          });
      };
      return Decoder;
  }());

  /**
   * @module QRKanji
   * @author nuintun
   * @author Kazuhiko Arase
   * @description SJIS only
   */
  var QRKanji = /*#__PURE__*/ (function (_super) {
      __extends(QRKanji, _super);
      /**
       * @constructor
       * @param {string} data
       */
      function QRKanji(data) {
          var _this = _super.call(this, exports.Mode.Kanji, data) || this;
          _this.bytes = SJIS(data);
          return _this;
      }
      /**
       * @public
       * @method write
       * @param {BitBuffer} buffer
       */
      QRKanji.prototype.write = function (buffer) {
          var index = 0;
          var bytes = this.bytes;
          var length = bytes.length;
          while (index + 1 < length) {
              var code = ((0xff & bytes[index]) << 8) | (0xff & bytes[index + 1]);
              if (0x8140 <= code && code <= 0x9ffc) {
                  code -= 0x8140;
              }
              else if (0xe040 <= code && code <= 0xebbf) {
                  code -= 0xc140;
              }
              code = ((code >> 8) & 0xff) * 0xc0 + (code & 0xff);
              buffer.put(code, 13);
              index += 2;
          }
      };
      /**
       * @public
       * @method getLength
       * @returns {number}
       */
      QRKanji.prototype.getLength = function () {
          return Math.floor(this.bytes.length / 2);
      };
      return QRKanji;
  }(QRData));

  /**
   * @module UTF16
   * @author nuintun
   */
  function UTF16(str) {
      var bytes = [];
      var length = str.length;
      for (var i = 0; i < length; i++) {
          bytes.push(str.charCodeAt(i));
      }
      return bytes;
  }

  /**
   * @module QRNumeric
   * @author nuintun
   * @author Kazuhiko Arase
   */
  function getCode(byte) {
      // 0 - 9
      if (0x30 <= byte && byte <= 0x39) {
          return byte - 0x30;
      }
      throw "illegal char: " + String.fromCharCode(byte);
  }
  function getBatchCode(bytes) {
      var num = 0;
      var length = bytes.length;
      for (var i = 0; i < length; i++) {
          num = num * 10 + getCode(bytes[i]);
      }
      return num;
  }
  var QRNumeric = /*#__PURE__*/ (function (_super) {
      __extends(QRNumeric, _super);
      /**
       * @constructor
       * @param {string} data
       */
      function QRNumeric(data) {
          var _this = _super.call(this, exports.Mode.Numeric, data) || this;
          _this.bytes = UTF16(data);
          return _this;
      }
      /**
       * @public
       * @method write
       * @param {BitBuffer} buffer
       */
      QRNumeric.prototype.write = function (buffer) {
          var i = 0;
          var bytes = this.bytes;
          var length = bytes.length;
          while (i + 2 < length) {
              buffer.put(getBatchCode([bytes[i], bytes[i + 1], bytes[i + 2]]), 10);
              i += 3;
          }
          if (i < length) {
              if (length - i === 1) {
                  buffer.put(getBatchCode([bytes[i]]), 4);
              }
              else if (length - i === 2) {
                  buffer.put(getBatchCode([bytes[i], bytes[i + 1]]), 7);
              }
          }
      };
      /**
       * @public
       * @method getLength
       * @returns {number}
       */
      QRNumeric.prototype.getLength = function () {
          return this.bytes.length;
      };
      return QRNumeric;
  }(QRData));

  /**
   * @module QRAlphanumeric
   * @author nuintun
   * @author Kazuhiko Arase
   */
  function getCode$1(byte) {
      if (0x30 <= byte && byte <= 0x39) {
          // 0 - 9
          return byte - 0x30;
      }
      else if (0x41 <= byte && byte <= 0x5a) {
          // A - Z
          return byte - 0x41 + 10;
      }
      else {
          switch (byte) {
              // space
              case 0x20:
                  return 36;
              // $
              case 0x24:
                  return 37;
              // %
              case 0x25:
                  return 38;
              // *
              case 0x2a:
                  return 39;
              // +
              case 0x2b:
                  return 40;
              // -
              case 0x2d:
                  return 41;
              // .
              case 0x2e:
                  return 42;
              // /
              case 0x2f:
                  return 43;
              // :
              case 0x3a:
                  return 44;
              default:
                  throw "illegal char: " + String.fromCharCode(byte);
          }
      }
  }
  var QRAlphanumeric = /*#__PURE__*/ (function (_super) {
      __extends(QRAlphanumeric, _super);
      /**
       * @constructor
       * @param {string} data
       */
      function QRAlphanumeric(data) {
          var _this = _super.call(this, exports.Mode.Alphanumeric, data) || this;
          _this.bytes = UTF16(data);
          return _this;
      }
      /**
       * @public
       * @method write
       * @param {BitBuffer} buffer
       */
      QRAlphanumeric.prototype.write = function (buffer) {
          var i = 0;
          var bytes = this.bytes;
          var length = bytes.length;
          while (i + 1 < length) {
              buffer.put(getCode$1(bytes[i]) * 45 + getCode$1(bytes[i + 1]), 11);
              i += 2;
          }
          if (i < length) {
              buffer.put(getCode$1(bytes[i]), 6);
          }
      };
      /**
       * @public
       * @method getLength
       * @returns {number}
       */
      QRAlphanumeric.prototype.getLength = function () {
          return this.bytes.length;
      };
      return QRAlphanumeric;
  }(QRData));

  /**
   * @module index
   * @author nuintun
   */

  exports.Decoder = Decoder;
  exports.Encoder = Encoder;
  exports.QRAlphanumeric = QRAlphanumeric;
  exports.QRByte = QRByte;
  exports.QRKanji = QRKanji;
  exports.QRNumeric = QRNumeric;

}));
