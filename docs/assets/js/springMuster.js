/* eslint-disable no-unused-vars */
/* global jsork, $ */

// const jsork = require("./jsork");

var stringOutput = "";
var allPlayers = [];
var kingdomPlayers = [];
var startMuster = moment("2023-03-01");
var endMuster = moment("2023-05-31");
var returningMuster = moment(startMuster).subtract(12, 'months');
var startTime = Date.now();
var howManyPlayersChecked = 0;
var dotCount = 0;
var mundane_number = 0;
var kingdomPoints = 0;
var kingdomTotals = [];
var allKingdoms = [];
var currentKingdom = null;
var playerHTMLOutput = "";
var competitionHTMLOutput = "";
var resultsOutput = "";

function updateWorkingMessage() {
    howManyPlayersChecked++;
    if (howManyPlayersChecked % 5 === 0) {
        var avgCallTime = (Date.now() - startTime) / howManyPlayersChecked;
        var timeLeft = moment.duration(avgCallTime * (mundane_number - howManyPlayersChecked) / 1000, "seconds").humanize();
        $('.working').text(currentKingdom.KingdomName + " " + (mundane_number - howManyPlayersChecked) + " players to go" + ", it will be " + timeLeft);
        if (dotCount > 5) {
            dotCount = 0;
        }
    }
}


function kingdomSelect(event, ui) {
  stringOutput = '';
  allPlayers = [];
  kingdomPlayers = [];
  $('.working').text('Gathering the players...');
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  if (event.target.value === '0') {
    return;
  }
  $('.working').attr('hidden', false);
  $('#kingdom').selectmenu('option', 'disabled', true);

  getNewPlayers(parseInt(event.target.value, 10));
  $('.generateddate').text('Generated on ' + new Date().toDateString() + " for " + startMuster.format('YYYY-MM-DD') + " thru " + endMuster.format('YYYY-MM-DD'));
}

function initKingdoms() {
  jsork.kingdom.getKingdoms().then(function(data) {
    allKingdoms = data;
    // allKingdoms = data.slice(21,22)

    stringOutput = '';
    allPlayers = [];
    kingdomPlayers = [];
    kingdomTotals = [];
    $('.working').text('Gathering the players...');
    $('.allresults').attr('hidden', true);
    $('.working').attr('hidden', false);
    $('.generateddate').text('Generated on ' + new Date().toDateString() + " for " + startMuster.format('YYYY-MM-DD') + " thru " + endMuster.format('YYYY-MM-DD'));
    doNextKingdom();
  });
}

function startUp() {
  initKingdoms();
}

function doNextKingdom() {
  if (allKingdoms.length === 0) {
    console.log("Done");
    allDone();
    return;
  }
  kingdomPoints = 0;
  allPlayers = [];
  currentKingdom = allKingdoms.shift();
  console.log("Doing " + currentKingdom.KingdomName);
  $('.working').text(currentKingdom.KingdomName + ' gathering the players...');
  getNewPlayers(currentKingdom.KingdomId);
}

function getNewPlayers(kingdomId) {
  jsork.kingdom.getPlayers(kingdomId, jsork.filters.ACTIVE).then(function(activePlayers) {
      kingdomPlayers = activePlayers;
      jsork.kingdom.getPlayers(kingdomId, jsork.filters.INACTIVE).then(function(inactivePlayers) {
        kingdomPlayers = kingdomPlayers.concat(inactivePlayers);
        // kingdomPlayers = kingdomPlayers.slice(0,1000);
        mundane_number = kingdomPlayers.length;
        howManyPlayersChecked = 0;
        dotCount = 0;
        startTime = Date.now();
        getNextPlayer();
      });
  });
}

function getNextPlayer() {
    updateWorkingMessage();
    if (kingdomPlayers.length === 0) {
        // outputResults();
        var newPlayers = allPlayers.filter(function(aPlayer) { return aPlayer.newPlayer });
        var returningPlayers = allPlayers.filter(function(aPlayer) { return !aPlayer.newPlayer });
        kingdomTotals.push({ KingdomName: currentKingdom.KingdomName, NewPlayers: newPlayers.length, ReturningPlayers: returningPlayers.length, TotalPoints: kingdomPoints});
        currentKingdom.NewPlayers = newPlayers.length;
        currentKingdom.ReturningPlayers = returningPlayers.length;
        outputNextResults();
        console.log("Done a kingdom, moving on...");
        doNextKingdom();
        return;
    }
    var nextPlayer = kingdomPlayers.pop();
    jsork.player.getFirstAttendance(nextPlayer.MundaneId).then(function(attendance) {
        if (attendance.length > 0 && (moment(attendance[0].Date) >= startMuster) && (moment(attendance[0].Date) <= endMuster)) {
          // Calculate new players
          var playerPoints = 10;
          nextPlayer.startDate = attendance[0].Date;
          jsork.player.getAttendanceFrom(nextPlayer.MundaneId, startMuster.format('YYYY-MM-DD')).then(function(allAttendance) {
            attendance = allAttendance.filter(function(anAttendance) {
                return (moment(anAttendance.Date) >= startMuster) && (moment(anAttendance.Date) <= endMuster)
            })
            nextPlayer.totalAttendance = attendance.length;
            if (nextPlayer.totalAttendance >= 6) {
                playerPoints += 75;
            }
            nextPlayer.playerPoints = playerPoints;
            nextPlayer.newPlayer = true;
            kingdomPoints += playerPoints;
            allPlayers.push(nextPlayer);
            getNextPlayer();
          });
        } else {
          // Calculate returning players
          if (attendance.length > 0 && moment(attendance[0].Date) < returningMuster) {
            // Player has attended at least before the six months before the start of Spring Muster
            jsork.player.getAttendanceFrom(nextPlayer.MundaneId, returningMuster.format('YYYY-MM-DD')).then(function(allAttendance) {
              if (allAttendance.length > 0) {
                // Player has played some time in the six months before spring muster OR during spring muster
                var attendanceBeforeStart = allAttendance.filter(function(anAttendance) {
                  return (moment(anAttendance.Date) >= returningMuster) && (moment(anAttendance.Date) <= startMuster)
                });
                var attendance = allAttendance.filter(function(anAttendance) {
                  return (moment(anAttendance.Date) >= startMuster) && (moment(anAttendance.Date) <= endMuster)
                });
              if (attendanceBeforeStart.length > 0 || attendance.length === 0) {
                  // Player has played within six months or has no attendance during Spring Muster
                  getNextPlayer();
                } else {
                  var playerPoints = 5;
                  nextPlayer.startDate = "returning";
                  nextPlayer.totalAttendance = attendance.length;
                  if (nextPlayer.totalAttendance >= 6) {
                      playerPoints += 40;
                  }
                  nextPlayer.playerPoints = playerPoints;
                  nextPlayer.newPlayer = false;
                  kingdomPoints += playerPoints;
                  allPlayers.push(nextPlayer);
                  getNextPlayer();
  
                }
              } else {
                getNextPlayer();
              }
            });
          } else {
            getNextPlayer();
          }
        }
    });
}

