var debounceSearchOne = debounce(searchForPlayerOne, 400);
var debounceSearchTwo = debounce(searchForPlayerTwo, 400);
var playerOne = null;
var playerTwo = null;
var mundaneIdOne = null;
var mundaneIdTwo = null;

function startUp() {
  $('#queryOne').on('keydown input', debounceSearchOne);
  $('#queryTwo').on('keydown input', debounceSearchTwo);
  showSearchOne();
  // var qrcode = new QRCode("qrcode", {
  //   text: "https://ork.amtgard.com/orkui/?Route=Player/index/43232",
  //   width: 100,
  //   height: 100
  // });
}

function hideSearch() {
  $('#playerBox').show();
  $('#backToSearch').show();
  $('.searchResultsOne').hide();
  $('#searchOne').hide();
  $('.searchResultsTwo').hide();
  $('#searchTwo').hide();
  $('.allResults').show();
}

function showSearchOne() {
  $('#whenTheyMet').text('');
  $('#playerBox').hide();
  $('.working').hide();
  $('#backToSearch').hide();
  $('.searchResultsOne').hide();
  $('#searchOne').show();
  $('.searchResultsTwo').hide();
  $('#searchTwo').hide();
  $('.allResults').hide();
}

function showSearchTwo() {
    $('#playerBox').hide();
    $('#backToSearch').hide();
    $('.searchResultsOne').hide();
    $('#searchOne').hide();
    $('.searchResultsTwo').hide();
    $('#searchTwo').show();
    $('.allResults').hide();
  }
  
function backToSearch() {
  showSearchOne();
}

function doPlayerOne(mundaneId, element) {
  var Persona = element.children[0].textContent,
      UserName = element.children[1].textContent,
      ParkName = element.children[2].textContent,
      KingdomName = element.children[3].textContent;
  mundaneIdOne = mundaneId;
  playerOne = Persona + ' (' + UserName + ')';
  showSearchTwo();
}

function doPlayerTwo(mundaneId, element) {
    var Persona = element.children[0].textContent,
    UserName = element.children[1].textContent,
    ParkName = element.children[2].textContent,
    KingdomName = element.children[3].textContent;
    hideSearch();
  mundaneIdTwo = mundaneId;
  playerTwo = Persona + ' (' + UserName + ')';
  $('.working').text('Searching players attendance history...');
  $('.working').show();

//   $('.printtitle').text("Person one is " + playerOne + "<br>" + "Person two is " + playerTwo);

  jsork.player.getAttendance(mundaneIdOne).then(function(attendanceOne) {
    attendanceOne = attendanceOne.reverse();
    jsork.player.getAttendance(mundaneIdTwo).then(function(attendanceTwo) {
        attendanceTwo = attendanceTwo.reverse();
        var getNextAttendance = function(attendances) {
            while (true) {
                var nextAttendance = attendances.shift();
                if (nextAttendance === undefined || nextAttendance.Date !== '0000-00-00') {
                    return nextAttendance;
                }
            }
        };
        var keepLooking = true;
        var firstOne = getNextAttendance(attendanceOne);
        var firstTwo = getNextAttendance(attendanceTwo);
        var foundDateText = null;
        while (keepLooking) {
            var incrementADate = function() {
                if (moment(firstOne.Date) < moment(firstTwo.Date)) {
                    firstOne = getNextAttendance(attendanceOne);
                    if (firstOne === undefined) {
                        keepLooking = false;
                    }
                } else {
                    firstTwo = getNextAttendance(attendanceTwo);
                    if (firstTwo === undefined) {
                        keepLooking = false;
                    }
                }
            };
            if (firstOne === undefined || firstTwo === undefined) {
                keepLooking = false;
            } else {
                if (firstOne.Date === firstTwo.Date) {
                    if ((firstOne.KingdomName && firstOne.KingdomName === firstTwo.KingdomName) &&
                        (firstOne.ParkName && firstOne.ParkName === firstTwo.ParkName)) {
                          foundDateText = " first met at a park day at " + firstOne.ParkName + " in " + firstOne.KingdomName + " on " + moment(firstOne.Date).format('MMMM Do YYYY') + ". Roughly " + moment.duration(moment(firstOne.Date) - moment()).humanize() + ' ago';
                          keepLooking = false;
                        } else {
                            if ((firstOne.EventKingdomName && firstOne.EventKingdomName === firstTwo.EventKingdomName) &&
                                (firstOne.EventName && firstOne.EventName === firstTwo.EventName)) {
                                    foundDateText = " first met at the event " + firstOne.EventName + " in " + firstOne.KingdomName + " on " + moment(firstOne.Date).format('MMMM Do YYYY') + ". Roughly " + moment.duration(moment(firstOne.Date) - moment()).humanize() + ' ago';
                                    keepLooking = false;
                                }
                        }
                    incrementADate();
                    // keepLooking = false;
                } else {
                    incrementADate();
                }    
            }
        }
        if (foundDateText) {
            foundDateText = "It looks like " + playerOne + " and " + playerTwo + foundDateText;
        } else {
            foundDateText = "It looks like " + playerOne + " and " + playerTwo + " have not met according to the ORK records.";
        }
        $('.working').hide();
        $('#whenTheyMet').text(foundDateText);
        $('.allResults').show();
    });
  });
}

