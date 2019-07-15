/* global jsork, $ */

var remembered = {};

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
  window.noLocations = {};
  setTimeout(sortAndDisplayResults, 5000);
  jsork.kingdom.getKingdoms().then(function(data) {
    remembered.kingdoms = data;
    console.log(data);
  }).then(function() {
    remembered.kingdoms.forEach(function(kingdom) {
      jsork.kingdom.getParks(kingdom.KingdomId).then(function(parks) {
        // console.log(parks);
        parks.forEach(function(park) {
          if (park.Active !== 'Retired' && (park.Location === null || park.Location === '')) {
            if (!window.noLocations[kingdom.KingdomName]) {
              window.noLocations[kingdom.KingdomName] = [];
            }
            window.noLocations[kingdom.KingdomName].push(park);
          }
        })
      });
    });
  });
}

function sortAndDisplayResults() {
  Object.keys(window.noLocations).forEach(function(kingdom) {
    window.noLocations[kingdom] = window.noLocations[kingdom].sort(function(a, b) {
      return a.Name.localeCompare(b.Name);
    });
  });
  Object.keys(window.noLocations).forEach(function(kingdom) {
    window.noLocations[kingdom].forEach(function(park) {
      console.log(kingdom + ", " + park.Name);
    });
  });
}

function startUp() {
  initKingdoms();
}

$(document).ready(function() {
  startUp();
});
