/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = null;
var playerContent = '';
var dotCount = 1;
var callCount = 0;
var startDate;
var endDate = moment();
var startTime = Date.now();
var howManyPlayersChecked = 0;
var dotCount = 0;
var activePlayers = [];
var totalActive = 0;
var selectedPark = 0;
var wholeKingdom = false;
var olderPlayers = 0;
var fourteenMonthsAgo = moment(startTime).subtract(14, "months");


function initParks() {
    playerList = [];
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    $('.noplayers').text(' ');
}

function updateWorkingMessage() {
    howManyPlayersChecked++;
    if (howManyPlayersChecked % 5 === 0) {
        var avgCallTime = (Date.now() - startTime) / howManyPlayersChecked;
        var timeLeft = moment.duration(avgCallTime * (totalActive - howManyPlayersChecked) / 1000, "seconds").humanize();
        $('.working').text('Number of Knights left to check ' + (totalActive - howManyPlayersChecked) + ", time left " + timeLeft);
        if (dotCount > 5) {
            dotCount = 0;
        }
    }
}

function runReport() {
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    $('.noplayers').text('');
    $('#allinputs').hide();
    playerList = [];
    playerContent = '';
    dotCount = 1;
    callCount = 0;
    howManyPlayersChecked = 0;
    activePlayers = [];
    totalActive = 0;
    olderPlayers = 0;
    startTime = Date.now();

    $('.generateddate').text(
        'Attendance from ' +
        startDate.format('ddd MMM Do, YYYY [Week] w') +
        ' To ' +
        endDate.format('ddd MMM Do, YYYY [Week] w'));
    $('.working').attr('hidden', false);
    $('.working').text('Getting Kingdom Knights');
    var allKnights = [];
    jsork.kingdom.getKnights(14).then(function(result) {
      result.forEach(function(aKnight) {
          if (!allKnights.find(function(aMatch) {
              return aMatch.MundaneId === aKnight.MundaneId;
          })) {
              allKnights.push(aKnight);
          }
      });
      activePlayers = allKnights;
      totalActive = activePlayers.length;
      checkNextPlayer();
    });
}

function checkNextPlayer() {
    if (activePlayers.length === 0) {
        donePlayers();
        return;
    }
    var player = activePlayers.pop();
    updateWorkingMessage();
    jsork.player.getLastAttendance(player.MundaneId).then(function (lastAttendance) {
        if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) >= startDate) {
            var playerWeeks = {};
            jsork.player.getAttendanceFrom(player.MundaneId, startDate.format('MM/DD/YYYY')).then(function (allAttendance) {
                allAttendance.reverse();
                allAttendance.forEach(function (attendance) {
                    var dow = moment(attendance.Date).isoWeekday();
                    if (moment(attendance.Date) <= endDate) {
                        playerWeeks[Object.keys(playerWeeks).length.toString()] = moment(attendance.Date).format("ddd, MMM Do YYYY");
                    }
                });
                if (Object.keys(playerWeeks).length >= 0) {
                    jsork.player.getInfo(player.MundaneId).then(function (playerInfo) {
                        var duesForLife = false;
                        playerInfo.DuesPaidList.forEach(function (dues) {
                            if (dues.DuesForLife) { duesForLife = true }
                        });
                        if (!playerInfo.Suspended) {
                            playerList.push({
                                ParkName: player.ParkName,
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
                        if (playerWeeks.length > 6) {
                            activePlayers = [];
                        }
                        checkNextPlayer();
                    });
                } else {
                    checkNextPlayer();
                }
            })
        } else {
            if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) < fourteenMonthsAgo) {
                olderPlayers++;
            }
            checkNextPlayer();
        }
    });
}

function checkFirstAttendance() {
    var playersLeft = playerList.length;
    if (playerList.length === 0) {
        donePlayers();
    } else {
        $('.working').text('Checking first attendance date....');
        playerList.forEach(function (aPlayer) {
            jsork.player.getFirstAttendance(aPlayer.MundaneId).then(function (attendance) {
                if (moment(attendance[0].Date) <= startDate) {
                    aPlayer.sixMonthsPlayed = true;
                } else {
                    aPlayer.sixMonthsPlayed = false;
                }
                aPlayer.firstAttendance = attendance[0].Date;
                $('.working').text('Number of Knights left to check first attendance ' + playersLeft);
                if (--playersLeft <= 0) {
                    donePlayers();
                }
            });
        });
    }
}

function parkSelect(event, ui) {
    if (event.target.value === '0') {
      return;
    }
    selectedPark = parseInt(event.target.value, 10);
}

