/* eslint-disable no-unused-vars */
/* global jsork, $ */

var remembered = [];
var numberOfPlayers = 0;
var minimumRank = 0;
var griffinContent, hardcoreContent, hydraContent, joviusContent, maskContent, tacticianContent, zodiacContent;

window.remembered = remembered;

function resetAwards() {
  $('#allawards').empty();
}

function kingdomSelect(event, ui) {
  minimumRank = parseInt($('#level option:selected').text(), 10);
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  if (event.target.value === '0') {
    return;
  }
  $('.working').attr('hidden', false);
  $('#kingdom').selectmenu('option', 'disabled', true);
  getAwards(parseInt(event.target.value, 10));
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

function getAwards(kingdomId) {
  var players = {};
  jsork.kingdom.playerAwards(kingdomId, 0).then(function(awards) {
    awards.forEach(function(award) {
      if (award.MundaneId === 43232) {
          console.log(award.AwardName);
      }
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

    // do the griffins
    var content = '';
    var htmlContent = '';

    var griffinCandidates = allPlayers.filter(function(player) {
        return player['Master Griffin'] ||
          player['Order of the Griffin'] && player['Order of the Griffin'].Rank >= minimumRank;
      });
      griffinCandidates.forEach(function(player) {
      var playerLine =
          player.ParkName + '\t' +
          (player.Persona || 'No persona for ID ' + player.MundaneId) + '\t';
      var playerHTMLLine = '<tr><td>' +
        player.ParkName + '</td><td>' +
        '<a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
        player.MundaneId + '">' +
        (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
      if (player['Master Griffin']) {
        playerLine = playerLine + 'Master\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle gold">Master</td>';
      } else if (player['Order of the Griffin'] && player['Order of the Griffin'].Rank >= minimumRank) {
        playerLine = playerLine + player['Order of the Griffin'].Rank + '\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle';
        if (player['Order of the Griffin'].Rank > 7) {
          playerHTMLLine = playerHTMLLine + ' lightgold">' + player['Order of the Griffin'].Rank + '</td>';
        } else {
          playerHTMLLine = playerHTMLLine + '">' + player['Order of the Griffin'].Rank + '</td>';
        }
      } else {
        playerLine = playerLine + '\t';
        playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
      }
      content = content + playerLine + '\r\n';
      htmlContent = htmlContent + playerHTMLLine + '</tr>';
    });
    griffinContent = content;
    $('#griffinTable').append(htmlContent);

    // // do the hardcores
    // content = '';
    // htmlContent = '';

    // var hardcoreCandidates = allPlayers.filter(function(player) {
    //     return player['Master Hardcore'] ||
    //       player['Order of the Hardcore'] && player['Order of the Hardcore'].Rank >= minimumRank;
    //   });
    //   hardcoreCandidates.forEach(function(player) {
    //   var playerLine =
    //       player.ParkName + '\t' +
    //       (player.Persona || 'No persona for ID ' + player.MundaneId) + '\t';
    //   var playerHTMLLine = '<tr><td>' +
    //     player.ParkName + '</td><td>' +
    //     '<a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
    //     player.MundaneId + '">' +
    //     (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
    //   if (player['Master Hardcore']) {
    //     playerLine = playerLine + 'Master\t';
    //     playerHTMLLine = playerHTMLLine + '<td class="middle gold">Master</td>';
    //   } else if (player['Order of the Hardcore'] && player['Order of the Hardcore'].Rank >= minimumRank) {
    //     playerLine = playerLine + player['Order of the Hardcore'].Rank + '\t';
    //     playerHTMLLine = playerHTMLLine + '<td class="middle';
    //     if (player['Order of the Hardcore'].Rank > 7) {
    //       playerHTMLLine = playerHTMLLine + ' lightgold">' + player['Order of the Hardcore'].Rank + '</td>';
    //     } else {
    //       playerHTMLLine = playerHTMLLine + '">' + player['Order of the Hardcore'].Rank + '</td>';
    //     }
    //   } else {
    //     playerLine = playerLine + '\t';
    //     playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
    //   }
    //   content = content + playerLine + '\r\n';
    //   htmlContent = htmlContent + playerHTMLLine + '</tr>';
    // });
    // hardcoreContent = content;
    // $('#hardcoreTable').append(htmlContent);

    // do the hydras
    content = '';
    htmlContent = '';

    var hydraCandidates = allPlayers.filter(function(player) {
        if (player['Master Hydra']) {
            console.log("MASTER");
        }
        return player['Master Hydra'] ||
          player['Order of the Hydra'] && player['Order of the Hydra'].Rank >= minimumRank;
      });
      hydraCandidates.forEach(function(player) {
      var playerLine =
          player.ParkName + '\t' +
          (player.Persona || 'No persona for ID ' + player.MundaneId) + '\t';
      var playerHTMLLine = '<tr><td>' +
        player.ParkName + '</td><td>' +
        '<a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
        player.MundaneId + '">' +
        (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
      if (player['Master Hydra']) {
        playerLine = playerLine + 'Master\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle gold">Master</td>';
      } else if (player['Order of the Hydra'] && player['Order of the Hydra'].Rank >= minimumRank) {
        playerLine = playerLine + player['Order of the Hydra'].Rank + '\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle';
        if (player['Order of the Hydra'].Rank > 7) {
          playerHTMLLine = playerHTMLLine + ' lightgold">' + player['Order of the Hydra'].Rank + '</td>';
        } else {
          playerHTMLLine = playerHTMLLine + '">' + player['Order of the Hydra'].Rank + '</td>';
        }
      } else {
        playerLine = playerLine + '\t';
        playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
      }
      content = content + playerLine + '\r\n';
      htmlContent = htmlContent + playerHTMLLine + '</tr>';
    });
    hydraContent = content;
    $('#hydraTable').append(htmlContent);

    // do the jovius'
    content = '';
    htmlContent = '';

    var joviusCandidates = allPlayers.filter(function(player) {
        return player['Master Jovius'] ||
            player['Order of the Jovius'] && player['Order of the Jovius'].Rank >= minimumRank;
        });
        joviusCandidates.forEach(function(player) {
        var playerLine =
            player.ParkName + '\t' +
            (player.Persona || 'No persona for ID ' + player.MundaneId) + '\t';
        var playerHTMLLine = '<tr><td>' +
        player.ParkName + '</td><td>' +
        '<a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
        player.MundaneId + '">' +
        (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
        if (player['Master Jovius']) {
        playerLine = playerLine + 'Master\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle gold">Master</td>';
        } else if (player['Order of the Jovius'] && player['Order of the Jovius'].Rank >= minimumRank) {
        playerLine = playerLine + player['Order of the Jovius'].Rank + '\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle';
        if (player['Order of the Jovius'].Rank > 7) {
            playerHTMLLine = playerHTMLLine + ' lightgold">' + player['Order of the Jovius'].Rank + '</td>';
        } else {
            playerHTMLLine = playerHTMLLine + '">' + player['Order of the Jovius'].Rank + '</td>';
        }
        } else {
        playerLine = playerLine + '\t';
        playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
        }
        content = content + playerLine + '\r\n';
        htmlContent = htmlContent + playerHTMLLine + '</tr>';
    });
    joviusContent = content;
    $('#joviusTable').append(htmlContent);
    
    // do the masks
    content = '';
    htmlContent = '';

    var maskCandidates = allPlayers.filter(function(player) {
        return player['Master Mask'] ||
            player['Order of the Mask'] && player['Order of the Mask'].Rank >= minimumRank;
        });
        maskCandidates.forEach(function(player) {
        var playerLine =
            player.ParkName + '\t' +
            (player.Persona || 'No persona for ID ' + player.MundaneId) + '\t';
        var playerHTMLLine = '<tr><td>' +
        player.ParkName + '</td><td>' +
        '<a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
        player.MundaneId + '">' +
        (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
        if (player['Master Mask']) {
        playerLine = playerLine + 'Master\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle gold">Master</td>';
        } else if (player['Order of the Mask'] && player['Order of the Mask'].Rank >= minimumRank) {
        playerLine = playerLine + player['Order of the Mask'].Rank + '\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle';
        if (player['Order of the Mask'].Rank > 7) {
            playerHTMLLine = playerHTMLLine + ' lightgold">' + player['Order of the Mask'].Rank + '</td>';
        } else {
            playerHTMLLine = playerHTMLLine + '">' + player['Order of the Mask'].Rank + '</td>';
        }
        } else {
        playerLine = playerLine + '\t';
        playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
        }
        content = content + playerLine + '\r\n';
        htmlContent = htmlContent + playerHTMLLine + '</tr>';
    });
    maskContent = content;
    $('#maskTable').append(htmlContent);
    
    // // do the tacticians
    // content = '';
    // htmlContent = '';

    // var tacticianCandidates = allPlayers.filter(function(player) {
    //     return player['Master Tactician'] ||
    //         player['Order of the Tactician'] && player['Order of the Tactician'].Rank >= minimumRank;
    //     });
    //     tacticianCandidates.forEach(function(player) {
    //     var playerLine =
    //         player.ParkName + '\t' +
    //         (player.Persona || 'No persona for ID ' + player.MundaneId) + '\t';
    //     var playerHTMLLine = '<tr><td>' +
    //     player.ParkName + '</td><td>' +
    //     '<a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
    //     player.MundaneId + '">' +
    //     (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
    //     if (player['Master Tactician']) {
    //     playerLine = playerLine + 'Master\t';
    //     playerHTMLLine = playerHTMLLine + '<td class="middle gold">Master</td>';
    //     } else if (player['Order of the Tactician'] && player['Order of the Tactician'].Rank >= minimumRank) {
    //     playerLine = playerLine + player['Order of the Tactician'].Rank + '\t';
    //     playerHTMLLine = playerHTMLLine + '<td class="middle';
    //     if (player['Order of the Tactician'].Rank > 7) {
    //         playerHTMLLine = playerHTMLLine + ' lightgold">' + player['Order of the Tactician'].Rank + '</td>';
    //     } else {
    //         playerHTMLLine = playerHTMLLine + '">' + player['Order of the Tactician'].Rank + '</td>';
    //     }
    //     } else {
    //     playerLine = playerLine + '\t';
    //     playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
    //     }
    //     content = content + playerLine + '\r\n';
    //     htmlContent = htmlContent + playerHTMLLine + '</tr>';
    // });
    // tacticianContent = content;
    // $('#tacticianTable').append(htmlContent);
    
    // do the zodiacs
    content = '';
    htmlContent = '';

    var zodiacsCandidates = allPlayers.filter(function(player) {
        return player['Master Zodiac'] ||
            player['Order of the Zodiac'] && player['Order of the Zodiac'].Rank >= minimumRank;
        });
        zodiacsCandidates.forEach(function(player) {
        var playerLine =
            player.ParkName + '\t' +
            (player.Persona || 'No persona for ID ' + player.MundaneId) + '\t';
        var playerHTMLLine = '<tr><td>' +
        player.ParkName + '</td><td>' +
        '<a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
        player.MundaneId + '">' +
        (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
        if (player['Master Zodiac']) {
        playerLine = playerLine + 'Master\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle gold">Master</td>';
        } else if (player['Order of the Zodiac'] && player['Order of the Zodiac'].Rank >= minimumRank) {
        playerLine = playerLine + player['Order of the Zodiac'].Rank + '\t';
        playerHTMLLine = playerHTMLLine + '<td class="middle';
        if (player['Order of the Zodiac'].Rank > 7) {
            playerHTMLLine = playerHTMLLine + ' lightgold">' + player['Order of the Zodiac'].Rank + '</td>';
        } else {
            playerHTMLLine = playerHTMLLine + '">' + player['Order of the Zodiac'].Rank + '</td>';
        }
        } else {
        playerLine = playerLine + '\t';
        playerHTMLLine = playerHTMLLine + '<td class=middle></td>';
        }
        content = content + playerLine + '\r\n';
        htmlContent = htmlContent + playerHTMLLine + '</tr>';
    });
    zodiacContent = content;
    $('#zodiacTable').append(htmlContent);
    


    $('.working').attr('hidden', true);
    $('.allresults').attr('hidden', false);
    $('#kingdom').selectmenu('option', 'disabled', false);

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

function copyGriffinToClipboard() {
  var allCSV = 'Park\tPersona\tGriffin Order\r\n';
  allCSV += griffinContent;
  copyTextToClipboard(allCSV);
}

function copyHardcoreToClipboard() {
    var allCSV = 'Park\tPersona\tHardcore Order\r\n';
    allCSV += hardcoreContent;
    copyTextToClipboard(allCSV);
  }
  
  function copyHydraToClipboard() {
    var allCSV = 'Park\tPersona\tHydra Order\r\n';
    allCSV += hydraContent;
    copyTextToClipboard(allCSV);
  }
  
  function copyJoviusToClipboard() {
    var allCSV = 'Park\tPersona\tJovius Order\r\n';
    allCSV += joviusContent;
    copyTextToClipboard(allCSV);
  }
  
  function copyMaskToClipboard() {
    var allCSV = 'Park\tPersona\tMask Order\r\n';
    allCSV += maskContent;
    copyTextToClipboard(allCSV);
  }
  
  function copyTacticianToClipboard() {
    var allCSV = 'Park\tPersona\tTactician Order\r\n';
    allCSV += tacticianContent;
    copyTextToClipboard(allCSV);
  }
  
  function copyZodiacToClipboard() {
    var allCSV = 'Park\tPersona\tZodiac Order\r\n';
    allCSV += zodiacContent;
    copyTextToClipboard(allCSV);
  }
  
  $(document).ready(function() {
  startUp();
});
