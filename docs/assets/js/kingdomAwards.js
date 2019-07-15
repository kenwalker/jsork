/* eslint-disable no-unused-vars */
/* global jsork, $ */

var remembered = [];
var numberOfPlayers = 0;
var serpentContent, flameContent, swordContent;

window.remembered = remembered;

function resetAwards() {
  $( '#progressbar' ).progressbar( 'option', 'value', 0 );
  $('#allawards').empty();
}

function kingdomSelect(event, ui) {
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  if (event.target.value === '0') {
    return;
  }
  $('#kingdom').selectmenu('option', 'disabled', true);
  getAwards(parseInt(event.target.value, 10));
  $('.printtitle').text($('#kingdom option:selected').text());
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
  $('#progressbar').progressbar();
  initKingdoms();
}

function getAwards(kingdomId) {
  var players = {};
  jsork.kingdom.playerAwards(kingdomId, 0).then(function(awards) {
    awards.forEach(function(award) {
      if (!players[award.MundaneId.toString()]) {
        players[award.MundaneId.toString()] = {
          ParkName: award.ParkName,
          Persona: ('' + award.Persona),
          MundaneId: award.MundaneId
        };
      }
      var aPlayer = players[award.MundaneId.toString()];
      var currentAward = award.AwardName;
      if (!aPlayer.Persona && award.Persona) {
        aPlayer.Persona = award.Persona;
      }
      var playerAward = aPlayer[currentAward];
      if (!playerAward) {
        aPlayer[currentAward] = award;
        award.count = 1;
        if (!award.Rank || award.Rank === 0) {
          award.Rank = 1;
        }
      } else {
        playerAward.count = playerAward.count + 1;
        if (award.Rank > playerAward.Rank) {
          playerAward.Rank = award.Rank;
        }
        if (playerAward.count > playerAward.Rank) {
          playerAward.Rank = playerAward.count;
        }
      }
    });
    var allPlayers = Object.values(players);
    allPlayers.sort(function(a, b) {
      return a.Persona.localeCompare(b.Persona);
    });

    // do the serpents
    var content = '';
    var htmlContent = '';
    var serpentCandidates = allPlayers.filter(function(player) {
      return player['Master Dragon'] ||
        (player['Order of the Dragon'] && player['Order of the Dragon'].Rank > 6) ||
        player['Master Garber'] ||
        (player['Order of the Garber'] && player['Order of the Garber'].Rank > 6) ||
        player['Master Owl'] ||
        (player['Order of the Owl'] && player['Order of the Owl'].Rank > 6);
    });
    serpentCandidates.forEach(function(player) {
      var playerLine =
          player.ParkName + '\t' +
          player.Persona + '\t';
      var playerHTMLLine = '<tr><td>' + 
        player.ParkName + '</td><td>' + 
        '<a href="https://amtgard.com/ork/orkui/index.php?Route=Player/index/' +
        player.MundaneId + '">' +
        player.Persona + '</a></td>';
      if (player['Master Dragon']) {
        playerLine = playerLine + 'Master\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle green">Master</td>';
      } else if (player['Order of the Dragon'] && player['Order of the Dragon'].Rank > 6) {
        playerLine = playerLine + player['Order of the Dragon'].Rank + '\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle';
        if (player['Order of the Dragon'].Rank > 7) {
          playerHTMLLine = playerHTMLLine + ' lightgreen">' + player['Order of the Dragon'].Rank + '</td>';
        } else {
          playerHTMLLine = playerHTMLLine + '">' + player['Order of the Dragon'].Rank + '</td>';
        }
      } else {
        playerLine = playerLine + '\t';
        playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
      }
      if (player['Master Garber']) {
        playerLine = playerLine + 'Master\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle green">Master</td>';
      } else if (player['Order of the Garber'] && player['Order of the Garber'].Rank > 6) {
        playerLine = playerLine + player['Order of the Garber'].Rank + '\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle';
        if (player['Order of the Garber'].Rank > 7) {
          playerHTMLLine = playerHTMLLine + ' lightgreen">' + player['Order of the Garber'].Rank + '</td>';
        } else {
          playerHTMLLine = playerHTMLLine + '">' + player['Order of the Garber'].Rank + '</td>';
        }
      } else {
        playerLine = playerLine + '\t';
        playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
      }
      if (player['Master Owl']) {
        playerLine = playerLine + 'Master\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle green">Master</td>';
      } else if (player['Order of the Owl'] && player['Order of the Owl'].Rank > 6) {
        playerLine = playerLine + player['Order of the Owl'].Rank + '\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle';
        if (player['Order of the Owl'].Rank > 7) {
          playerHTMLLine = playerHTMLLine + ' lightgreen">' + player['Order of the Owl'].Rank + '</td>';
        } else {
          playerHTMLLine = playerHTMLLine + '">' + player['Order of the Owl'].Rank + '</td>';
        }
      } else {
        playerLine = playerLine + '\t';
        playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
      }
      playerLine = playerLine + (player['Knight of the Crown'] ? 'TRUE\t' : 'FALSE\t');
      playerHTMLLine = playerHTMLLine + '<td class=middle>' + (player['Knight of the Crown'] ? 'Yes' : 'No') + '</td>';
      playerLine = playerLine + (player['Knight of the Flame'] ? 'TRUE\t' : 'FALSE\t');
      playerHTMLLine = playerHTMLLine + '<td class=middle>' + (player['Knight of the Flame'] ? 'Yes' : 'No') + '</td>';
      playerLine = playerLine + (player['Knight of the Serpent'] ? 'TRUE\t' : 'FALSE\t');
      if (player['Knight of the Serpent']) {
        playerHTMLLine = playerHTMLLine + '<td class="middle green">Yes</td>';
      } else {
        playerHTMLLine = playerHTMLLine + '<td class="middle lightgreen">No</td>';
      }
      playerLine = playerLine + (player['Knight of the Sword'] ? 'TRUE' : 'FALSE');
      playerHTMLLine = playerHTMLLine + '<td class=middle>' + (player['Knight of the Sword'] ? 'Yes' : 'No') + '</td>';
      content = content + playerLine + '\r\n';
      htmlContent = htmlContent + playerHTMLLine + '</tr>';
    });
    serpentContent = content;
    $('#serpentTable').append(htmlContent);

    // do the flames
    content = '';
    htmlContent = '';
    var flameCandidates = allPlayers.filter(function(player) {
      return player['Master Lion'] ||
        (player['Order of the Lion'] && player['Order of the Lion'].Rank > 6) ||
        player['Master Rose'] ||
        (player['Order of the Rose'] && player['Order of the Rose'].Rank > 6) ||
        player['Master Smith'] ||
        (player['Order of the Smith'] && player['Order of the Smith'].Rank > 6);
    });
    flameCandidates.forEach(function(player) {
      var playerLine =
          player.Persona + '\t';
      var playerHTMLLine = '<tr><td>' +
        player.ParkName + '</td><td>' +
        '<a href="https://amtgard.com/ork/orkui/index.php?Route=Player/index/' +
        player.MundaneId + '">' +
        player.Persona + '</a></td>';
      if (player['Master Lion']) {
        playerLine = playerLine + 'Master\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle red">Master</td>';
      } else if (player['Order of the Lion'] && player['Order of the Lion'].Rank > 6) {
        playerLine = playerLine + player['Order of the Lion'].Rank + '\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle';
        if (player['Order of the Lion'].Rank > 7) {
          playerHTMLLine = playerHTMLLine + ' lightred">' + player['Order of the Lion'].Rank + '</td>';
        } else {
          playerHTMLLine = playerHTMLLine + '">' + player['Order of the Lion'].Rank + '</td>';
        }
      } else {
        playerLine = playerLine + '\t';
        playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
      }
      if (player['Master Rose']) {
        playerLine = playerLine + 'Master\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle red">Master</td>';
      } else if (player['Order of the Rose'] && player['Order of the Rose'].Rank > 6) {
        playerLine = playerLine + player['Order of the Rose'].Rank + '\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle';
        if (player['Order of the Rose'].Rank > 7) {
          playerHTMLLine = playerHTMLLine + ' lightred">' + player['Order of the Rose'].Rank + '</td>';
        } else {
          playerHTMLLine = playerHTMLLine + '">' + player['Order of the Rose'].Rank + '</td>';
        }
      } else {
        playerLine = playerLine + '\t';
        playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
      }
      if (player['Master Smith']) {
        playerLine = playerLine + 'Master\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle red">Master</td>';
      } else if (player['Order of the Smith'] && player['Order of the Smith'].Rank > 6) {
        playerLine = playerLine + player['Order of the Smith'].Rank + '\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle';
        if (player['Order of the Smith'].Rank > 7) {
          playerHTMLLine = playerHTMLLine + ' lightred">' + player['Order of the Smith'].Rank + '</td>';
        } else {
          playerHTMLLine = playerHTMLLine + '">' + player['Order of the Smith'].Rank + '</td>';
        }
      } else {
        playerLine = playerLine + '\t';
        playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
      }
      playerLine = playerLine + (player['Knight of the Crown'] ? 'TRUE\t' : 'FALSE\t');
      playerHTMLLine = playerHTMLLine + '<td class=middle>' + (player['Knight of the Crown'] ? 'Yes' : 'No') + '</td>';
      playerLine = playerLine + (player['Knight of the Flame'] ? 'TRUE\t' : 'FALSE\t');
      if (player['Knight of the Flame']) {
        playerHTMLLine = playerHTMLLine + '<td class="middle red">Yes</td>';
      } else {
        playerHTMLLine = playerHTMLLine + '<td class="middle lightred">No</td>';
      }
      playerLine = playerLine + (player['Knight of the Serpent'] ? 'TRUE\t' : 'FALSE\t');
      playerHTMLLine = playerHTMLLine + '<td class=middle>' + (player['Knight of the Serpent'] ? 'Yes' : 'No') + '</td>';
      playerLine = playerLine + (player['Knight of the Sword'] ? 'TRUE' : 'FALSE');
      playerHTMLLine = playerHTMLLine + '<td class=middle>' + (player['Knight of the Sword'] ? 'Yes' : 'No') + '</td>';
      content = content + playerLine + '\r\n';
      htmlContent = htmlContent + playerHTMLLine + '</tr>';
    });
    flameContent = content;
    $('#flameTable').append(htmlContent);

    // do the Swords
    content = '';
    htmlContent = '';
    var swordCandidates = allPlayers.filter(function(player) {
      return player.Warlord ||
        (player['Order of the Warrior'] && player['Order of the Warrior'].Rank > 6);
    });
    swordCandidates.forEach(function(player) {
      var playerLine =
          player.ParkName + '\t' +
          (player.Persona || player.MundaneId) + '\t';
      var playerHTMLLine = '<tr><td>' +
        player.ParkName + '</td><td>' +
        '<a href="https://amtgard.com/ork/orkui/index.php?Route=Player/index/' +
        player.MundaneId + '">' +
        player.Persona + '</a></td>';
      if (player.Warlord) {
        playerLine = playerLine + 'Warlord\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle blue">Warlord</td>';
      } else if (player['Order of the Warrior'] && player['Order of the Warrior'].Rank > 6) {
        playerLine = playerLine + player['Order of the Warrior'].Rank + '\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle';
        if (player['Order of the Warrior'].Rank > 7) {
          playerHTMLLine = playerHTMLLine + ' lightblue">' + player['Order of the Warrior'].Rank + '</td>';
        } else {
          playerHTMLLine = playerHTMLLine + '">' + player['Order of the Warrior'].Rank + '</td>';
        }
      } else {
        playerLine = playerLine + '\t';
        playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
      }

      playerLine = playerLine + (player['Knight of the Crown'] ? 'TRUE\t' : 'FALSE\t');
      playerHTMLLine = playerHTMLLine + '<td class=middle>' + (player['Knight of the Crown'] ? 'Yes' : 'No') + '</td>';
      playerLine = playerLine + (player['Knight of the Flame'] ? 'TRUE\t' : 'FALSE\t');
      playerHTMLLine = playerHTMLLine + '<td class=middle>' + (player['Knight of the Flame'] ? 'Yes' : 'No') + '</td>';
      playerLine = playerLine + (player['Knight of the Serpent'] ? 'TRUE\t' : 'FALSE\t');
      playerHTMLLine = playerHTMLLine + '<td class=middle>' + (player['Knight of the Serpent'] ? 'Yes' : 'No') + '</td>';
      playerLine = playerLine + (player['Knight of the Sword'] ? 'TRUE' : 'FALSE');
      if (player['Knight of the Sword']) {
        playerHTMLLine = playerHTMLLine + '<td class="middle blue">Yes</td>';
      } else {
        playerHTMLLine = playerHTMLLine + '<td class="middle lightblue">No</td>';
      }
      content = content + playerLine + '\r\n';
      htmlContent = htmlContent + playerHTMLLine + '</tr>';
    });
    swordContent = content;
    $('#swordTable').append(htmlContent);

    $('.allresults').attr('hidden', false);
    $('#kingdom').selectmenu('option', 'disabled', false);
  

    window.output = Object.values(allPlayers);
  });
}

