/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerContent = '';
var numberOfDays = 0;
var startDate;
var incrementalDate;
var endDate;
var localPlayersOnly = true;
var uniqueParkIDs = {};
var uniqueKingdoms = {};
var allCSV = '';
var kingdomName = '';
var kingdomParks = [];

function kingdomSelect(event, ui) {
  uniqueParkIDs = {};
  uniqueKingdoms = {};
  allCSV = '';
  localPlayersOnly = $('#localonly').is(":checked");
  startDate = moment($('#startdate').val());
  incrementalDate = moment($('#startdate').val());
  endDate = moment($('#enddate').val()).endOf('month');
  if (startDate > endDate) {
    alert("End month before start month silly");
    return;
  }
  kingdomName = $('#kingdom option:selected').text();
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
    kingdomParks = data;
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
};

function parkSelect(event, ui) {
  uniqueParkIDs = {};
  uniqueKingdoms = {};
  allCSV = '';
  localPlayersOnly = $('#localonly').is(":checked");
  startDate = moment($('#startdate').val());
  incrementalDate = moment($('#startdate').val());
  endDate = moment($('#enddate').val()).endOf('month');
  if (startDate > endDate) {
    alert("End month before start month silly");
    return;
  }

  $('.numberofuniqueplayers').text('');
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  $('table').find('th').remove();
  $('.noplayers').text(' ');
  if (event.target.value === '0') {
    return;
  }
  document.getElementById('kingdom').disabled = true;
  document.getElementById('startdate').disabled = true;
  document.getElementById('enddate').disabled = true;
  var aPark = kingdomParks.find(function(x) { return x.ParkId === parseInt(event.target.value, 10) });
  attendanceForPark(aPark);
}

function attendanceForPark(aPark) {
  incrementalDate = moment($('#startdate').val());
  var parkNumber = aPark.ParkId;
  var kingdomNumber = aPark.KingdomId;
  uniqueParkIDs[aPark.Name] = {};
  $('.allresults').attr('hidden', true);
  $('table').find('tr:gt(0)').remove();
  $('.noplayers').text('');
  playerContent = '';
  numberOfDays = endDate.diff(startDate, "days") + 1;
  // $('.printtitle').text($('#kingdom option:selected').text() + ' - ' + $('#park option:selected').text());
  $('.generateddate').text('Generated on ' + new Date().toDateString());

  $('.working').attr('hidden', false);
  $('.working').text('Getting ' + aPark.Name + " " + numberOfDays + ' days of attendance....');

  for (var m = incrementalDate; incrementalDate.isSameOrBefore(endDate); incrementalDate.add(1, 'days')) {
    jsork.park.getAttendance(parkNumber, incrementalDate.toDate()).then(function (attendanceForDay) {
      attendanceForDay.forEach(function (attendance) {
        if (!uniqueParkIDs[attendance.ParkName]) {
          uniqueParkIDs[attendance.ParkName] = {};
        }
        var uniqueParkMonthIDs = uniqueParkIDs[attendance.ParkName];
        if (!localPlayersOnly || attendance.FromParkId === parkNumber) {
          var uniqueMonth = moment(attendance.Date).format("MMMM, YYYY");
          if (!uniqueParkMonthIDs[uniqueMonth]) {
            uniqueParkMonthIDs[uniqueMonth] = {};
          }
          var uniqueMonthObj = uniqueParkMonthIDs[uniqueMonth];
          if (!uniqueMonthObj[attendance.MundaneId]) {
            uniqueMonthObj[attendance.MundaneId] = attendance;
          }
        }
        if (!localPlayersOnly || attendance.FromKingdomName === kingdomName) {
          var uniqueMonth = moment(attendance.Date).format("MMMM, YYYY");
          if (!uniqueKingdoms[uniqueMonth]) {
            uniqueKingdoms[uniqueMonth] = {};
          }
          var uniqueKingdomMonthObj = uniqueKingdoms[uniqueMonth];
          if (!uniqueKingdomMonthObj[attendance.MundaneId]) {
            uniqueKingdomMonthObj[attendance.MundaneId] = attendance;
          }
        }
      });
      numberOfDays--;
      if (numberOfDays === 0) {
        doneParks();
        return;
      }
    });
  }
}

