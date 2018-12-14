var mysql = require("mysql");
var inquirer = require("inquirer");

var connection = mysql.createConnection({
	host: "localhost",
	port: 3306,
	user: "root",
	password: "root",
	database: "greatBay_DB"
});

connection.connect(function(err) {
	if (err) throw err;{console.error("error connecting: " + err.stack);}
	loadProducts();
});

// Function to load the products table from the database and print results to the console
function loadProducts() {
	// Selects all of the data from the MySQL products table
	connection.query("SELECT * FROM products", function(err, res) {
		if (err) throw err;
		// Draw the table in the terminal using the response
		console.table(res);
		start();
	});
 }

function start() {//start asking what to do
	inquirer.prompt({
		name: "postOrBid",
		type: "rawlist",
		message: "Would you like to [POST] an auction or [BID] on an auction?",
		choices: ["POST", "BID"]//one or two
	}).then(function(answer) {//waiting for response. Then branch.
		if (answer.postOrBid.toUpperCase() === "POST") {postAuction();}
		else {bidAuction();}
	});
}

function postAuction() {
	inquirer.prompt([
		{
			name: "item",
			type: "input",
			message: "What is the item you would like to submit?"
		},
		{
			name: "category",
			type: "input",
			message: "What category would you like to place your auction in?"
		},
		{
			name: "startingBid",
			type: "input",
			message: "What would you like your starting bid to be?",
			validate: function(value) {
				if (isNaN(value) === false) {return true;}
				return false;
			}
		}
	]).then(function(answer) {
		connection.query(
			"INSERT INTO auctions SET ?",
			{
				item_name: answer.item,
				category: answer.category,
				starting_bid: answer.startingBid,
				highest_bid: answer.startingBid
			},
			function(err) {
				if (err) throw err;
				console.log("Your auction was created successfully!");
				start();//back to start
			}
		);
	});
}

function bidAuction() {
	// query the database for all items being auctioned
	connection.query("SELECT * FROM auctions", function(err, results) {
		if (err) throw err;
		// once you have the items, prompt the user for which they'd like to bid on
		inquirer
			.prompt([
				{
					name: "choice",
					type: "rawlist",
					choices: function() {
						var choiceArray = [];
						for (var i = 0; i < results.length; i++) {
							choiceArray.push(results[i].item_name);
						}
						return choiceArray;
					},
					message: "What auction would you like to place a bid in?"
				},
				{
					name: "bid",
					type: "input",
					message: "How much would you like to bid?"
				}
			])
			.then(function(answer) {
				// get the information of the chosen item
				var chosenItem;
				for (var i = 0; i < results.length; i++) {
					if (results[i].item_name === answer.choice) {
						chosenItem = results[i];
					}
				}

				// determine if bid was high enough
				if (chosenItem.highest_bid < parseInt(answer.bid)) {
					// bid was high enough, so update db, let the user know, and start over
					connection.query(
						"UPDATE auctions SET ? WHERE ?",
						[
							{
								highest_bid: answer.bid
							},
							{
								id: chosenItem.id
							}
						],
						function(error) {
							if (error) throw err;
							console.log("Bid placed successfully!");
							start();
						}
					);
				}
				else {//to low
					console.log("Your bid was too low. Try again...");
					start();
				}
			});
	});
}
