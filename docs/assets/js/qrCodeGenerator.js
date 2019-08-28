var debounceSearch = debounce(searchForPlayer, 400);
var qrcode = null;

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
  $('#copyToClipboard').show();
}

function showSearch() {
  $('#playerBox').hide();
  $('#backToSearch').hide();
  $('.searchResults').show();
  $('#search').show();
  $('#copyToClipboard').hide();
}

function backToSearch() {
  showSearch();
}

function doPlayer(mundaneId, element) {
  var ParkName = element.children[2].textContent,
      KingdomName = element.children[3].textContent;
  jsork.player.getInfo(mundaneId).then(function(player) {
    var playerDetails = player.Persona + '<br>' + player.UserName + '<br>' + ParkName + '<br>' + KingdomName;
    var playerImage = 'https://ork.amtgard.com/assets/heraldry/player/000000.jpg';
    if (player.HasImage) {
      playerImage = 'https:' + player.Image;
    }
    $('#playerImg').attr('src', playerImage);
    $('#playerDetails').html(playerDetails);
    if (!qrcode) {
      qrcode = new QRCode('qrcode', {
        text: 'https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + player.MundaneId,
        width: 100,
        height: 100
      });
    } else {
      qrcode.makeCode('https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + player.MundaneId);
    }
    hideSearch();
  });
}

function copyPlayerCard() {
  var node = document.getElementById('playerBox');

  domtoimage.toPng(node,{ height: 350 })
    .then(function (dataUrl) {
      copyImage(dataUrl);
      alert('Card is in clipboard');
    })
    .catch(function (error) {
      alert('An error occurred trying to copy the image');
    });
}

function copyImage(url){
  var img = new Image();
  img.src = url;
  var node = document.getElementById('playerBox');
  node.insertBefore(img, node.firstChild);
  var r = document.createRange();
  r.setStartBefore(img);
  r.setEndAfter(img);
  r.selectNode(img);
  var sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
  document.execCommand('Copy');
  node.removeChild(img);
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