/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = null;
var playerContent = '';
var dotCount = 1;
var callCount = 0;
var today = moment();
var startDate = moment(today).subtract(6, 'months').isoWeekday(1).startOf('isoWeek');

function updateWorkingMessage() {
    if (callCount++ % 5) {
        $('.working').text('Gathering the players' + '.'.repeat(dotCount++));
        if (dotCount > 5) {
            dotCount = 0;
        }
    }
}

function findParagons() {
    playerList = [];
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    $('.noplayers').text('');
    playerList = [];
    playerContent = '';

    $('.printtitle').text($('#park option:selected').text());
    $('.generateddate').text(
        'Attendance from ' +
        startDate.format('ddd MMM Do, YYYY [Week] w') +
        ' To ' +
        today.format('ddd MMM Do, YYYY [Week] w'));

    $('.working').attr('hidden', false);
    $('.working').text('Gathering the players...');

    jsork.kingdom.getParagons(31).then(function (paragons) {
        var paragonsWithClasses = {};
        paragons.forEach(function (aParagon) {
            if (!paragonsWithClasses[aParagon.MundaneId]) {
                paragonsWithClasses[aParagon.MundaneId] = aParagon;
                paragonsWithClasses[aParagon.MundaneId].classes = [];
            }
            paragonsWithClasses[aParagon.MundaneId].classes.push(aParagon.AwardName);
        });
        paragons = [];
        Object.keys(paragonsWithClasses).forEach(function (mundaneId) {
            paragons.push(paragonsWithClasses[mundaneId]);
        });
        paragons.sort(function (a, b) {
            return a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
        });
        // jsork.park.getActivePlayers(parseInt(event.target.value, 10)).then(function(paragons) {
        var playersLeft = paragons.length;
        if (playersLeft === 0) {
            $('.working').attr('hidden', true);
            $('.noplayers').text('There are no active players');
            return;
        }
        $('.working').text('Number of players left to check ' + playersLeft);
        paragons.forEach(function (player) {
            updateWorkingMessage();
            jsork.player.getLastAttendance(player.MundaneId).then(function (lastAttendance) {
                if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) >= startDate) {
                    var playerWeeks = {};
                    jsork.player.getAttendanceFrom(player.MundaneId, startDate.format('MM/DD/YYYY')).then(function (allAttendance) {
                        allAttendance.forEach(function (attendance) {
                            if (moment(attendance.Date) <= today) {
                                if (attendance.KingdomId === 31 || attendance.EventKingdomId === 31) {
                                    if (!playerWeeks[moment(attendance.Date).isoWeekday(1).week()]) {
                                        playerWeeks[moment(attendance.Date).isoWeekday(1).week()] = [];
                                    }
                                    playerWeeks[moment(attendance.Date).isoWeekday(1).week()].push(attendance);
                                }
                            }
                        });
                        if (Object.keys(playerWeeks).length >= 0) {
                            jsork.player.getInfo(player.MundaneId).then(function (playerInfo) {
                                if (!playerInfo.Suspended) {
                                    playerList.push({
                                        Persona: playerInfo.Persona,
                                        UserName: playerInfo.UserName,
                                        MundaneId: playerInfo.MundaneId,
                                        DuesThrough: playerInfo.DuesThrough,
                                        DuesPaid: moment(playerInfo.DuesThrough) > moment(),
                                        Waivered: playerInfo.Waivered !== 0,
                                        attendance: playerWeeks,
                                        classes: [... new Set(player.classes)],
                                        ParkName: player.ParkName
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
        playerList.forEach(function (aPlayer) {
            jsork.player.getFirstAttendance(aPlayer.MundaneId).then(function (attendance) {
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
        // $('.noplayers').text('Generated on ' + new Date().toDateString());
        $('.working').attr('hidden', true);
        $('.noplayers').text('There are no players returned in the results');
        return;
    }
    playerList = playerList.filter(function(aPlayer) { 
        return Object.keys(aPlayer.attendance).length >= 6 && aPlayer.sixMonthsPlayed;
    })
    playerList.sort(function (a, b) {
        var personaSort = a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
        var canVoteA = Object.keys(a.attendance).length >= 6 && a.sixMonthsPlayed;
        var canVoteB = Object.keys(b.attendance).length >= 6 && b.sixMonthsPlayed;
        if (canVoteA === canVoteB) {
            return personaSort;
        }
        return canVoteB ? 1 : -1;
    });
    var lastPlayer = null;
    playerList.forEach(function (aPlayer) {
        var playerHTMLLine = '';
        var attendanceNumber = Object.keys(aPlayer.attendance).length;
        var canVote = attendanceNumber >= 6 && aPlayer.sixMonthsPlayed;
        // Temporary rules for voting. Just need to have waiver signed
        // canVote = aPlayer.Waivered && attendanceNumber >= 6 && aPlayer.sixMonthsPlayed;
        // canVote = aPlayer.Waivered && aPlayer.sixMonthsPlayed;
        var playerLine = (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '\t';
        if (lastPlayer && lastPlayer.Persona === aPlayer.Persona) {
            playerHTMLLine += '<tr><td></td>';
        } else {
            playerHTMLLine += '<tr>';
            playerHTMLLine += '<td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
                aPlayer.MundaneId + '">' +
                (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
        }
        playerLine += aPlayer.ParkName + '\t' + aPlayer.classes.join(", ") + '\t' + aPlayer.Waivered + '\t' + aPlayer.DuesPaid + '\t' + attendanceNumber;
        playerHTMLLine += '<td class="left">' + aPlayer.ParkName + '</td>';
        playerHTMLLine += '<td class="left">' + (aPlayer.classes.join(", ")) + '</td>';

        // TEMPORARY change back to these after voting returns to normal
        playerHTMLLine += '<td class="middle">' + (aPlayer.Waivered ? 'Waivered' : 'Sign Waiver') + '</td>';
        playerHTMLLine += '<td class="middle">' + (aPlayer.DuesPaid ? aPlayer.DuesThrough : 'Pay Dues') + '</td>';
        playerHTMLLine += '<td class="middle">' + attendanceNumber + '</td>';

        $('#playerTable').append(playerHTMLLine);
        playerContent += playerLine + '\r\n';
        lastPlayer = aPlayer;
    });
    $('.working').attr('hidden', true);
    $('.allresults').attr('hidden', false);
}

function startUp() {
    findParagons();
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
    var allCSV = 'Persona\tPark\tParagon Classes\tWaivered\tDues Paid\tWeeks of Attendance\r\n';
    allCSV += playerContent;
    copyTextToClipboard(allCSV);
}

$(document).ready(function () {
    startUp();
});
