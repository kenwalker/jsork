/* eslint-disable no-unused-vars */
/* global jsork, $ */

var playerList = null;
var reducedToFiveList = null;
var shuffledNames = null;
var totalDropped = 0;
var numberToMatch = 5;
var droppedNames = [];
var allMatchedNames = [];

function kingdomSelect(event, ui) {
    playerList = [];
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    $('.noplayers').text(' ');
    $('.playagain').hide();
    if (event.target.value === '0') {
        return;
    }
    document.getElementById('kingdom').disabled = true;
    document.getElementById('park').disabled = true;
    var select = document.getElementById('park');
    for (var i = select.options.length - 1; i >= 0; i--) {
        select.options[i] = null;
    }
    jsork.kingdom.getParks(parseInt(event.target.value, 10)).then(function (data) {
        data.sort(function (a, b) {
            return a.Name.toLowerCase().localeCompare(b.Name.toLowerCase());
        });
        var kSelect = $('#park');
        var emptyOption = $('<option>');
        emptyOption.html('Choose a Park');
        emptyOption.val(0);
        kSelect.append(emptyOption);
        data.forEach(function (park) {
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
    if (event.target.value === '0') {
        return;
    }
    document.getElementById('kingdom').disabled = true;
    document.getElementById('park').disabled = true;
    $('.printtitle').text($('#kingdom option:selected').text() + ' - ' + $('#park option:selected').text());

    $('.working').attr('hidden', false);
    $('.working').text('Getting players....');
    jsork.park.getPlayers(parseInt(event.target.value, 10), jsork.filters.ACTIVE).then(function (data) {
        var playersLeft = data.length;
        if (playersLeft === 0) {
            document.getElementById('kingdom').disabled = false;
            document.getElementById('park').disabled = false;
            $('.working').attr('hidden', true);
            $('.noplayers').text('There are no active players');
            return;
        }
        data.forEach(function (player) {
            jsork.player.getLastAttendance(player.MundaneId).then(function (lastAttendance) {
                if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) > moment().subtract(6, 'months')) {
                    jsork.player.getInfo(player.MundaneId).then(function (playerInfo) {
                        $('.working').text('Number of players left to check for images/heraldry ' + playersLeft);
                        if (!playerInfo.Suspended && (playerInfo.HasImage || playerInfo.HasHeraldry) && playerInfo.Persona) {
                            playerList.push(playerInfo);
                            if (!playerInfo.HasImage && playerInfo.HasHeraldry) {
                                console.log("HERALDRY");
                            }
                        }
                        if (--playersLeft <= 0) {
                            allMatchedNames = new Array(playerList.length).fill(false);
                            if (playerList.length === 0) {
                                document.getElementById('kingdom').disabled = false;
                                document.getElementById('park').disabled = false;
                                $('.working').attr('hidden', true);
                                $('.noplayers').text('There are no players with images or heraldry in this park ;-(');
                                return;
                            }
                            donePlayers();
                        }
                    }.bind(player));
                } else {
                    $('.working').text('Number of players left to check for images/heraldry ' + playersLeft);
                    if (--playersLeft <= 0) {
                        allMatchedNames = new Array(playerList.length).fill(false);
                        if (playerList.length === 0) {
                            document.getElementById('kingdom').disabled = false;
                            document.getElementById('park').disabled = false;
                            $('.working').attr('hidden', true);
                            $('.noplayers').text('There are no players with images or heraldry in this park ;-(');
                            return;
                        }
                        donePlayers();
                    }
                }
            });
        });
    });
}

function pickAnotherPark() {
    $('.kingdomselection').show();
    $('table').find('tr:gt(0)').remove();
    $('.playerbutton').show();
    $('.playagain').hide();
    $('.noplayers').text('');
    $('.allresults').attr('hidden', true);

}

function donePlayers() {
    var totalKnown = allMatchedNames.filter(function(x) { return x; }).length;
    $('.noplayers').text('You have matched ' + totalKnown + ' out of ' + playerList.length + ' players in this park with an image/heraldry');
    $('table').find('tr:gt(0)').remove();
    $('.playagain').hide();
    $('.kingdomselection').hide();
    var lastPlayer = null;
    totalDropped = 0;
    var nonMatchedPlayers = playerList.filter(function(aPlayer, index) {
        return !allMatchedNames[index];
    });
    shuffledFullList = shuffle([...nonMatchedPlayers]);
    reducedToFiveList = shuffledFullList.slice(0, numberToMatch);
    shuffledNames = [...reducedToFiveList];
    droppedNames = Array(reducedToFiveList.length).fill({MundaneId: 0});
    shuffle(shuffledNames);
    reducedToFiveList.forEach(function (aPlayer, index) {
        var playerHTMLLine = '';
        playerHTMLLine += '<tr><td class="name noselect namecolumn" id="' + index + '"draggable="true">' + shuffledNames[index].Persona + '<br>' + shuffledNames[index].UserName + '</td>';
        playerHTMLLine += '<td class="match noselect namecolumn"></td>';
        if (aPlayer.HasImage) {
            playerHTMLLine += '<td class="noselect imagecolumn" style="width:130px; height:130px;text-align:center; vertical-align:middle">';
            playerHTMLLine += '<img src="https:' + aPlayer.Image + '" style="max-height:100%; max-width:100%" /></td></tr>';
        } else {
            playerHTMLLine += '<td class="noselect imagecolumn" style="width:130px; height:130px;text-align:center; vertical-align:middle">';
            playerHTMLLine += '<img src="https:' + aPlayer.Heraldry + '" style="max-height:100%; max-width:100%" /></td></tr>';
        }
        $('#playerTable').append(playerHTMLLine);
        lastPlayer = aPlayer;
    });
    var names = document.querySelectorAll('.name');
    names.forEach(name => {
        name.addEventListener('dragstart', dragStart);
        name.addEventListener('dragend', dragEnd);
    });
    matches = document.querySelectorAll('.match');
    matches.forEach(match => {
        match.addEventListener('dragenter', dragEnter)
        match.addEventListener('dragover', dragOver);
        match.addEventListener('dragleave', dragLeave);
        match.addEventListener('drop', drop);
    });
    $('.working').attr('hidden', true);
    $('.allresults').attr('hidden', false);
    document.getElementById('kingdom').disabled = false;
    document.getElementById('park').disabled = false;
}

function dragStart(e) {
    e.dataTransfer.effectAllowed = 'all';
    e.dataTransfer.setData('text/plain', e.target.id);
}

function dragEnter(e) {
    e.preventDefault();
    e.target.classList.add('drag-over');
    e.dataTransfer.dropEffect = "move";
}

function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
}

function dragLeave(e) {
    e.target.classList.remove('drag-over');
}

function dragEnd(e) {
    if (!e.target) {
        return;
    }
    var theTarget = e.target;
    if (theTarget instanceof Text) {
        theTarget = e.target.parentElement;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
    if (e.dataTransfer.dropEffect === 'none') {
        return;
    }
    theTarget.setAttribute('draggable', false);
}

function finishedFive() {
    var totalMatches = 0;
    reducedToFiveList.forEach(function(aPlayer, index) {
        if (aPlayer.MundaneId === droppedNames[index].MundaneId) {
            totalMatches++;
            allMatchedNames[playerList.indexOf(aPlayer)] = true;
            $('table tr').eq(index+1).children().addClass('matched');
        } else {
            $('table tr').eq(index+1).children().addClass('unmatched');
        }
    });
    var totalKnown = allMatchedNames.filter(function(x) { return x; }).length;
    $('.noplayers').text('You have matched ' + totalKnown + ' out of ' + playerList.length + ' players in this park with an image/heraldry');
    // if (totalMatches === reducedToFiveList.length) {
    //     $('.noplayers').text('You matched them all!');
    // } else {
    //     $('.noplayers').text('You got ' + totalMatches + ' out of ' + reducedToFiveList.length);
    // }
    $('.playagain').show();
    if (totalKnown === playerList.length) {
        $('.playerbutton').hide();
    }
}

function drop(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    e.target.classList.remove('drag-over');
    const id = e.dataTransfer.getData('text/plain');
    if (id === undefined || id === 'undefined') {
        return;
    }
    e.dataTransfer.dropEffect = "move";
    e.target.removeEventListener('dragenter', dragEnter, false);
    e.target.removeEventListener('dragover', dragOver, false);
    e.target.removeEventListener('dragleave', dragLeave, false);
    e.target.removeEventListener('drop', drop, false);

    e.target.setAttribute('drop', false);
    const draggable = document.getElementById(id);
    const indexOfDestination = $('table tr').index(e.target.parentElement) - 1;
    droppedNames[indexOfDestination] = shuffledNames[id];
    e.target.innerHTML = draggable.innerHTML;
    draggable.textContent = "";
    totalDropped++;
    if (totalDropped === reducedToFiveList.length) {
        finishedFive();
    }
}

function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

function initKingdoms() {
    $('#parkselect').attr('hidden', true);
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

$(document).ready(function () {
    startUp();
});
