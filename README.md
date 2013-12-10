loljs
=====

A library for fetching League of Legends data from the Riot API in node.js

**Featured Functions**
* getRunes (Returns all of a summoner's rune pages)
* getMasteries (Returns all of a summoner's masteries)
* getTeams (Returns all of a summoner's teams and stats)
* getLeagues (Returns all of a summoner's leagues and stats)
* getRankedStats (Returns all of a summoner's ranked stats for the current season)
* getStatsSummary (Returns a summary of a summoner's game stats for the current season)

**Usage Example**
```javascript
// Require our library
var lol = require('loljs');

var KEY = 'YOUR API KEY HERE';

// Grab a listing of all the champions
lol.getChampions(KEY, 'na', function(err, champions) {
	// Loop through each champion
	champions.forEach(function(champ) {
		// Print out their ID and name
		console.log("Champion #" + champ.id + " is " + champ.name);
		return;
	});
	return;
});

// Get the summoner 'Codemaster'
lol.getSummonerByName(KEY, 'na', 'Codemaster', function(err, summoner) {
	console.log(summoner.name + "'s mastery pages are...");
	// Obtain their mastery pages
	lol.getMasteries(KEY, 'na', summoner, function(err, mastery_pages) {
		// Loop through each of them
		mastery_pages.forEach(function(mastery_page) {
			// Print out each page
			console.log('- ' + mastery_page.name);
		});
		return;
	});
	return;
});

// Grab a summoner by their ID; in this case, #20769365 which is 'HatPerson'
lol.getSummonerById(KEY, 'na', 20769365, function(err, summoner) {
	console.log(summoner.name + "'s rune pages are...");
	// Grab all of the rune pages
	lol.getRunes(KEY, 'na', summoner, function(err, rune_pages) {
		// Loop through each rune page
		rune_pages.forEach(function(rune_page) {
			// Print out the name
			console.log('- ' + rune_page.name);
			return;
		});
		return;
	});
	return;
});

// Grab the summoner 'Dyrus'
lol.getSummoner(KEY, 'na', { name : 'Dyrus' }, function(err, summoner) {
	console.log(summoner.name + " is a part of the following teams:");
	// Find all of the teams that the summoner belongs to
	lol.getTeams(KEY, 'na', summoner, function(err, teams) {
		// Loop through each of them
		teams.forEach(function(team) {
			// Print out their name
			console.log('- ' + team.name);
			return;
		});
		return;
	});
	return;
});
```

Please feel free to [contact](mailto:andrew at andrewmkane dot com) [me](http://andrewmkane.com) if you have any issues.
