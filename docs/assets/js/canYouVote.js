var debounceSearch = debounce(searchForPlayer, 400);
var supportedKingdoms = [
    6,
    10,
    25,
    31
];
var today = moment();

function startUp() {
  $('#query').on('keydown input', debounceSearch);
  var searchParams = new URLSearchParams(window.location.search);
  if (searchParams.has('mundaneId')) {
    clickedPlayer(searchParams.get('mundaneId'));
  }
}

function gatheringInfo() {
    $('.searchResults').hide();
    $('#search').hide();
    $('.allResults').hide();     
    $('.working').show(); 
    $('.working').text('Retrieving player information...');
}

function setVotingText(votingText) {
  $('#votingtext').text(votingText);
}

function clearVotingText() {
  setVotingText("");
}

function showPlayerInfo() {
    $('.working').text('');
    $('.working').hide();
    $('.allResults').show();
}

function hideSearch() {
  $('#backToSearch').show();
}

function showSearch() {
  $('#playerBox').hide();
  $('#backToSearch').hide();
  $('.searchResults').show();
  $('#search').show();
  $('.allResults').hide();
}

function backToSearch() {
  clearVotingText();
  showSearch();
  var url = new URL(window.location.href);
  url.searchParams.delete('mundaneId');
  history.replaceState(null, null, url.href);
}
function clickedPlayer(mundaneId) {
    gatheringInfo();
    jsork.player.getInfo(mundaneId).then(function(aPlayer) {
        switch (aPlayer.KingdomId) {
            case 6:
              kingdom6(aPlayer);
              break;
            case 10:
              kingdom10(aPlayer);
              break;
            case 25:
              kingdom25(aPlayer);
              break;
            case 31: 
              kingdom31(aPlayer);
              break;
        }
      });
}

