/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = null;
var playerContent = '';
var startTime = 0;
var playersDone = 0;

function run() {
    playerList = [];
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    $('.noplayers').text(' ');
    var kingdomId = 31;
    $('.printtitle').text("Nine Blades Masks and Dragons");
    $('.generateddate').text('Generated on ' + new Date().toDateString());

    $('.working').attr('hidden', false);
    $('.working').text('Getting Mask and Dragon awards....');

    jsork.kingdom.playerAwards(kingdomId, 0).then(function(allAwards) {
        allAwards = allAwards.filter(function(x) {
            var isMask = x.AwardName.toLowerCase().indexOf("mask") !== -1;
            var isDragon = x.AwardName.toLowerCase().indexOf("dragon") !== -1;
            return isMask || isDragon;
        });
        if (allAwards.length === 0) {
            $('.working').attr('hidden', true);
            $('.noplayers').text('There are no Mask or Dragon awards which is weird');
            return;
        }
        var awardsByPlayer = [];
        allAwards.forEach(function(anAward) {
            var currentPlayer = null;
            if (!awardsByPlayer[anAward.Persona]) {
                awardsByPlayer[anAward.Persona] = { Persona: anAward.Persona, MundaneId: anAward.MundaneId, ParkName: anAward.ParkName, MaskCount: 0, MaskMax: 0, DragonCount: 0, DragonMax: 0};
            }
            currentPlayer = awardsByPlayer[anAward.Persona];
            if (anAward.AwardName.toLowerCase().indexOf("order of the mask") !== -1) {
                if (anAward.Rank === 0) {
                    currentPlayer.MaskCount ++;
                } else {
                    if (anAward.Rank > currentPlayer.MaskMax) {
                        currentPlayer.MaskCount ++;
                        currentPlayer.MaskMax = anAward.Rank;
                    }
                }
            }
            if (anAward.AwardName.toLowerCase().indexOf("order of the dragon") !== -1) {
                if (anAward.Rank === 0) {
                    currentPlayer.DragonCount ++;
                } else {
                    if (anAward.Rank > currentPlayer.DragonMax) {
                        currentPlayer.DragonCount ++;
                        currentPlayer.DragonMax = anAward.Rank;
                    }
                }
            }
        });
        Object.keys(awardsByPlayer).forEach(function(aPlayerName) {
            var aPlayer = awardsByPlayer[aPlayerName];
            var playerHTMLLine = '';
            var playerLine = (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '\t';
            playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
                aPlayer.MundaneId + '" target="_blank">' +
                (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
            playerLine += aPlayer.ParkName + '\t';
            playerHTMLLine += '<td class="left">' + aPlayer.ParkName + '</td>';
            if (aPlayer.MaskCount > aPlayer.MaskMax) {
                playerHTMLLine += '<td class="middle">' + aPlayer.MaskCount + '</td><td class="middle">yes</td>';
                playerLine += aPlayer.MaskCount + '\tyes\t';
            } else {
                playerHTMLLine += '<td class="middle">' + aPlayer.MaskMax + '</td><td class="middle"></td>';
                playerLine += aPlayer.MaskMax + '\t\t';
            }
            if (aPlayer.DragonCount > aPlayer.DragonMax) {
                playerHTMLLine += '<td class="middle">' + aPlayer.DragonCount + '</td><td class="middle">yes</td>';
                playerLine += aPlayer.DragonCount + '\tyes\t';
            } else {
                playerHTMLLine += '<td class="middle">' + aPlayer.DragonMax + '</td><td class="middle"></td>';
                playerLine += aPlayer.DragonMax + '\t\t';
            }
            playerHTMLLine += '</tr>';
            $('#playerTable').append(playerHTMLLine);
            playerContent += playerLine + '\r\n';

        });
        $('.working').attr('hidden', true);
        $('.allresults').attr('hidden', false);
     });
}

function donePlayers() {
    if (playerList.length === 0) {
        document.getElementById('kingdom').disabled = false;
        // $('.noplayers').text('Generated on ' + new Date().toDateString());
        $('.working').attr('hidden', true);
        $('.noplayers').text('There are no players with any Orders of the Warrior');
        return;
    }
    playerList.sort(function (a, b) {
        return a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
    });
    playerList.forEach(function (aPlayer) {
        var playerHTMLLine = '';
        var playerLine = (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '\t';
        if (lastPlayer && lastPlayer.Persona === aPlayer.Persona) {
            playerHTMLLine += '<tr><td></td>';
        } else {
            playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
                aPlayer.MundaneId + '" target="_blank">' +
                (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
        }
        playerLine += aPlayer.KingdomName + '\t' + aPlayer.ParkName + '\t' + aPlayer.Warriors + '\t' + aPlayer.Warlord + '\t' + aPlayer.Knight;
        playerHTMLLine += '<td class="left">' + aPlayer.KingdomName + '<td class="left">' + aPlayer.ParkName + '</td><td class="middle">' + aPlayer.Warriors + '</td><td class="middle">' + aPlayer.Warlord + '</td><td class="middle">' + aPlayer.Knight + '</td></tr>';
        $('#playerTable').append(playerHTMLLine);
        playerContent += playerLine + '\r\n';
        lastPlayer = aPlayer;
    });
    $('.working').attr('hidden', true);
    $('.allresults').attr('hidden', false);
    document.getElementById('kingdom').disabled = false;
}

function startUp() {
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
    var allCSV = 'Persona\tPark\tMasks\tCount Only\tFlames\tCount Only\r\n';
    allCSV += playerContent;
    copyTextToClipboard(allCSV);
}

$(document).ready(function () {
    run();
});

