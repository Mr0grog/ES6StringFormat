/**
 * Format string parsing algorithms for ES6 string formatting proposal:
 * http://wiki.ecmascript.org/doku.php?id=strawman:string_format_take_two
 * 
 * These are meant for benchmarking the performance of different methods.
 * 
 * (c) 2012 Rob Brackett (rob@robbrackett.com)
 * This code is free to use under the terms of the accompanying LICENSE.txt file
 */


// utility used by all the algorithms. It could be optimized itself, but we'll keep it constant for the sake of testing the parsing bits
var findByPath = (function () {
	// regex for separating the various parts of an identifier from each other
	var identifierIdentifier = /^(?:\[([^\.\[\]]+)\]|\.?([^\.\[\]]+))(.*)$/
	// convert an identifier into the actual value that will be substituted
	return function findByPath(path, data, top) {
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
})();


var algorithms = {
// regex-based
regexFormat: function (template, data) {
	var args = Array.prototype.slice.call(arguments, 1);
	
	// replace expression matches things inside {thisIsAToken:withSpecifier} brackets and "{{" and "}}"
	return template.replace(/(?:(^|[^{])\{([^{].*?)\}(?!\}))|(\{\{|\}\})/g, function (match, before, token, doubleBrackets) {
		// if we found double brackets, they're just an escape sequence for single brackets
		if (doubleBrackets) {
			return doubleBrackets[0];
		}
		// separate the identifier (index 0) and the format specifier (index 1)
		var parts = token.split(":");
		var value = findByPath(parts[0], args, true);
		var specifier = parts[1];
		// if a specifier is an identifier itself, do the replacement
		if (specifier && specifier[0] === "{" && specifier.slice(-1) === "}") {
			specifier = findByPath(specifier.slice(1, -1), args, true);
		}
	
		// format the value
		var result = "";
		if (value) {
			if (value.toFormat) {
				result = value.toFormat(specifier);
			}
			else if (typeof(value) === "number") {
				result = numberToFormat(value, specifier);
			}
			else {
				result = value.toString();
			}
		}
	
		return before + result;
	});
},


// character buffering
eachCharFormat: function (template, data) {
	var args = Array.prototype.slice.call(arguments, 1);
	
	var buffer = [];
	for (var i = 0, length = template.length; i < length; i++) {
		var current = template[i];
		if (current == "{") {
			if (template[i + 1] == "{") {
				buffer.push(current);
				i += 1;
			}
			else {
				var rest = template.slice(i + 1);
				var tokenIndex = rest.indexOf("}");
				var colonIndex = rest.indexOf(":");
				if (colonIndex != -1 && colonIndex < tokenIndex && rest[colonIndex + 1] == "{") {
					tokenIndex += 1;
				}
				var token = rest.slice(0, tokenIndex > -1 ? tokenIndex : undefined);
				i += token.length + 1;
				
				var parts = token.split(":");
				var foundValue = findByPath(parts[0], args, true);
				var specifier = parts[1];
				// if a specifier is an identifier itself, do the replacement
				if (specifier && specifier[0] === "{" && specifier.slice(-1) === "}") {
					specifier = findByPath(specifier.slice(1, -1), args, true);
				}

				// format the value
				var result = "";
				if (foundValue != undefined) {
					if (foundValue.toFormat) {
						result = foundValue.toFormat(specifier);
					}
					else if (typeof(foundValue) === "number") {
						result = numberToFormat(foundValue, specifier);
					}
					else {
						result = foundValue.toString();
					}
				}
				buffer.push(result);
			}
		}
		else if (current == "}" && template[i + 1] == "}") {
			buffer.push(current);
			i += 1;
		}
		else {
			buffer.push(current);
		}
	}
	
	return buffer.join("");
},




// character buffering
eachCharFormat2: function (template, data) {
	var args = Array.prototype.slice.call(arguments, 1);
	
	var buffer = "";
	for (var i = 0, length = template.length; i < length; i++) {
		var current = template[i];
		if (current == "{") {
			if (template[i + 1] == "{") {
				buffer += current;
				i += 1;
			}
			else {
				var rest = template.slice(i + 1);
				var tokenIndex = rest.indexOf("}");
				var colonIndex = rest.indexOf(":");
				if (colonIndex != -1 && colonIndex < tokenIndex && rest[colonIndex + 1] == "{") {
					tokenIndex += 1;
				}
				var token = rest.slice(0, tokenIndex > -1 ? tokenIndex : undefined);
				i += token.length + 1;
				
				var parts = token.split(":");
				var foundValue = findByPath(parts[0], args, true);
				var specifier = parts[1];
				// if a specifier is an identifier itself, do the replacement
				if (specifier && specifier[0] === "{" && specifier.slice(-1) === "}") {
					specifier = findByPath(specifier.slice(1, -1), args, true);
				}

				// format the value
				var result = "";
				if (foundValue != undefined) {
					if (foundValue.toFormat) {
						result = foundValue.toFormat(specifier);
					}
					else if (typeof(foundValue) === "number") {
						result = numberToFormat(foundValue, specifier);
					}
					else {
						result = foundValue.toString();
					}
				}
				buffer += result;
			}
		}
		else if (current == "}" && template[i + 1] == "}") {
			buffer += current;
			i += 1;
		}
		else {
			buffer += current;
		}
	}
	
	return buffer;
},




// character buffering
eachCharFormat3: function (template, data) {
	var args = Array.prototype.slice.call(arguments, 1);
	
	var buffer = [];
	for (var i = 0, length = template.length; i < length; i++) {
		var current = template.charAt(i);
		if (current == "{") {
			if (template.charAt(i + 1) == "{") {
				buffer.push(current);
				i += 1;
			}
			else {
				var rest = template.slice(i + 1);
				var tokenIndex = rest.indexOf("}");
				var colonIndex = rest.indexOf(":");
				if (colonIndex != -1 && colonIndex < tokenIndex && rest.charAt(colonIndex + 1) == "{") {
					tokenIndex += 1;
				}
				var token = rest.slice(0, tokenIndex > -1 ? tokenIndex : undefined);
				i += token.length + 1;
				
				var parts = token.split(":");
				var foundValue = findByPath(parts[0], args, true);
				var specifier = parts[1];
				// if a specifier is an identifier itself, do the replacement
				if (specifier && specifier[0] === "{" && specifier.slice(-1) === "}") {
					specifier = findByPath(specifier.slice(1, -1), args, true);
				}

				// format the value
				var result = "";
				if (foundValue != undefined) {
					if (foundValue.toFormat) {
						result = foundValue.toFormat(specifier);
					}
					else if (typeof(foundValue) === "number") {
						result = numberToFormat(foundValue, specifier);
					}
					else {
						result = foundValue.toString();
					}
				}
				buffer.push(result);
			}
		}
		else if (current == "}" && template.charAt(i + 1) == "}") {
			buffer.push(current);
			i += 1;
		}
		else {
			buffer.push(current);
		}
	}
	
	return buffer.join("");
},



// character buffering
eachCharFormat4: function (template, data) {
	var args = Array.prototype.slice.call(arguments, 1);
	
	var buffer = "";
	for (var i = 0, length = template.length; i < length; i++) {
		var current = template.charAt(i);
		if (current == "{") {
			if (template.charAt(i + 1) == "{") {
				buffer += current;
				i += 1;
			}
			else {
				var rest = template.slice(i + 1);
				var tokenIndex = rest.indexOf("}");
				var colonIndex = rest.indexOf(":");
				if (colonIndex != -1 && colonIndex < tokenIndex && rest.charAt(colonIndex + 1) == "{") {
					tokenIndex += 1;
				}
				var token = rest.slice(0, tokenIndex > -1 ? tokenIndex : undefined);
				i += token.length + 1;
				
				var parts = token.split(":");
				var foundValue = findByPath(parts[0], args, true);
				var specifier = parts[1];
				// if a specifier is an identifier itself, do the replacement
				if (specifier && specifier[0] === "{" && specifier.slice(-1) === "}") {
					specifier = findByPath(specifier.slice(1, -1), args, true);
				}

				// format the value
				var result = "";
				if (foundValue != undefined) {
					if (foundValue.toFormat) {
						result = foundValue.toFormat(specifier);
					}
					else if (typeof(foundValue) === "number") {
						result = numberToFormat(foundValue, specifier);
					}
					else {
						result = foundValue.toString();
					}
				}
				buffer += result;
			}
		}
		else if (current == "}" && template.charAt(i + 1) == "}") {
			buffer += current;
			i += 1;
		}
		else {
			buffer += current;
		}
	}
	
	return buffer;
},



eachCharFormat5: function (template, data) {
	var args = Array.prototype.slice.call(arguments, 1);
	
	var output = "";
	var buffer = "";
	var token, specifier;
	var bufferingToken = false;
	var depth = 0;
	var hit = true;
	for (var i = 0, length = template.length; i < length; i++) {
		var current = template.charAt(i);
		if (current == "{") {
			if (bufferingToken) {
				depth += 1;
				buffer += current;
			}
			else if (template.charAt(i + 1) == "{") {
				buffer += current;
				i += 1;
			}
			else {
				output += buffer;
				buffer = "";
				bufferingToken = true;
				depth += 1;
			}
		}
		else if (current == "}") {
			if (bufferingToken) {
				depth -= 1;
				if (depth > 0) {
					buffer += current;
					continue;
				}
				
				var token = buffer;
				buffer = "";
				bufferingToken = false;
				
				var parts = token.split(":");
				var foundValue = findByPath(parts[0], args, true);
				var specifier = parts[1];
				// if a specifier is an identifier itself, do the replacement
				if (specifier && specifier[0] === "{" && specifier.slice(-1) === "}") {
					specifier = findByPath(specifier.slice(1, -1), args, true);
				}

				// format the value
				var result = "";
				if (foundValue != undefined) {
					if (foundValue.toFormat) {
						result = foundValue.toFormat(specifier);
					}
					else if (typeof(foundValue) === "number") {
						result = numberToFormat(foundValue, specifier);
					}
					else {
						result = foundValue.toString();
					}
				}
				buffer += result;
			}
			else if (template.charAt(i + 1) == "}") {
				buffer += current;
				i += 1;
			}
		}
		else {
			buffer += current;
		}
	}
	
	return output + buffer;
},


eachCharFormat6: function (template, data) {
	var args = Array.prototype.slice.call(arguments, 1);
	
	var output = "";
	var buffer = "";
	var token, specifier;
	var bufferingToken = false;
	var depth = 0;
	for (var i = 0, length = template.length; i < length; i++) {
		var current = template.charAt(i);
		if (current == "{") {
			if (bufferingToken) {
				depth += 1;
				buffer += current;
			}
			else if (template.charAt(i + 1) == "{") {
				buffer += current;
				i += 1;
			}
			else {
				output += buffer;
				buffer = "";
				bufferingToken = true;
				depth += 1;
			}
		}
		else if (current == "}") {
			if (bufferingToken) {
				depth -= 1;
				if (depth > 0) {
					buffer += current;
					continue;
				}
				
				if (token) {
					specifier = buffer;
				}
				else {
					token = buffer;
				}
				
				buffer = "";
				bufferingToken = false;
				
				var foundValue = findByPath(token, args, true);
				// if a specifier is an identifier itself, do the replacement
				if (specifier && specifier.charAt(0) === "{" && specifier.slice(-1) === "}") {
					specifier = findByPath(specifier.slice(1, -1), args, true);
				}

				// format the value
				var result = "";
				if (foundValue != undefined) {
					if (foundValue.toFormat) {
						result = foundValue.toFormat(specifier);
					}
					else if (typeof(foundValue) === "number") {
						result = numberToFormat(foundValue, specifier);
					}
					else {
						result = foundValue.toString();
					}
				}
				buffer += result;
				token = null;
				specifier = null;
			}
			else if (template.charAt(i + 1) == "}") {
				buffer += current;
				i += 1;
			}
		}
		else if (bufferingToken && current == ":") {
			token = buffer;
			buffer = "";
		}
		else {
			buffer += current;
		}
	}
	
	return output + buffer;
},


eachCharFormat7: function (template, data) {
	var args = Array.prototype.slice.call(arguments, 1);
	
	var output = "";
	var buffer = "";
	var token, specifier;
	var bufferingToken = false;
	var specifierIsReference = false;
	for (var i = 0, length = template.length; i < length; i++) {
		var current = template.charAt(i);
		if (bufferingToken) {
			if (current === ":") {
				token = buffer;
				buffer = "";
				if (template.charAt(i + 1) === "{") {
					specifierIsReference = true;
				}
			}
			else if (current === "}") {
				if (specifierIsReference) {
					buffer += current;
					i += 1;
					specifierIsReference = false;
				}
				
				if (token) {
					specifier = buffer;
				}
				else {
					token = buffer;
				}
				buffer = "";
				
				var foundValue = findByPath(token, args, true);
				// if a specifier is an identifier itself, do the replacement
				if (specifier && specifier.charAt(0) === "{" && specifier.slice(-1) === "}") {
					specifier = findByPath(specifier.slice(1, -1), args, true);
				}

				// format the value
				var formattedValue = "";
				if (foundValue != undefined) {
					if (foundValue.toFormat) {
						formattedValue = foundValue.toFormat(specifier);
					}
					else if (typeof(foundValue) === "number") {
						formattedValue = numberToFormat(foundValue, specifier);
					}
					else {
						formattedValue = foundValue.toString();
					}
				}
				buffer += formattedValue;
				
				// cleanup
				bufferingToken = false;
				specifier = token = null;
			}
			else {
				buffer += current;
			}
		}
		else if (current === "{") {
			// doubled up {{ is an escape sequence for {
			if (template.charAt(i + 1) === "{") {
				buffer += current;
				i += 1;
			}
			// otherwise start buffering a new token
			else {
				output += buffer;
				buffer = "";
				bufferingToken = true;
			}
		}
		else if (current === "}" && template.charAt(i + 1) === "}") {
			buffer += "}";
			i += 1;
		}
		else {
			buffer += current;
		}
	}
	
	return output + buffer;
},


eachCharFormat8: function (template, data) {
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
				var formattedValue = "";
				if (foundValue != undefined) {
					if (foundValue.toFormat) {
						formattedValue = foundValue.toFormat(specifier);
					}
					else if (typeof(foundValue) === "number") {
						formattedValue = numberToFormat(foundValue, specifier);
					}
					else {
						formattedValue = foundValue.toString();
					}
				}
				outputBuffer += formattedValue;
				
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
},


indexing: function (template, data) {
	var args = Array.prototype.slice.call(arguments, 1);
	
	var output = "";
	var buffer;
	var templateSection = template;
	var isToken = false;
	var identifier, specifier;
	
	while (templateSection) {
		var bracketIndex = templateSection.indexOf("{");
		if (bracketIndex > -1) {
			buffer = templateSection.slice(0, bracketIndex);
			buffer.split("}}").join("}");
			output += buffer;
			
			// output += templateSection.slice(0, bracketIndex);
			isToken = templateSection.charAt(bracketIndex + 1) !== "{";
			templateSection = templateSection.slice(bracketIndex + (isToken ? 1 : 2));
		
			if (isToken) {
				var colonIndex = templateSection.indexOf(":");
				var closeBracketIndex = templateSection.indexOf("}")
				// TODO: sanity check that closeBracketIndex is > -1
				if (colonIndex > -1 && colonIndex < closeBracketIndex) {
					identifier = templateSection.slice(0, colonIndex);
					specifier = templateSection.slice(colonIndex + 1, closeBracketIndex);
					if (specifier.charAt(0) === "{") {
						specifier += "}";
						closeBracketIndex += 1;
					}
				}
				else {
					identifier = templateSection.slice(0, closeBracketIndex);
					specifier = null;
				}
				templateSection = templateSection.slice(closeBracketIndex + 1);
				
				var foundValue = findByPath(identifier, args, true);
				// if a specifier is an identifier itself, do the replacement
				if (specifier && specifier.charAt(0) === "{" && specifier.slice(-1) === "}") {
					specifier = findByPath(specifier.slice(1, -1), args, true);
				}

				// format the value
				var formattedValue = "";
				if (foundValue != undefined) {
					if (foundValue.toFormat) {
						formattedValue = foundValue.toFormat(specifier);
					}
					else if (typeof(foundValue) === "number") {
						formattedValue = numberToFormat(foundValue, specifier);
					}
					else {
						formattedValue = foundValue.toString();
					}
				}
				output += formattedValue;
				
				identifier = specifier = null;
			}
			else {
				output += "{";
			}
		}
		else {
			output += templateSection.split("}}").join("}");
			break;
		}
	}
	
	return output;
}
};







// formatting for numbers
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
		if (precision) {
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
		case "d":
			result = Math.round(value - 0.5).toString(10);
			result = applyPrecision(result);
			break;
		case "x":
			result = Math.round(value - 0.5).toString(16);
			break;
		case "X":
			result = Math.round(value - 0.5).toString(16).toUpperCase();
			break;
		case "b":
			result = Math.round(value - 0.5).toString(2);
			break;
		case "o":
			result = Math.round(value - 0.5).toString(8);
			break;
		// TODO: e,E,g,G types
		// not quite clear on whether g/G ignores the precision specifier
		case "f":
		case "F":
			// TODO: proper case for NaN, Infinity
			// proposal talks about INF and INFINITY, but not sure when each would be used :\
		default:
			result = value.toString(10);
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