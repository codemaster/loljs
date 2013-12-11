var request = require('request');
var merge = require('merge');
var util = require('util');

var ENDPOINT = process.env.ENDPOINT || 'https://%s.api.pvp.net';
var API_VERSIONS = {
	'CHAMPIONS' : 'v1.2',
	'SUMMONER' : 'v1.4',
	'GAME' : 'v1.3',
	'STATS' : 'v1.3',
	'TEAM' : 'v2.4',
	'LEAGUE' : 'v2.5',
	'STATIC' : 'v1.2'
};

var ERRORS = {
	'NO_KEY' : 'A valid API key must be provided to work with this API. Please see https://developer.riotgames.com',
	'UNAUTHORIZED' : 'Your API key is either invalid or unsupported.',
	'SERVER_ERROR' : 'There was a server error, please try again or inspect your data for issues.',
	'UNAVAILABLE' : 'The API is currently unavailable. Please try again later.',
	'BAD_REQUEST' : 'Your request was invalid. Please check your data for issues.',
	'RATE_LIMIT' : 'You have hit the rate limit with the provided API Key.',
	'NOT_FOUND' : 'The summoner requested was not found'
}


var regions = {
	'na' : 'North America',
	'euw' : 'Europe West',
	'eune' : 'Europe Nordic/East',
	'lan' : 'Latin America North',
	'las' : 'Latin America South',
	'oce' : 'Oceania',
	'kr' : 'Korea',
	'br' : 'Brazil',
	'tr' : 'Turkey',
	'ru' : 'Russia'
}

var static_cache = {}

function isObject(obj) {
  return toString.call(obj) === "[object Object]";
}

function getRegions(cb) {
	if(cb) cb(null, regions);
	return regions;
}

function apiUrl(region, uri, key) {
	return util.format(ENDPOINT, region) + '/api/lol/' + region + '/' + uri + '?api_key=' + key;
}

function apiStaticUrl(region, uri, key) {
	return util.format(ENDPOINT, region) + '/api/lol/static-data/' + region + '/' + uri + '?api_key=' + key;
}

function checkKey(key, cb) {
	if(!key) {
		if(cb) {
			cb(ERRORS['NO_KEY'], {});
		} else {
			console.error(ERRORS['NO_KEY']);
		}
	}
	return true;
}

function checkError(err, data, cb) {
	if(!err) return true;
	if(cb) {
		cb(err, data ? data : {});
		return false;
	} else {
		console.error(err);
		return false;
	}
	return true;
}

function checkResponseStatus(response, data, cb) {
	if(response.statusCode == 200) {
		return true;
	} else if(response.statusCode == 500) {
		cb(ERRORS['SERVER_ERROR'], data);
	} else if(response.statusCode == 400) {
		cb(ERRORS['BAD_REQUEST'], data);
	} else if(response.statusCode == 404) {
		cb(ERRORS['NOT_FOUND'], data);
	} else if(response.statusCode == 401) {
		cb(ERRORS['UNAUTHORIZED'], data);
	} else if(response.statusCode == 429) {
		cb(ERRORS['RATE_LIMIT'], data);
	} else if(response.statusCode == 503) {
		cb(ERRORS['UNAVAILABLE'], data);
	}
	return false;
}

function getChampions(key, region, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	request(apiUrl(region, API_VERSIONS['CHAMPIONS'] + '/champion', key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var champs = JSON.parse(data)['champions'];
			var champions = {};
			Object.keys(champs).forEach(function(item, key, _array) {
				var champ_id = parseInt(champs[item]['id']);
				champions[champ_id] = champs[item];
			});
			var match_champ_data = function(champ_data, champions) {
				Object.keys(champ_data).forEach(function(item) {
					var champ_id = parseInt(champ_data[item]['id']);
					champions[champ_id] = merge(champions[champ_id], champ_data[item]);
				});
				var champ_array = [];
				Object.keys(champions).forEach(function(key) {
					champ_array[key] = champions[key];
				});
				return champ_array;
			};
			var champ_static_url = apiStaticUrl(region, API_VERSIONS['STATIC'] + '/champion', key);
			if(champ_static_url in static_cache) {
				champions = match_champ_data(static_cache[champ_static_url], champions);
				if(cb) cb(null, champions);
				return champions;
			} else {
				request(champ_static_url, function(err, response, data) {
					var champ_data = JSON.parse(data)['data'];
					static_cache[champ_static_url] = champ_data;
					champions = match_champ_data(champ_data, champions);
					if(cb) cb(null, champions);
					return champions;
				});
			}
		}
		return;
	});
	return;
}

function getSummoner(key, region, data, cb) {
	if('id' in data) {
		return getSummonerById(key, region, data['id'], cb);
	} else if('name' in data) {
		return getSummonerByName(key, region, data['name'], cb);
	}
	return false;
}

function getSummonerByName(key, region, name, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	request(apiUrl(region, API_VERSIONS['SUMMONER'] + '/summoner/by-name/' + name, key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var summoner = JSON.parse(data)[name.toLowerCase()];
			if(cb) cb(null, summoner);
			return summoner;
		}
		return;
	});
	return;
}

function getSummonerById(key, region, id, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	request(apiUrl(region, API_VERSIONS['SUMMONER'] + '/summoner/' + id, key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var summoner = JSON.parse(data)[id.toString()];
			if(cb) cb(null, summoner);
			return summoner;
		}
		return;
	});
	return;
}

function getSummonerNamesFromIds(key, region, ids, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	if(Array.isArray(ids)) {
		ids = ids.toString()
	}
	request(apiUrl(region, API_VERSIONS['SUMMONER'] + '/summoner/' + ids + '/name', key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var summoners = JSON.parse(data)['summoners'];
			if(cb) cb(null, summoners);
			return summoners;
		}
		return;
	});
	return;
}