function outputNextResults() {
  allPlayers.sort(function(a, b) {
    var aPersona = a.Persona !== null ? a.Persona : '';
    var bPersona = b.Persona !== null ? b.Persona : '';
    var aParkName = a.ParkName !== null ? a.ParkName : '';
    var bParkName = b.ParkName !== null ? b.ParkName : '';
    var personaSort = aPersona.toLowerCase().localeCompare(bPersona.toLowerCase());
    var parkSort = aParkName.toLowerCase().localeCompare(bParkName.toLowerCase());
    if (parkSort !== 0) {
      return parkSort;
    }
    return personaSort;
  });
  playerHTMLOutput += "<H3>" + currentKingdom.KingdomName + "</h3>";
  playerHTMLOutput += "<h4>" + "There were " + currentKingdom.NewPlayers + " new players, and " + currentKingdom.ReturningPlayers + " returning players in this timeframe worth " + kingdomPoints + " points</h4>";
  if (allPlayers.length > 0) {
    playerHTMLOutput += "<table style=\"width:100%\"><tr><th class='left'>Park</th><th class='left'>Persona</th><th class='left'>First Credit</th><th class='left'>Total Credits</th><th class='left'>Points</th></tr>";
    allPlayers.forEach(function(player) {
      var playerLine =
        (player.KingdomName || 'No Kingdom') + '\t' +
        (player.ParkName || 'No Park') + '\t' +
        (player.Persona || 'No persona for ID ' + player.MundaneId) + '\t';
      var playerHTMLLine = '<tr><td>' +
        (player.ParkName || 'No Park') + '</td><td>' +
        '<a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
        player.MundaneId + '">' +
        (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
      playerLine += player.startDate + '\t';
      playerHTMLLine += '<td>' + player.startDate + '</td>';
      playerLine += player.totalAttendance + '\t';
      playerHTMLLine += '<td>' + player.totalAttendance + '</td>';
      playerLine += player.playerPoints;
      playerHTMLLine += '<td>' + player.playerPoints + '</td></tr>';
      playerHTMLOutput += playerHTMLLine;
      stringOutput += playerLine + '\r\n';
    });
    playerHTMLOutput += "</table>";
  }
}

function allDone() {
  competitionHTMLOutput += "<H3>Total Points Breakdown By Kingdom</h3>";
  competitionHTMLOutput += "<table style=\"width:100%\"><tr><th class='left'>Kingdom</th><th class='left'>New Players</th><th class='left'>Returning Players</th><th class='left'>Points</th></tr>";
  resultsOutput += "Kingdom\tNew Players\tReturning Players\tTotal Points\r\n";
  kingdomTotals.sort(function(a, b) { return b.TotalPoints - a.TotalPoints } );
  kingdomTotals.forEach(function(aKingdom) {
    competitionHTMLOutput += '<tr><td>' + aKingdom.KingdomName + "</td><td>" + aKingdom.NewPlayers + "</td><td>" + aKingdom.ReturningPlayers + "</td><td>" + aKingdom.TotalPoints + "</td></tr>";
    resultsOutput += aKingdom.KingdomName + "\t" + aKingdom.NewPlayers + "\t" + aKingdom.ReturningPlayers + "\t" + aKingdom.TotalPoints + "\r\n";
  });
  competitionHTMLOutput += "</table><br><br>";
  $('#kingdomResultsTable').append(competitionHTMLOutput);
  $('#newPlayersTable').append(playerHTMLOutput);
  $('.allresults').attr('hidden', false);
  $('.working').attr('hidden', true);
}

function copyTextToClipboard(str) {
  var el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function copyResultsToClipboard() {
  copyTextToClipboard(resultsOutput);
}

function copyNewPlayersToClipboard() {
  var allCSV = 'Kingdom\tPark\tPersona\tFirst Credit\tTotal Credits\tPoints\r\n';
  allCSV += stringOutput;
  copyTextToClipboard(allCSV);
}

$(document).ready(function() {
  startUp();
});
