var _ = require('underscore');
var openrtb = require('openrtb');
var moment = require('moment');
var uuid = require('uuid');
var sha1 = require('sha1');
var randomip = require('random-ip');
var random_ua = require('random-ua');
var randgen = require('randgen');

var iab = require(__dirname + "/iab.json");

function iab_generate() {
	var k = randgen.rpoisson(2) + 1;
	var retval = [];
	for(var i = 0;i < k;i++) {
		retval.push(randgen.rlist(Object.keys(iab)));
	}
	return _.uniq(retval);
}

var bidRequestBuilder = openrtb.getBuilder({
	builderType: 'bidRequest'
});

var program = require('commander')
.option("-n, --num [num]", "the size of generated bid requests", parseInt)
.parse(process.argv);

for(var i = 0;i < program.num;i++) {
	var bidRequest = bidRequestBuilder
	.timestamp(moment.utc().format())
	.id('1234')
	.at(2)
	.imp([
		{
			"id":"1",
			"native":{
				"request": {
					"ver": 1,
					"layout": 6,
					"assets": [
						{ "id": 0, "req": 1, "title": { "len": 25 } },
						{ "id": 1, "req": 1, "img": { "type": 3, "wmin": 100, "hmin": 100 } },
						{ "id": 3, "req": 0, "data": { "type": 2, "len": 90 } }
					]
				}
			},
			"tagid": uuid(),
			"bidfloor": 1.3,
			"pmp": {
				"private_auction": 1,
				"deals": [
					{
						"id": 'deal1',
						"bidfloor": 5.5,
						"bidfloorcur": "USD",
						"at": 3,
						"wseat": ["seat1"],
						"wadomain": ["advertiser.com"]
					}
				]
			}
		}
	])
	.app({
		"id":uuid(),
		"name":uuid(),
		"cat":iab_generate(),
		"storeurl": "http://www.example.com",
		"publisher":{
				"id": "6332"
		}
	})
	.device({
		"dnt":0,
		"ua":random_ua.generate(),
		"ip":randomip("0.0.0.0", 0),
		"connectiontype":2,
		"devicetype":1,
		"didsha1": sha1(uuid()),
		"carrier": "o2",
		"make": "samsung GT-I9300",
		"model": "Android",
		"language": "en",
		"os": "Android",
		"osv": "5.1.1",
		"geo": {
				"country": "UK"
		}
	})
	.user({
		"id":uuid(),
		"yob": 1987,
		"gender": "M"
	})
	.bcat(["IAB10"])
	.badv(["xxx.com"])
	.ext({
		'extra': '1234'
	})
	.build();
	console.log(JSON.stringify(bidRequest));
}
