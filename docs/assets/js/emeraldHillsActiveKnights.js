/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = [];
var allKnights = [];
var playerContent = '';
var dotCount = 1;
var callCount = 0;
// var today = moment(new Date("03/17/2020"));
// var today = moment().startOf('week').isoWeekday(2);
var today = moment();
var startDate = moment(today).subtract(6, 'months').startOf('week').isoWeekday(2);
// var begin = moment(date).startOf('week').isoWeekday(1);

function updateWorkingMessage() {
  if (callCount++ % 5) {
    $('.working').text('Gathering the players' + '.'.repeat(dotCount++));
    if (dotCount > 5) {
      dotCount = 0;
    }
  }
}

function doKnights() {
  $('.working').text('Getting Kingdom Knights');
  jsork.kingdom.getKnights(6).then(function(result) {
    result.forEach(function(aKnight) {
        if (!allKnights.find(function(aMatch) {
            return aMatch.MundaneId === aKnight.MundaneId;
        })) {
            allKnights.push(aKnight);
        }
    });
    doPlayers();
  });
};

function doPlayers() {
    $('.working').text('Gathering the data...');
    data = allKnights.slice();
    var playersLeft = data.length;
    if (playersLeft === 0) {
        document.getElementById('kingdom').disabled = false;
        $('.working').attr('hidden', true);
        $('.noplayers').text('There are no active players');
        return;
    }
    $('.working').text('Number of players left to check ' + playersLeft);
    data.forEach(function (player) {
        updateWorkingMessage();
        var isKnight = allKnights.find(function (aKnight) { return aKnight.MundaneId === player.MundaneId });
        player.IsKnight = isKnight;
        jsork.player.getLastAttendance(player.MundaneId).then(function (lastAttendance) {
            if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) >= startDate) {
                var playerWeeks = {};
                jsork.player.getAttendanceFrom(player.MundaneId, startDate.format('MM/DD/YYYY')).then(function (allAttendance) {

                    allAttendance.forEach(function (attendance) {
                        if (moment(attendance.Date) <= today) {
                            if (attendance.KingdomId === 6 || attendance.EventKingdomId === 6) {
                                if (!playerWeeks[moment(attendance.Date).startOf('week').isoWeekday(2).isoWeek()]) {
                                    playerWeeks[moment(attendance.Date).startOf('week').isoWeekday(2).isoWeek()] = [];
                                }
                                playerWeeks[moment(attendance.Date).startOf('week').isoWeekday(2).isoWeek()].push(attendance);
                            }
                        }
                    });
                    if (Object.keys(playerWeeks).length >= 0) {
                        jsork.player.getInfo(player.MundaneId).then(function (playerInfo) {
                            var duesForLife = false;
                            playerInfo.DuesPaidList.forEach(function (dues) { if (dues.DuesForLife) { duesForLife = true } });
                            if (!playerInfo.Suspended) {
                                playerList.push({
                                    Persona: playerInfo.Persona || "",
                                    UserName: playerInfo.UserName,
                                    MundaneId: playerInfo.MundaneId,
                                    DuesThrough: playerInfo.DuesThrough,
                                    DuesPaid: duesForLife || moment(playerInfo.DuesThrough) >= today,
                                    DuesForLife: duesForLife,
                                    Waivered: playerInfo.Waivered !== 0,
                                    attendance: playerWeeks,
                                    IsKnight: player.IsKnight
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
}

function checkFirstAttendance() {
  var playersLeft = playerList.length;
  if (playerList.length === 0) {
    donePlayers();
  } else {
    $('.working').text('Checking first attendance date....');
    playerList.forEach(function(aPlayer) {
      jsork.player.getFirstAttendance(aPlayer.MundaneId).then(function(attendance) {
        if (moment(attendance[0].Date) <= startDate || attendance[0].Date === '0000-00-00') {
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
    $('.working').attr('hidden', true);
    $('.noplayers').text('There are no players returned in the results');
    return;
  }
  playerList.sort(function(a, b) {
    var personaSort = a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
    var canVoteA = a.Waivered && a.DuesPaid && Object.keys(a.attendance).length >= 6 && a.sixMonthsPlayed;
    var canVoteB = b.Waivered && b.DuesPaid && Object.keys(b.attendance).length >= 6 && b.sixMonthsPlayed;
    if (canVoteA === canVoteB) {
      return personaSort;
    }
    return canVoteB ? 1 : -1;
  });
  var lastPlayer = null;
  playerList.forEach(function(aPlayer) {
    // var allowedTwoPerWeek = Object.values(aPlayer.attendance).reduce(function(count, att) { return count + Math.min(2, att.length) }, 0);
    var playerHTMLLine = '';
    var attendanceNumber = Object.keys(aPlayer.attendance).length;
    var canVote = aPlayer.Waivered && aPlayer.DuesPaid && attendanceNumber >= 6 && aPlayer.sixMonthsPlayed;
    aPlayer.ActiveKnight = attendanceNumber >= 8 && canVote;
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
        aPlayer.MundaneId + '" target="_blank">' +
        (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
    }
    playerLine += canVote + '\t' + aPlayer.Waivered + '\t' + aPlayer.DuesPaid + '\t' + attendanceNumber + '\t' + aPlayer.sixMonthsPlayed + '\t' + aPlayer.firstAttendance + '\t' + aPlayer.ActiveKnight + '\t';
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
    playerHTMLLine += '<td class="middle ' + (aPlayer.Waivered ? 'lightgreen' : 'lightred') + '">' + (aPlayer.Waivered ? 'Waivered' : 'Must sign Waiver') + '</td>';
    playerHTMLLine += '<td class="middle ' + (aPlayer.DuesPaid ? 'lightgreen' : 'lightred') + '">' + (aPlayer.DuesPaid ? (aPlayer.DuesForLife ? "Dues for Life" : aPlayer.DuesThrough) : 'Must Pay Dues') + '</td>';
    playerHTMLLine += '<td class="middle ' + (attendanceNumber >= 6 ? 'lightgreen' : 'lightred') + '">' + attendanceNumber + '</td>';
    playerHTMLLine += '<td class="middle ' + (aPlayer.sixMonthsPlayed ? 'lightgreen' : 'lightred') + '">' + aPlayer.firstAttendance + '</td>';
    if (aPlayer.IsKnight) {
      playerHTMLLine += '<td class="middle ' + (aPlayer.ActiveKnight ? 'lightgreen':'lightred') + '">' + (aPlayer.ActiveKnight ? "Yes" : "No") + '</td>';
    } else {
      playerHTMLLine += '<td class="middle white"></td>';
    }
    playerHTMLLine += '</tr>';
    $('#playerTable').append(playerHTMLLine);
    playerContent += playerLine + '\r\n';
    lastPlayer = aPlayer;
  });
  $('.working').attr('hidden', true);
  $('.allresults').attr('hidden', false);
}

function startUp() {
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    $('.noplayers').text('');
    playerList = [];
    allKnights = [];
    playerContent = '';
    $('.generateddate').text(
      'Attendance from ' +
      startDate.format('ddd MMM Do, YYYY [Week] W') +
      ' To ' +
      today.format('ddd MMM Do, YYYY [Week] W'));
  
    $('.working').attr('hidden', false);
    doKnights();
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
  var allCSV = 'Persona\tCan Vote\tSigned Waiver\tDues Paid\tWeeks of Attendance\tSix Months Played\tFirst Attendance\tActive Knight\tThe Week numbers of attendance\r\n';
  allCSV += playerContent;
  copyTextToClipboard(allCSV);
}

$(document).ready(function() {
  startUp();
});