function doPlayer(mundaneId, element) {
  var Persona = element.children[0].textContent,
      UserName = element.children[1].textContent,
      ParkName = element.children[2].textContent,
      KingdomName = element.children[3].textContent,
      startDate = moment().subtract(12, 'months').format('MM/DD/YYYY'),
      sortedAttendance = [];
  jsork.player.getAttendanceFrom(mundaneId, startDate).then(function(attendance) {
    attendance.forEach(function(entry) {
      var foundItem = null;
      if (entry.EventName) {
        foundItem = sortedAttendance.find(function(item) {
          return item.EventName === entry.EventName;
        });
        if (foundItem) {
          foundItem.Credits += entry.Credits;
        } else {
          sortedAttendance.push(entry);
        }
      } else {
        foundItem = sortedAttendance.find(function(item) {
          return item.KingdomName === entry.KingdomName && item.ParkName === entry.ParkName;
        });
        if (foundItem) {
          foundItem.Credits += entry.Credits;
        } else {
          sortedAttendance.push(entry);
        }
      }
    });
    sortedAttendance.sort(function(a, b) {
      return b.Credits - a.Credits;
    });
    $('.printtitle').text(Persona + ' - ' + UserName);
    $('.generateddate').text('Generated on ' + new Date().toDateString());
    sortedAttendance.forEach(function(creditSum) {
      var creditHTMLLine = '<tr>';
      creditHTMLLine = creditHTMLLine + '<td>' + (creditSum.KingdomName || '') + '</td>';
      creditHTMLLine = creditHTMLLine + '<td>' + (creditSum.ParkName || '') + '</td>';
      creditHTMLLine = creditHTMLLine + '<td>' + (creditSum.EventName || '') + '</td>';
      creditHTMLLine = creditHTMLLine + '<td>' + (creditSum.Credits || '') + '</td>';
      creditHTMLLine = creditHTMLLine + '</tr> ';
      $('#playerTable').append(creditHTMLLine);

    });
  });
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
      supportedKingdom = supportedKingdoms.includes(player.KingdomId);
      var playerHTMLLine = '<tr onclick="clickedPlayer(' + player.MundaneId + ')"';
      playerHTMLLine += supportedKingdom ? '' : ' class="disabled"';
      playerHTMLLine += player.Suspended ? ' class="suspended"' : '';
      playerHTMLLine += '>';
      playerHTMLLine = playerHTMLLine + '<td>' + player.Persona || '' + '</td>';
      playerHTMLLine = playerHTMLLine + '<td>' + player.UserName || '' + '</td>';
      playerHTMLLine = playerHTMLLine + '<td>' + player.ParkName || '' + '</td>';
      playerHTMLLine = playerHTMLLine + '<td>' + player.KingdomName || '' + '</td>';
      playerHTMLLine = playerHTMLLine + '<td>' + (supportedKingdom ? "Yes" : "No") || '' + '</td>';
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

function kingdom6(player) {
  $('#playerTable').empty();
  var votingText = "In Emerald Hills a player must be waivered, be dues paid, and have signed in at a minimum of six Emerald Hills functions, in six different weeks, within the previous six months. The attendance week starts on Tuesday and ends on Monday for Emerald Hills.";
  var startDate = moment(today).subtract(6, 'months').startOf('week').isoWeekday(2);
  jsork.park.getKnights(player.ParkId).then(function (parkKnights) {
    var isKnight = parkKnights.find(function(aKnight) { return aKnight.MundaneId === player.MundaneId });
    jsork.player.getLastAttendance(player.MundaneId).then(function (lastAttendance) {
      var playerWeeks = {};
      jsork.player.getAttendanceFrom(player.MundaneId, startDate.format('MM/DD/YYYY')).then(function (allAttendance) {
        allAttendance.forEach(function (attendance) {
          if (moment(attendance.Date) <= today) {
            if (attendance.KingdomId === 6 || attendance.EventKingdomId === 6) {
              if (!playerWeeks[moment(attendance.Date).startOf('week').isoWeekday(2).isoWeek()]) {
                  playerWeeks[moment(attendance.Date).startOf('week').isoWeekday(2).isoWeek()] = [];
              }
              playerWeeks[moment(attendance.Date).startOf('week').isoWeekday(2).isoWeek()].push(attendance);
            }
          }
        });
        jsork.player.getInfo(player.MundaneId).then(function (playerInfo) {
          var duesForLife = false;
          playerInfo.DuesPaidList.forEach(function (dues) { if (dues.DuesForLife) { duesForLife = true } });
          playerInfo.attendance = playerWeeks;
          playerInfo.duesForLife = duesForLife;
          playerInfo.DuesPaid = duesForLife || moment(playerInfo.DuesThrough) > moment();
          playerInfo.IsKnight = isKnight;
          jsork.player.getFirstAttendance(playerInfo.MundaneId).then(function (attendance) {
            if (moment(attendance[0].Date) <= startDate) {
              playerInfo.sixMonthsPlayed = true;
            } else {
              playerInfo.sixMonthsPlayed = false;
            }
            playerInfo.firstAttendance = attendance[0].Date;
            var playerHTMLLine = '';
            playerHTMLLine += '<tr>';
            playerHTMLLine += '<th class="left">Player</th>';
            playerHTMLLine += '<th class="middle">Can Vote</th>';
            playerHTMLLine += '<th class="middle">Signed Waiver</th>';
            playerHTMLLine += '<th class="middle">Dues Paid</th>';
            playerHTMLLine += '<th class="middle">Weeks of attendance</th>';
            playerHTMLLine += '<th class="middle">First Attendance</th>';
            playerHTMLLine += '<th class="middle">Active Knight</th>';
            playerHTMLLine += '</tr>';
            var attendanceNumber = Object.keys(playerInfo.attendance).length;
            var canVote = playerInfo.Waivered && playerInfo.DuesPaid && attendanceNumber >= 6 && playerInfo.sixMonthsPlayed;
            playerInfo.ActiveKnight = attendanceNumber >= 8 && canVote;

            if (canVote) {
              playerHTMLLine += '<tr class="lightgreen">';
            } else {
              playerHTMLLine += '<tr>';
            }
            playerHTMLLine += '<td ' + (canVote ? 'class="lightgreen"' : '') + '><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
              playerInfo.MundaneId + '" target="_blank">' +
              (playerInfo.Persona || 'No persona for ID ' + playerInfo.MundaneId) + '</a></td>';
            playerHTMLLine += '<td ' + (canVote ? 'class="lightgreen"' : '') + '>' + (canVote ? 'Vote' : 'Can\'t Vote') + '</td>';
            playerHTMLLine += '<td class="middle ' + (playerInfo.Waivered ? 'lightgreen' : 'lightred') + '">' + (playerInfo.Waivered ? 'Waivered' : 'Sign Waiver') + '</td>';
            playerHTMLLine += '<td class="middle ' + (playerInfo.DuesPaid ? 'lightgreen' : 'lightred') + '">' + (playerInfo.DuesPaid ? (playerInfo.duesForLife ? "Dues for Life" : playerInfo.DuesThrough) : 'Pay Dues') + '</td>';
            playerHTMLLine += '<td class="middle ' + (attendanceNumber >= 6 ? 'lightgreen' : 'lightred') + '">' + attendanceNumber + '</td>';
            playerHTMLLine += '<td class="middle ' + (playerInfo.sixMonthsPlayed ? 'lightgreen' : 'lightred') + '">' + playerInfo.firstAttendance + '</td>';
            if (playerInfo.IsKnight) {
              playerHTMLLine += '<td class="middle ' + (playerInfo.ActiveKnight ? 'lightgreen':'lightred') + '">' + (playerInfo.ActiveKnight ? "Yes" : "No") + '</td>';
            } else {
              playerHTMLLine += '<td class="middle white"></td>';
            }
            playerHTMLLine += "</tr>";
            $('#playerTable').append(playerHTMLLine);
            showPlayerInfo();
            var queryParams = new URLSearchParams(window.location.search);
            queryParams.set("mundaneId", playerInfo.MundaneId);
            history.replaceState(null, null, "?" + queryParams.toString());
            setVotingText(votingText);
            hideSearch();
          });
        });
      });
    });
  });
}

function kingdom10(player) {
  $('#playerTable').empty();
  var votingText = "In the Rising Winds a player must be waivered (2.1.4), have attended 7 different days in the last 6 months at any event or park day within the Rising Winds (2.2.2.2), be dues paid (2.2.2.5), and not have joined within the last six months.";
  var startDate = moment(today).subtract(6, 'months').isoWeekday(1).startOf('isoWeek');
  jsork.player.getLastAttendance(player.MundaneId).then(function (lastAttendance) {
      var playerWeeks = {};
      jsork.player.getAttendanceFrom(player.MundaneId, startDate.format('MM/DD/YYYY')).then(function (allAttendance) {
          allAttendance.forEach(function(attendance) {
            if (moment(attendance.Date) <= today) {
              if (attendance.KingdomId === 10 || attendance.EventKingdomId === 10) {
                playerWeeks[Object.keys(playerWeeks).length.toString()] = [];
              }
            }
          });
          jsork.player.getInfo(player.MundaneId).then(function (playerInfo) {
              var duesForLife = false;
              playerInfo.DuesPaidList.forEach(function (dues) { if (dues.DuesForLife) { duesForLife = true } });
              playerInfo.attendance = playerWeeks;
              playerInfo.duesForLife = duesForLife;
              playerInfo.DuesPaid = duesForLife || moment(playerInfo.DuesThrough) > moment()
              jsork.player.getFirstAttendance(playerInfo.MundaneId).then(function (attendance) {
                  if (moment(attendance[0].Date) <= startDate) {
                      playerInfo.sixMonthsPlayed = true;
                  } else {
                      playerInfo.sixMonthsPlayed = false;
                  }
                  playerInfo.firstAttendance = attendance[0].Date;
                  var playerHTMLLine = '';
                  playerHTMLLine += '<tr>';
                  playerHTMLLine += '<th class="left">Player</th>';
                  playerHTMLLine += '<th class="middle">Can Vote</th>';
                  playerHTMLLine += '<th class="middle">Signed Waiver</th>';
                  playerHTMLLine += '<th class="middle">Dues Paid</th>';
                  playerHTMLLine += '<th class="middle">Days of attendance</th>';
                  playerHTMLLine += '<th class="middle">First Attendance</th>';
                  playerHTMLLine += '</tr>';
                  var attendanceNumber = Object.keys(playerInfo.attendance).length;
                  var canVote = playerInfo.Waivered && playerInfo.DuesPaid && attendanceNumber >= 7 && playerInfo.sixMonthsPlayed;
                  if (canVote) {
                      playerHTMLLine += '<tr class="lightgreen">';
                    } else {
                      playerHTMLLine += '<tr>';
                    }
                  playerHTMLLine += '<td ' + (canVote ? 'class="lightgreen"' : '') + '><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
                  playerInfo.MundaneId + '" target="_blank">' +
                  (playerInfo.Persona || 'No persona for ID ' + playerInfo.MundaneId) + '</a></td>';
                  playerHTMLLine += '<td ' + (canVote ? 'class="lightgreen"' : '') + '>' + (canVote ? 'Vote' : 'Can\'t Vote') + '</td>';
                  playerHTMLLine += '<td class="middle ' + (playerInfo.Waivered ? 'lightgreen' : 'lightred') + '">' + (playerInfo.Waivered ? 'Waivered' : 'Sign Waiver') + '</td>';
                  playerHTMLLine += '<td class="middle ' + (playerInfo.DuesPaid ? 'lightgreen' : 'lightred') + '">' + (playerInfo.DuesPaid ? (playerInfo.duesForLife ? "Dues for Life" : playerInfo.DuesThrough) : 'Pay Dues') + '</td>';
                  playerHTMLLine += '<td class="middle ' + (attendanceNumber >= 7 ? 'lightgreen' : 'lightred') + '">' + attendanceNumber + '</td>';
                  playerHTMLLine += '<td class="middle ' + (playerInfo.sixMonthsPlayed ? 'lightgreen' : 'lightred') + '">' + playerInfo.firstAttendance + '</td>';
                  $('#playerTable').append(playerHTMLLine);
                  showPlayerInfo();
                  var queryParams = new URLSearchParams(window.location.search);
                  queryParams.set("mundaneId", playerInfo.MundaneId);
                  history.replaceState(null, null, "?"+queryParams.toString());
                  setVotingText(votingText);
                  hideSearch();
              });
          });
      });
  });
}

function kingdom25(player) {
  $('#playerTable').empty();
  var votingText = "In the Viridian Outlands a player must have attended 6 different days in the last 6 months anywhere in the Viridian Outlands, be dues paid, and have signed a waiver. The Viridian Outlands Week starts on Monday and ends on Sunday.";
  var startDate = moment(today).subtract(6, 'months').isoWeekday(1).startOf('isoWeek');
  jsork.player.getLastAttendance(player.MundaneId).then(function (lastAttendance) {
      var playerWeeks = {};
      jsork.player.getAttendanceFrom(player.MundaneId, startDate.format('MM/DD/YYYY')).then(function (allAttendance) {
          allAttendance.forEach(function(attendance) {
            if (moment(attendance.Date) <= today) {
              if (attendance.KingdomId === 25 || attendance.EventKingdomId === 25) {
                playerWeeks[Object.keys(playerWeeks).length.toString()] = [];
              }
            }
          });
          jsork.player.getInfo(player.MundaneId).then(function (playerInfo) {
              var duesForLife = false;
              playerInfo.DuesPaidList.forEach(function (dues) { if (dues.DuesForLife) { duesForLife = true } });
              playerInfo.attendance = playerWeeks;
              playerInfo.duesForLife = duesForLife;
              playerInfo.DuesPaid = duesForLife || moment(playerInfo.DuesThrough) > moment();
              var playerHTMLLine = '';
              playerHTMLLine += '<tr>';
              playerHTMLLine += '<th class="left">Player</th>';
              playerHTMLLine += '<th class="middle">Can Vote</th>';
              playerHTMLLine += '<th class="middle">Signed Waiver</th>';
              playerHTMLLine += '<th class="middle">Dues Paid</th>';
              playerHTMLLine += '<th class="middle">Days of attendance</th>';
              playerHTMLLine += '</tr>';
              var attendanceNumber = Object.keys(playerInfo.attendance).length;
              var canVote = playerInfo.Waivered && playerInfo.DuesPaid && attendanceNumber >= 6;
              if (canVote) {
                  playerHTMLLine += '<tr class="lightgreen">';
                } else {
                  playerHTMLLine += '<tr>';
                }
              playerHTMLLine += '<td ' + (canVote ? 'class="lightgreen"' : '') + '><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
              playerInfo.MundaneId + '" target="_blank">' +
              (playerInfo.Persona || 'No persona for ID ' + playerInfo.MundaneId) + '</a></td>';
              playerHTMLLine += '<td ' + (canVote ? 'class="lightgreen"' : '') + '>' + (canVote ? 'Vote' : 'Can\'t Vote') + '</td>';
              playerHTMLLine += '<td class="middle ' + (playerInfo.Waivered ? 'lightgreen' : 'lightred') + '">' + (playerInfo.Waivered ? 'Waivered' : 'Sign Waiver') + '</td>';
              playerHTMLLine += '<td class="middle ' + (playerInfo.DuesPaid ? 'lightgreen' : 'lightred') + '">' + (playerInfo.DuesPaid ? (playerInfo.duesForLife ? "Dues for Life" : playerInfo.DuesThrough) : 'Pay Dues') + '</td>';
              playerHTMLLine += '<td class="middle ' + (attendanceNumber >= 6 ? 'lightgreen' : 'lightred') + '">' + attendanceNumber + '</td>';
              playerHTMLLine += '</tr>';
              $('#playerTable').append(playerHTMLLine);
              showPlayerInfo();
              var queryParams = new URLSearchParams(window.location.search);
              queryParams.set("mundaneId", playerInfo.MundaneId);
              history.replaceState(null, null, "?"+queryParams.toString());
              setVotingText(votingText);
              hideSearch();
            });
      });
  });
}

function kingdom31(player) {
    $('#playerTable').empty();
    var votingText = "In the Nine Blades, a player must be 16 years or older, have a waiver signed (membership requirement), attended 6 different weeks in the last 6 months anywhere in the Nine Blades, be dues paid and not have joined within the last six months. The Nine Blades Week starts on Monday and ends on Sunday.";
    var startDate = moment(today).subtract(6, 'months').isoWeekday(1).startOf('isoWeek');
    jsork.player.getLastAttendance(player.MundaneId).then(function (lastAttendance) {
        var playerWeeks = {};
        jsork.player.getAttendanceFrom(player.MundaneId, startDate.format('MM/DD/YYYY')).then(function (allAttendance) {
            allAttendance.forEach(function (attendance) {
                if (moment(attendance.Date) <= today) {
                    if (attendance.KingdomId === 31 || attendance.EventKingdomId === 31) {
                        if (!playerWeeks[moment(attendance.Date).isoWeekday(1).week()]) {
                            playerWeeks[moment(attendance.Date).isoWeekday(1).week()] = [];
                        }
                        playerWeeks[moment(attendance.Date).isoWeekday(1).week()].push(attendance);
                    }
                }
            });
            jsork.player.getInfo(player.MundaneId).then(function (playerInfo) {
                var duesForLife = false;
                playerInfo.DuesPaidList.forEach(function (dues) { if (dues.DuesForLife) { duesForLife = true } });
                playerInfo.attendance = playerWeeks;
                playerInfo.duesForLife = duesForLife;
                playerInfo.DuesPaid = duesForLife || moment(playerInfo.DuesThrough) > moment()
                jsork.player.getFirstAttendance(playerInfo.MundaneId).then(function (attendance) {
                    if (moment(attendance[0].Date) <= startDate) {
                        playerInfo.sixMonthsPlayed = true;
                    } else {
                        playerInfo.sixMonthsPlayed = false;
                    }
                    playerInfo.firstAttendance = attendance[0].Date;
                    var playerHTMLLine = '';
                    playerHTMLLine += '<tr>';
                    playerHTMLLine += '<th class="left">Player</th>';
                    playerHTMLLine += '<th class="middle">Can Vote</th>';
                    playerHTMLLine += '<th class="middle">Signed Waiver</th>';
                    playerHTMLLine += '<th class="middle">Dues Paid</th>';
                    playerHTMLLine += '<th class="middle">Weeks of attendance</th>';
                    playerHTMLLine += '<th class="middle">First Attendance</th>';
                    playerHTMLLine += '</tr>';
                    var attendanceNumber = Object.keys(playerInfo.attendance).length;
                    var canVote = playerInfo.Waivered && playerInfo.DuesPaid && attendanceNumber >= 6 && playerInfo.sixMonthsPlayed;
                    if (canVote) {
                        playerHTMLLine += '<tr class="lightgreen">';
                      } else {
                        playerHTMLLine += '<tr>';
                      }
                    playerHTMLLine += '<td ' + (canVote ? 'class="lightgreen"' : '') + '><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
                    playerInfo.MundaneId + '" target="_blank">' +
                    (playerInfo.Persona || 'No persona for ID ' + playerInfo.MundaneId) + '</a></td>';
                    playerHTMLLine += '<td ' + (canVote ? 'class="lightgreen"' : '') + '>' + (canVote ? 'Vote' : 'Can\'t Vote') + '</td>';
                    playerHTMLLine += '<td class="middle ' + (playerInfo.Waivered ? 'lightgreen' : 'lightred') + '">' + (playerInfo.Waivered ? 'Waivered' : 'Sign Waiver') + '</td>';
                    playerHTMLLine += '<td class="middle ' + (playerInfo.DuesPaid ? 'lightgreen' : 'lightred') + '">' + (playerInfo.DuesPaid ? (playerInfo.duesForLife ? "Dues for Life" : playerInfo.DuesThrough) : 'Pay Dues') + '</td>';
                    playerHTMLLine += '<td class="middle ' + (attendanceNumber >= 6 ? 'lightgreen' : 'lightred') + '">' + attendanceNumber + '</td>';
                    playerHTMLLine += '<td class="middle ' + (playerInfo.sixMonthsPlayed ? 'lightgreen' : 'lightred') + '">' + playerInfo.firstAttendance + '</td>';
                    $('#playerTable').append(playerHTMLLine);
                    showPlayerInfo();
                    var queryParams = new URLSearchParams(window.location.search);
                    queryParams.set("mundaneId", playerInfo.MundaneId);
                    history.replaceState(null, null, "?"+queryParams.toString());
                    setVotingText(votingText);
                    hideSearch();
                });
            });
        });
    });
}

$(document).ready(function() {
  startUp();
})