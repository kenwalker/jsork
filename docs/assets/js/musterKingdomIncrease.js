/* eslint-disable no-unused-vars */
/* global jsork, $ */

// const jsork = require("./jsork");

var stringOutput = "";
var allPlayers = [];
var kingdomPlayers = [];
var startMuster = moment("2023-03-01");
var endMuster = moment("2023-05-31");
var startTime = Date.now();
var howManyPlayersChecked = 0;
var dotCount = 0;
var mundane_number = 0;
var kingdomTotals = [];
var allKingdoms = [];
var currentKingdom = null;
var startingPopulation = 0;
var newPopulation = 0;
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

function initKingdoms() {
  jsork.kingdom.getKingdoms().then(function(data) {
    allKingdoms = data;
    // allKingdoms = data.slice(20,22);
    // allKingdoms = [];
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
  allPlayers = [];
  startingPopulation = 0;
  newPopulation = 0;
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
        var increase = (newPopulation / startingPopulation * 100).toFixed(2);
        newPopulation = startingPopulation + newPopulation;
        kingdomTotals.push({ KingdomName: currentKingdom.KingdomName, StartingPopulation: startingPopulation, NewPopulation: newPopulation, PercentageIncrease: increase});
        console.log("Done a kingdom, moving on...");
        doNextKingdom();
        return;
    }
    var nextPlayer = kingdomPlayers.pop();
    jsork.player.getFirstAttendance(nextPlayer.MundaneId).then(function(anAttendance) {
        if (anAttendance.length > 0 && moment(anAttendance[0].Date) <= endMuster) {
            // Check for existing numbers first
            if (moment(anAttendance[0].Date) < startMuster) {
                // This is an existing player
                startingPopulation++;
            } else {
                newPopulation++;
            }
        }
        getNextPlayer();
    });
}

function allDone() {
  kingdomTotals.sort(function(a, b) { return b.PercentageIncrease - a.PercentageIncrease });
  competitionHTMLOutput += "<H3>Total Increases by Kingdom</h3>";
  competitionHTMLOutput += "<table style=\"width:100%\"><tr><th class='left'>Kingdom</th><th class='left'>Starting Population</th><th class='left'>New Population</th><th class='left'>Percentage Increase</th></tr>";
  resultsOutput += "Kingdom\tStarting Population\tNew Population\tPercentage Increase\r\n";
  kingdomTotals.forEach(function(aKingdom) {
    competitionHTMLOutput += '<tr><td>' + aKingdom.KingdomName + "</td><td>" + aKingdom.StartingPopulation + "</td><td>" + aKingdom.NewPopulation + "</td><td>" + aKingdom.PercentageIncrease + "</td></tr>";
    resultsOutput += aKingdom.KingdomName + "\t" + aKingdom.StartingPopulation + "\t" + aKingdom.NewPopulation + "\t" + aKingdom.PercentageIncrease + "\r\n";
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

$(document).ready(function() {
  startUp();
});
