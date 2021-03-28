/* eslint-disable no-unused-vars */
/* global jsork, $ */

var stringOutput = '';
var allPlayers = [];

function kingdomSelect(event, ui) {
  stringOutput = '';
  allPlayers = [];
  titlesonly = $('#titlesonly').is(":checked");
  $('.working').text('Generating report.....');
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  if (event.target.value === '0') {
    return;
  }
  $('.working').attr('hidden', false);
  $('#kingdom').selectmenu('option', 'disabled', true);
  getTitles(parseInt(event.target.value, 10));
  $('.printtitle').text($('#kingdom option:selected').text());
  $('.generateddate').text('Generated on ' + new Date().toDateString());
}

function initKingdoms() {
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
  initKingdoms();
}

function getTitles(kingdomId) {
  jsork.kingdom.getInfo(kingdomId).then(function(kingdom) {
    $('#kingdomName').text(kingdom.KingdomName);
    jsork.kingdom.getPlayers(kingdomId, jsork.filters.ACTIVE).then(function(activePlayers) {
      // activePlayers = activePlayers.slice(0, 100);
      var doPlayer = function() {
        var player;
        if (activePlayers.length === 0) {
          outputResults();
          return;
        } else {
          player = activePlayers.pop();
          $('.working').text('Number of players left to check ' + activePlayers.length);
        }
        jsork.player.getAwards(player.MundaneId, jsork.awardIDs.ALL).then(function(awards) {
          var hasTitle = false;
          var knighthoods = [],
              longTitle = '',
              titles = awards.filter(function(award) {
                return award.IsTitle &&
                  award.Name.indexOf('Knight') === -1 &&
                  award.Name.indexOf('Master') === -1 &&
                  award.Name.indexOf('Paragon') === -1 &&
                  award.Name.indexOf('Warlord') === -1;
              }).reverse();
          if (titles.length > 0) {
            hasTitle = true;
            var topTitle = titles[0];
            var remainingTitles = titles.slice(1);
            longTitle = topTitle.KingdomAwardName ? topTitle.KingdomAwardName : topTitle.Name;
            if (topTitle.AwardId >= jsork.awardIDs.LORDS_PAGE && topTitle.AwardId <= jsork.awardIDs.SQUIRE) {
              if (topTitle.GivenBy) {
                longTitle = longTitle + ' (' + topTitle.GivenBy + ')';
              }
            }

            remainingTitles.forEach(function(award) {
              var addTitle = ', ' + (award.KingdomAwardName ? award.KingdomAwardName : award.Name);
              var subordinateTitle = false;
              if (award.AwardId >= jsork.awardIDs.LORDS_PAGE && award.AwardId <= jsork.awardIDs.SQUIRE) {
                subordinateTitle = true;
                addTitle = addTitle + ' (' + award.GivenBy + ')';
              }
              longTitle = longTitle + addTitle;
            });
          }

          // Compute knighthoods
          if (awards.find(function(award) { return award.AwardId === jsork.awardIDs.KNIGHT_OF_THE_SERPENT; })
            || awards.find(function(award) { return award.AwardId === 94 && award.CustomAwardName.match(/knight of the serpent/i); })) {
            knighthoods.push('Serpent');
            hasTitle = true;
          }
          if (awards.find(function(award) { return award.AwardId === jsork.awardIDs.KNIGHT_OF_THE_FLAME; })
            || awards.find(function(award) { return award.AwardId === 94 && award.CustomAwardName.match(/knight of the flame/i); })) {
            knighthoods.push('Flame');
            hasTitle = true;
          }
          if (awards.find(function(award) { return award.AwardId === jsork.awardIDs.KNIGHT_OF_THE_SWORD; })
            || awards.find(function(award) { return award.AwardId === 94 && award.CustomAwardName.match(/knight of the sword/i); })) {
            knighthoods.push('Sword');
            hasTitle = true;
          }
          if (awards.find(function(award) { return award.AwardId === jsork.awardIDs.KNIGHT_OF_THE_CROWN; })
            || awards.find(function(award) { return award.AwardId === 94 && award.CustomAwardName.match(/knight of the crown/i); })) {
            knighthoods.push('Crown');
            hasTitle = true;
          }
          allPlayers.push( {
            ParkName: (player.ParkName || 'No Park'),
            Persona: (player.Persona || 'No persona for ID ' + player.MundaneId),
            MundaneId: player.MundaneId,
            longTitle: longTitle,
            knighthoods: knighthoods,
            hasTitle: hasTitle
          });
          doPlayer();
        });
      };
      doPlayer();
    });
  });
}

function outputResults() {
  allPlayers.sort(function(a, b) {
    var personaSort = a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
    var parkSort = a.ParkName.toLowerCase().localeCompare(b.ParkName.toLowerCase());
    if (parkSort !== 0) {
      return parkSort;
    }
    return personaSort;
  });
  allPlayers.forEach(function(player) {
    var playerLine =
      (player.ParkName || 'No Park') + '\t' +
      (player.Persona || 'No persona for ID ' + player.MundaneId) + '\t';
    var playerHTMLLine = '<tr><td>' +
      (player.ParkName || 'No Park') + '</td><td>' +
      '<a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
      player.MundaneId + '">' +
      (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
    playerLine += player.longTitle + '\t';
    playerHTMLLine += '<td>' + player.longTitle + '</td>';
    if (player.knighthoods.includes('Crown')) {
      playerLine += 'Yes\t';
      playerHTMLLine += '<td>Crown</td>';
    } else {
      playerLine += '\t';
      playerHTMLLine += '<td></td>';
    }
    if (player.knighthoods.includes('Flame')) {
      playerLine += 'Yes\t';
      playerHTMLLine += '<td>Flame</td>';
    } else {
      playerLine += '\t';
      playerHTMLLine += '<td></td>';
    }
    if (player.knighthoods.includes('Serpent')) {
      playerLine += 'Yes\t';
      playerHTMLLine += '<td>Serpent</td>';
    } else {
      playerLine += '\t';
      playerHTMLLine += '<td></td>';
    }
    if (player.knighthoods.includes('Sword')) {
      playerLine += 'Yes';
      playerHTMLLine += '<td>Sword</td>';
    } else {
      playerHTMLLine += '<td></td>';
    }
    if (!titlesonly || player.hasTitle) {
      $('#titleTable').append(playerHTMLLine);
      stringOutput += playerLine + '\r\n';  
    }
  });
  $('.allresults').attr('hidden', false);
  $('#kingdom').selectmenu('option', 'disabled', false);
  $('.working').attr('hidden', true);
}

function copyTextToClipboard(str) {
  var el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function copyTitlesToClipboard() {
  var allCSV = 'Park\tPersona\tTitles or None\tCrown\tFlame\tSerpent\tSword\r\n';
  allCSV += stringOutput;
  copyTextToClipboard(allCSV);
}

$(document).ready(function() {
  startUp();
});