function ladderAwards() {
  return {
    'Order of the Dragon': jsork.awardIDs.ORDER_OF_THE_DRAGON,
    'Order of the Garber': jsork.awardIDs.ORDER_OF_THE_GARBER,
    'Order of the Owl': jsork.awardIDs.ORDER_OF_THE_OWL,
    'Order of the Lion': jsork.awardIDs.ORDER_OF_THE_LION,
    'Order of the Rose': jsork.awardIDs.ORDER_OF_THE_ROSE,
    'Order of the Smith': jsork.awardIDs.ORDER_OF_THE_SMITH,
    'Order of the Warrior': jsork.awardIDs.ORDER_OF_THE_WARRIOR
  };
}
function ladderAwardMasterhoods() {
  return {
    'Order of the Dragon': jsork.awardIDs.MASTER_DRAGON,
    'Order of the Garber': jsork.awardIDs.MASTER_GARBER,
    'Order of the Owl': jsork.awardIDs.MASTER_OWL,
    'Order of the Lion': jsork.awardIDs.MASTER_LION,
    'Order of the Rose': jsork.awardIDs.MASTER_ROSE,
    'Order of the Smith': jsork.awardIDs.MASTER_SMITH,
    'Order of the Warrior': jsork.awardIDs.WARLORD
  };
}

