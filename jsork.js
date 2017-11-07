//     jsork.js 0.1
//     https://github.com/kenwalker/jsork
//     (c) 2017 Ken Walker
//     jsork may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` (`self`) in the browser, `global`
  // on the server, or `this` in some virtual machines. We use `self`
  // instead of `window` for `WebWorker` support.
  var root = typeof self == 'object' && self.self === self && self ||
            typeof global == 'object' && global.global === global && global ||
            this ||
            {};

  // Create a safe reference to the jsork object for use below.
  var jsork = function(obj) {
    if (obj instanceof jsork) return obj;
    if (!(this instanceof jsork)) return new jsork(obj);
    this._wrapped = obj;
  };

  // Export the jsork object for **Node.js**, with
  // backwards-compatibility for their old module API. If we're in
  // the browser, add `jsork` as a global object.
  // (`nodeType` is checked to ensure that `module`
  // and `exports` are not HTML elements.)
  if (typeof exports != 'undefined' && !exports.nodeType) {
    if (typeof module != 'undefined' && !module.nodeType && module.exports) {
      exports = module.exports = jsork;
    }
    exports.jsork = jsork;
  } else {
    root.jsork = jsork;
  }

  // Current version.
  jsork.VERSION = '0.1';


  var ork = "https://amtgard.com/ork/orkservice/Json/index.php";

  jsork.kingdom = {};

  jsork.kingdom.getKingdoms = function(callback) {
	$.getJSON( ork + "?request=",
		{
			call: "Kingdom/GetKingdoms",
			request: {}
		},
		function(data) {
			if (data.Status.Status == 0) {
				var kingdomArray = $.map(data.Kingdoms, function(value, index) { return value });
				callback(kingdomArray);
			} else {
				console.log(JSON.stringify(data));
			}
		});
  }

  jsork.kingdom.getParks = function(kingdomID, callback) {
	$.getJSON( ork + "?request=",
		{
			call: "Kingdom/GetParks",
			request: { KingdomId: kingdomID }
		},
		function(data) {
			if (data.Status.Status == 0) {
				callback(data.Parks);
			} else {
				console.log(JSON.stringify(data));
			}
		});
  }

  jsork.kingdom.getOfficers = function(kingdomId, callback) {
	$.getJSON( ork + "?request=",
		{
			call: "Kingdom/GetOfficers",
			request: { KingdomId: kingdomId }
		},
		function(data) {
			if (data.Status.Status == 0) {
				callback(data.Officers);
			} else {
				console.log(JSON.stringify(data));
			}
		});  	
  }

  jsork.kingdom.getParkTitles = function(kingdomId, callback) {
	$.getJSON( ork + "?request=",
		{
			call: "Kingdom/GetKingdomParkTitles",
			request: { KingdomId: kingdomId }
		},
		function(data) {
			if (data.Status.Status == 0) {
				callback(data.ParkTitles);
			} else {
				console.log(JSON.stringify(data));
			}
		});  	
  }

  jsork.kingdom.getKingdomDetails = function(kingdomId, callback) {
	$.getJSON( ork + "?request=",
		{
			call: "Kingdom/GetKingdomDetails",
			request: { KingdomId: kingdomId }
		},
		function(data) {
			if (data.Status.Status == 0) {
				callback(data.KingdomInfo);
			} else {
				console.log(JSON.stringify(data));
			}
		});  	
  }

  jsork.kingdom.getPrincipalities = function(kingdomId, callback) {
	$.getJSON( ork + "?request=",
		{
			call: "Kingdom/GetPrincipalities",
			request: { KingdomId: kingdomId }
		},
		function(data) {
			if (data.Status.Status == 0) {
				callback(data.Principalities);
			} else {
				callback([]);
			}
		});  	
  }

  jsork.park = {};

 //  jsork.park.getPlayers = function(parkID, callback) {
	// $.getJSON( ork + "?request=",
	// 	{
	// 		call: "Report/GetPlayerRoster",
	// 		request: {
	// 			Id: parkID,
	// 			Type: "Park"
	// 		}
	// 	},
	// 	function(data) {
	// 		if (data.Status.Status == 0 || data.Status == true) {
	// 			callback(data.Roster);
	// 		} else {
	// 			console.log(JSON.stringify(data));
	// 		}
	// 	});  	
 //  }

  jsork.park.getOfficers = function(parkID, callback) {
	$.getJSON( ork + "?request=",
		{
			call: "Park/GetOfficers",
			request: { ParkId: parkID }
		},
		function(data) {
			if (data.Status.Status == 0) {
				callback(data.Officers);
			} else {
				console.log(JSON.stringify(data));
			}
		});  	
  }

  jsork.searchservice = {};


  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define == 'function' && define.amd) {
    define('jsork', [], function() {
      return jsork;
    });
  }
}());
