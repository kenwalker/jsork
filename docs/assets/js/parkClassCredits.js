/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = null;
var playerContent = '';

function kingdomSelect(event, ui) {
  playerList = [];
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
  jsork.kingdom.getParks(parseInt(event.target.value, 10)).then(function(data) {
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
  document.getElementById('kingdom').disabled = true;
  document.getElementById('park').disabled = true;
  $('.printtitle').text($('#kingdom option:selected').text() + ' - ' + $('#park option:selected').text());
  $('.generateddate').text('Generated on ' + new Date().toDateString());

  $('.working').attr('hidden', false);
  $('.working').text('Getting players....');
  jsork.park.getPlayers(parseInt(event.target.value, 10), jsork.filters.ACTIVE).then(function(data) {
    // data = data.slice(10, 20);
    var playersLeft = data.length;
    if (playersLeft === 0) {
      document.getElementById('kingdom').disabled = false;
      document.getElementById('park').disabled = false;
      $('.working').attr('hidden', true);
      $('.noplayers').text('There are no active players');
      return;
    }
    data.forEach(function(player) {
        jsork.player.getClasses(player.MundaneId).then(function(classes) {
            $('.working').text('Number of players left to check ' + playersLeft);
            playerList.push({
                Persona: player.Persona,
                MundaneId: player.MundaneId,
                Classes: classes
            });
          if (--playersLeft <= 0) {
            donePlayers();  
          }
      });
    });
  });
}

function donePlayers() {
  if (playerList.length === 0) {
    document.getElementById('kingdom').disabled = false;
    document.getElementById('park').disabled = false;        
    // $('.noplayers').text('Generated on ' + new Date().toDateString());
    $('.working').attr('hidden', true);
    $('.noplayers').text('There are no active players');
    return;
  }
  playerList.sort(function(a, b) {
    return a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
  });
  var lastPlayer = null;
  playerList.forEach(function(aPlayer) {
    var playerHTMLLine = '';
    var playerLine = (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '\t';
    playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
    aPlayer.MundaneId + '">' +
    (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
    aPlayer.Classes.forEach(function(aClass, index) {
        playerLine += aClass.credits + ((index + 1 < aPlayer.Classes.length) ? '\t' : '');
        playerHTMLLine += '<td class="middle">' + aClass.credits + '</td>';    
    });
    playerHTMLLine += '</tr>';
    $('#playerTable').append(playerHTMLLine);
    playerContent += playerLine + '\r\n';
    lastPlayer = aPlayer;
  });
  $('.working').attr('hidden', true);
  $('.allresults').attr('hidden', false);
  document.getElementById('kingdom').disabled = false;
  document.getElementById('park').disabled = false;
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

function copyTextToClipboard(str) {
  var el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function copyToClipboard() {
  var allCSV = 'Persona\tAnti-Paladin\tArcher\tAssassin\tBarbarian\tBard\tColor\tDruid\tHealer\tMonk\tMonster\tPaladin\tPeasant\tReeve\tScout\tWarrior\tWizard\r\n';
  allCSV += playerContent;
  copyTextToClipboard(allCSV);
}

$(document).ready(function() {
  startUp();
});
