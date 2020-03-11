var debounceSearch = debounce(searchForPlayer, 400);
var playerName = null;

function startUp() {
  $('#query').on('keydown input', debounceSearch);
  // var qrcode = new QRCode("qrcode", {
  //   text: "https://ork.amtgard.com/orkui/?Route=Player/index/43232",
  //   width: 100,
  //   height: 100
  // });
}

function hideSearch() {
  $('#playerBox').show();
  $('#backToSearch').show();
  $('.searchResults').hide();
  $('#search').hide();
  $('.allResults').show();
}

function showSearch() {
  $('#playerBox').hide();
  $('#backToSearch').hide();
  $('.searchResults').show();
  $('#search').show();
  $('.allResults').hide();
}

function backToSearch() {
  showSearch();
}

function doPlayer(mundaneId, element) {
  var Persona = element.children[0].textContent,
      UserName = element.children[1].textContent,
      ParkName = element.children[2].textContent,
      KingdomName = element.children[3].textContent,
      startDate = moment().subtract(12, 'months').format('MM/DD/YYYY'),
      allClasses;
  jsork.player.getClasses(mundaneId).then(function(classes) { 
    allClasses = classes;
    allClasses.forEach(function(aClass) {
        aClass.consolidatedCredits = 0;
    });
    jsork.player.getAttendance(mundaneId).then(function(attendance) {
        attendance.forEach(function(anAttendance) {
            var foundClass = allClasses.find(function(aClass) {
                return aClass.class === anAttendance.ClassName;
            });
            foundClass.consolidatedCredits += anAttendance.Credits;
        });
        allClasses.forEach(function(aClass) {
            var classHTMLLine = '<tr>';
            var warning = (aClass.consolidatedCredits > aClass.credits);
            classHTMLLine = classHTMLLine + '<td>' + aClass.class + '</td>';
            classHTMLLine = classHTMLLine + (warning ? '<td class="lightred">' : '<td>') + aClass.consolidatedCredits + '</td>';
            classHTMLLine = classHTMLLine + (warning ? '<td class="lightred">' : '<td>') + aClass.credits + '</td>';
            classHTMLLine = classHTMLLine + '</tr> ';
            $('#playerTable').append(classHTMLLine);
        });
    });
  });
  $('.generateddate').text('Generated on ' + new Date().toDateString());
  $('.printtitle').html('<a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
  mundaneId + '">Click here to view ' + Persona + ' on the ORK</a>');
  hideSearch();
}

function searchForPlayer() {
  var searchTerm = $('#query').val().trim();

  $('table').find('tr:gt(0)').remove();
  jsork.searchservice.searchPlayer(searchTerm.trim()).then(function(result) {
    var searchResults = result.sort(function(a, b) {
      var aPersona = a.Persona || '';
      var bPersona = b.Persona || '';
      return aPersona.localeCompare(bPersona);
    });
    searchResults.forEach(function(player) {
      var playerHTMLLine = '<tr onclick="doPlayer(' + player.MundaneId + ', this)">';
      playerHTMLLine = playerHTMLLine + '<td>' + player.Persona || '' + '</td>';
      playerHTMLLine = playerHTMLLine + '<td>' + player.UserName || '' + '</td>';
      playerHTMLLine = playerHTMLLine + '<td>' + player.ParkName || '' + '</td>';
      playerHTMLLine = playerHTMLLine + '<td>' + player.KingdomName || '' + '</td>';
      playerHTMLLine = playerHTMLLine + '</tr> ';
      $('#playerList').append(playerHTMLLine);
    });
    $('.working').attr('hidden', true);
    $('.searchResults').attr('hidden', false);
  });
}

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

$(document).ready(function() {
  startUp();
})