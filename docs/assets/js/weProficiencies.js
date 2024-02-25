
/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = null;
var playerContent = '';
var dotCount = 1;
var callCount = 0;
var today = moment();
var startDate = moment(today).subtract(12, 'months').isoWeekday(1).startOf('isoWeek');
var total_number_of_players = 0;
var howManyPicked = 0;
var startTime = moment();

function updateWorkingMessage() {
    if (howManyPicked % 5 === 0) {
        var avgCallTime = (Date.now() - startTime) / howManyPicked;
        var timeLeft = moment.duration(avgCallTime * (total_number_of_players - howManyPicked) / 1000, "seconds").humanize();
        $('.working').text('Number of players left to check ' + (total_number_of_players - howManyPicked) + ", time left " + timeLeft);
        if (dotCount > 5) {
            dotCount = 0;
        }
    }
}


function getPlayerClassInfo(activePlayers) {
    var playersLeft = activePlayers.length;
    // $('.working').text('Number of players left to check ' + playersLeft);
    if (playersLeft === 0) {
        donePlayers();
        return;
    }
    var currentPlayer = activePlayers.pop();
    howManyPicked++;
    updateWorkingMessage();
    jsork.player.getLastAttendance(currentPlayer.MundaneId).then(function (lastAttendance) {
        if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) >= startDate) {
            jsork.player.getInfo(currentPlayer.MundaneId).then(function (playerInfo) {
                if (!playerInfo.Suspended) {
                    jsork.player.getClasses(currentPlayer.MundaneId).then(function(playerClasses) {
                        var hasAProficiency = false;
                        var playerObject = {
                            Persona: playerInfo.Persona,
                            UserName: playerInfo.UserName,
                            MundaneId: playerInfo.MundaneId,
                            ParkName: currentPlayer.ParkName,
                            LastPlayed: moment(lastAttendance[0].Date).format("MM/DD/YYYY")
                        };
                        playerClasses.forEach(function(aClass) {
                            playerObject[aClass.class] = aClass.level;
                            if (aClass.level === 6) {
                                hasAProficiency = true;
                            }
                        });
                        if (hasAProficiency) {
                            playerList.push(playerObject);
                        }
                        getPlayerClassInfo(activePlayers);
                        return;
                    });
                } else {
                    getPlayerClassInfo(activePlayers);
                }
            });
        } else {
            getPlayerClassInfo(activePlayers);
        }
    });
}

function findPlayers() {
    playerList = [];
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    $('.noplayers').text('');
    playerList = [];
    playerContent = '';

    $('.working').attr('hidden', false);
    $('.working').text('Gathering the players...');

    jsork.kingdom.getPlayers(24, jsork.filters.ACTIVE).then(function (activePlayers) {
        var playersLeft = activePlayers.length;
        if (playersLeft === 0) {
            $('.working').attr('hidden', true);
            $('.noplayers').text('There are no active players');
            return;
        }
        // activePlayers = activePlayers.slice(100, 250);
        total_number_of_players = activePlayers.length;
        getPlayerClassInfo(activePlayers);
        // getPlayerClassInfo(activePlayers);
    });
}

function donePlayers() {
    if (playerList.length === 0) {
        // $('.noplayers').text('Generated on ' + new Date().toDateString());
        $('.working').attr('hidden', true);
        $('.noplayers').text('There are no players returned in the results');
        return;
    }
    playerList.sort(function (a, b) {
        var personaSort = a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
        var parkSort = a.ParkName.toLowerCase().localeCompare(b.ParkName.toLowerCase());
        if (a.ParkName.toLowerCase() === b.ParkName.toLowerCase()) {
            return personaSort;
        }
        return parkSort;
    });
    var lastPlayer = null;
    playerList.forEach(function (aPlayer) {
        var playerHTMLLine = '';
        var playerLine = (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '\t';
        if (lastPlayer && lastPlayer.Persona === aPlayer.Persona) {
            playerHTMLLine += '<tr><td></td>';
        } else {
            playerHTMLLine += '<tr>';
            playerHTMLLine += '<td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
                aPlayer.MundaneId + '">' +
                (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
        }
        playerLine += aPlayer.ParkName + '\t' + aPlayer.LastPlayed + '\t';
        playerHTMLLine += '<td class="left">' + aPlayer.ParkName + '</td>';
        playerHTMLLine += '<td class="left">' + aPlayer.LastPlayed + '</td>';
        
        if (aPlayer['Anti-Paladin'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Anti-Paladin'] + '</td>';
            playerLine += aPlayer['Anti-Paladin'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Archer'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Archer'] + '</td>';
            playerLine += aPlayer['Archer'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Assassin'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Assassin'] + '</td>';
            playerLine += aPlayer['Assassin'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Barbarian'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Barbarian'] + '</td>';
            playerLine += aPlayer['Barbarian'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Bard'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Bard'] + '</td>';
            playerLine += aPlayer['Bard'] + '\t';
        } else {
            playerLine += '\t';
            playerHTMLLine += '<td class="middle"></td>';
        }
        if (aPlayer['Color'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Color'] + '</td>';
            playerLine += aPlayer['Color'] + '\t';
        } else {
            playerLine += '\t';
            playerHTMLLine += '<td class="middle"></td>';
        }
        if (aPlayer['Druid'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Druid'] + '</td>';
            playerLine += aPlayer['Druid'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Healer'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Healer'] + '</td>';
            playerLine += aPlayer['Healer'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Monk'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Monk'] + '</td>';
            playerLine += aPlayer['Monk'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Paladin'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Paladin'] + '</td>';
            playerLine += aPlayer['Paladin'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Scout'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Scout'] + '</td>';
            playerLine += aPlayer['Scout'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Warrior'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Warrior'] + '</td>';
            playerLine += aPlayer['Warrior'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Wizard'] === 6) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Wizard'] + '</td>';
            playerLine += aPlayer['Wizard'];
        } else {
            playerHTMLLine += '<td class="middle"></td>';
        }

        $('#playerTable').append(playerHTMLLine);
        playerContent += playerLine + '\r\n';
        lastPlayer = aPlayer;
    });
    $('.working').attr('hidden', true);
    $('.allresults').attr('hidden', false);
}

function startUp() {
    findPlayers();
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
    var allCSV = 'Persona\tPark\tLast Played\tAnti-Paladin\tArcher\tAssassin\tBarbarian\tBard\tColor\tDruid\tHealer\tMonk\tPaladin\tScout\tWarrior\tWizard\r\n';
    allCSV += playerContent;
    copyTextToClipboard(allCSV);
}

$(document).ready(function () {
    startUp();
});
