/**
 * Tests for ES6 string formatting proposal:
 * http://wiki.ecmascript.org/doku.php?id=strawman:string_format_take_two
 * 
 * (c) 2012 Rob Brackett (rob@robbrackett.com)
 * This code is free to use under the terms of the accompanying LICENSE.txt file
 */

// Util
this.assertLogger = this.assertLogger || function (pass, message) {
	console[pass ? "log" : "error"](message);
};

var assertEquals = function (value, expected, message) {
	if (expected === value) {
		assertLogger(true, "PASS: " + (message || expected));
	}
	else {
		assertLogger(false, "FAIL: " + (message || "") + 
		             "\nExpected: " + expected + 
		             "\nResult:   " + value);
	}
};


// The tests
assertEquals("{0}'s father has two sons, {0} and {1}.".format("tom", "jerry"),
             "tom's father has two sons, tom and jerry.",
             "Formatting with indices substitues the argument of the given index.");

assertEquals("The car is made by {brand} in year {make}.".format({brand: "Nissan", make: 2009}),
             "The car is made by Nissan in year 2009.",
             "Formatting with names substitutes the value of the given key from the first argument.");

var car = {brand: "Nissan", make: 2009};
assertEquals("The car is made by {0.brand} in year {0.make}.".format(car),
             "The car is made by Nissan in year 2009.",
             "Deep substitutions work with dot-delimited identifiers.");

assertEquals("The car is made by {0[brand]} in year {0[make]}.".format(car),
             "The car is made by Nissan in year 2009.",
             "Deep substitutions work with square-bracket-delimited identifiers that are names.");

assertEquals("This year’s top two Japanese brands are {0[0]} and {0[1]}.".format(["Honda", "Toyota"]),
             "This year’s top two Japanese brands are Honda and Toyota.",
             "Deep substitutions work with square-bracket-delimited identifiers that are numbers.");

assertEquals("This is a {very.very.deep} substitution.".format({very: {very: {deep: "very deep"}}}),
             "This is a very deep substitution.",
             "Substitutions work with a long series of dot-delimited identifiers.");

assertEquals("This is a {very[very][deep]} substitution.".format({very: {very: {deep: "very deep"}}}),
             "This is a very deep substitution.",
             "Substitutions work with long series of square-bracket-delimited identifiers.");

assertEquals("This is a {very.very[very]} {very[very].deep} substitution.".format({very: {very: {very: "very", deep: "deep"}}}),
             "This is a very deep substitution.",
             "Substitutions work with long series of mixed dot- and square-bracket-delimited identifiers.");

assertEquals("{0}".format(5), "5", "Positive numbers are replaced without a sign.");
assertEquals("{0}".format(-5), "-5", "Negative numbers are replaced with a sign.");
assertEquals("{0:+}".format(5), "+5", "The '+' specifier causes positive numbers to be replaced with a sign.");
assertEquals("{0:4}".format(5), "   5", "A width format specifier right-aligns the number.");
assertEquals("{0:04}".format(5), "0005", "A '0' flag and width format specifier pads with 0s instead of spaces.");
assertEquals("{0:-4}".format(5), "5   ", "A negative width format specifier left-aligns the number.");
assertEquals("{0:-04}".format(5), "5   ", "A negative width format specifier with a '0' flag still pads with spaces.");
assertEquals("{0:+4}".format(5), "  +5", "A plus and width format specifier right-aligns the number with a plus sign.");
assertEquals("{0:+04}".format(5), "+005", "A plus with the '0' flag puts padding after the plus sign.");
assertEquals("{0:.4}".format(5), "5.0000", "A precision specifier results in at least that number of digits after the decimal.");
assertEquals("{0:.4}".format(5.14326), "5.14326", "A precision specifier does not truncate a number that is more precise.");
assertEquals("{0:b}".format(10), "1010", "The 'b' type converts a number to binary.")
assertEquals("{0:o}".format(10), "12", "The 'o' type converts a number to octal.")
assertEquals("{0:x}".format(10), "a", "The 'x' type converts a number to lower-case hexadecimal.")
assertEquals("{0:X}".format(10), "A", "The 'X' type converts a number to upper-case hexadecimal.")

assertEquals("Number {0} can be presented as decimal {0:d}, octex {0:o}, hex {0:x}".format(56),
             "Number 56 can be presented as decimal 56, octex 70, hex 38",
             "Basic format specifiers for numbers work.");

assertEquals("Number formatter: {0} formatted string: {1:{0}}".format("03d", 56),
             "Number formatter: 03d formatted string: 056",
             "Format specifiers can be identifiers themselves.");

assertEquals("Curly {0} can be {{ escaped }} by doubling }}".format("brackets"),
             "Curly brackets can be { escaped } by doubling }",
             "Curly brackets can be escaped by doubling them up.");

