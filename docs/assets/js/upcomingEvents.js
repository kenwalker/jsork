function startUp() {
  jsork.searchservice.allEvents().then(function(events) {
    events.forEach(function(event) {
      var eventHTMLLine = '<tr>';
      eventHTMLLine = eventHTMLLine + '<td> ' + event.KingdomName || '' + '</td>';
      eventHTMLLine = eventHTMLLine + '<td> ' + (event.ParkName === null ? '' : event.ParkName) + '</td>';
      eventHTMLLine = eventHTMLLine + '<td> ' + event.Name || '' + '</td>';
      eventHTMLLine = eventHTMLLine + '<td> ' + moment(event.NextDate).format('ddd, MMM Do, YYYY') + '</td>';
      eventHTMLLine = eventHTMLLine + '<td> ' + event.ShortDescription + '</td>';
      eventHTMLLine = eventHTMLLine + '</tr> ';
      $('#eventTable').append(eventHTMLLine);
      $('.working').attr('hidden', true);
      $('.allresults').attr('hidden', false);
    });
  });
}

$(document).ready(function() {
  startUp();
});