function doneParks() {
  var sd = startDate.format('ddd MMM Do, YYYY');
  var ed = endDate.format('ddd MMM Do, YYYY');
  $('.numberofuniqueplayers').text('Monthly unique players' + (localPlayersOnly ? ', from the park only,' : '') + ' between ' + sd + ' and ' + ed);
  var trHeaderLine = "<tr><th class='left'>Park</th><th class='middle'>Average</th>";
  incrementalDate = moment($('#startdate').val());
  allCSV += 'Park\tAverage';
  var numberOfMonths = 0;
  while (incrementalDate <= endDate) {
    numberOfMonths++;
    var monthFormat = incrementalDate.format("MMMM, YYYY");
    trHeaderLine += "<th class='middle'>" + monthFormat + "</th>";
    allCSV += '\t' + monthFormat;
    incrementalDate.add(1, 'months');
  }
  trHeaderLine += "</tr>";
  allCSV += '\r\n';
  $('#playerTable').append(trHeaderLine);

  Object.keys(uniqueParkIDs).forEach(function (aPark) {
    var parkResults = uniqueParkIDs[aPark];
    var totalAttendance = 0;
    Object.keys(parkResults).forEach(function(aMonth) {
      totalAttendance += Object.keys(parkResults[aMonth]).length;
    });
    var average = totalAttendance / numberOfMonths;
    incrementalDate = moment($('#startdate').val());
    var parkHTMLLine = '';
    var parkLine = aPark + '\t' + Math.round(average);
    parkHTMLLine += '<tr><td class="left">' + aPark + '</td><td class="middle">' + Math.round(average) + '</td>';
    while (incrementalDate <= endDate) {
      var monthValues = parkResults[incrementalDate.format("MMMM, YYYY")];
      var uniquesInMonth = 0;
      if (monthValues) {
        uniquesInMonth = Object.keys(monthValues).length;
      }
      parkLine += '\t' + uniquesInMonth;
      parkHTMLLine += '<td class="middle">' + uniquesInMonth + '</td>';
      incrementalDate.add(1, 'months');
    }
    $('#playerTable').append(parkHTMLLine);
    playerContent += parkLine + '\r\n';
  });

  // // Do Kingdom attendance
  // incrementalDate = moment($('#startdate').val());
  // var kingdomTotalAttendance = 0;
  // Object.keys(uniqueKingdoms).forEach(function(aMonth) {
  //   kingdomTotalAttendance += Object.keys(uniqueKingdoms[aMonth]).length;
  // });
  // var kingdomHTMLLine = '<tr><td class="left">' + kingdomName + '</td><td class="middle">' + Math.round(kingdomTotalAttendance/numberOfMonths) + '</td>';
  // var kingdomLine = kingdomName + '\t' + Math.round(kingdomTotalAttendance/numberOfMonths);
  // while (incrementalDate <= endDate) {
  //   var monthValues = uniqueKingdoms[incrementalDate.format("MMMM, YYYY")];
  //   var uniquesInMonth = 0;
  //   if (monthValues) {
  //     uniquesInMonth = Object.keys(monthValues).length;
  //   }
  //   kingdomLine += '\t' + uniquesInMonth;
  //   kingdomHTMLLine += '<td class="middle">' + uniquesInMonth + '</td>';
  //   incrementalDate.add(1, 'months');
  // }
  // $('#playerTable').append(kingdomHTMLLine);
  // playerContent += kingdomLine + '\r\n';

  $('.working').attr('hidden', true);
  $('.allresults').attr('hidden', false);
  document.getElementById('kingdom').disabled = false;
  document.getElementById('startdate').disabled = false;
  document.getElementById('enddate').disabled = false;
}

function initKingdoms() {
  var today = moment();
  $('#enddate').val(today.format('YYYY-MM'));
  $('#startdate').val(today.subtract(1, "days").format('YYYY-MM'));
  $('.working').attr('hidden', true);
  jsork.kingdom.getKingdoms().then(function (data) {
    var kSelect = $('#kingdom');
    var emptyOption = $('<option>');
    emptyOption.html('Choose a Kingdom/Principality');
    emptyOption.val(0);
    kSelect.append(emptyOption);
    data.forEach(function (kingdom) {
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
  // var allCSV = '';
  allCSV += playerContent;
  copyTextToClipboard(allCSV);
}

$(document).ready(function () {
  startUp();
});
