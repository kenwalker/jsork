/* eslint-disable no-unused-vars */
/* global jsork, $ */

var numberOfParks = 0;

function kingdomSelect(event, ui) {
  $('.allresults').empty();
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  if (event.target.value === '0') {
    return;
  }
  $('.working').attr('hidden', false);
  $('#kingdom').selectmenu('option', 'disabled', true);
  getOfficers(parseInt(event.target.value, 10));
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

function getOfficers(kingdomId) {
  var htmlOutput = '';
  jsork.kingdom.getInfo(kingdomId).then(function(kingdom) {
    $('.allresults').append( '<h3>' + kingdom.KingdomName + '</h3>');
    jsork.kingdom.getOfficers(kingdomId).then(function(kingdomOfficers) {
      if (kingdom.KingdomName !== 'The Freeholds of Amtgard') {
        var monarch = kingdomOfficers.find(function(officer) {
          return officer.OfficerRole === 'Monarch';
        });
        var regent = kingdomOfficers.find(function(officer) {
          return officer.OfficerRole === 'Regent';
        });
        var pm = kingdomOfficers.find(function(officer) {
          return officer.OfficerRole === 'Prime Minister';
        });
        var champion = kingdomOfficers.find(function(officer) {
          return officer.OfficerRole === 'Champion';
        });
        var gmr = kingdomOfficers.find(function(officer) {
          return officer.OfficerRole === 'GMR';
        });
        $('.allresults').append('<b>Monarch:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + monarch.MundaneId + '">' + monarch.Persona + '</a>' + ((monarch.Surname || monarch.GivenName) ? ' (' + monarch.Surname + ', ' + monarch.GivenName + ')' : '') + '<br>');
        $('.allresults').append('<b>Regent:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + regent.MundaneId + '">' + regent.Persona + '</a>' + ((regent.Surname || regent.GivenName) ? ' (' + regent.Surname + ', ' + regent.GivenName + ')' : '') + '<br>');
        $('.allresults').append('<b>Prime Minister:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + pm.MundaneId + '">' + pm.Persona + '</a>' + ((pm.Surname || pm.GivenName) ? ' (' + pm.Surname + ', ' + pm.GivenName + ')' : '') + '<br>');
        $('.allresults').append('<b>Champion:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + champion.MundaneId + '">' + champion.Persona + '</a>' + ((champion.Surname || champion.GivenName) ? ' (' + champion.Surname + ', ' + champion.GivenName + ')' : '') + '<br>');
        $('.allresults').append('<b>GMR:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + gmr.MundaneId + '">' + gmr.Persona + '</a>' + ((gmr.Surname || gmr.GivenName) ? ' (' + gmr.Surname + ', ' + gmr.GivenName + ')' : '') + '<br>');
        $('.allresults').append('<p>');
      }
      $('.allresults').append('<p><h2>All Parks</h2></p>');
      var allParks = {};

      jsork.kingdom.getParks(kingdomId).then(function(parks) {
        var parksLeft = parks.length;
        parks.forEach(function(park) {
          if (park.Active === 'Active') {
            jsork.park.getOfficers(park.ParkId).then(function(parkOfficers) {
              var parkHTML = '';
              parkHTML += '<h3>' + park.Name + '</h3>';
              var parkMonarch = parkOfficers.find(function(officer) {
                return officer.OfficerRole === 'Monarch';
              });
              var parkRegent = parkOfficers.find(function(officer) {
                return officer.OfficerRole === 'Regent';
              });
              var parkPM = parkOfficers.find(function(officer) {
                return officer.OfficerRole === 'Prime Minister';
              });
              var parkChampion = parkOfficers.find(function(officer) {
                return officer.OfficerRole === 'Champion';
              });
              var parkGmr = parkOfficers.find(function(officer) {
                return officer.OfficerRole === 'GMR';
              });
      
              if (parkMonarch && parkMonarch.Persona) {
                parkHTML += '<b>Monarch:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + parkMonarch.MundaneId + '">' + parkMonarch.Persona + '</a>' + ((parkMonarch.Surname || parkMonarch.GivenName) ? ' (' + parkMonarch.Surname + ', ' + parkMonarch.GivenName + ')' : '') + '<br>';
              }
              if (parkRegent && parkRegent.Persona) {
                parkHTML += '<b>Regent:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + parkRegent.MundaneId + '">' + parkRegent.Persona + '</a>' + ((parkRegent.Surname || parkRegent.GivenName) ? ' (' + parkRegent.Surname + ', ' + parkRegent.GivenName + ')' : '') + '<br>';
              }
              if (parkPM && parkPM.Persona) {
                parkHTML += '<b>Prime Minister:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + parkPM.MundaneId + '">' + parkPM.Persona + '</a>' + ((parkPM.Surname || parkPM.GivenName) ? ' (' + parkPM.Surname + ', ' + parkPM.GivenName + ')' : '') + '<br>';
              }
              if (parkChampion && parkChampion.Persona) {
                parkHTML += '<b>Champion:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + parkChampion.MundaneId + '">' + parkChampion.Persona + '</a>' + ((parkChampion.Surname || parkChampion.GivenName) ? ' (' + parkChampion.Surname + ', ' + parkChampion.GivenName + ')' : '') + '<br>';
              }
              if (parkGmr && parkGmr.Persona) {
                parkHTML += '<b>GMR:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + parkGmr.MundaneId + '">' + parkGmr.Persona + '</a>' + ((parkGmr.Surname || parkGmr.GivenName) ? ' (' + parkGmr.Surname + ', ' + parkGmr.GivenName + ')' : '') + '<br>';
              }
              parkHTML += '<p>';
              allParks[park.Name] = parkHTML;
              if (--parksLeft <= 0) {
                Object.keys(allParks).sort().forEach(function(aPark) {
                  $('.allresults').append(allParks[aPark]);
                });
                $('.allresults').attr('hidden', false);
                $('#kingdom').selectmenu('option', 'disabled', false);
                $('.working').attr('hidden', true);
              }
            });
          } else if (--parksLeft <= 0) {
            Object.keys(allParks).sort().forEach(function(aPark) {
              $('.allresults').append(allParks[aPark]);
            });
            $('.allresults').attr('hidden', false);
            $('#kingdom').selectmenu('option', 'disabled', false);
            $('.working').attr('hidden', true);
          }
        });
      });
    });
  });
}

function ladderAwards() {
  return {
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

function copyTextToClipboard(str) {
  var el = document.createElement('textarea');
  el.value = str;
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function copyCrownToClipboard() {
  var allCSV = 'Park\tPersona\tCrown Order\tCrown\tFlame\tSerpent\tSword\r\n';
  allCSV += crownContent;
  copyTextToClipboard(allCSV);
}

function copyFlameToClipboard() {
  var allCSV = 'Park\tPersona\tLion\tRose\tSmith\tCrown\tFlame\tSerpent\tSword\r\n';
  allCSV += flameContent;
  copyTextToClipboard(allCSV);
}

function copySerpentToClipboard() {
  var allCSV = 'Park\tPersona\tDragon\tGarber\tOwl\tCrown\tFlame\tSerpent\tSword\r\n';
  allCSV += serpentContent;
  copyTextToClipboard(allCSV);
}

function copySwordToClipboard() {
  var allCSV = 'Park\tPersona\tWarrior\tCrown\tFlame\tSerpent\tSword\r\n';
  allCSV += swordContent;
  copyTextToClipboard(allCSV);
}

$(document).ready(function() {
  startUp();
});