function donePlayers() {
    if (playerList.length === 0) {
        // $('.noplayers').text('Generated on ' + new Date().toDateString());
        $('.working').attr('hidden', true);
        $('.noplayers').text('There are no Knights returned in the results');
        $('#allinputs').show();
        return;
    }
    playerList.sort(function (a, b) {
        var parkSort = a.ParkName.toLowerCase().localeCompare(b.ParkName.toLowerCase());
        var personaSort = a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
        var canVoteA = a.DuesPaid && Object.keys(a.attendance).length >= 7 && a.Waivered;
        var canVoteB = b.DuesPaid && Object.keys(b.attendance).length >= 7 && b.Waivered;
        if (canVoteA === canVoteB) {
            if (parkSort === 0) {
                return personaSort;
            }
            return parkSort;
        }
        return canVoteB ? 1 : -1;
    });
    var lastPlayer = null;
    playerList.forEach(function (aPlayer) {
        var playerHTMLLine = '';
        var attendanceNumber = Object.keys(aPlayer.attendance).length;
        var contributing = aPlayer.DuesPaid && attendanceNumber >= 7 && aPlayer.Waivered;
        var active = aPlayer.DuesPaid && attendanceNumber >= 12 && aPlayer.Waivered;
        var playerLine = aPlayer.ParkName + '\t' + (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '\t';
        if (active) {
            playerHTMLLine += '<tr class="lightgreen">';
        } else {
            playerHTMLLine += '<tr>';
        }
        playerHTMLLine += '<td ' + (contributing ? 'class="lightgreen"' : '') + '>' + aPlayer.ParkName + '</td><td ' + (contributing ? 'class="lightgreen"' : '') + '><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
            aPlayer.MundaneId + '">' +
            (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
        playerLine += contributing + '\t' + active + '\t' + aPlayer.Waivered + '\t' + aPlayer.DuesPaid + '\t' + attendanceNumber + '\t';
        playerHTMLLine += '<td ' + (contributing ? 'class="lightgreen"' : '') + '>' + (contributing ? 'Yes' : 'No') + '</td>';
        playerHTMLLine += '<td ' + (contributing ? 'class="lightgreen"' : '') + '>' + (active ? 'Yes' : 'No') + '</td>';
        playerHTMLLine += '<td class="middle ' + (aPlayer.Waivered ? 'lightgreen' : 'lightred') + '">' + (aPlayer.Waivered ? 'Waivered' : 'Sign Waiver') + '</td>';
        playerHTMLLine += '<td class="middle ' + (aPlayer.DuesPaid ? 'lightgreen' : 'lightred') + '">' + (aPlayer.DuesPaid ? (aPlayer.duesForLife ? "Dues for Life" : aPlayer.DuesThrough) : 'Pay Dues') + '</td>';
        playerHTMLLine += '<td class="middle ' + (attendanceNumber >= 7 ? 'lightgreen' : 'lightred') + '">' + attendanceNumber + '</td>';
        playerHTMLLine += '</tr>';
        // Temporary
        // playerHTMLLine += '<td class="middle ' + (attendanceNumber >= 7 ? 'lightgreen' : 'lightgreen') + '">' + attendanceNumber + '</td>';
        // playerHTMLLine += '<td class="middle ' + (aPlayer.sixMonthsPlayed ? 'lightgreen' : 'lightred') + '">' + aPlayer.firstAttendance + '</td>';
        $('#playerTable').append(playerHTMLLine);
        Object.keys(aPlayer.attendance).forEach(function (aKey, index) {
            playerLine += aPlayer.attendance[aKey];
            if (index < attendanceNumber - 1) {
                playerLine += ', ';
            }
        });
        playerContent += playerLine + '\r\n';
        lastPlayer = aPlayer;
    });
    if (olderPlayers > 0) {
        $('#oldPlayers').html("<b>There are " + olderPlayers + " Knight(s) who have not played in 14 months, maybe run the <a href='https://kenwalker.github.io/jsork/shouldBeRetired.html'>Should be retired</a> report?</b><br>");
    }
    $('.working').attr('hidden', true);
    $('.allresults').attr('hidden', false);
    $('#allinputs').show();
}

function startUp() {
    $('#dateselect').on('change', dateChange);
    $('#enddate').val(endDate.format('YYYY-MM-DD'));
    dateChange();
    $('#park').on('change', parkSelect);
    $('#wholekingdom').on('change', wholeKingdomChange);
    initParks();
}

function dateChange() {
    var ed = $('#enddate').val();
    endDate = moment(ed);
    startDate = moment(endDate).subtract(6, 'months');
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
    var allCSV = 'Park\tKnight Persona\tContributing\tActive\tWaivered\tDues Paid\tDays of Attendance\tAll Attendances\r\n';
    allCSV += playerContent;
    copyTextToClipboard(allCSV);
}

$(document).ready(function () {
    startUp();
});
