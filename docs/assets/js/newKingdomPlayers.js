/* eslint-disable no-unused-vars */
/* global jsork, $ */

// const jsork = require("./jsork");

var stringOutput = '';
var allPlayers = [];
var kingdomPlayers = [];
var sixMonthsAgo = moment();
sixMonthsAgo = sixMonthsAgo.subtract(6, "months");
var startTime = Date.now();
var howManyPlayersChecked = 0;
var dotCount = 0;
var mundane_number = 0;

function updateWorkingMessage() {
    howManyPlayersChecked++;
    if (howManyPlayersChecked % 5 === 0) {
        var avgCallTime = (Date.now() - startTime) / howManyPlayersChecked;
        var timeLeft = moment.duration(avgCallTime * (mundane_number - howManyPlayersChecked) / 1000, "seconds").humanize();
        $('.working').text('Number of players left to check ' + (mundane_number - howManyPlayersChecked) + ", time left " + timeLeft);
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
  $('.generateddate').text('Generated on ' + new Date().toDateString());
}

function initKingdoms() {
  jsork.kingdom.getKingdoms().then(function(data) {
    var kSelect = $('#kingdom');
    var emptyOption = $('<option>');
    emptyOption.html('Choose a Kingdom/Principality');
    emptyOption.val(0);
    kSelect.append(emptyOption);
    data.forEach(function(kingdom) {
      var option = $('<option>');
      option.html(kingdom.KingdomName);
      option.val(kingdom.KingdomId);
      kSelect.append(option);
    });
    $('#kingdom').selectmenu('option', 'disabled', false);
    $('#kingdom').show();
  });
}

function startUp() {
  $('#kingdom').selectmenu();
  $('#kingdom').on('change', kingdomSelect);
  initKingdoms();
}

function getNewPlayers(kingdomId) {
    jsork.kingdom.getPlayers(kingdomId, jsork.filters.ACTIVE).then(function(players) {
        kingdomPlayers = players;
        // kingdomPlayers = kingdomPlayers.slice(0,150);
        mundane_number = kingdomPlayers.length;
        startTime = Date.now();
        getNextPlayer();
    });
}

function getNextPlayer() {
    updateWorkingMessage();
    if (kingdomPlayers.length === 0) {
        // outputResults();
        console.log("Done");
        outputResults();
        return;
    }
    var nextPlayer = kingdomPlayers.pop();
    jsork.player.getFirstAttendance(nextPlayer.MundaneId).then(function(attendance) {
        if (attendance.length > 0 && (moment(attendance[0].Date) >= sixMonthsAgo)) {
            nextPlayer.startDate = attendance[0].Date;
            allPlayers.push(nextPlayer);
        }
        getNextPlayer();
    });
}

function outputResults() {
  allPlayers.sort(function(a, b) {
    var personaSort = a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
    var parkSort = a.ParkName.toLowerCase().localeCompare(b.ParkName.toLowerCase());
    if (parkSort !== 0) {
      return parkSort;
    }
    return personaSort;
  });
  allPlayers.forEach(function(player) {
    var playerLine =
      (player.ParkName || 'No Park') + '\t' +
      (player.Persona || 'No persona for ID ' + player.MundaneId) + '\t';
    var playerHTMLLine = '<tr><td>' +
      (player.ParkName || 'No Park') + '</td><td>' +
      '<a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
      player.MundaneId + '">' +
      (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
    playerLine += player.startDate + '\r\n';
    playerHTMLLine += '<td>' + player.startDate + '</td></tr>';
    $('#newPlayersTable').append(playerHTMLLine);
    stringOutput += playerLine + '\r\n';  
  });
  $('.allresults').attr('hidden', false);
  $('#kingdom').selectmenu('option', 'disabled', false);
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

function copyNewPlayersToClipboard() {
  var allCSV = 'Park\tPersona\tFirst Credit\r\n';
  allCSV += stringOutput;
  copyTextToClipboard(allCSV);
}

$(document).ready(function() {
  startUp();
});