function searchForPlayerOne() {
  var searchTerm = $('#queryOne').val().trim();
  if (searchTerm.length === 0) return;

  $('table').find('tr:gt(0)').remove();
  jsork.searchservice.searchPlayer(searchTerm).then(function(result) {
    var searchResults = result.sort(function(a, b) {
      var aPersona = a.Persona || '';
      var bPersona = b.Persona || '';
      return aPersona.localeCompare(bPersona);
    });
    searchResults.forEach(function(player) {
      var playerHTMLLine = '<tr onclick="doPlayerOne(' + player.MundaneId + ', this)">';
      playerHTMLLine = playerHTMLLine + '<td>' + player.Persona || '' + '</td>';
      playerHTMLLine = playerHTMLLine + '<td>' + player.UserName || '' + '</td>';
      playerHTMLLine = playerHTMLLine + '<td>' + player.ParkName || '' + '</td>';
      playerHTMLLine = playerHTMLLine + '<td>' + player.KingdomName || '' + '</td>';
      playerHTMLLine = playerHTMLLine + '</tr> ';
      $('#playerListOne').append(playerHTMLLine);
    });
    $('.working').attr('hidden', true);
    $('.searchResultsOne').show();
  });
}

function searchForPlayerTwo() {
    var searchTerm = $('#queryTwo').val().trim();
    if (searchTerm.length === 0) return;
  
    $('table').find('tr:gt(0)').remove();
    jsork.searchservice.searchPlayer(searchTerm).then(function(result) {
      var searchResults = result.sort(function(a, b) {
        var aPersona = a.Persona || '';
        var bPersona = b.Persona || '';
        return aPersona.localeCompare(bPersona);
      });
      searchResults.forEach(function(player) {
        var playerHTMLLine = '<tr onclick="doPlayerTwo(' + player.MundaneId + ', this)">';
        playerHTMLLine = playerHTMLLine + '<td>' + player.Persona || '' + '</td>';
        playerHTMLLine = playerHTMLLine + '<td>' + player.UserName || '' + '</td>';
        playerHTMLLine = playerHTMLLine + '<td>' + player.ParkName || '' + '</td>';
        playerHTMLLine = playerHTMLLine + '<td>' + player.KingdomName || '' + '</td>';
        playerHTMLLine = playerHTMLLine + '</tr> ';
        $('#playerListTwo').append(playerHTMLLine);
      });
      $('.working').attr('hidden', true);
      $('.searchResultsTwo').show();
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