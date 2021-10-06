/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = null;
var playerContent = '';
var startTime = 0;
var playersDone = 0;

function kingdomSelect(event, ui) {
    playerList = [];
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    $('.noplayers').text(' ');
    if (event.target.value === '0') {
        return;
    }
    document.getElementById('kingdom').disabled = true;
    var kingdomId = parseInt(event.target.value, 10);
    $('.printtitle').text($('#kingdom option:selected').text());
    $('.generateddate').text('Generated on ' + new Date().toDateString());

    $('.working').attr('hidden', false);
    $('.working').text('Getting warriors....');
    jsork.kingdom.getPlayers(kingdomId, jsork.filters.ACTIVE).then(function (data) {
        data = data.filter(function (player) { return !player.Suspended });
        // data = data.slice(0, 20);
        if (data.length === 0) {
            document.getElementById('kingdom').disabled = false;
            $('.working').attr('hidden', true);
            $('.noplayers').text('There are no active players');
            return;
        }
        startTime = Date.now();
        playersDone = 0;    
        nextPlayer(data);
    });
}

function updateMessage(playersLeft) {
    playersDone++;
    var avgCallTime = (Date.now() - startTime) / playersDone;
    var timeLeft = moment.duration(avgCallTime * playersLeft.length / 1000, "seconds").humanize();
    $('.working').text('Number of players left to check ' + playersLeft.length + ", time left " + timeLeft);
}

function nextPlayer(thePlayerList) {
    if (thePlayerList.length === 0) {
        donePlayers();
        return;
    }
    var player = thePlayerList.pop();
    jsork.player.getLastAttendance(player.MundaneId).then(function (lastAttendance) {
        if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) > moment().subtract(6, 'months')) {
            jsork.player.getAwards(player.MundaneId, jsork.awardIDs.ORDER_OF_THE_WARRIOR).then(function (awards) {
                // $('.working').text('Number of players left to check ' + thePlayerList.length);
                var warriorCount = 0;
                var warriorRank = 0;
                awards.forEach(function (award) {
                    if (!award.Rank || award.Rank === 0) {
                        warriorCount++;
                    } else {
                        if (award.Rank > warriorRank) {
                            warriorRank = award.Rank;
                        }
                    }
                });
                if (warriorRank < warriorCount) {
                    warriorRank = warriorCount;
                }
                player.warriorRank = warriorRank;
                jsork.player.getAwards(player.MundaneId, (jsork.awardIDs.WARLORD)).then(function (warlordAward) {
                    player.Warlord = warlordAward.length > 0 ? "Warlord" : "";
                    jsork.player.getAwards(player.MundaneId, (jsork.awardIDs.KNIGHT_OF_THE_SWORD)).then(function (knightAward) {
                        player.Knight = knightAward.length > 0 ? "Knight of the Sword" : "";
                        if (player.warriorRank > 0 || player.Warlord !== '' || player.Knight !== '') {
                            playerList.push({ Persona: player.Persona, MundaneId: player.MundaneId, KingdomName: player.KingdomName, ParkName: player.ParkName, Warriors: warriorRank, Warlord: player.Warlord, Knight: player.Knight });
                        }
                        updateMessage(thePlayerList);
                        nextPlayer(thePlayerList);
                    });
                });
            }.bind(player));
        } else {
            updateMessage(thePlayerList);
            // $('.working').text('Number of players left to check ' + thePlayerList.length);
            nextPlayer(thePlayerList);
        }
    });
};

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
    var lastPlayer = null;
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
        playerHTMLLine += '<td class="left">' + aPlayer.KingdomName + '<td class="left">' + aPlayer.ParkName + '</td><td class="middle">' + aPlayer.Warriors + '</td><td class="middle">' + aPlayer.Warlord + '</td><td class="middle">' + aPlayer.Knight + '</td><tr>';
        $('#playerTable').append(playerHTMLLine);
        playerContent += playerLine + '\r\n';
        lastPlayer = aPlayer;
    });
    $('.working').attr('hidden', true);
    $('.allresults').attr('hidden', false);
    document.getElementById('kingdom').disabled = false;
}

function initKingdoms() {
    $('.working').attr('hidden', true);
    jsork.kingdom.getKingdoms().then(function (data) {
        var kSelect = $('#kingdom');
        var emptyOption = $('<option>');
        emptyOption.html('Choose a Kingdom/Principality');
        emptyOption.val(0);
        kSelect.append(emptyOption);
        data.forEach(function (kingdom) {
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
    var allCSV = 'Persona\tKingdom\tPark\tWarriors\tWarlord\tKnight of the Sword\r\n';
    allCSV += playerContent;
    copyTextToClipboard(allCSV);
}

$(document).ready(function () {
    startUp();
});
