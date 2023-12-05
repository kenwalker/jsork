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
var twentyFourMonthsAgo = moment(startTime).subtract(24, "months");


function initParks() {
    playerList = [];
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    $('.noplayers').text(' ');

    jsork.kingdom.getParks(19).then(function (data) {
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
        document.getElementById('park').disabled = false;
    });
}

function updateWorkingMessage() {
    howManyPlayersChecked++;
    if (howManyPlayersChecked % 5 === 0) {
        var avgCallTime = (Date.now() - startTime) / howManyPlayersChecked;
        var timeLeft = moment.duration(avgCallTime * (totalActive - howManyPlayersChecked) / 1000, "seconds").humanize();
        $('.working').text('Number of players left to check ' + (totalActive - howManyPlayersChecked) + ", time left " + timeLeft);
        if (dotCount > 5) {
            dotCount = 0;
        }
    }
}

function wholeKingdomChange() {
    wholeKingdom = $('#wholekingdom').is(":checked");
    if (wholeKingdom) {
        $('#parkselect').hide();
    } else {
        $('#parkselect').show();
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
    $('.working').text('Gathering the players...');
    if (wholeKingdom) {
        jsork.kingdom.getPlayers(19, jsork.filters.ACTIVE).then(function (data) {
            // data = data.slice(500, 600);
            activePlayers = data;
            totalActive = activePlayers.length;
            checkNextPlayer();
        });    
    } else {
        jsork.park.getPlayers(selectedPark, jsork.filters.ACTIVE).then(function(data) {
            activePlayers = data;
            totalActive = activePlayers.length;
            checkNextPlayer();
        });
    }
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
            var creditsOutsideTD = 0;
            var totalCredits = 0;
            jsork.player.getAttendanceFrom(player.MundaneId, startDate.format('MM/DD/YYYY')).then(function (allAttendance) {
                allAttendance.reverse();
                allAttendance.forEach(function (attendance) {
                    var dow = moment(attendance.Date).isoWeekday();
                    if (moment(attendance.Date) <= endDate) {
                        var added = false;
                        var addedOutsideTD = false;
                        if (attendance.EventId) {
                            var possibleCredits = Math.min(attendance.Credits, 2);
                            if (attendance.EventKingdomId !== 19) {
                                var diff = 0;
                                switch (creditsOutsideTD) {
                                    case 0:
                                        diff = possibleCredits; break;
                                    case 1:
                                        diff = 1; break;
                                }
                                if (diff > 0) {
                                    added = true;
                                    addedOutsideTD = true;
                                    totalCredits += diff;
                                    creditsOutsideTD += diff;
                                }
                            } else {
                                added = true;
                                totalCredits += possibleCredits;
                            }
                        } else {
                            var possibleCredits = Math.min(attendance.Credits, 2);
                            if (attendance.KingdomId !== 19) {
                                var diff = 0;
                                switch (creditsOutsideTD) {
                                    case 0:
                                        diff = possibleCredits; break;
                                    case 1:
                                        diff = 1; break;
                                }
                                if (diff > 0) {
                                    added = true;
                                    addedOutsideTD = true;
                                    totalCredits += diff;
                                    creditsOutsideTD += diff;
                                }
                            } else {
                                totalCredits += possibleCredits;
                                added = true;
                            }
                        }
                        if (added) {
                            playerWeeks[Object.keys(playerWeeks).length.toString()] = moment(attendance.Date).format("ddd, MMM Do YYYY") + (addedOutsideTD ? " (Outside TD)" : "");
                        }
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
                                OutsideTD: creditsOutsideTD,
                                TotalCredits: totalCredits,
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
            if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) < twentyFourMonthsAgo) {
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
                $('.working').text('Number of players left to check first attendance ' + playersLeft);
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
        $('.noplayers').text('There are no players returned in the results');
        $('#allinputs').show();
        return;
    }
    playerList.sort(function (a, b) {
        var parkSort = a.ParkName.toLowerCase().localeCompare(b.ParkName.toLowerCase());
        var personaSort = a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
        var canVoteA = a.DuesPaid && a.TotalCredits >= 8 && a.Waivered;
        var canVoteB = b.DuesPaid && b.TotalCredits >= 8 && b.Waivered;
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
        var attendanceNumber = aPlayer.TotalCredits;
        var citizen = aPlayer.DuesPaid && attendanceNumber >= 8 && aPlayer.Waivered;
        var playerLine = aPlayer.ParkName + '\t' + (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '\t';
        if (citizen) {
            playerHTMLLine += '<tr class="lightgreen">';
        } else {
            playerHTMLLine += '<tr>';
        }
        playerHTMLLine += '<td ' + (citizen ? 'class="lightgreen"' : '') + '>' + aPlayer.ParkName + '</td><td ' + (citizen ? 'class="lightgreen"' : '') + '><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
            aPlayer.MundaneId + '">' +
            (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
        playerLine += citizen + '\t' + aPlayer.Waivered + '\t' + aPlayer.DuesPaid + '\t' + attendanceNumber + '\t';
        playerHTMLLine += '<td ' + (citizen ? 'class="lightgreen"' : '') + '>' + (citizen ? 'Yes' : 'No') + '</td>';
        playerHTMLLine += '<td class="middle ' + (aPlayer.Waivered ? 'lightgreen' : 'lightred') + '">' + (aPlayer.Waivered ? 'Waivered' : 'Sign Waiver') + '</td>';
        playerHTMLLine += '<td class="middle ' + (aPlayer.DuesPaid ? 'lightgreen' : 'lightred') + '">' + (aPlayer.DuesPaid ? (aPlayer.duesForLife ? "Dues for Life" : aPlayer.DuesThrough) : 'Pay Dues') + '</td>';
        playerHTMLLine += '<td class="middle ' + (attendanceNumber >= 8 ? 'lightgreen' : 'lightred') + '">' + attendanceNumber + '</td>';
        playerHTMLLine += '</tr>';
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
        $('#oldPlayers').html("<b>There are " + olderPlayers + " player(s) who have not played in 24 months, maybe run the <a href='https://kenwalker.github.io/jsork/shouldBeRetired.html' target='_blank'>Should be retired</a> report?</b><br>");
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
    var allCSV = 'Park\tPersona\tCitizen\tWaivered\tDues Paid\tDays of Attendance\tAll Attendances\r\n';
    allCSV += playerContent;
    copyTextToClipboard(allCSV);
}

$(document).ready(function () {
    startUp();
});
