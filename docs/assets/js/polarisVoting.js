/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = null;
var playerContent = '';
var dotCount = 1;
var callCount = 0;
var today = moment();
var startDate = moment(today).subtract(6, 'months').isoWeekday(1).startOf('isoWeek');

function initParks() {
  playerList = [];
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  $('.noplayers').text(' ');

  jsork.kingdom.getParks(27).then(function(data) {
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
    document.getElementById('park').disabled = false;
  });
}

function updateWorkingMessage() {
  if (callCount++ % 5) {
    $('.working').text('Gathering the players' + '.'.repeat(dotCount++));
    if (dotCount > 5) {
      dotCount = 0;
    }
  }
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
  document.getElementById('park').disabled = true;
  $('.printtitle').text($('#park option:selected').text());
  $('.generateddate').text(
    'Attendance from ' +
    startDate.format('ddd MMM Do, YYYY [Week] w') +
    ' To ' +
    today.format('ddd MMM Do, YYYY [Week] w'));

  $('.working').attr('hidden', false);
  $('.working').text('Gathering the players...');
  jsork.park.getPlayers(parseInt(event.target.value, 10), jsork.filters.ACTIVE).then(function(data) {
  // jsork.park.getActivePlayers(parseInt(event.target.value, 10)).then(function(data) {
    var playersLeft = data.length;
    if (playersLeft === 0) {
      document.getElementById('kingdom').disabled = false;
      document.getElementById('park').disabled = false;
      $('.working').attr('hidden', true);
      $('.noplayers').text('There are no active players');
      return;
    }
    $('.working').text('Number of players left to check ' + playersLeft);
    data.forEach(function(player) {
      updateWorkingMessage();
      jsork.player.getLastAttendance(player.MundaneId).then(function(lastAttendance) {
        if (lastAttendance.length > 0) {
          var playerWeeks = {};
          jsork.player.getAttendanceFrom(player.MundaneId, startDate.format('MM/DD/YYYY')).then(function(allAttendance) {
            allAttendance.forEach(function(attendance) {
              if (moment(attendance.Date) <= today) {
                if (attendance.ParkId === (parseInt(event.target.value, 10)) || attendance.EventParkId === (parseInt(event.target.value, 10))) {
                    playerWeeks[Object.keys(playerWeeks).length.toString()] = [];
                }
              }
            });
            if (Object.keys(playerWeeks).length >= 0) {
              jsork.player.getInfo(player.MundaneId).then(function(playerInfo) {
                var duesForLife = false;
                playerInfo.DuesPaidList.forEach(function(dues) { if (dues.DuesForLife) { duesForLife = true } });
                if (!playerInfo.Suspended) {
                  playerList.push({
                    Persona: playerInfo.Persona,
                    UserName: playerInfo.UserName,
                    MundaneId: playerInfo.MundaneId,
                    DuesThrough: playerInfo.DuesThrough,
                    DuesPaid: duesForLife || moment(playerInfo.DuesThrough) > moment(),
                    Waivered: playerInfo.Waivered !== 0,
                    attendance: playerWeeks,
                    duesForLife: duesForLife
                  });
                }
                $('.working').text('Number of players left to check ' + playersLeft);
                if (--playersLeft <= 0) {
                  checkFirstAttendance();
                }
              });
            } else {
              $('.working').text('Number of players left to check ' + playersLeft);
              if (--playersLeft <= 0) {
                checkFirstAttendance();
              }
            }
          })
        } else {
          $('.working').text('Number of players left to check ' + playersLeft);
          if (--playersLeft <= 0) {
            checkFirstAttendance();
          }
        }
      });
    });
  });
}

