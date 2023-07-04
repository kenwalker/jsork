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
  jsork.VERSION = '1.0';
  jsork.TOKEN = null;
  jsork.TIMEOUT = null;


  // var ork = 'http://localhost/ork/orkservice/Json/index.php';

  // var ork = 'http://192.168.2.21/ork/orkservice/Json/index.php';
  // var ork = 'https://amtgard.com/ork/orkservice/Json/index.php';
  // var ork = 'https://staging.amtgard.com/ork/orkservice/Json/index.php';
  // var ork = 'https://ork.stage.amtgard.com/orkservice/Json/index.php';
  
  var ork = 'https://ork.amtgard.com/orkservice/Json/index.php';

  // ork = 'https://ork7.dev.amtgard.com/orkservice/Json/index.php'

  jsork.filters = {
    ACTIVE: 0,
    INACTIVE: 1,
    WAIVERED: 2,
    UNWAIVERED: 3,
    BANNED: 4,
    SUSPENDED: 5,
    DUESPAID: 6,
    NOFILTER: 7,
    ROSE: ''
  };


  jsork.login = function(username, password) {
    $.ajaxSetup({timeout: 20000});
    jsork.TOKEN = null;
    username = username.trim();
    password = password.trim();
    var promise = new Promise(function(resolve, reject) {
      $.getJSON(ork + '?request=',
        { 
          call: 'Authorization/Authorize',
          request: {
            UserName: username,
            Password: password
          }
        },
        function(data) {
          if (data.Status.Status === 0) {
            jsork.TOKEN = data.Token;
            jsork.player.getInfo(data.UserId).then(function(player) {
              player.Timeout = data.Timeout;
              player.Token = data.Token;
              resolve(player);
            });
          } else {
            reject(data);
          }
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.logout = function() {
    var promise = new Promise(function(resolve, reject) {
      jsork.TOKEN = null;
      resolve();
    });
    return promise;
  }

  jsork.getAuthorizations = function(mundaneId) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
        {
          call: 'Authorization/GetAuthorizations',
          request: {
            Token: jsork.TOKEN,
            MundaneId: mundaneId
          }
        },
        function(data) {
          resolve(data);
        });
    });
    return promise;
  };

  jsork.removeParkAttendance = function (attendanceId) {
    var promise = new Promise(function (resolve, reject) {
      $.getJSON(ork + '?request=',
        {
          call: 'Attendance/RemoveAttendance',
          request: {
            Token: jsork.TOKEN,
            AttendanceId: attendanceId
          }
        },
        function (data) {
          if (data.Status === 0) {
            resolve(data);
          } else {
            reject(data);
          }
        }).fail(function (error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.addParkAttendance = function (mundane_id, persona, class_id, date, credits, flavor, park_id, calendar_event_id) {
    var promise = new Promise(function (resolve, reject) {
      $.getJSON(ork + '?request=',
        {
          call: 'Attendance/AddAttendance',
          request: {
            Token: jsork.TOKEN,
            MundaneId: mundane_id,
            Persona: persona,
            ClassId: class_id,
            Date: date,
            Credits: credits,
            Flavor: flavor,
            Note: null,
            ParkId: park_id,
            EventCalendarDetailId: calendar_event_id
          }
        },
        function (data) {
          if (data.Status === 0) {
            resolve(data);
          } else {
            reject(data);
          }
        }).fail(function (error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
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
        }).fail(function(error, textStatus) {
        reject(textStatus);
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
    var promise = new Promise(function(resolve, reject) {
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
        }).fail(function(error, textStatus) {
        reject(textStatus);
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
    var promise = new Promise(function(resolve, reject) {
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
        }).fail(function(error, textStatus) {
        reject(textStatus);
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
            Token: jsork.TOKEN,
            Id: kingdomId,
            Type: 'Kingdom'
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
          call: 'Report/PlayerAwards',
          request: {
            KingdomId: kingdomID,
            IncludeKnights: 1,
          }
        },
        function(data) {
          if (data.Status.Status === 0) {
            resolve(data.Awards);
          } else {
            // on error just assume no parks
            resolve([]);
          }
        });
    });
    return promise;
  };

  jsork.kingdom.playerAwards = function(kingdomID, minLadder) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
        {
          call: 'Report/PlayerAwards',
          request: {
            KingdomId: kingdomID,
            Ladder: minLadder,
            IncludeKnights: 1,
            IncludeMasters: 1,
            IncludeLadder: 1,
            LadderMinimum: minLadder
          }
        },
        function(data) {
          if (data.Status.Status === 0) {
            resolve(data.Awards);
          } else {
            // on error just assume no parks
            resolve([]);
          }
        });
    });
    return promise;
  };

  jsork.kingdom.playerAwardsPark = function(kingdomID, parkID, minLadder) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
        {
          call: 'Report/PlayerAwards',
          request: {
            KingdomId: kingdomID,
            ParkId: parkID,
            Ladder: minLadder,
            IncludeKnights: 1,
            IncludeMasters: 1,
            IncludeLadder: 1,
            LadderMinimum: minLadder
          }
        },
        function(data) {
          if (data.Status.Status === 0) {
            resolve(data.Awards);
          } else {
            // on error just assume no parks
            resolve([]);
          }
        });
    });
    return promise;
  };

  jsork.kingdom.parkAverages = function(kingdomId) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            KingdomId: kingdomId
          };
      $.getJSON(ork + '?request=',
        {
          call: 'Report/GetKingdomParkAverages',
          request: request
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data.KingdomParkAveragesSummary);
          } else {
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

  jsork.park.getReeveQualified = function(parkID) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
        {
          call: 'Report/GetReeveQualified',
          request: {ParkId: parkID}
        },
        function(data) {
          if (data.Status.Status === 0) {
            resolve(data.ReeveQualified);
          } else {
            resolve([]);
          }
        });
    });
    return promise;
  };

  jsork.park.getParagons = function(parkId) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            ParkId: parkId
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

  jsork.park.getKnights = function(parkId) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
        {
          call: 'Report/PlayerAwards',
          request: {
            ParkId: parkId,
            IncludeKnights: 1,
          }
        },
        function(data) {
          if (data.Status.Status === 0) {
            resolve(data.Awards);
          } else {
            // on error just assume no parks
            resolve([]);
          }
        });
    });
    return promise;
  };

  jsork.park.getActivePlayers = function(parkID) {
    var request = {
      ParkId: parkID
    };
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
        {
          call: 'Report/GetActivePlayers',
          request: request
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
    var promise = new Promise(function(resolve, reject) {
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
        }).fail(function(error, textStatus) {
        reject(textStatus);
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

  jsork.park.getAttendance = function(parkID, date) {
    var promise = new Promise(function(resolve, reject) {
      var month = date.getMonth() + 1; //months from 1-12
      var day = date.getUTCDate();
      var year = date.getFullYear();
      var requestDate = year + '-' + month + '-' + day;
      var request =
          {
            ParkId: parkID,
            Date: requestDate
          };
      $.getJSON(ork + '?request=',
        {
          call: 'Report/AttendanceForDate',
          request: request
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data.Attendance);
          } else {
            resolve([]);
          }
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.park.getAllAttendance = function(parkID) {
    var promise = new Promise(function(resolve, reject) {
      var request =
          {
            ParkId: parkID
          };
      $.getJSON(ork + '?request=',
        {
          call: 'Report/AttendanceSummary',
          request: request
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data.Dates);
          } else {
            resolve([]);
          }
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.park.getParkDays = function(parkID) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
        {
          call: 'Park/GetParkDays',
          request: {ParkId: parkID}
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

  jsork.park.createPlayer = function(parkID, userName, givenName, surname, persona, email, waivered) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
        {
          call: 'Player/CreatePlayer',
          request: {
            Token: jsork.TOKEN,
            ParkId: parkID,
            UserName: userName,
            GivenName: givenName,
            Surname: surname,
            Persona: persona,
            Email: email,
            Waivered: waivered ? 1:0,
            IsActive: 1
          }
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data);
          } else {
            resolve(data);
          }
        });
    });
    return promise;
  };

  jsork.park.findParkNear = function(latitude, longitude, start, end, distance, limit) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
        {
          call: 'Park/PlayAmtgard',
          request: {
            latitude: latitude,
            longitude: longitude,
            distance: distance,
            start: start,
            end: end,
            limit: limit
          }
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

  jsork.pronouns = {};

  jsork.pronouns.getList = function() {
    var promise = new Promise(function(resolve, reject) {
      $.getJSON(ork + '?request=',
        {
          call: 'Pronoun/GetPronounList'
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data.Pronouns);
          } else {
            reject('Error retrieving pronouns');
          }
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;    
  }

  // Define all the Player applicable APIs
  jsork.player = {};

  jsork.player.getInfo = function(mundaneID) {
    var promise = new Promise(function(resolve, reject) {
      var request =
          {
            Token: jsork.TOKEN,
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
            reject('Error retrieving player');
          }
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.player.setImage = function(mundaneID, base64Image) {
    var promise = new Promise(function(resolve, reject) {
      $.post(
        ork + '?request=Player/SetImage',
        {
          call: 'Player/SetImage',
          request: {
            Token: jsork.TOKEN,
            MundaneId: mundaneID,
            Image: base64Image,
            ImageMimeType: 'image/jpeg'
          }
        },
        function(data) {
          resolve(data);
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.player.getClasses = function(mundaneID) {
    if (jsork.TIMEOUT) {
      $.ajaxSetup({timeout: jsork.TIMEOUT});
    }
    var promise = new Promise(function(resolve, reject) {
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
                aboutToLevel: jsork.aboutToLevelTo(reconciledCredits),
                credits: reconciledCredits || 0,
                reconciled: item.Reconciled || 0
              };
              result.push(nextClass);
            });
            resolve(result);
          } else {
            resolve([]);
          }
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.player.getAwards = function(mundaneID, filter) {
    var promise = new Promise(function(resolve, reject) {
      $.getJSON(ork + '?request=',
        {
          call: 'Player/AwardsForPlayer',
          request: {
            MundaneId: mundaneID,
            AwardsId: filter
          }
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            data.Awards = data.Awards.filter(function(award) {
              var includeAward = true;
              if (filter !== jsork.awardIDs.ALL) {
                includeAward = award.AwardId === filter;
              }
              return includeAward && award.MundaneId === mundaneID;
            });
            resolve(data.Awards);
          } else {
            resolve([]);
          }
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.player.awardLevel = function(mundaneID, awardId) {
    var promise = new Promise(function(resolve, reject) {
      // jsork._priv.addFilterToAwardRequest(request, filter);
      $.getJSON(ork + '?request=',
        {
          call: 'Player/AwardsForPlayer',
          request: {
            MundaneId: mundaneID,
            AwardsId: awardId
          }
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            var maxLevel = 0, countLevel = 0;
            data.Awards = data.Awards.filter(function(award) {
              return award.AwardId === awardId;
            });
            data.Awards.forEach(function(award) {
              if (award.Rank > maxLevel) {
                maxLevel = award.Rank;
              }
              countLevel++;
            });
            if (countLevel > maxLevel) {
              maxLevel = countLevel;
            }
            resolve(maxLevel);
          } else {
            resolve([]);
          }
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.player.getAttendanceFrom = function(mundaneID, dateStart) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            MundaneId: mundaneID,
            date_start: dateStart
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

  jsork.player.getLastAttendance = function(mundaneID) {
    var promise = new Promise(function(resolve, reject) {
      var request =
          {
            MundaneId: mundaneID,
            limit: 1
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
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.player.getFirstAttendance = function(mundaneID) {
    var promise = new Promise(function(resolve, reject) {
      var request =
          {
            MundaneId: mundaneID,
            order: 'asc',
            limit: 1
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
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.player.updatePlayer = function(mundaneId, userName, givenName, surname, persona, email, waivered, active, duesDate, semesters) {
    var promise = new Promise(function(resolve) {
      $.post(
        ork + '?request=Player/UpdatePlayer',
        {
          call: 'Player/UpdatePlayer',
          request: {
            Token: jsork.TOKEN,
            MundaneId: mundaneId,
            UserName: userName,
            GivenName: givenName,
            Surname: surname,
            Persona: persona,
            Email: email,
            Waivered: waivered ? 1:0,
            Active: active ? 1:0,
            DuesDate: duesDate,
            DuesSemesters: semesters
          }
        },
        function(data) {
          resolve(data);
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.player.updatePlayerWaiver = function(mundaneId, waivered, active) {
    var promise = new Promise(function(resolve) {
      $.post(
        ork + '?request=Player/UpdatePlayer',
        {
          call: 'Player/UpdatePlayer',
          request: {
            Token: jsork.TOKEN,
            MundaneId: mundaneId,
            Active: active ? 1:0,
            Waivered: waivered ? 1:0,
          }
        },
        function(data) {
          resolve(data);
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.player.revokeDues = function(mundaneId) {
    var promise = new Promise(function(resolve) {
      $.post(
        ork + '?request=Player/UpdatePlayer',
        {
          call: 'Player/UpdatePlayer',
          request: {
            Token: jsork.TOKEN,
            MundaneId: mundaneId,
            RemoveDues: 'Revoke Dues'
          }
        },
        function(data) {
          resolve(data);
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.player.getUnits = function(mundaneId) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            MundaneId: mundaneId,
            IncludeCompanies: 1,
            IncludeHouseHolds: 1,
            ActiveOnly: 1
          };
      $.getJSON(ork + '?request=',
        {
          call: 'Report/UnitSummary',
          request: request
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data.Units);
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

  jsork.event.findEventNear = function(latitude, longitude, start, end, distance, limit) {
    var promise = new Promise(function(resolve) {
      $.getJSON(ork + '?request=',
        {
          call: 'Event/PlayAmtgard',
          request: {
            latitude: latitude,
            longitude: longitude,
            distance: distance,
            start: start,
            end: end,
            limit: limit
          }
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

  jsork.kingdom.getEvents = function(kingdomId) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            KingdomId: kingdomId
          };
      $.getJSON(ork + '?request=',
        {
          call: 'Event/GetEvents',
          request: request
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data);
          } else {
            resolve([]);
          }
        });
    });
    return promise;
  };

  jsork.event.getEvents = function() {
    var promise = new Promise(function(resolve) {
      var request =
          {
          };
      $.getJSON(ork + '?request=',
        {
          call: 'Event/GetEvents',
          request: request
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data);
          } else {
            resolve([]);
          }
        });
    });
    return promise;
  };

  jsork.event.getEvent = function(eventId) {
    var promise = new Promise(function(resolve) {
      var request =
          {
            EventId: eventId
          };
      $.getJSON(ork + '?request=',
        {
          call: 'Event/GetEvent',
          request: request
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data);
          } else {
            resolve([]);
          }
        });
    });
    return promise;
  };

  jsork.event.getEventDetail = function(eventId) {
    var promise = new Promise(function(resolve, reject) {
      var request =
          {
            EventId: eventId,
            Current: true
          };
      $.getJSON(ork + '?request=',
        {
          call: 'Event/GetEventDetails',
          request: request
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data);
          } else {
            resolve([]);
          }
        }).fail(function (error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.event.getAttendance = function(eventId, eventCalendarDetailId) {
    var promise = new Promise(function(resolve, reject) {
      var request =
          {
            EventId: eventId,
            EventCalendarDetailId: eventCalendarDetailId
          };
      $.getJSON(ork + '?request=',
        {
          call: 'Report/AttendanceForEvent',
          request: request
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data.Attendance);
          } else {
            resolve([]);
          }
        }).fail(function (error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.event.addAttendance = function(mundane_id, persona, class_id, credits, date, flavor, calendar_event_id) {  
    var promise = new Promise(function(resolve, reject) {
      $.getJSON(ork + '?request=',
        {
          call: 'Attendance/AddAttendance',
          request: {
            Token: jsork.TOKEN,
					          MundaneId: mundane_id,
					          Persona: persona,
					          ClassId: class_id,
            Credits: credits,
					          Date: date,
					          Flavor: flavor,
					          Note: null,
					          ParkId: 0,
					          EventCalendarDetailId: calendar_event_id
				        }
        },
        function(data) {
				        if (data.Status === 0) {
            resolve(data);
          } else {
					  reject(data);
          }
        });
    });
    return promise;
  };


  jsork.searchservice = {};

  jsork.searchservice.searchPlayer = function(searchTerm) {
    var promise = new Promise(function(resolve, reject) {
      $.getJSON(ork + '?',
        {
          call: 'SearchService/Player',
          type: 'All',
          search: searchTerm,
          limit: '20',
          Token: jsork.TOKEN
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data.Result);
          } else {
            reject(Error('Call failed ' + JSON.stringify(data)));
          }
        }).fail(function(error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.searchservice.searchPlayerUsername = function(userName) {
    var promise = new Promise(function(resolve, reject) {
      $.getJSON(ork + '?',
        {
          call: 'SearchService/Player',
          type: 'USER',
          search: userName,
          limit: '2000',
          Token: jsork.TOKEN
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data.Result);
          } else {
            reject(Error('Call failed ' + JSON.stringify(data)));
          }
        });
    });
    return promise;
  };

  jsork.searchservice.searchKingdomEvent = function(kingdomId, searchTerm) {
    var promise = new Promise(function(resolve, reject) {
      $.getJSON(ork + '?',
        {
          call: 'SearchService/Event', 
          kingdom_id: kingdomId,
          date_order: 'true',
          name: searchTerm,
          limit: '200',
          Token: jsork.TOKEN
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data.Result);
          } else {
            reject(Error('Call failed ' + JSON.stringify(data)));
          }
        }).fail(function (error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.searchservice.searchParkEvent = function(parkId, searchTerm) {
    var promise = new Promise(function(resolve, reject) {
      $.getJSON(ork + '?',
        {
          call: 'SearchService/Event',
          park_id: parkId,
          date_order: 'true',
          name: searchTerm,
          limit: '200',
          Token: jsork.TOKEN
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data.Result);
          } else {
            reject(Error('Call failed ' + JSON.stringify(data)));
          }
        }).fail(function (error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

  jsork.searchservice.allEvents = function() {
    var promise = new Promise(function(resolve, reject) {
      $.getJSON(ork + '?',
        {
          call: 'SearchService/Event',
          date_order: 'true',
          limit: '10000',
          date_start: new Date().toISOString(),
          Token: jsork.TOKEN
        },
        function(data) {
          if (data.Status.Status === 0 || data.Status === true) {
            resolve(data.Result);
          } else {
            reject(Error('Call failed ' + JSON.stringify(data)));
          }
        }).fail(function (error, textStatus) {
        reject(textStatus);
      });
    });
    return promise;
  };

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
      case jsork.filters.NOFILTER:
        return request;
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
    MASTER_JOVIUS: 7, MASTER_ZODIAC: 8, MASTER_MASK: 9, MASTER_HYDRA: 10, MASTER_GRIFFIN: 11, WARLORD: 12, MASTER_CROWN: 240, LORDS_PAGE: 13,
    MANATARMS: 14, PAGE: 15, SQUIRE: 16, KNIGHT_OF_THE_FLAME: 17, KNIGHT_OF_THE_CROWN: 18, KNIGHT_OF_THE_SERPENT: 19,
    KNIGHT_OF_THE_SWORD: 20, ORDER_OF_THE_ROSE: 21, ORDER_OF_THE_SMITH: 22, ORDER_OF_THE_LION: 23, ORDER_OF_THE_OWL: 24,
    ORDER_OF_THE_DRAGON: 25, ORDER_OF_THE_GARBER: 26, ORDER_OF_THE_WARRIOR: 27, ORDER_OF_THE_JOVIUS: 28, ORDER_OF_THE_MASK: 29,
    ORDER_OF_THE_ZODIAC: 30, ORDER_OF_THE_WALKER_IN_THE_MIDDLE: 31, ORDER_OF_THE_HYDRA: 32, ORDER_OF_THE_GRIFFIN: 33,
    ORDER_OF_THE_FLAME: 34, ORDER_OF_THE_CROWN: 239, DEFENDER: 35, WEAPONMASTER: 36, PARAGON_ANTIPALADIN: 37, PARAGON_ARCHER: 38, PARAGON_ASSASSIN: 39,
    PARAGON_BARBARIAN: 40, PARAGON_BARD: 41, PARAGON_DRUID: 42, PARAGON_HEALER: 43, PARAGON_MONK: 44, PARAGON_MONSTER: 45,
    PARAGON_PALADIN: 46, PARAGON_PEASANT: 47, PARAGON_RAIDER: 48, PARAGON_SCOUT: 49, PARAGON_WARRIOR: 50, PARAGON_WIZARD: 51,
    PARAGON_COLOR: 241, PARAGON_REEVE: 242,
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

  jsork.awardIDsToString = {};
  jsork.awardIDsToString[jsork.awardIDs.LORD] = 'Lord';
  jsork.awardIDsToString[jsork.awardIDs.LADY] = 'Lady';
  jsork.awardIDsToString[jsork.awardIDs.BARONET] = 'Baronet';
  jsork.awardIDsToString[jsork.awardIDs.BARONETESS] = 'Baronetess';
  jsork.awardIDsToString[jsork.awardIDs.BARON] = 'Baron';
  jsork.awardIDsToString[jsork.awardIDs.BARONESS] = 'Baroness';
  jsork.awardIDsToString[jsork.awardIDs.VISCOUNT] = 'Viscount';
  jsork.awardIDsToString[jsork.awardIDs.VISCOUNTESS] = 'Viscountess';
  jsork.awardIDsToString[jsork.awardIDs.COUNT] = 'Count';
  jsork.awardIDsToString[jsork.awardIDs.COUNTESS] = 'Countess';
  jsork.awardIDsToString[jsork.awardIDs.MARQUIS] = 'Marquis';
  jsork.awardIDsToString[jsork.awardIDs.MARQUESS] = 'Marquess';
  jsork.awardIDsToString[jsork.awardIDs.DUKE] = 'Duke';
  jsork.awardIDsToString[jsork.awardIDs.DUCHESS] = 'Duchess';
  jsork.awardIDsToString[jsork.awardIDs.ARCHDUKE] = 'Archduke';
  jsork.awardIDsToString[jsork.awardIDs.ARCHDUCHESS] = 'Archduchess';
  jsork.awardIDsToString[jsork.awardIDs.GRAND_DUKE] = 'Grand Duke';
  jsork.awardIDsToString[jsork.awardIDs.GRAND_DUCHESS] = 'Grand Duchess';

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

