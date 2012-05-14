/**
 * An experimental implementation of the string formatting proposal from ECMAScript 6.
 * Proposal: http://wiki.ecmascript.org/doku.php?id=strawman:string_format_take_two
 * 
 * It's not quite complete; some number formatting isn't yet there:
 *   - The '#' flag isn't supported
 * 
 * (c) 2012 Rob Brackett (rob@robbrackett.com)
 * This code is free to use under the terms of the accompanying LICENSE.txt file
 */

(function (exports) {
	
	// regex for separating the various parts of an identifier from each other
	var identifierIdentifier = /^(?:\[([^\.\[\]]+)\]|\.?([^\.\[\]]+))(.*)$/
	// convert an identifier into the actual value that will be substituted
	var findByPath = function (path, data, top) {
		var identifiers = path.match(identifierIdentifier);
		if (!identifiers) {
			throw "Invalid identifier: " + path;
		}
		var key = identifiers[1] || identifiers[2];
		// For the first identifier, named keys are a shortcut to "0.key"
		if (top && !isFinite(key)) {
			data = data[0];
		}
		var value = data[key];
		// recurse as necessary
		return identifiers[3] ? findByPath(identifiers[3], value) : value;
	};
	
	// the actual format function
	var format = function (template, data) {
		// NOTE: other versions of this algorithm are in performance/parsing-algorithms.js
		// Generally, this version performs best on small-ish strings and a regex-based
		// versions performs best on very large strings. Since people will probably use
		// more complicated templating libraries for big strings, we use the small-string
		// optimized version here.
		
		var args = Array.prototype.slice.call(arguments, 1);

		var outputBuffer = "";
		var tokenBuffer = "";
		// true if we are currently buffering a token that will be replaced
		var bufferingToken = false;
		// true if we've encountered a specifier that will be replaced
		var specifierIsReplaced = false;
		// track the {identifier:specifier} replacement parts
		var identifier, specifier;

		// walk the template
		for (var i = 0, length = template.length; i < length; i++) {
			var current = template.charAt(i);

			if (bufferingToken) {
				// ":" designates end of identifier, start of specifier
				if (current === ":") {
					identifier = tokenBuffer;
					tokenBuffer = "";
					// if the first character of the specifier is "{", assume it is replaced
					if (template.charAt(i + 1) === "{") {
						specifierIsReplaced = true;
						i += 1;
					}
				}
				// end of token
				else if (current === "}") {
					// if we've already captured an identifier, the buffer contains the specifier
					// (see check for ":" above)
					if (identifier) {
						specifier = tokenBuffer;
					}
					else {
						identifier = tokenBuffer;
					}
					
					var foundValue = findByPath(identifier, args, true);
					// if a specifier is an identifier itself, do the replacement and
					// if we're dealing with a replaced specifier, we should end with a "}}"
					// so deal with the second "}"
					if (specifierIsReplaced) {
						specifier = findByPath(specifier, args, true);
						i += 1;
					}
					
					// format the value
					outputBuffer += formatValue(foundValue, specifier);
					
					// cleanup
					bufferingToken = false;
					specifierIsReplaced = false;
					specifier = identifier = null;
				}
				// non-special characters
				else {
					tokenBuffer += current;
				}
			}
			// when not buffering a token
			else if (current === "{") {
				// doubled up {{ is an escape sequence for {
				if (template.charAt(i + 1) === "{") {
					outputBuffer += current;
					i += 1;
				}
				// otherwise start buffering a new token
				else {
					tokenBuffer = "";
					bufferingToken = true;
				}
			}
			// doubled up }} is an escape sequence for }
			// TODO: what should happen when encountering a single "}"?
			else if (current === "}" && template.charAt(i + 1) === "}") {
				outputBuffer += "}";
				i += 1;
			}
			// non-special character
			else {
				outputBuffer += current;
			}
		}

		return outputBuffer;
	};
	
	var formatValue = function (value, specifier) {
		if (value == null) return ""; // can't use !value because NaN would stop here
		if (value.toFormat) return value.toFormat(specifier);
		if (typeof(value) === "number") return numberToFormat(value, specifier);
		return value.toString();
	};
	
	var numberToFormat = function (value, specifier) {
		if (!specifier) {
			return value.toString();
		}
		var formatters = specifier.match(/^([\+\-#0]*)(\d*)(?:\.(\d+))?(.*)$/);
		var flags     = formatters[1],
		    width     = formatters[2],
		    precision = formatters[3],
		    type      = formatters[4];
	
		var repeatCharacter = function (character, times) {
			var result = "";
			while (times--) {
				result += character;
			}
			return result;
		}
	
		var applyPrecision = function (result) {
			// only apply precision to numeric strings
			if (precision && (/^[\d\.]*$/).test(result)) {
				var afterDecimal = result.split(".")[1];
				var extraPrecision = precision - afterDecimal;
				if (isNaN(extraPrecision)) {
					extraPrecision = precision;
				}
				if (extraPrecision > 0) {
					if (result.indexOf(".") === -1) {
						result += ".";
					}
					for (; extraPrecision > 0; extraPrecision--) {
						result += "0";
					}
				}
			}
			return result;
		}
	
		var result = "";
		switch (type) {
			// signed decimal number
			case "d":
				result = Math.round(value - 0.5).toString(10);
				result = applyPrecision(result);
				break;
			// hex
			case "x":
				result = Math.round(value - 0.5).toString(16);
				break;
			case "X":
				result = Math.round(value - 0.5).toString(16).toUpperCase();
				break;
			// binary
			case "b":
				result = Math.round(value - 0.5).toString(2);
				break;
			// octal
			case "o":
				result = Math.round(value - 0.5).toString(8);
				break;
			// scientific notation (exponential)
			case "e":
			case "E":
				// FIXME: not sure if the precision specifier should apply here and how
				// FIXME: not sure how to behave for Infinity and NaN. Leaving it up to toExponential()
				result = value.toExponential().replace("e", " e");
				// must have at least two digits in exponent
				if ((/[+\-]\d$/).test(result)) {
					result = result.slice(0, -1) + "0" + result.slice(-1);
				}
				if (type === "E") {
					result = result.toUpperCase();
				}
				break;
			// normal or exponential notation, whichever is more appropriate for its magnitude
			case "g":
				result = value.toString(10).toLowerCase();
				// not quite clear on whether g/G ignores the precision specifier, but it seems like # should control this?
				if (~flags.indexOf("#")) {
					result = applyPrecision(result);
				}
				break;
			case "G":
				result = value.toString(10).toUpperCase();
				// not quite clear on whether g/G ignores the precision specifier, but it seems like # should control this?
				if (~flags.indexOf("#")) {
					result = applyPrecision(result);
				}
				break;
			// fixed point
			case "f":
			case "F":
				// proposal talks about INF and INFINITY, but not sure when each would be used :\
				// FIXME: not sure how this should behave in the absence of a precision
				result = value.toFixed(precision || 0);
				result = result[type === "f" ? "toLowerCase" : "toUpperCase"]();
				break;
			case "s":
			default:
				result = value.toString();
				result = applyPrecision(result);
		}
	
		if (~flags.indexOf("+")) {
			if (value >= 0) {
				result = "+" + result;
			}
		}
	
		if (width && result.length < width) {
			// "-" flag is right-fill
			if (~flags.indexOf("-")) {
				result += repeatCharacter(" ", width - result.length);
			}
			else {
				var padding = repeatCharacter(~flags.indexOf("0") ? "0" : " ", width - result.length);
				if (~flags.indexOf("0") && (result[0] === "+" || result[0] === "-")) {
					result = result[0] + padding + result.slice(1);
				}
				else {
					result = padding + result;
				}
			}
		}
		// TODO: # flag
		return result;
	};
	
	// exports
	exports.format = format;
	
	// prototype modification
	String.prototype.format = function (data) {
		var args = [this].concat(Array.prototype.slice.call(arguments));
		return format.apply(null, args);
	};
	
	Number.prototype.toFormat = function (specifier) {
		return numberToFormat.call(null, this, specifier);
	};

})(typeof(exports) !== "undefined" ? exports : this);