function checkFirstAttendance() {
  var playersLeft = playerList.length;
  if (playerList.length === 0) {
    donePlayers();
  } else {
    $('.working').text('Checking first attendance date....');
    playerList.forEach(function(aPlayer) {
      jsork.player.getFirstAttendance(aPlayer.MundaneId).then(function(attendance) {
        if (moment(attendance[0].Date) <= startDate) {
          aPlayer.sixMonthsPlayed = true;
        } else {
          aPlayer.sixMonthsPlayed = false;
        }
        aPlayer.firstAttendance = attendance[0].Date;
        $('.working').text('Number of players left to check first attendance ' + playersLeft);
        if (--playersLeft <= 0) {
          donePlayers();
        }
      });
    });
  }
}

function donePlayers() {
  if (playerList.length === 0) {
    document.getElementById('park').disabled = false;        
    // $('.noplayers').text('Generated on ' + new Date().toDateString());
    $('.working').attr('hidden', true);
    $('.noplayers').text('There are no players returned in the results');
    return;
  }
  playerList.sort(function(a, b) {
    var aPersona = a.Persona !== null ? a.Persona : '';
    var bPersona = b.Persona !== null ? b.Persona : '';
    var personaSort = aPersona.toLowerCase().localeCompare(bPersona.toLowerCase());
    var canVoteA = a.DuesPaid && Object.keys(a.attendance).length >= 6;
    var canVoteB = b.DuesPaid && Object.keys(b.attendance).length >= 6;
    if (canVoteA === canVoteB) {
      return personaSort;
    }
    return canVoteB ? 1 : -1;
  });
  var lastPlayer = null;
  playerList.forEach(function(aPlayer) {
    var playerHTMLLine = '';
    var attendanceNumber = Object.keys(aPlayer.attendance).length;
    // var canVote = aPlayer.DuesPaid && attendanceNumber >= 7 && aPlayer.sixMonthsPlayed;
    // TEMPORARY
    var canVote = aPlayer.DuesPaid && attendanceNumber >= 6;
    var playerLine = (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '\t';
    if (lastPlayer && lastPlayer.Persona === aPlayer.Persona) {
      playerHTMLLine += '<tr><td></td>';
    } else {
      if (canVote) {
        playerHTMLLine += '<tr class="lightgreen">';
      } else {
        playerHTMLLine += '<tr>';
      }
      playerHTMLLine += '<td ' + (canVote ? 'class="lightgreen"' : '') + '><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
      aPlayer.MundaneId + '">' +
      (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
    }
    playerLine += canVote + '\t' + aPlayer.Waivered + '\t' + aPlayer.DuesPaid + '\t' + attendanceNumber;
    playerHTMLLine += '<td ' + (canVote ? 'class="lightgreen"' : '') + '>' + (canVote ? 'Vote' : 'Can\'t Vote') + '</td>';
    playerHTMLLine += '<td class="middle ' + (aPlayer.Waivered ? 'lightgreen' : 'lightyellow') + '">' + (aPlayer.Waivered ? 'Waivered' : 'Should Sign Waiver') + '</td>';
    playerHTMLLine += '<td class="middle ' + (aPlayer.DuesPaid ? 'lightgreen' : 'lightred') + '">' + (aPlayer.DuesPaid ? (aPlayer.duesForLife ? "Dues for Life" : aPlayer.DuesThrough) : 'Pay Dues') + '</td>';
    playerHTMLLine += '<td class="middle ' + (attendanceNumber >= 6 ? 'lightgreen' : 'lightred') + '">' + attendanceNumber + '</td>';
    $('#playerTable').append(playerHTMLLine);
    playerContent += playerLine + '\r\n';
    lastPlayer = aPlayer;
  });
  $('.working').attr('hidden', true);
  $('.allresults').attr('hidden', false);
  document.getElementById('park').disabled = false;
}

function startUp() {
  $('#park').on('change', parkSelect);
  initParks();
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
  var allCSV = 'Persona\tCan Vote\tSigned Waiver\tDues Paid\tDays of Attendance\r\n';
  allCSV += playerContent;
  copyTextToClipboard(allCSV);
}

$(document).ready(function() {
  startUp();
});
