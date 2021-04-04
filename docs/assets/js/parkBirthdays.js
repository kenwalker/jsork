/* eslint-disable no-unused-vars */
/* global jsork, $ */

var numberOfParks = 0;
var today = moment().subtract(7, 'days');
var monthAway = moment().add(1, 'months');
var playerBirthdays = [];

function kingdomSelect(event, ui) {
    playerBirthdays = [];
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    $('.noplayers').text(' ');
    if (event.target.value === '0') {
      return;
    }
    document.getElementById('kingdom').disabled = true;
    document.getElementById('park').disabled = true;
    var select = document.getElementById('park');
    for (var i = select.options.length - 1; i >= 0; i--) {
      select.options[i] = null;
    }
    jsork.kingdom.getParks(parseInt(event.target.value, 10)).then(function(data) {
      data.sort(function(a, b) {
        return a.Name.toLowerCase().localeCompare(b.Name.toLowerCase());
      });
      var kSelect = $('#park');
      var emptyOption = $('<option>');
      emptyOption.html('Choose a Park');
      emptyOption.val(0);
      kSelect.append(emptyOption);
      data.forEach(function(park) {
        if (park.Active === 'Active') {
          var option = $('<option>');
          option.html(park.Name);
          option.val(park.ParkId);
          kSelect.append(option);
        }
      });
      $('#parkselect').attr('hidden', false);
      document.getElementById('kingdom').disabled = false;
      document.getElementById('park').disabled = false;
    });
}
function parkSelect(event, ui) {
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    $('.noplayers').text('');
    playerBirthdays = [];
    playerContent = '';
    if (event.target.value === '0') {
      return;
    }
    document.getElementById('kingdom').disabled = true;
    document.getElementById('park').disabled = true;
    $('.printtitle').text($('#kingdom option:selected').text() + ' - ' + $('#park option:selected').text());
    $('.generateddate').text('Generated on ' + new Date().toDateString());
  
    $('.working').attr('hidden', false);
    var parkId = parseInt(event.target.value, 10);
    getBirthdays(parkId);
}

function kingdomSelect2(event, ui) {
  $('.allresults').empty();
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  if (event.target.value === '0') {
    return;
  }
  $('.working').attr('hidden', false);
  $('#kingdom').selectmenu('option', 'disabled', true);
  getOfficers(parseInt(event.target.value, 10));
  $('.printtitle').text($('#kingdom option:selected').text());
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
  $('#park').on('change', parkSelect);
  initKingdoms();
}

function getBirthdays(parkId) {
  var htmlOutput = '';
  jsork.park.getPlayers(parkId, jsork.filters.ACTIVE).then(function(parkPlayers) {
    var getNextPlayerBirthday = function() {
        if (parkPlayers.length === 0) {
            done();
            return;
        }
        var player = parkPlayers.pop();
        $('.working').text('Number of players left to check ' + parkPlayers.length);
        jsork.player.getFirstAttendance(player.MundaneId).then(function(attendance) {
            if (attendance && attendance[0]) {
                var birthDate = moment(attendance[0].Date);
                var thisYearBirthday = birthDate.clone().set('year', moment().year());
                if (thisYearBirthday >= today && thisYearBirthday <= monthAway) {
                    player.birthDate = birthDate;
                    player.age = moment().year() - birthDate.year();
                    playerBirthdays.push(player);
                }
            }
            getNextPlayerBirthday(parkPlayers);
        });
    }
    getNextPlayerBirthday();
  });
}

function done() {
    if (playerBirthdays.length === 0) {
        document.getElementById('kingdom').disabled = false;
        document.getElementById('park').disabled = false;        
        // $('.noplayers').text('Generated on ' + new Date().toDateString());
        $('.working').attr('hidden', true);
        $('.noplayers').text('There are no players with Amtgard birthdays');
        return;
      }
      playerBirthdays.sort(function(a, b) {
          var aBirthday = a.birthDate.clone();
          aBirthday.set('year', moment().year());
          var bBirthday = b.birthDate.clone();
          bBirthday.set('year', moment().year());
        return aBirthday - bBirthday;
      });
      var lastPlayer = null;
      playerBirthdays.forEach(function(aPlayer) {
        var playerHTMLLine = '';
        var playerLine = (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '\t';
        if (lastPlayer && lastPlayer.Persona === aPlayer.Persona) {
          playerHTMLLine += '<tr><td></td>';
        } else {
          playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
          aPlayer.MundaneId + '">' +
          (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
        }
        playerLine += aPlayer.birthDate.format("dddd, MMMM Do YYYY") + '\t' + aPlayer.age;
        playerHTMLLine += '<td class="middle">' + aPlayer.birthDate.format("dddd, MMMM Do YYYY") + '</td><td class="middle">' + aPlayer.age + '</td><tr>';
        $('#playerTable').append(playerHTMLLine);
        playerContent += playerLine + '\r\n';
        lastPlayer = aPlayer;
      });
      $('.working').attr('hidden', true);
      $('.allresults').attr('hidden', false);
      document.getElementById('kingdom').disabled = false;
      document.getElementById('park').disabled = false;
}

function copyTextToClipboard(str) {
  var el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function copyToClipboard() {
  var allCSV = 'Player\tBirthday\tAmtgard Age\r\n';
  allCSV += playerContent;
  copyTextToClipboard(allCSV);
}

$(document).ready(function() {
  startUp();
});
