/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = null;
var playerContent = '';

function kingdomSelect(event, ui) {
  playerList = [];
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

function classesLeveled(classes) {
  return classes.filter(function(item) {
    var reconciledCredits = item.credits + item.reconciled;
    return (
      (reconciledCredits === 5 || reconciledCredits === 6) ||
      (reconciledCredits === 12 || reconciledCredits === 13) ||
      (reconciledCredits === 21 || reconciledCredits === 22) ||
      (reconciledCredits === 34 || reconciledCredits === 35) ||
      (reconciledCredits === 53 || reconciledCredits === 54)
    );
  });
}

function parkSelect(event, ui) {
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  $('.noplayers').text('');
  playerList = [];
  playerContent = '';
  if (event.target.value === '0') {
    return;
  }
  document.getElementById('kingdom').disabled = true;
  document.getElementById('park').disabled = true;
  $('.printtitle').text($('#kingdom option:selected').text() + ' - ' + $('#park option:selected').text());
  $('.generateddate').text('Generated on ' + new Date().toDateString());

  $('.working').attr('hidden', false);
  $('.working').text('Getting players....');
  var startDate = moment().subtract(1, 'months').isoWeekday(1).startOf('isoWeek');
  jsork.park.getPlayers(parseInt(event.target.value, 10), jsork.filters.ACTIVE).then(function(data) {
    var playersLeft = data.length;
    if (playersLeft === 0) {
      document.getElementById('kingdom').disabled = false;
      document.getElementById('park').disabled = false;
      $('.working').attr('hidden', true);
      $('.noplayers').text('There are no active players');
      return;
    }
    data.forEach(function(player) {
      jsork.player.getAttendanceFrom(player.MundaneId, startDate.format('MM/DD/YYYY')).then(function(attendances) {
        if (attendances.length > 0) {
          jsork.player.getClasses(player.MundaneId).then(function(classes) {
            $('.working').text('Number of players left to check ' + playersLeft);
            var leveled = classesLeveled(classes);
            if (leveled) {
              leveled.forEach(function(level) {
                var foundAttendance = attendances.find(function(attendance) { return attendance.ClassName === level.class } );
                if (foundAttendance) {
                  playerList.push({Persona: player.Persona, MundaneId: player.MundaneId, Class: level.class, Level: level.level, aquired: foundAttendance.Date });
                }
              });
            }
            if (--playersLeft <= 0) {
              donePlayers();  
            }
          }.bind(player));
        } else {
          $('.working').text('Number of players left to check ' + playersLeft);
          if (--playersLeft <= 0) {
            donePlayers();
          }
        }
      });
    });
  });
}

function donePlayers() {
  if (playerList.length === 0) {
    document.getElementById('kingdom').disabled = false;
    document.getElementById('park').disabled = false;        
    // $('.noplayers').text('Generated on ' + new Date().toDateString());
    $('.working').attr('hidden', true);
    $('.noplayers').text('There are no players who recently leveled');
    return;
  }
  playerList.sort(function(a, b) {
    return a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
  });
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
    playerLine += aPlayer.Class + '\t' + aPlayer.Level + '\t' + aPlayer.aquired;
    playerHTMLLine += '<td class="middle">' + aPlayer.Class + '</td><td class="middle">' + aPlayer.Level + '</td><td class="middle">' + aPlayer.aquired + '</td><tr>';
    $('#playerTable').append(playerHTMLLine);
    playerContent += playerLine + '\r\n';
    lastPlayer = aPlayer;
  });
  $('.working').attr('hidden', true);
  $('.allresults').attr('hidden', false);
  document.getElementById('kingdom').disabled = false;
  document.getElementById('park').disabled = false;
}

function initKingdoms() {
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
  var allCSV = 'Persona\tClass\tLevel\tWhen did they level\r\n';
  allCSV += playerContent;
  copyTextToClipboard(allCSV);
}

$(document).ready(function() {
  startUp();
});
