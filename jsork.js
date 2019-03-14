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
  var root = typeof self === 'object' && self.self === self && self ||
    typeof global === 'object' && global.global === global && global ||
    this || {};

  // Create a safe reference to the jsork object for use below.
  var jsork = function(obj) {
    if (obj instanceof jsork)return obj;
    if ( !(this instanceof jsork))return new jsork(obj);
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


  var ork = 'https://amtgard.com/ork/orkservice/Json/index.php';

  jsork.filters = {
    ACTIVE: 0,
    INACTIVE: 1,
    WAIVERED: 2,
    UNWAIVERED: 3,
    BANNED: 4,
    SUSPENDED: 5,
    DUESPAID: 6,
    ROSE: ''
  };

  // Define all the Kingdom applicable APIs
  jsork.kingdom = {};

  jsork.kingdom.getKingdoms = function() {
    var promise = new Promise(function(resolve, reject) {
      $.getJSON(ork + '?request=',
          {
            call: 'Kingdom/GetKingdoms',
            request: {}
          },
        function(data) {
          if (data.Status.Status === 0) {
            var kingdomArray = $.map(data.Kingdoms, function(value, index) {
              return value;
            });
            resolve(kingdomArray);
          } else {
            reject(Error('Call failed ' + JSON.stringify(data)));
          }
        });
    });
    return promise;
  };

  jsork.kingdom.getAllParks = function() {
    var kingdoms = jsork.kingdom.getKingdoms();
    kingdoms.then(function(kingdomsArray) {
      var allParkPromises = [];
      kingdomsArray.forEach(function(aKingdom) {
        allParkPromises.push(jsork.kingdom.getParks(aKingdom.KingdomId));
      });
      return Promise.all(allParkPromises).then(function(result) {
        var toReturn = result.reduce(function(acc, val) {
          return acc.concat(val.filter(function(park) {
            return park.Active === 'Active';
          }));
        });
        return toReturn;
      });
    });
    return kingdoms;
  };

  jsork.kingdom.getParks = function(kingdomID) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
          {
            call: 'Kingdom/GetParks',
            request: {KingdomId: kingdomID}
          },
        function(data) {
          if (data.Status.Status === 0) {
            resolve(data.Parks);
          } else {
            // on error just assume no parks
            resolve([]);
          }
        });
    });
    return promise;
  };

  jsork.kingdom.getOfficers = function(kingdomId) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
          {
            call: 'Kingdom/GetOfficers',
            request: {KingdomId: kingdomId}
          },
        function(data) {
          if (data.Status.Status === 0) {
            resolve(data.Officers);
          } else {
            resolve([]);
          }
        });
    });
    return promise;
  };

  jsork.kingdom.getParkTitles = function(kingdomId) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
          {
            call: 'Kingdom/GetKingdomParkTitles',
            request: {KingdomId: kingdomId}
          },
      function(data) {
        if (data.Status.Status === 0) {
          resolve(data.ParkTitles);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.kingdom.getInfo = function(kingdomId) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
          {
            call: 'Kingdom/GetKingdomDetails',
            request: {KingdomId: kingdomId}
          },
      function(data) {
        if (data.Status.Status === 0) {
          resolve(data.KingdomInfo);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.kingdom.getPrincipalities = function(kingdomId, callback) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
          {
            call: 'Kingdom/GetPrincipalities',
            request: {KingdomId: kingdomId}
          },
      function(data) {
        if (data.Status.Status === 0) {
          resolve(data.Principalities);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.kingdom.getPlayers = function(kingdomId, filter) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            Id: kingdomId,
            Type: 'Kingdom'
          };
      addFilterToPlayerRequest(request, filter);
      $.getJSON(ork + '?request=',
          {
            call: 'Report/GetPlayerRoster',
            request: request
          },
      function(data) {
        if (data.Status.Status === 0 || data.Status === true) {
          resolve(data.Roster);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.kingdom.getParagons = function(kingdomId) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            KingdomId: kingdomId
          };
      $.getJSON(ork + '?request=',
          {
            call: 'Report/ClassMasters',
            request: request
          },
      function(data) {
        if (data.Status.Status === 0 || data.Status === true) {
          resolve(data.Awards);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.kingdom.getKnights = function(kingdomID) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
          {
            call: 'Reports/knights_list',
            request: {KingdomId: kingdomID}
          },
        function(data) {
          if (data.Status.Status === 0) {
            resolve(data.Parks);
          } else {
            // on error just assume no parks
            resolve([]);
          }
        });
    });
    return promise;
  };

  // Define all the Report applicable APIs
  jsork.reports = {};

  // Define all the Park applicable APIs
  jsork.park = {};

  jsork.park.getPlayers = function(parkID, filter) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            Id: parkID,
            Type: 'Park'
          };
      jsork._priv.addFilterToPlayerRequest(request, filter);
      $.getJSON(ork + '?request=',
          {
            call: 'Report/GetPlayerRoster',
            request: request
          },
      function(data) {
        if (data.Status.Status === 0 || data.Status === true) {
          resolve(data.Roster);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.park.getActivePlayers = function(parkID) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
          {
            call: 'Report/GetActivePlayers',
            request: {ParkId: parkID}
          },
      function(data) {
        if (data.Status.Status === 0 || data.Status === true) {
          resolve(data.ActivePlayerSummary);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.park.getOfficers = function(parkID) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
          {
            call: 'Park/GetOfficers',
            request: {ParkId: parkID}
          },
      function(data) {
        if (data.Status.Status === 0) {
          resolve(data.Officers);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.park.getInfo = function(parkID) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
          {
            call: 'Park/GetParkDetails',
            request: {ParkId: parkID}
          },
      function(data) {
        if (data.Status.Status === 0) {
          resolve(data);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.park.getShortInfo = function(parkID) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
          {
            call: 'Park/GetParkShortInfo',
            request: {ParkId: parkID}
          },
      function(data) {
        if (data.Status.Status === 0) {
          resolve(data.ParkInfo);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  // Define all the Player applicable APIs
  jsork.player = {};

  jsork.player.getInfo = function(mundaneID) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            MundaneId: mundaneID
          };
      $.getJSON(ork + '?request=',
          {
            call: 'Player/GetPlayer',
            request: request
          },
      function(data) {
        if (data.Status.Status === 0 || data.Status === true) {
          resolve(data.Player);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.player.getClasses = function(mundaneID) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            MundaneId: mundaneID
          };
      $.getJSON(ork + '?request=',
          {
            call: 'Player/GetPlayerClasses',
            request: request
          },
      function(data) {
        if (data.Status.Status === 0 || data.Status === true) {
          var result = [];
          $.each(data.Classes, function(index, item) {
            var reconciledCredits = item.Credits + item.Reconciled;
            var nextClass = {
              class: item.ClassName,
              level: jsork._priv.levelForCredits(reconciledCredits),
              credits: reconciledCredits || 0
            };
            result.push(nextClass);
          });
          resolve(result);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.player.getAwards = function(mundaneID, filter) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            MundaneId: mundaneID
          };
      jsork._priv.addFilterToAwardRequest(request, filter);
      $.getJSON(ork + '?request=',
          {
            call: 'Player/AwardsForPlayer',
            request: request
          },
      function(data) {
        if (data.Status.Status === 0 || data.Status === true) {
          if (filter !== jsork.awardIDs.ALL) {
            data.Awards = data.Awards.filter(function(award) {
              return award.AwardId === filter;
            });
          }
          resolve(data.Awards);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.player.getAttendance = function(mundaneID) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            MundaneId: mundaneID
          };
      $.getJSON(ork + '?request=',
          {
            call: 'Player/AttendanceForPlayer',
            request: request
          },
      function(data) {
        if (data.Status.Status === 0 || data.Status === true) {
          resolve(data.Attendance);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.heraldry = {};
  jsork.heraldry.getHeraldryUrl = function(id, type) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            Id: id,
            Type: type
          };
      $.getJSON(ork + '?request=',
          {
            call: 'Heraldry/GetHeraldryUrl',
            request: request
          },
      function(data) {
        if (data.Status.Status === 0 || data.Status === true) {
          resolve(data.Result.Url);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };


  jsork.award = {};

  jsork.award.getAwardList = function() {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
          {
            call: 'Award/GetAwardList'
          },
      function(data) {
        if (data.Status.Status === 0 || data.Status === true) {
          resolve(data.Awards);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.event = {};

  jsork.event.playAmtgard = function(latitude, longitude) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            latitude: latitude,
            longitude: longitude,
            start: '2018-10-30',
            end: '2019-11-30',
            distance: '5000'
          };
      $.getJSON(ork + '?request=', {
        call: 'Park/PlayAmtgard',
        request: request
      },
      function(data) {
        if (data.Status.Status === 0 || data.Status === true) {
          resolve(data.ParkDays);
        } else {
          resolve([]);
        }
      });
    });
    return promise;
  };

  jsork.searchservice = {};

  jsork._priv = {};
  jsork._priv.addFilterToPlayerRequest = function(request, filter) {
    switch (filter) {
      case jsork.filters.WAIVERED:
        return $.extend(request, {Waivered: true});
      case jsork.filters.UNWAIVERED:
        return $.extend(request, {UnWaivered: true});
      case jsork.filters.ACTIVE:
        return $.extend(request, {Active: true});
      case jsork.filters.INACTIVE:
        return $.extend(request, {InActive: true});
      case jsork.filters.BANNED:
        return $.extend(request, {Banned: true});
      case jsork.filters.SUSPENDED:
        return $.extend(request, {Suspended: true});
      case jsork.filters.DUESPAID:
        return $.extend(request, {DuesPaid: true});
      default:
        throw Error('Illegal filter argument ' + filter);
    }
  };

  jsork._priv.addFilterToAwardrequest = function(request, filter) {
    // This might get written like player request above but for now just pass through the filter
    return $.extend(request, {AwardsId: filter});
  };

  jsork._priv.levelForCredits = function(credits) {
    switch (true) {
      case credits === null || credits < 5:
        return 1;
      case credits < 12:
        return 2;
      case credits < 21:
        return 3;
      case credits < 34:
        return 4;
      case credits < 53:
        return 5;
      default:
        return 6;
    }
  };

  jsork.aboutToLevelTo = function(credits) {
    switch (true) {
      case credits === null:
        return 0;
      case credits === 4:
        return 2;
      case credits === 11:
        return 3;
      case credits === 20:
        return 4;
      case credits === 33:
        return 5;
      case credits === 52:
        return 6;
      default:
        return 0;
    }
  };

  jsork.awardIDs = {
    ALL: 9999, MASTER_ROSE: 1, MASTER_SMITH: 2, MASTER_LION: 3, MASTER_OWL: 4, MASTER_DRAGON: 5, MASTER_GARBER: 6,
    MASTER_JOVIUS: 7, MASTER_ZODIAC: 8, MASTER_MASK: 9, MASTER_HYDRA: 10, MASTER_GRIFFIN: 11, WARLORD: 12, LORDS_PAGE: 13,
    MANATARMS: 14, PAGE: 15, SQUIRE: 16, KNIGHT_OF_THE_FLAME: 17, KNIGHT_OF_THE_CROWN: 18, KNIGHT_OF_THE_SERPENT: 19,
    KNIGHT_OF_THE_SWORD: 20, ORDER_OF_THE_ROSE: 21, ORDER_OF_THE_SMITH: 22, ORDER_OF_THE_LION: 23, ORDER_OF_THE_OWL: 24,
    ORDER_OF_THE_DRAGON: 25, ORDER_OF_THE_GARBER: 26, ORDER_OF_THE_WARRIOR: 27, ORDER_OF_THE_JOVIUS: 28, ORDER_OF_THE_MASK: 29,
    ORDER_OF_THE_ZODIAC: 30, ORDER_OF_THE_WALKER_IN_THE_MIDDLE: 31, ORDER_OF_THE_HYDRA: 32, ORDER_OF_THE_GRIFFIN: 33,
    ORDER_OF_THE_FLAME: 34, DEFENDER: 35, WEAPONMASTER: 36, PARAGON_ANTIPALADIN: 37, PARAGON_ARCHER: 38, PARAGON_ASSASSIN: 39,
    PARAGON_BARBARIAN: 40, PARAGON_BARD: 41, PARAGON_DRUID: 42, PARAGON_HEALER: 43, PARAGON_MONK: 44, PARAGON_MONSTER: 45,
    PARAGON_PALADIN: 46, PARAGON_PEASANT: 47, PARAGON_RAIDER: 48, PARAGON_SCOUT: 49, PARAGON_WARRIOR: 50, PARAGON_WIZARD: 51,
    LORD: 52, LADY: 53, BARONET: 54, BARONETESS: 55, BARON: 56, BARONESS: 57, VISCOUNT: 58, VISCOUNTESS: 59, COUNT: 60,
    COUNTESS: 61, MARQUIS: 62, MARQUESS: 63, DUKE: 64, DUCHESS: 65, ARCHDUKE: 66, ARCHDUCHESS: 67, GRAND_DUKE: 68,
    GRAND_DUCHESS: 69, SHERIFF: 70, PROVINCIAL_BARON: 71, PROVINCIAL_BARONESS: 72, PROVINCIAL_DUKE: 73, PROVINCIAL_DUCHESS: 74,
    PROVINCIAL_GRAND_DUKE: 75, PROVINCIAL_GRAND_DUCHESS: 76, SHIRE_REGENT: 77, BARONIAL_REGENT: 78, DUCAL_REGENT: 79,
    GRAND_DUCAL_REGENT: 80, SHIRE_CLERK: 81, BARONIAL_SENESCHAL: 82, DUCAL_CHANCELLOR: 83, GRAND_DUCAL_GENERAL_MINISTER: 84,
    PROVINCIAL_CHAMPION: 85, BARONIAL_CHAMPION: 86, DUCAL_DEFENDER: 87, GRAND_DUCAL_DEFENDER: 88, KINGDOM_CHAMPION: 89,
    KINGDOM_REGENT: 90, KINGDOM_PRIME_MINISTER: 91, KINGDOM_MONARCH: 92, DIRECTOR_OF_THE_BOARD: 93, CUSTOM_AWARD: 94,
    GUILDMASTER_OF_REEVES: 202, GUILDMASTER_OF_WIZARDS: 201, GUILDMASTER_OF_WARRIORS: 200, GUILDMASTER_OF_SCOUTS: 199,
    PLAGUESERVANT_OF_PEASANTS: 198, GUILDMASTER_OF_PALADINS: 197, GUILDMASTER_OF_MONSTERS: 196, GUILDMASTER_OF_MONKS: 195,
    GUILDMASTER_OF_HEALERS: 194, GUILDMASTER_OF_DRUIDS: 193, GUILDMASTER_OF_BARDS: 192, GUILDMASTER_OF_BARBARIANS: 191,
    GUILDMASTER_OF_ASSASSINS: 190, GUILDMASTER_OF_ARCHERS: 189, GUILDMASTER_OF_KNIGHTS: 188, APPRENTICE: 203,
    COM_EXECUTIVE_COMMITTEE: 204, CHAMPION_PRINCIPALITY: 205, CHAMPION_SHIRE: 206, DRAGONMASTER: 207, CULTURAL_OLYMPIAN: 208,
    ESQUIRE: 209, GUILDMASTER_OF_ANTIPALADINS: 210, GUILDMASTER_OF_REEVES_SHIRE: 211, GUILDMASTER_OF_REEVES_BARONY: 212,
    GUILDMASTER_OF_REEVES_DUCHY: 213, GUILDMASTER_OF_REEVES_GRAND_DUCHY: 214, GUILDMASTER_OF_REEVES_PRINCIPALITY: 215,
    AUTOCRAT_KINGDOM: 216, SUBCRAT_KINGDOM: 217, AUTOCRAT_INTERKINGDOM: 218, SUBCRAT_INTERKINGDOM: 219, AUTOCRAT_PARK: 220,
    SUBCRAT_PARK: 221, AUTOCRAT_INTERPARK: 222, SUBCRAT_INTERPARK: 223, GRAND_OLYMPIAN: 224, RULES_REPRESENTATIVE: 225,
    MASTER: 226, MONARCH_PRINCIPALITY: 227, REGENT_PRINCIPALITY: 228, WAR_EVENT_WINNER: 229, WAR_OLYMPIAN: 230, WARMASTER: 231
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('jsork', [], function() {
      return jsork;
    });
  }
}());

