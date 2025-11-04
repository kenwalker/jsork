/* eslint-disable no-unused-vars */
/* global jsork, $ */

var remembered = [];
var allPlayers = [];
var resultPlayers = [];
var removePlayers = [];
var numberOfPlayers = 0;
var minimumRank = 0;
var stringOutput = '';
// var today = moment("2020-12-31");
var startDate = moment().subtract(8, 'months').isoWeekday(1).startOf('isoWeek');
var dotCount = 1;
var startTime = Date.now();
var howManyPlayersChecked = 0;
var totalPlayers = 0;

window.remembered = remembered;

function resetAwards() {
  $('#allawards').empty();
}

function kingdomSelect(event, ui) {
  stringOutput = 'MundaneID\tPlayer\tPark\tBattle\tBattle Knight\tCrown\tCrown Knight\tLion\tRose\tSmith\tFlame Knight\tDragon\tGarber\tOwl\tSerpent Knight\tWarrior\tSword Knight\r\n';
  resultPlayers = [];
  startTime = Date.now();
  dotCount = 1;
  howManyPlayersChecked = 0;
  minimumRank = parseInt($('#level option:selected').text(), 10);
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  if (event.target.value === '0') {
    return;
  }
  $('.working').attr('hidden', false);
  $('#kingdom').selectmenu('option', 'disabled', true);
  getPlayers(parseInt(event.target.value, 10));
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

function getPlayers(kingdomId) {
    jsork.kingdom.getPlayers(kingdomId, jsork.filters.ACTIVE).then(function(result) {
        allPlayers = result;
        // allPlayers = result.slice(0,199);
        // allPlayers = result.slice(450, 510);
        totalPlayers = allPlayers.length;
        getNextPlayerAwards();
    });
}

function getNextPlayerAwards() {
    updateWorkingMessage();
    if (allPlayers.length === 0) {
        outputResults();
        return;
    }
    var nextPlayer = allPlayers.shift();
    var tempLadderAwards = [],
      tempKnighthoods = [],
      tempawardmasters = [];
    jsork.player.getAwards(nextPlayer.MundaneId, jsork.awardIDs.ALL).then(function (awards) {
      // Compute title
      var isKnight = false;
      awards.forEach(function (award) {
        if (award.IsTitle) {
        }
        if (award.IsTitle && award.Name.indexOf("Knight") !== -1) {
          isKnight = true;
        }
      });

      // Compute knighthoods
      if (awards.find(function (award) { return award.AwardId === jsork.awardIDs.KNIGHT_OF_BATTLE; })
        || awards.find(function (award) { return award.AwardId === 94 && award.CustomAwardName !== null && award.CustomAwardName.match(/knight of battle/i); })) {
        tempKnighthoods.push('Battle');
      }
      if (awards.find(function (award) { return award.AwardId === jsork.awardIDs.KNIGHT_OF_THE_SERPENT })
        || awards.find(function (award) { return award.AwardId === 94 && award.CustomAwardName !== null && award.CustomAwardName && award.CustomAwardName.match(/knight of the serpent/i) })) {
        tempKnighthoods.push("Serpent");
      }
      if (awards.find(function (award) { return award.AwardId === jsork.awardIDs.KNIGHT_OF_THE_FLAME })
        || awards.find(function (award) { return award.AwardId === 94 && award.CustomAwardName !== null && award.CustomAwardName && award.CustomAwardName.match(/knight of the flame/i) })) {
        tempKnighthoods.push("Flame");
      }
      if (awards.find(function (award) { return award.AwardId === jsork.awardIDs.KNIGHT_OF_THE_SWORD })
        || awards.find(function (award) { return award.AwardId === 94 && award.CustomAwardName !== null && award.CustomAwardName && award.CustomAwardName.match(/knight of the sword/i) })) {
        tempKnighthoods.push("Sword");
      }
      if (awards.find(function (award) { return award.AwardId === jsork.awardIDs.KNIGHT_OF_THE_CROWN })
        || awards.find(function (award) { return award.AwardId === 94 && award.CustomAwardName !== null && award.CustomAwardName && award.CustomAwardName.match(/knight of the crown/i) })) {
        tempKnighthoods.push("Crown");
      }
      nextPlayer.knighthoods = tempKnighthoods;

      Object.keys(ladderAwards()).forEach(function (awardName) {
        var maxLevel = 0, countLevel = 0, hasBlankLevels = false;
        var filtered = awards.filter(function (award) {
          return award.AwardId === ladderAwards()[awardName];
        });
        filtered.forEach(function (award) {
          if (!award.Rank) {
            hasBlankLevels = true;
          }
          if (award.Rank > maxLevel) {
            maxLevel = award.Rank;
          }
          countLevel++;
        });
        if (countLevel > maxLevel && hasBlankLevels) {
          maxLevel = countLevel;
        }
        maxLevel = maxLevel > 10 ? 10 : maxLevel;
        if (maxLevel >= 0) {
          var splitName = awardName.split(" ");
          tempLadderAwards.push({ award: splitName[splitName.length - 1], level: maxLevel, isMaster: false });
        }
        if (Object.keys(ladderAwardMasterhoods()).includes(awardName)) {
          var isMaster = awards.find(function (award) {
            return award.AwardId === ladderAwardMasterhoods()[awardName];
          });
          if (isMaster) {
            var splitName = awardName.split(" ");
            tempawardmasters.push(splitName[splitName.length - 1]);
            tempLadderAwards.find(function(award) { return award.award === splitName[splitName.length - 1]}).isMaster = true;
          }
        }
      });
      nextPlayer.ladderawards = tempLadderAwards;
      resultPlayers.push(nextPlayer);
      setTimeout(getNextPlayerAwards, 2000);
    });
}

function outputResults() {
    resultPlayers.sort(function (a, b) {
        var personaSort = a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
        var parkSort = a.ParkName.toLowerCase().localeCompare(b.ParkName.toLowerCase());
        if (parkSort !== 0) {
            return parkSort;
        }
        return personaSort;
    });

    resultPlayers.forEach(function (player) {
        var playerLine = player.MundaneId + '\t' + (player.Persona || 'No persona for ID ' + player.MundaneId) + '\t'
        playerLine += (player.ParkName || 'No Park') + '\t';
        var playerHTMLLine = '<tr>';
        playerHTMLLine += '<td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + player.MundaneId + '">' + (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
        playerHTMLLine += '<td>' + (player.ParkName || 'No Park') + '</td>';
        // playerLine +=
        //Battle
        if (player.ladderawards[0].isMaster) {
            playerLine += 'Master\t';
            playerHTMLLine += '<td class="lightblue">Master</td>';
        } else {
            playerLine += player.ladderawards[0].level + '\t';
            playerHTMLLine += '<td class="lightblue">' + player.ladderawards[0].level + '</td>';
        }
        if (player.knighthoods.includes("Battle")) {
            playerLine += 'Yes\t'
            playerHTMLLine += '<td class="lightblue">Yes</td>';
        } else {
            playerLine += 'No\t';
            playerHTMLLine += '<td class="lightblue">No</td>';
        }
        // Crown
        if (player.ladderawards[1].isMaster) {
            playerLine += 'Master\t';
            playerHTMLLine += '<td class="lightgold">Master</td>';
        } else {
            playerLine += player.ladderawards[1].level + '\t';
            playerHTMLLine += '<td class="lightgold">' + player.ladderawards[1].level + '</td>';
        }
        if (player.knighthoods.includes('Crown')) {
            playerLine += 'Yes\t';
            playerHTMLLine += '<td class="lightgold">Yes</td>';
        } else {
            playerLine += 'No\t';
            playerHTMLLine += '<td class="lightgold">No</td>';
        }
        // Lion
        if (player.ladderawards[5].isMaster) {
            playerLine += 'Master\t';
            playerHTMLLine += '<td class="lightred">Master</td>';
        } else {
            playerLine += player.ladderawards[5].level + '\t';
            playerHTMLLine += '<td class="lightred">' + player.ladderawards[5].level + '</td>';
        }
        // Rose
        if (player.ladderawards[6].isMaster) {
            playerLine += 'Master\t';
            playerHTMLLine += '<td class="lightred">Master</td>';
        } else {
            playerLine += player.ladderawards[6].level + '\t';
            playerHTMLLine += '<td class="lightred">' + player.ladderawards[6].level + '</td>';
        }
        // Smith
        if (player.ladderawards[7].isMaster) {
            playerLine += 'Master\t';
            playerHTMLLine += '<td class="lightred">Master</td>';
        } else {
            playerLine += player.ladderawards[7].level + '\t';
            playerHTMLLine += '<td class="lightred">' + player.ladderawards[7].level + '</td>';
        }
        if (player.knighthoods.includes('Flame')) {
            playerLine += 'Yes\t';
            playerHTMLLine += '<td class="lightred">Yes</td>';
        } else {
            playerLine += 'No\t';
            playerHTMLLine += '<td class="lightred">No</td>';
        }
        // Dragon
        if (player.ladderawards[2].isMaster) {
            playerLine += 'Master\t';
            playerHTMLLine += '<td class="lightgreen">Master</td>';
        } else {
            playerLine += player.ladderawards[2].level + '\t';
            playerHTMLLine += '<td class="lightgreen">' + player.ladderawards[2].level + '</td>';
        }
        // Garber
        if (player.ladderawards[3].isMaster) {
            playerLine += 'Master\t';
            playerHTMLLine += '<td class="lightgreen">Master</td>';
        } else {
            playerLine += player.ladderawards[3].level + '\t';
            playerHTMLLine += '<td class="lightgreen">' + player.ladderawards[3].level + '</td>';
        }
        // Owl
        if (player.ladderawards[4].isMaster) {
            playerLine += 'Master\t';
            playerHTMLLine += '<td class="lightgreen">Master</td>';
        } else {
            playerLine += player.ladderawards[4].level + '\t';
            playerHTMLLine += '<td class="lightgreen">' + player.ladderawards[4].level + '</td>';
        }
        if (player.knighthoods.includes('Serpent')) {
            playerLine += 'Yes\t';
            playerHTMLLine += '<td class="lightgreen">Yes</td>';
        } else {
            playerLine += 'No\t';
            playerHTMLLine += '<td class="lightgreen">No</td>';
        }
        // Warrior
        if (player.ladderawards[8].isMaster) {
            playerLine += 'Master\t';
            playerHTMLLine += '<td class="lightgrey">Master</td>';
        } else {
            playerLine += player.ladderawards[8].level + '\t';
            playerHTMLLine += '<td class="lightgrey">' + player.ladderawards[8].level + '</td>';
        }
        if (player.knighthoods.includes('Sword')) {
            playerLine += 'Yes';
            playerHTMLLine += '<td class="lightgrey">Yes</td>';
        } else {
            playerLine += 'No';
            playerHTMLLine += '<td class="lightgrey">No</td>';
        }
        playerHTMLLine += '</tr>';
        $('#playerTable').append(playerHTMLLine);
        stringOutput += playerLine + '\r\n';
    });
    $('.allresults').attr('hidden', false);
    $('#kingdom').selectmenu('option', 'disabled', false);
    $('.working').attr('hidden', true);
}

function trimInactivePlayers(nextIndex) {
  if (nextIndex >= allPlayers.length) {
    doComputations();
    return;
  }
  jsork.player.getLastAttendance(allPlayers[nextIndex].MundaneId).then(function(lastAttendance) {
    if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) >= startDate) {
      // player is ok
    } else {
      removePlayers.push(allPlayers[nextIndex].MundaneId);
    }
    nextIndex++;
    trimInactivePlayers(nextIndex);
  });
}

function ladderAwards() {
  return {
    'Order of Battle': jsork.awardIDs.ORDER_OF_BATTLE,
    'Order of the Crown': jsork.awardIDs.ORDER_OF_THE_CROWN,
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
    'Order of Battle': jsork.awardIDs.BATTLEMASTER,
    'Order of the Crown': jsork.awardIDs.MASTER_CROWN,
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

function updateWorkingMessage() {
    howManyPlayersChecked++;
    if (howManyPlayersChecked % 5 === 0) {
        var avgCallTime = (Date.now() - startTime) / howManyPlayersChecked;
        var timeLeft = moment.duration(avgCallTime * (totalPlayers - howManyPlayersChecked) / 1000, "seconds").humanize();
        $('.working').text('Number of players left to check ' + (totalPlayers - howManyPlayersChecked) + ", time left " + timeLeft);
        if (dotCount > 5) {
            dotCount = 0;
        }
    }
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
  copyTextToClipboard(stringOutput);
}

$(document).ready(function() {
  startUp();
});
