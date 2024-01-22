/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = null;
var playerContent = '';
var dotCount = 1;
var callCount = 0;
var startDate;
var attendingDate;
var endDate = moment();

function initParks() {
  playerList = [];
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  $('.noplayers').text(' ');
  $('#enddate').val(endDate.format('YYYY-MM-DD'));
  dateChange();

  jsork.kingdom.getParks(27).then(function (data) {
    data.sort(function (a, b) {
      return a.Name.toLowerCase().localeCompare(b.Name.toLowerCase());
    });
    var kSelect = $('#park');
    var emptyOption = $('<option>');
    emptyOption.html('Choose a Park');
    emptyOption.val(0);
    kSelect.append(emptyOption);
    data.forEach(function (park) {
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
  document.getElementById('enddate').disabled = true;
  $('.printtitle').text($('#park option:selected').text());
  $('.generateddate').text(
    'Attendance from ' +
    startDate.format('ddd MMM Do, YYYY [Week] w') +
    ' To ' +
    endDate.format('ddd MMM Do, YYYY [Week] w'));

  $('.working').attr('hidden', false);
  $('.working').text('Gathering the players...');
  jsork.park.getPlayers(parseInt(event.target.value, 10), jsork.filters.ACTIVE).then(function (data) {
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
    data.forEach(function (player) {
      updateWorkingMessage();
      jsork.player.getLastAttendance(player.MundaneId).then(function (lastAttendance) {
        if (lastAttendance.length > 0) {
          var playerWeeks = {};
          jsork.player.getAttendanceFrom(player.MundaneId, startDate.format('MM/DD/YYYY')).then(function (sixMonthAttendance) {
            sixMonthAttendance.forEach(function (attendance) {
              if (moment(attendance.Date) <= endDate) {
                if (attendance.KingdomId === 27 || attendance.EventKingdomId === 27) {
                  if (!playerWeeks[moment(attendance.Date).week()]) {
                    playerWeeks[moment(attendance.Date).week()] = [];
                  }
                  playerWeeks[moment(attendance.Date).week()].push(attendance);
                }
              }
            });
            if (Object.keys(playerWeeks).length > 0) {
              // Need full attendance to check park affiliation
              jsork.player.getAttendance(player.MundaneId).then(function (allAttendance) {
                // Reduce this to the attendance that is before the start of the six month window
                // and where the park is the same as the players park
                allAttendance = allAttendance.filter(function(attendance) {
                  return moment(attendance.Date) <= attendingDate && attendance.ParkId === player.ParkId;
                });
                jsork.player.getInfo(player.MundaneId).then(function (playerInfo) {
                  var duesForLife = false;
                  playerInfo.DuesPaidList.forEach(function (dues) { if (dues.DuesForLife) { duesForLife = true } });
                  if (!playerInfo.Suspended) {
                    playerList.push({
                      Persona: playerInfo.Persona,
                      UserName: playerInfo.UserName,
                      MundaneId: playerInfo.MundaneId,
                      DuesThrough: playerInfo.DuesThrough,
                      DuesPaid: duesForLife || moment(playerInfo.DuesThrough) > moment(),
                      Waivered: playerInfo.Waivered !== 0,
                      attendance: playerWeeks,
                      duesForLife: duesForLife,
                      ThreeMonthsHomeChapter: allAttendance.length > 0
                    });
                  }
                  $('.working').text('Number of players left to check ' + playersLeft);
                  if (--playersLeft <= 0) {
                    donePlayers();
                  }
                });
              });
            } else {
              $('.working').text('Number of players left to check ' + playersLeft);
              if (--playersLeft <= 0) {
                donePlayers();
              }
            }
          });
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
    document.getElementById('park').disabled = false;
    document.getElementById('enddate').disabled = false;
    // $('.noplayers').text('Generated on ' + new Date().toDateString());
    $('.working').attr('hidden', true);
    $('.noplayers').text('There are no players returned in the results');
    return;
  }
  playerList.sort(function (a, b) {
    var aPersona = a.Persona !== null ? a.Persona : '';
    var bPersona = b.Persona !== null ? b.Persona : '';
    var personaSort = aPersona.toLowerCase().localeCompare(bPersona.toLowerCase());
    var canVoteA = a.DuesPaid && Object.keys(a.attendance).length >= 6 && a.ThreeMonthsHomeChapter && a.Waivered;
    var canVoteB = b.DuesPaid && Object.keys(b.attendance).length >= 6 && b.ThreeMonthsHomeChapter && b.Waivered;
    if (canVoteA === canVoteB) {
      return personaSort;
    }
    return canVoteB ? 1 : -1;
  });
  var lastPlayer = null;
  playerList.forEach(function (aPlayer) {
    var playerHTMLLine = '';
    var attendanceNumber = Object.keys(aPlayer.attendance).length;
    // var canVote = aPlayer.DuesPaid && attendanceNumber >= 7 && aPlayer.sixMonthsPlayed;
    // TEMPORARY
    var canVote = aPlayer.DuesPaid && attendanceNumber >= 6 && aPlayer.ThreeMonthsHomeChapter && aPlayer.Waivered;
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
    playerLine += canVote + '\t' + aPlayer.Waivered + '\t' + aPlayer.DuesPaid + '\t' + attendanceNumber + '\t' + aPlayer.ThreeMonthsHomeChapter + '\t';
    var firstTime = true;
    Object.keys(aPlayer.attendance).forEach(function(aWeek) {
      if (firstTime) {
        firstTime = false;
      } else {
        playerLine += ' ';
      }
      playerLine += aWeek;
    });

    playerHTMLLine += '<td ' + (canVote ? 'class="lightgreen"' : '') + '>' + (canVote ? 'Vote' : 'Can\'t Vote') + '</td>';
    playerHTMLLine += '<td class="middle ' + (aPlayer.Waivered ? 'lightgreen' : 'lightred') + '">' + (aPlayer.Waivered ? 'Waivered' : 'Sign Waiver') + '</td>';
    playerHTMLLine += '<td class="middle ' + (aPlayer.DuesPaid ? 'lightgreen' : 'lightred') + '">' + (aPlayer.DuesPaid ? (aPlayer.duesForLife ? "Dues for Life" : aPlayer.DuesThrough) : 'Pay Dues') + '</td>';
    playerHTMLLine += '<td class="middle ' + (attendanceNumber >= 6 ? 'lightgreen' : 'lightred') + '">' + attendanceNumber + '</td>';
    playerHTMLLine += '<td class="middle ' + (aPlayer.ThreeMonthsHomeChapter ? 'lightgreen' : 'lightred') + '">' + (aPlayer.ThreeMonthsHomeChapter ? 'Yes' : 'No') + '</td>';
    $('#playerTable').append(playerHTMLLine);
    playerContent += playerLine + '\r\n';
    lastPlayer = aPlayer;
  });
  $('.reportspan').hide();
  $('.working').attr('hidden', true);
  $('.allresults').attr('hidden', false);
  document.getElementById('park').disabled = false;
  document.getElementById('enddate').disabled = false;
}

function startUp() {
  $('#park').on('change', parkSelect);
  $('#dateselect').on('change', dateChange);
  initParks();
}

function dateChange() {
  var ed = $('#enddate').val();
  endDate = moment(ed);
  startDate = moment(endDate).subtract(6, 'months').startOf('week');
  attendingDate = moment(endDate).subtract(3, 'months').startOf('week')
  $('.reportspan').show();
  $('.reportspan').text(
    'Attendance will be calculated from ' +
    startDate.format('ddd MMM Do, YYYY [Week] w') +
    ' To ' +
    endDate.format('ddd MMM Do, YYYY [Week] w')
  );

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
  var allCSV = 'Persona\tCan Vote\tSigned Waiver\tDues Paid\tWeeks of Attendance\tThree Months in Home Chapter\tThe Week numbers of attendance\r\n';
  allCSV += playerContent;
  copyTextToClipboard(allCSV);
}

$(document).ready(function () {
  startUp();
});
