var request = require('request');

var ENDPOINT = 'http://prod.api.pvp.net';

var ERRORS = {
	'NO_KEY' : 'A valid API key must be provided to work with this API. Please see https://developer.riotgames.com',
	'SERVER_ERROR' : 'There was a server error, please try again or inspect your data for issues.',
	'BAD_REQUEST' : 'Your request was invalid. Please check your data for issues.',
	'NOT_FOUND' : 'The summoner requested was not found'
}


regions = {
	'na' : 'North America',
	'euw' : 'Europe West',
	'eune' : 'Europe Nordic/East',
	'br' : 'Brazil',
	'tr' : 'Turkey'
}

function getRegions(cb) {
	if(cb) cb(null, regions);
	return regions;
}

function apiUrl(uri, key) {
	return ENDPOINT + uri + '?api_key=' + key;
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
	if(response.statusCode == 500) {
		cb(ERRORS['SERVER_ERROR'], data);
		return false;
	} else if(response.statusCode == 400) {
		cb(ERRORS['BAD_REQUEST'], data);
		return false;
	} else if(response.statusCode == 404) {
		cb(ERRORS['NOT_FOUND'], data);
		return false;
	}
	return true;
}

function getChampions(key, region, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	request(apiUrl('/api/lol/' + region + '/v1.1/champion', key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var champions = JSON.parse(data)['champions'];
			if(cb) cb(null, champions);
			return champions;
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
	request(apiUrl('/api/lol/' + region + '/v1.1/summoner/by-name/' + name, key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var summoner = JSON.parse(data);
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
	request(apiUrl('/api/lol/' + region + '/v1.1/summoner/' + id, key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var summoner = JSON.parse(data);
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
	request(apiUrl('/api/lol/' + region + '/v1.1/summoner/' + ids + '/name', key), function(err, response, data) {
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
	id = (summoner instanceof Object) ? summoner['id'] : summoner;
	request(apiUrl('/api/lol/' + region + '/v1.1/summoner/' + id + '/runes', key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var runes = JSON.parse(data)['pages'];
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
	id = (summoner instanceof Object) ? summoner['id'] : summoner;
	request(apiUrl('/api/lol/' + region + '/v1.1/summoner/' + id + '/masteries', key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var runes = JSON.parse(data)['pages'];
			if(cb) cb(null, runes);
			return runes;
		}
		return;
	});
	return;
}

function getTeams(key, region, summoner, cb) {
	if(!region) region = 'na';
	if(!checkKey(key, cb)) return;
	id = (summoner instanceof Object) ? summoner['id'] : summoner;
	request(apiUrl('/api/' + region + '/v2.1/team/by-summoner/' + id, key), function(err, response, data) {
		if(checkError(err, data, cb) && checkResponseStatus(response, data, cb)) {
			var teams = JSON.parse(data);
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
	id = (summoner instanceof Object) ? summoner['id'] : summoner;
	request(apiUrl('/api/' + region + '/v2.1/league/by-summoner/' + id, key), function(err, response, data) {
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
