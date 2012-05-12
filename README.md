ECMAScript 6 String.format()
============================

This is an ECMAScript 4 based implementation of the current proposal for `String.format()` in ECMAScript 6. You can see the proposal at: [http://wiki.ecmascript.org/doku.php?id=strawman:string_format_take_two](http://wiki.ecmascript.org/doku.php?id=strawman:string_format_take_two)

It is compatible with both broser and Node.js environments.

## Use

The basic concept is that you can include identifiers inside curly brackets that will be replaced by additional data that you pass in. The identifiers can be numbers (indicating which argument to replace with) or string identifiers (indicating which property of an object to replace with). Here's an example:


	"The car is made by {0} in {1}.".format("Nissan", 2009);
	// returns "Tom's father has two sons, Tom and Jerry."
	
	"The car is made by {brand} in {year}.".format({brand: "Nissan", year: 2009});
	// returns "The car is made by Nissan in 2009."

Identifiers can also use dot or square bracket notation to dig deeper:

	"The car is made by {car.brand} in {car[year]}.".format({car: {brand: "Nissan", year: 2009});
	// returns "The car is made by Nissan in 2009."

You can also specify formatting. "Format specifiers" denote how a value should be formatted and are included after a colon inside the curly brackets:

	"This number has at at least 4 digits after the decimal point: {0:.4}".format(5);
	// "This number has at at least 4 digits after the decimal point: 5.0000"

You can also use a value as a format specifier:

	"This number has at at least 4 digits after the decimal point: {value:{format}".format({value; 5, format: ".4"});
	// "This number has at at least 4 digits after the decimal point: 5.0000"

Many format specifiers are available. See the proposal for a full list. _(Note: not all are implemented yet)_

Finally, you can provide custom formatting for you own objects by implementing a `toFormat(specifier)` method on them:

	var myObject = {
	  password: "nyah-nyah!",
	  toFormat: function (specifier) {
	    return (specifier === "secret") ? "***" : this.data;
	  }
	};
	
	"The password is: {password:secret}".format(myObject);

There are more nitty gritty details; check the proposal or the tests to see them all.


## Goals

This code was really just written on a lark on day, but please feel free to use and suggest changes. Using the proposed feature in real-world situations is the best way to determine whether it effectively serves developers' needs.


## License

This code was written by Rob Brackett in 2012 and is licensed under an MIT-style license. See the full text in `LICENSE.txt`. 

Please share and use! This library's best value is as feedback to the TC39 committee on how well the `String.format()` proposal fits your needs.