function nonLadderAwards() {
  return {
    'Order of the Flame': jsork.awardIDs.ORDER_OF_THE_FLAME,
    'Order of the Jovius': jsork.awardIDs.ORDER_OF_THE_JOVIUS,
    'Order of the Mask': jsork.awardIDs.ORDER_OF_THE_MASK,
    'Order of the Zodiac': jsork.awardIDs.ORDER_OF_THE_ZODIAC,
    'Order of the Hydra': jsork.awardIDs.ORDER_OF_THE_HYDRA,
    'Order of the Griffin': jsork.awardIDs.ORDER_OF_THE_GRIFFIN
  };
}
function nonLadderAwardMasterhoods() {
  return {
    'Order of the Jovius': jsork.awardIDs.MASTER_JOVIUS,
    'Order of the Mask': jsork.awardIDs.MASTER_MASK,
    'Order of the Zodiac': jsork.awardIDs.MASTER_ZODIAC,
    'Order of the Hydra': jsork.awardIDs.MASTER_HYDRA,
    'Order of the Griffin': jsork.awardIDs.MASTER_GRIFFIN
  };
}

function copyTextToClipboard(str) {
  var el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function copySerpent() {
  copyTextToClipboard(serpentContent);
}

$(document).ready(function() {
  startUp();
});
