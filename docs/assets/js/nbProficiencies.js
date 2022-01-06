
/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = null;
var playerContent = '';
var dotCount = 1;
var callCount = 0;
var today = moment();
var startDate = moment(today).subtract(12, 'months').isoWeekday(1).startOf('isoWeek');

function updateWorkingMessage() {
    if (callCount++ % 5) {
        $('.working').text('Gathering the players' + '.'.repeat(dotCount++));
        if (dotCount > 5) {
            dotCount = 0;
        }
    }
}

function getPlayerClassInfo(activePlayers) {
    var playersLeft = activePlayers.length;
    $('.working').text('Number of players left to check ' + playersLeft);
    if (playersLeft === 0) {
        donePlayers();
        return;
    }
    var currentPlayer = activePlayers.pop();
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
                            ParkName: currentPlayer.ParkName
                        };
                        playerClasses.forEach(function(aClass) {
                            playerObject[aClass.class] = aClass.level;
                            if (aClass.level > 2) {
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

    jsork.kingdom.getPlayers(31, jsork.filters.ACTIVE).then(function (activePlayers) {
        var playersLeft = activePlayers.length;
        if (playersLeft === 0) {
            $('.working').attr('hidden', true);
            $('.noplayers').text('There are no active players');
            return;
        }
        // getPlayerClassInfo(activePlayers.slice(400, 500));
        getPlayerClassInfo(activePlayers);
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
        playerLine += aPlayer.ParkName + '\t';
        playerHTMLLine += '<td class="left">' + aPlayer.ParkName + '</td>';
        if (aPlayer['Anti-Paladin'] > 2) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Anti-Paladin'] + '</td>';
            playerLine += aPlayer['Anti-Paladin'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Archer'] > 2) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Archer'] + '</td>';
            playerLine += aPlayer['Archer'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Assassin'] > 2) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Assassin'] + '</td>';
            playerLine += aPlayer['Assassin'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Barbarian'] > 2) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Barbarian'] + '</td>';
            playerLine += aPlayer['Barbarian'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Bard'] > 2) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Bard'] + '</td>';
            playerLine += aPlayer['Bard'] + '\t';
        } else {
            playerLine += '\t';
            playerHTMLLine += '<td class="middle"></td>';
        }
        if (aPlayer['Color'] > 2) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Color'] + '</td>';
            playerLine += aPlayer['Color'] + '\t';
        } else {
            playerLine += '\t';
            playerHTMLLine += '<td class="middle"></td>';
        }
        if (aPlayer['Druid'] > 2) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Druid'] + '</td>';
            playerLine += aPlayer['Druid'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Healer'] > 2) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Healer'] + '</td>';
            playerLine += aPlayer['Healer'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Monk'] > 2) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Monk'] + '</td>';
            playerLine += aPlayer['Monk'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Paladin'] > 2) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Paladin'] + '</td>';
            playerLine += aPlayer['Paladin'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Scout'] > 2) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Scout'] + '</td>';
            playerLine += aPlayer['Scout'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Warrior'] > 2) {
            playerHTMLLine += '<td class="middle">' + aPlayer['Warrior'] + '</td>';
            playerLine += aPlayer['Warrior'] + '\t';
        } else {
            playerHTMLLine += '<td class="middle"></td>';
            playerLine += '\t';
        }
        if (aPlayer['Wizard'] > 2) {
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
    var allCSV = 'Persona\tPark\tAnti-Paladin\tArcher\tAssassin\tBarbarian\tBard\tColor\tDruid\tHealer\tMonk\tPaladin\tScout\tWarrior\tWizard\r\n';
    allCSV += playerContent;
    copyTextToClipboard(allCSV);
}

$(document).ready(function () {
    startUp();
});