function getRunes(key, region, summoner, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	if(!summoner) return;
	id = isObject(summoner) ? summoner['id'] : summoner;
	request(apiUrl(region, API_VERSIONS['SUMMONER'] + '/summoner/' + id + '/runes', key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var runes = JSON.parse(data)[id.toString()]['pages'];
			if(cb) cb(null, runes);
			return runes;
		}
		return;
	});
	return;
}

function getMasteries(key, region, summoner, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	if(!summoner) return;
	id = isObject(summoner) ? summoner['id'] : summoner;
	request(apiUrl(region, API_VERSIONS['SUMMONER'] + '/summoner/' + id + '/masteries', key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var masteries = JSON.parse(data)[id.toString()]['pages'];
			var masteries_static_url = apiStaticUrl(region, API_VERSIONS['STATIC'] + '/mastery', key);
			var mastery_merge = function(masteries, mastery_data) {
				for(var m = 0; m < masteries.length; ++m) {
					if(masteries[m].masteries) {
						for(var i = 0; i < masteries[m].masteries.length; ++i) {
							masteries[m].masteries[i].name = mastery_data[masteries[m].masteries[i].id].name;
							masteries[m].masteries[i].description = mastery_data[masteries[m].masteries[i].id].description[masteries[m].masteries[i].rank];
						}
					}
				}
			};
			if(masteries_static_url in static_cache) {
				var masteries_data = static_cache[masteries_static_url];
				mastery_merge(masteries, masteries_data);
				if(cb) cb(null, masteries);
				return masteries;
			} else {
				request(masteries_static_url, function(err, response, data) {
					var masteries_data = JSON.parse(data)['data'];
					static_cache[masteries_static_url] = masteries_data;
					mastery_merge(masteries, masteries_data);
					if(cb) cb(null, masteries);
					return masteries;
				});
			}
		}
		return;
	});
	return;
}

function getTeams(key, region, summoner, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	if(!summoner) return;
	id = isObject(summoner) ? summoner['id'] : summoner;
	request(apiUrl(region, API_VERSIONS['TEAM'] + '/team/by-summoner/' + id, key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var teams = JSON.parse(data)[id.toString()];
			if(cb) cb(null, teams);
			return teams;
		}
		return;
	});
	return;
}

function getLeagues(key, region, summoner, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	if(!summoner) return;
	id = isObject(summoner) ? summoner['id'] : summoner;
	request(apiUrl(region, API_VERSIONS['LEAGUE'] + '/league/by-summoner/' + id, key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var leagues = []
			var league_data = JSON.parse(data);
			Object.keys(league_data).forEach(function(key, i) {
				leagues.push(league_data[key]);
			});
			if(cb) cb(null, leagues);
			return leagues;
		}
		return;
	});
	return;
}

function getRecentGames(key, region, summoner, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	if(!summoner) return;
	id = isObject(summoner) ? summoner['id'] : summoner;
	request(apiUrl(region, API_VERSIONS['GAME'] + '/game/by-summoner/' + id + '/recent', key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var games = JSON.parse(data)['games'];
			if(cb) cb(null, games);
			return games;
		}
		return;
	});
	return;
}

function getRankedStatsForSeason(key, region, season, summoner, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	if(!summoner) return;
	id = isObject(summoner) ? summoner['id'] : summoner;
	var url = apiUrl(region, API_VERSIONS['STATS'] + '/stats/by-summoner/' + id + '/ranked', key);
	if(season != undefined) {
		url = apiUrl(region, API_VERSIONS['STATS'] + '/stats/by-summoner/' + id + '/ranked', key) + '&season=SEASON' + season;
	}
	request(url, function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var champ_stats = JSON.parse(data)['champions'];
			if(cb) cb(null, champ_stats);
			return champ_stats;
		}
		return;
	});
	return;
}

function getRankedStats(key, region, summoner, cb) {
	return getRankedStatsForSeason(key, region, undefined, summoner, cb);
}

function getStatsSummaryForSeason(key, region, season, summoner, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	if(!summoner) return;
	id = isObject(summoner) ? summoner['id'] : summoner;
	var url = apiUrl(region, LEAGUE_API_VERSION + '/stats/by-summoner/' + id + '/summary', key);
	if(season != undefined) {
		url = apiUrl(region, LEAGUE_API_VERSION + '/stats/by-summoner/' + id + '/summary', key) + '&season=SEASON' + season;
	}
	request(url, function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var champ_stats = JSON.parse(data)['playerStatSummaries'];
			if(cb) cb(null, champ_stats);
			return champ_stats;
		}
		return;
	});
	return;
}

function getStatsSummary(key, region, summoner, cb) {
	return getStatsSummaryForSeason(key, region, undefined, summoner, cb);
}

exports.getRegions = getRegions;
exports.getChampions = getChampions;
exports.getSummoner = getSummoner;
exports.getSummonerByName = getSummonerByName;
exports.getSummonerById = getSummonerById;
exports.getSummonerNamesFromIds = getSummonerNamesFromIds;
exports.getRunes = getRunes;
exports.getMasteries = getMasteries;
exports.getTeams = getTeams;
exports.getLeagues = getLeagues;
exports.getRecentGames = getRecentGames;
exports.getRankedStats = getRankedStats;
exports.getRankedStatsForSeason = getRankedStatsForSeason;
exports.getStatsSummary = getStatsSummary;
exports.getStatsSummaryForSeason = getStatsSummaryForSeason;
