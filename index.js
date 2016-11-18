var _ = require('underscore');
var openrtb = require('openrtb');
var moment = require('moment');
var uuid = require('uuid');
var sha1 = require('sha1');
var randomip = require('random-ip');
var random_ua = require('random-ua');
var randgen = require('randgen');
var pb = require('protocol-buffers');
var fs = require('fs');
var nbo = require('network-byte-order');
var geoip = require('geoip-lite');

var iab = require(__dirname + "/iab.json");
var schema = pb(fs.readFileSync(__dirname + "/openrtb.proto"));

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
.option("--json_out [json_out]")
.option("--proto_out [proto_out]")
.parse(process.argv);

var json_out = fs.createWriteStream(program.json_out);
var proto_out = fs.createWriteStream(program.proto_out);

var app_id = [];
var app_name = [];
var publisher_id = [];
var indexes = [];
for(var i = 0;i < 5;i++) {
	app_id.push(uuid());
	app_name.push(uuid());
	publisher_id.push(uuid());
	indexes.push(i);
}
function generate_single() {
	var app_index = randgen.rlist(indexes);
	var ip = randomip("0.0.0.0", 0);
	var geo = geoip.lookup(ip);
	if (geo) {
		geo = {
			country : geo.country,
			region : geo.region
		};
		if (geo.ll) {
			geo.lat = geo.ll[0],
			geo.lon = geo.ll[1]
		}
	} else {
		geo = {};
	}
	var bidRequest = bidRequestBuilder
	.timestamp(moment.utc().format())
	.id(uuid())
	.at(randgen.rlist([1,2,3]))
	.imp([{
		"id" : uuid(),
		"banner" : {
			w : 320,
			h : 50
		}
	}])
	.app({
		"id":app_id[app_index],
		"name":app_name[app_index],
		"cat":iab_generate(),
		"storeurl": "http://www.example.com",
		"publisher":{
				"id": publisher_id[app_index]
		}
	})
	.device({
		"dnt":0,
		"ua":random_ua.generate(),
		"ip":ip,
		"connectiontype":2,
		"devicetype":1,
		"didsha1": sha1(uuid()),
		"carrier": "o2",
		"make": "samsung GT-I9300",
		"model": "Android",
		"language": "en",
		"os": "Android",
		"osv": "5.1.1",
		"geo": geo
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
	var json = JSON.stringify(bidRequest);
	json_out.write(json);
	console.log(json);
	debugger;
	var buf = schema.BidRequest.encode(bidRequest);
	var size_buf = new Buffer(4);
	nbo.htonl(size_buf, 0, buf.length);
	proto_out.write(size_buf);
	proto_out.write(buf);
}

var num = 0;
function generate() {
	if (num < program.num) {
		generate_single();
		num += 1;
		setImmediate(generate);
	} else {
		return json_out.end(function() {
			proto_out.end();
		});
	}
}
generate();
