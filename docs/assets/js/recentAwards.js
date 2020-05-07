/* eslint-disable no-unused-vars */
/* global jsork, $ */

var players = {};
var kingdomId;
var parkId;
var playerContent = '';

function resetAwards() {
    $('#allawards').empty();
}

function kingdomSelect(event, ui) {
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    $('.noplayers').text(' ');
    if (event.target.value === '0') {
      return;
    }
    document.getElementById('kingdom').disabled = true;
    document.getElementById('park').disabled = true;
    var select = document.getElementById('park');
    for (var i = select.options.length - 1; i >= 0; i--) {
      select.options[i] = null;
    }
    kingdomId = parseInt(event.target.value, 10);
    jsork.kingdom.getParks(kingdomId).then(function(data) {
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
      document.getElementById('kingdom').disabled = false;
      document.getElementById('park').disabled = false;
    });
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
    parkId = parseInt(event.target.value, 10);
    document.getElementById('kingdom').disabled = true;
    document.getElementById('park').disabled = true;
    $('.printtitle').text($('#kingdom option:selected').text() + ' - ' + $('#park option:selected').text());
    $('.generateddate').text('Generated on ' + new Date().toDateString());
  
    $('.working').attr('hidden', false);
    $('.working').text('Getting recent awards....');
    getAwards();
}

function initKingdoms() {
    $('#parkselect').attr('hidden', true);
    $('.working').attr('hidden', true);
    jsork.kingdom.getKingdoms().then(function(data) {
      var kSelect = $('#kingdom');
      var emptyOption = $('<option>');
      emptyOption.html('Choose a Kingdom/Principality');
      emptyOption.val(0);
      kSelect.append(emptyOption);
      data.forEach(function(kingdom) {
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
    $('#park').on('change', parkSelect);
    initKingdoms();
}

function getAwards() {
    players = {};
    jsork.kingdom.playerAwardsPark(kingdomId, parkId, 0).then(function (awards) {
        // Only awards in the last 6 months
        awards = awards.filter(function(award) {
            return moment(award.Date) > moment().subtract(6, 'months');
        });
        // Sort by Date
        awards.sort(function(a, b) {
            return moment(a.Date) - moment(b.Date);
        });
        awards.forEach(function (award) {
            if (!players[award.MundaneId.toString()]) {
                players[award.MundaneId.toString()] = {
                    ParkName: award.ParkName,
                    Persona: ('' + award.Persona),
                    MundaneId: award.MundaneId,
                    recentAwards: []
                };
            }
            var aPlayer = players[award.MundaneId.toString()];
            aPlayer.recentAwards.push(award);
        });
        var allPlayers = Object.values(players);
        allPlayers.sort(function (a, b) {
            return a.Persona.localeCompare(b.Persona);
        });
        allPlayers.forEach(function(aPlayer) {
            var lastAward = null;
            aPlayer.recentAwards.sort(function(a, b) {
                var awardNameSort = a.AwardName.toLowerCase().localeCompare(b.AwardName.toLowerCase());
                var dateSort = moment(a.Date) - moment(b.Date);
                if (awardNameSort !== 0) {
                    return awardNameSort;
                }
                return dateSort;
            });
            aPlayer.recentAwards.forEach(function(anAward) {
                var playerHTMLLine = '';
                var playerLine = (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '\t';
                if (lastAward) {
                  playerHTMLLine += '<tr><td></td>';
                } else {
                  playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
                  aPlayer.MundaneId + '">' +
                  (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
                }
                playerHTMLLine += '<td>' + anAward.Date + "</td>";
                playerLine += anAward.Date + "\t";
                playerHTMLLine += '<td>' + anAward.AwardName + "</td>";
                playerLine += anAward.AwardName + "\t";
                playerHTMLLine += '<td>' + anAward.Rank + "</td>";
                playerLine += anAward.Rank;
                $('#playerTable').append(playerHTMLLine);
                playerContent += playerLine + '\r\n';
                lastAward = anAward;
            });
        });

        $('.working').attr('hidden', true);
        $('.allresults').attr('hidden', false);
        document.getElementById('kingdom').disabled = false;
        document.getElementById('park').disabled = false;
      
        window.output = Object.values(allPlayers);
    });
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
    var allCSV = 'Persona\tAward Date\tAward\tRank if present\r\n';
    allCSV += playerContent;
    copyTextToClipboard(allCSV);
}
  
$(document).ready(function () {
    startUp();
});
