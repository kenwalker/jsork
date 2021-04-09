/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = null;
var playerContent = '';
var uniquePlayerIDs = {};
var playerList = [];
var numberOfDays = 0;
var startDate;
var endDate;

function kingdomSelect(event, ui) {
  playerList = [];
  uniquePlayerIDs = {};
  $('.numberofuniqueplayers').text('');
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  $('.noplayers').text(' ');
  if (event.target.value === '0') {
    return;
  }
  document.getElementById('kingdom').disabled = true;
  document.getElementById('park').disabled = true;
  document.getElementById('startdate').disabled = true;
  document.getElementById('enddate').disabled = true;
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
    document.getElementById('startdate').disabled = false;
    document.getElementById('enddate').disabled = false;
    });
}

function parkSelect(event, ui) {
  playerList = [];
  uniquePlayerIDs = {};
  localPlayersOnly = $('#localonly').is(":checked");
  startDate = moment($('#startdate').val());
  endDate = moment($('#enddate').val());
  if (startDate > endDate) {
    alert("End date before start date silly");
    return;
  }
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  $('.noplayers').text('');
  playerList = [];
  playerContent = '';
  if (event.target.value === '0') {
    return;
  }
  numberOfDays = endDate.diff(startDate, "days") + 1;
  document.getElementById('kingdom').disabled = true;
  document.getElementById('park').disabled = true;
  document.getElementById('startdate').disabled = true;
  document.getElementById('enddate').disabled = true;
  $('.printtitle').text($('#kingdom option:selected').text() + ' - ' + $('#park option:selected').text());
  $('.generateddate').text('Generated on ' + new Date().toDateString());

  $('.working').attr('hidden', false);
  $('.working').text('Getting ' + numberOfDays + ' days of attendance....');

  for (var m = startDate; startDate.isSameOrBefore(endDate); startDate.add(1, 'days')) {
    var parkId = parseInt(event.target.value, 10);
    jsork.park.getAttendance(parkId, startDate.toDate()).then(function(attendanceForDay) {
      attendanceForDay.forEach(function(player) {
        if (localPlayersOnly && player.FromParkId !== parkId) {

        } else {
          if (!uniquePlayerIDs[player.MundaneId]) {
            uniquePlayerIDs[player.MundaneId] = player;
          }
        }
      });
      numberOfDays--;
      if (numberOfDays ===0) {
        playerList = Object.values(uniquePlayerIDs);

        playerList.sort(function(a, b) {
          var personaSort = a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
          var parkSort = a.FromParkName.toLowerCase().localeCompare(b.FromParkName.toLowerCase());
          var kingdomSort = a.FromKingdomName.toLowerCase().localeCompare(b.FromKingdomName.toLowerCase());
          if (kingdomSort !== 0) {
            return kingdomSort;
          }
          if (parkSort !== 0) {
            return parkSort;
          }
          return personaSort;
        });
        donePlayers();
      }
    });
  }
}

function donePlayers() {
  var sd = $('#startdate').val();
  var ed = $('#enddate').val();
  $('.numberofuniqueplayers').text(playerList.length + ' unique players between ' + sd + ' and ' + ed);

  if (playerList.length === 0) {
    document.getElementById('kingdom').disabled = false;
    document.getElementById('park').disabled = false;
    document.getElementById('startdate').disabled = false;
    document.getElementById('enddate').disabled = false;
    $('.working').attr('hidden', true);
    $('.noplayers').text('There are no players who attended those dates');
    return;
  }
  var lastPlayer = null;
  playerList.forEach(function(aPlayer) {
    var playerHTMLLine = '';
    var playerLine = (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '\t';
    if (lastPlayer && lastPlayer.Persona === aPlayer.Persona) {
      playerHTMLLine += '<tr><td></td>';
    } else {
      playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
      aPlayer.MundaneId + '">' +
      (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
    }
    playerLine += aPlayer.FromParkName + '\t' + aPlayer.FromKingdomName;
    playerHTMLLine += '<td>' + aPlayer.FromParkName + '</td><td>' + aPlayer.FromKingdomName + '</td><tr>';
    $('#playerTable').append(playerHTMLLine);
    playerContent += playerLine + '\r\n';
    lastPlayer = aPlayer;
  });
  $('.working').attr('hidden', true);
  $('.allresults').attr('hidden', false);
  document.getElementById('kingdom').disabled = false;
  document.getElementById('park').disabled = false;
  document.getElementById('startdate').disabled = false;
  document.getElementById('enddate').disabled = false;

}

function initKingdoms() {
  var today = moment();
  $('#enddate').val(today.format('YYYY-MM-DD'));
  $('#startdate').val(today.subtract(1, "days").format('YYYY-MM-DD'));
  $('#parkselect').attr('hidden', true);
  $('.working').attr('hidden', true);
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

function copyTextToClipboard(str) {
  var el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function copyToClipboard() {
  var allCSV = 'Persona (' + playerList.length + ' unique players)\tPark\tKingdom\r\n';
  allCSV += playerContent;
  copyTextToClipboard(allCSV);
}

$(document).ready(function() {
  startUp();
});
