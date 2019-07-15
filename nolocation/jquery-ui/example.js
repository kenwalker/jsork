/* global jsork, $ */

var remembered = {};
var ignoreFirstPark = true;

function playerClasses(player, data) {
  var value = $( '#progressbar' ).progressbar( 'option', 'value' );
  $( '#progressbar' ).progressbar( 'option', 'value', value + 1 );
  if (player.Persona.length === 0) {
    return;
  }
  var levelUp = $('<li>');
  levelUp.text(player.Persona);
  data.forEach(function(aClass) {
    var level = jsork.aboutToLevelTo(aClass.credits);
    if (level !== 0) {
      levelUp.append('<ul><li>' + aClass.class + ' level ' + level + '</li></ul>');
    }
  });
  if (levelUp.children().length > 0) {
    $('#player').append(levelUp);
  }
}
function parkSelect(event, ui) {
    // if (ignoreFirstPark) {
    //     ignoreFirstPark = false;
    //     return;
    // }
  resetPlayers();
  $('#player').empty();
  jsork.park.getActivePlayers(parseInt(ui.item.value, 10)).then(
    function(data) {
      $( '#progressbar' ).progressbar({
        max: data.length
      });
      data.forEach(function(player) {
        jsork.player.getClasses(player.MundaneId).then(
          playerClasses.bind(null, player));
      });
    }
  );

}

function resetPlayers() {
  $( '#progressbar' ).progressbar( 'option', 'value', 0 );
  $('#player').empty();
}

function kingdomSelect(event, ui) {
  $('#park').empty();
  resetPlayers();
  ignoreFirstPark = true;
  jsork.kingdom.getParks(parseInt(ui.item.value, 10)).then(function(data) {
    var pSelect = $('#park');
    data.forEach(function(park) {
      if (park.Active === 'Active') {
        var option = $('<option>');
        option.html(park.Name);
        option.val(park.ParkId);
        pSelect.append(option);
      }
    });
    $('#park').selectmenu('option', 'disabled', false);
    $('#park').selectmenu('refresh');

  });
}

function initKingdoms() {
  jsork.kingdom.getKingdoms().then(function(data) {
    remembered.kingdoms = data;
    var kSelect = $('#kingdom');
    data.forEach(function(kingdom) {
      var option = $('<option>');
      option.html(kingdom.KingdomName);
      option.val(kingdom.KingdomId);
      kSelect.append(option);
    });
    $('#kingdom').selectmenu('option', 'disabled', false);
  });
}

function startUp() {
  $('#kingdom').selectmenu();
  $('#park').selectmenu();
  $('#kingdom').on('selectmenuselect', kingdomSelect);
  $('#park').on('selectmenuselect', parkSelect);
  $('#progressbar').progressbar();
  initKingdoms();
}

$(document).ready(function() {
  startUp();
});
