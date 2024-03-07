/* eslint-disable no-unused-vars */
/* global jsork, $ */

kingdomId = 0;
parkId = 0;
kingdomName = "";
parkName = "";
allParks = [];
playerList = [];
allPlayersActive = [];
playerListAboutToLevel = [];
playerListRecentlyLeveled = [];
shouldBeActiveList = [];
parkBirthdays = [];
playerContent = '';
officerOutput = '';
aboutToLevelOutput = '';
recentlyLeveledOutput = '';
shouldBeRetiredOutput = '';
shouldBeActiveOutput = '';
shouldBeWaiveredOutput = '';
parkBirthdaysOutput = '';
parkParagonsOutput = '';
reeveQualifiedOutput = '';
knightsOutput = '';
attendancesOutput = '';
runinactivecheck = false;

today = moment().subtract(7, 'days');
monthAway = moment().add(1, 'months');


function kingdomSelect(event, ui) {
    kingdomId = 0;
    parkId = 0;
    kingdomName = "";
    parkName = "";
    playerList = null;
    playerContent = '';
    officerOutput = '';
    heraldTitle = '';
    playerList = [];
    $('.allresults').attr('hidden', true);
    $('table').find('tr:gt(0)').remove();
    if (event.target.value === '0') {
        return;
    }
    document.getElementById('kingdom').disabled = true;
    document.getElementById('park').disabled = true;
    var select = document.getElementById('park');
    for (var i = select.options.length - 1; i >= 0; i--) {
        select.options[i] = null;
    }
    kingdomId = parseInt(event.target.value, 10);
    jsork.kingdom.getParks(kingdomId).then(function (data) {
        data.sort(function (a, b) {
            return a.Name.toLowerCase().localeCompare(b.Name.toLowerCase());
        });
        allParks = data;
        var kSelect = $('#park');
        var emptyOption = $('<option>');
        emptyOption.html('Choose a Park');
        emptyOption.val(0);
        kSelect.append(emptyOption);
        data.forEach(function (park) {
            if (park.Active === 'Active') {
                let option = $('<option>');
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
    runinactivecheck = $('#runinactivecheck').is(":checked");
    allPlayersActive = [];
    playerListAboutToLevel = [];
    playerListRecentlyLeveled = [];
    parkBirthdays = [];
    shouldBeActiveList = [];
    playerContent = '';
    officerOutput = '';
    aboutToLevelOutput = '';
    recentlyLeveledOutput = '';
    shouldBeRetiredOutput = '';
    shouldBeActiveOutput = '';
    parkBirthdaysOutput = '';
    parkParagonsOutput = '';
    reeveQualifiedOutput = '';
    knightsOutput = '';
    attendancesOutput = '';
    shouldBeWaiveredOutput = '';
    if (event.target.value === '0') {
        return;
    }
    document.getElementById('kingdom').disabled = true;
    document.getElementById('park').disabled = true;
    kingdomName = $('#kingdom option:selected').text();
    parkName = $('#park option:selected').text();
    parkTitle = allParks.find(function (aPark) { return (aPark.ParkId + '') === event.target.value }).Title;
    heraldTitle = "<H2>" + parkTitle + " of " + parkName + " Herald Report</h2>";
    $('.printtitle').text(kingdomName + ' - ' + parkName);
    $('.generateddate').text('Generated on ' + new Date().toDateString());

    $('.working').attr('hidden', false);
    parkId = parseInt(event.target.value, 10);
    getLastAttendance();
}

function getLastAttendance() {
    jsork.park.getAllAttendance(parkId).then(function(attendances) { 
        if (attendances.length > 0) {
            var now = moment(Date.now());
            var weeksAgo = now.diff(moment(attendances[0].Date), "weeks");
            attendancesOutput += "<p><h2>Most recent attendance</h2>";
            if (weeksAgo > 1) {
                attendancesOutput += "Most recent attendance entered for " + moment(attendances[0].Date).format("MMMM Do, YYYY") + " (" + weeksAgo + " weeks ago)</p>"
            } else {
                attendancesOutput += "Most recent attendance entered for " + moment(attendances[0].Date).format("MMMM Do, YYYY") + "</p>"
            }
        }
        getOfficers();
    });
}

function doKnights() {
    $('.working').text('Checking for park Knights');
    jsork.park.getKnights(parkId).then(function(allKnights) {
        if (allKnights.length > 0) {
            allKnights.sort(function (a, b) {
                return a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
            });
            knightsOutput += "<h2>Park Knights</h2>";
            knightsOutput += '<table style="width:100%"><tr><th class="left">Player</th><th class="middle">Knighthood</th><th class="middle">Awarded On</th></tr>';
            lastPlayer = null;
            allKnights.forEach(function (aPlayer) {
                var playerHTMLLine = '';
                if (lastPlayer && lastPlayer.Persona === aPlayer.Persona) {
                    playerHTMLLine += '<tr><td></td>';
                } else {
                    playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
                        aPlayer.MundaneId + '" target="_blank">' +
                        (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
                }
                playerHTMLLine += '<td class="middle">' + aPlayer.AwardName + '</td>';
                playerHTMLLine += '<td class="middle">' + moment(aPlayer.Date).format("MMMM Do, YYYY") + '</td>';
                knightsOutput += playerHTMLLine;
                lastPlayer = aPlayer;
            });
            knightsOutput += '</table>';
        } else {
            knightsOutput += "<h2>Park Knights</h2>";
            knightsOutput += "<p>There are no Knights from this park</p>";
        }
        done();
    });
}

function doParagons() {
    $('.working').text('Checking for Park Paragons');

    jsork.park.getParagons(parkId).then(function(allParagons) {
        twoYearsAgo = moment().subtract(24, 'months');
        allParagons = allParagons.filter(function(player) { 
            return moment(player.LastAttended) > twoYearsAgo;
        });
        if (allParagons.length > 0) {
            allParagons.sort(function (a, b) {
                return a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
            });
            parkParagonsOutput += "<h2>Park Paragons</h2>";
            parkParagonsOutput += "<p>Any Paragons who have not attended in the last two years have been removed from this list</p>";
            parkParagonsOutput += '<table style="width:100%"><tr><th class="left">Player</th><th class="middle">Class</th><th class="middle">Awarded On</th><th class="middle">Last Attended</th></tr>';
            lastPlayer = null;
            allParagons.forEach(function (aPlayer) {
                var playerHTMLLine = '';
                if (lastPlayer && lastPlayer.Persona === aPlayer.Persona) {
                    playerHTMLLine += '<tr><td></td>';
                } else {
                    playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
                        aPlayer.MundaneId + '" target="_blank">' +
                        (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
                }
                playerHTMLLine += '<td class="middle">' + aPlayer.AwardName + '</td>';
                playerHTMLLine += '<td class="middle">' + moment(aPlayer.Date).format("MMMM Do, YYYY") + '</td>';
                if (lastPlayer && lastPlayer.Persona === aPlayer.Persona) {
                    playerHTMLLine += '<td></td></tr>';
                } else {
                    playerHTMLLine += '<td class="middle">' + moment(aPlayer.LastAttended).format("MMMM Do, YYYY") + '</td></tr>';
                }
                parkParagonsOutput += playerHTMLLine;
                lastPlayer = aPlayer;
            });
            parkParagonsOutput += '</table>';
        } else {
            parkParagonsOutput += "<h2>Park Paragons</h2>";
            parkParagonsOutput += "<p>There are no Park Paragons who have attended in the last two years</p>";
        }
        doKnights();
    });
}

function doReeves() {
    $('.working').text('Checking for Reeve Qualified Players');
    jsork.park.getReeveQualified(parkId).then(function(allReeves) {
        if (allReeves.length > 0) {
            allReeves.sort(function (a, b) {
                return a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
            });
            twoYearsAgo = moment().subtract(24, 'months');
            allReeves = allReeves.filter(function(player) { 
                return moment(player.LastAttended) > twoYearsAgo;
            });
            reeveQualifiedOutput += "<h2>Reeve Qualified</h2>";
            reeveQualifiedOutput += '<table style="width:100%"><tr><th class="left">Player</th><th class="middle">Qualified Until</th></tr>';
            lastPlayer = null;
            allReeves.forEach(function (aPlayer) {
                var playerHTMLLine = '';
                playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Admin/player/' +
                    aPlayer.MundaneId + '" target="_blank">' +
                    (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
                playerHTMLLine += '<td class="middle">' + moment(aPlayer.ReeveQualifiedUntil).format("MMMM Do, YYYY") + '</td>';
                playerHTMLLine += '</tr>';
                reeveQualifiedOutput += playerHTMLLine;
                lastPlayer = aPlayer;
            });
            reeveQualifiedOutput += '</table>';
        } else {
            reeveQualifiedOutput += "<h2>Reeve Qualified</h2>";
            reeveQualifiedOutput += "<p>There are no Reeve Qualified players</p>";
        }
        doParagons();
    });
}

function donePlayers() {
    if (playerListAboutToLevel.length > 0) {
        playerListAboutToLevel.sort(function (a, b) {
            return a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
        });
        lastPlayer = null;
        aboutToLevelOutput += '<h2>Players 1 credit away from leveling</h2>';
        aboutToLevelOutput += '<table style="width:100%"><tr><th class="left">Player</th><th class="left">Class</th><th class="middle">1 Away from Level</th></tr>';
        playerListAboutToLevel.forEach(function (aPlayer) {
            playerHTMLLine = '';
            if (lastPlayer && lastPlayer.Persona === aPlayer.Persona) {
                playerHTMLLine += '<tr><td></td>';
            } else {
                playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
                    aPlayer.MundaneId + '" target="_blank">' +
                    (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
            }
            playerHTMLLine += '<td class="middle">' + aPlayer.Class + '</td><td class="middle">' + aPlayer.Level + '</td></tr>';
            aboutToLevelOutput += playerHTMLLine;
            lastPlayer = aPlayer;
        });
        aboutToLevelOutput += '</table>';
    }

    if (playerListRecentlyLeveled.length > 0) {
        recentlyLeveledOutput += '<h2>Players who have recently leveled</h2>';
        recentlyLeveledOutput += '<table style="width:100%"><tr><th class="left">Player</th><th class="left">Class</th><th class="middle">Level</th><th class="middle">When did they level</th></tr>';

        playerListRecentlyLeveled.sort(function (a, b) {
            return a.Persona.toLowerCase().localeCompare(b.Persona.toLowerCase());
        });
        lastPlayer = null;
        playerListRecentlyLeveled.forEach(function (aPlayer) {
            playerHTMLLine = '';
            if (lastPlayer && lastPlayer.Persona === aPlayer.Persona) {
                playerHTMLLine += '<tr><td></td>';
            } else {
                playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
                    aPlayer.MundaneId + '" target="_blank">' +
                    (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
            }
            playerHTMLLine += '<td class="middle">' + aPlayer.Class + '</td><td class="middle">' + aPlayer.Level + '</td><td class="middle">' + moment(aPlayer.aquired).format("dddd, MMMM Do, YYYY") + '</td></tr>';
            recentlyLeveledOutput += playerHTMLLine;
            lastPlayer = aPlayer;
        });
        recentlyLeveledOutput += '</table>';
    }

    if (parkBirthdays.length > 0) {
        parkBirthdaysOutput += "<h2>Park Birthdays!</h2>";
        parkBirthdaysOutput += "<p>Birthdays are based on a players first attendance so may not be entirely accurate but.... enjoy!</p>";
        parkBirthdaysOutput += '<table style="width:100%"><tr><th class="left">Player</th><th class="left">Birthday</th><th class="middle">Amtgard Age</th></tr>';

        parkBirthdays.sort(function (a, b) {
            var aBirthday = a.birthDate.clone();
            aBirthday.set('year', moment().year());
            var bBirthday = b.birthDate.clone();
            bBirthday.set('year', moment().year());
            return aBirthday - bBirthday;
        });
        var lastPlayer = null;
        parkBirthdays.forEach(function (aPlayer) {
            var playerHTMLLine = '';
            playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' +
                aPlayer.MundaneId + '" target="_blank">' +
                (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
            playerHTMLLine += '<td class="middle">' + aPlayer.birthDate.format("dddd, MMMM Do, YYYY") + '</td><td class="middle">' + aPlayer.age + '</td></tr>';
            parkBirthdaysOutput += playerHTMLLine;
            lastPlayer = aPlayer;
        });
        parkBirthdaysOutput += '</table>';
    }

    if (shouldBeActiveList.length > 0) {
        shouldBeActiveOutput += "<h2>Active but marked Retired</h2>";
        shouldBeActiveOutput += "<p>These players are marked RETIRED but should be made VISIBLE otherwise they will not appear in many reports. Follow the links and modify each player.</p>";
        shouldBeActiveOutput += '<table style="width:100%"><tr><th class="left">Player</th><th class="middle">Last Played</th></tr>';
        shouldBeActiveList.forEach(function (aPlayer) {
            var playerHTMLLine = '';
            playerHTMLLine += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Admin/player/' +
                aPlayer.MundaneId + '" target="_blank">' +
                (aPlayer.Persona || 'No persona for ID ' + aPlayer.MundaneId) + '</a></td>';
            playerHTMLLine += '<td class="middle">' + moment(aPlayer.lastAttendance).format("MMMM Do, YYYY") + '</td></tr>';
            shouldBeActiveOutput += playerHTMLLine;
        });
        shouldBeActiveOutput += '</table>';
    }

    doReeves();
}

function initKingdoms() {
    $('#parkselect').attr('hidden', true);
    $('.working').attr('hidden', true);
    jsork.kingdom.getKingdoms().then(function (data) {
        let kSelect = $('#kingdom');
        emptyOption = $('<option>');
        emptyOption.html('Choose a Kingdom/Principality');
        emptyOption.val(0);
        kSelect.append(emptyOption);
        data.forEach(function (kingdom) {
            let option = $('<option>');
            option.html(kingdom.KingdomName);
            option.val(kingdom.KingdomId);
            kSelect.append(option);
        });
        $('#kingdom').selectmenu('option', 'disabled', false);
        $('#kingdom').show();
    });
}

function getOfficers() {
    $('.working').text('Finding Officers');
    officerOutput = '';
    jsork.kingdom.getInfo(kingdomId).then(function (kingdom) {
        jsork.kingdom.getOfficers(kingdomId).then(function (kingdomOfficers) {
            if (kingdom.KingdomName !== 'The Freeholds of Amtgard') {
                officerOutput += '<h3>' + kingdomName + ' Officers</h3>';
                let monarch = kingdomOfficers.find(function (officer) {
                    return officer.OfficerRole === 'Monarch';
                });
                let regent = kingdomOfficers.find(function (officer) {
                    return officer.OfficerRole === 'Regent';
                });
                let pm = kingdomOfficers.find(function (officer) {
                    return officer.OfficerRole === 'Prime Minister';
                });
                let champion = kingdomOfficers.find(function (officer) {
                    return officer.OfficerRole === 'Champion';
                });
                var gmr = kingdomOfficers.find(function(officer) {
                    return officer.OfficerRole === 'GMR';
                });
                if (monarch && monarch.Persona) {
                    officerOutput += '<b>Monarch:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + monarch.MundaneId + '" target="_blank">' + monarch.Persona + '</a> (' + monarch.Surname + ', ' + monarch.GivenName + ')<br>';
                }
                if (regent && regent.Persona) {
                    officerOutput += '<b>Regent:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + regent.MundaneId + '" target="_blank">' + regent.Persona + '</a> (' + regent.Surname + ', ' + regent.GivenName + ')<br>';
                }
                if (pm && pm.Persona) {
                    officerOutput += '<b>Prime Minister:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + pm.MundaneId + '" target="_blank">' + pm.Persona + '</a> (' + pm.Surname + ', ' + pm.GivenName + ')<br>';
                }
                if (champion && champion.Persona) {
                    officerOutput += '<b>Champion:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + champion.MundaneId + '" target="_blank">' + champion.Persona + '</a> (' + champion.Surname + ', ' + champion.GivenName + ')<br>';
                }
                if (gmr && gmr.Persona) {
                    officerOutput += '<b>GMR:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + gmr.MundaneId + '" target="_blank">' + gmr.Persona + '</a> (' + gmr.Surname + ', ' + gmr.GivenName + ')<br>';
                }
                officerOutput += '<p>';
            }
            jsork.park.getOfficers(parkId).then(function (parkOfficers) {
                let anyOfficers = false;
                officerOutput += '<h3>' + parkName + ' Officers</h3>';
                let parkMonarch = parkOfficers.find(function (officer) {
                    return officer.OfficerRole === 'Monarch';
                });
                let parkRegent = parkOfficers.find(function (officer) {
                    return officer.OfficerRole === 'Regent';
                });
                let parkPM = parkOfficers.find(function (officer) {
                    return officer.OfficerRole === 'Prime Minister';
                });
                let parkChampion = parkOfficers.find(function (officer) {
                    return officer.OfficerRole === 'Champion';
                });
                let parkGMR = parkOfficers.find(function (officer) {
                    return officer.OfficerRole === 'GMR';
                });
                if (parkMonarch && parkMonarch.Persona) {
                    anyOfficers = true;
                    officerOutput += '<b>Monarch:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + parkMonarch.MundaneId + '" target="_blank">' + parkMonarch.Persona + '</a> (' + parkMonarch.Surname + ', ' + parkMonarch.GivenName + ')<br>';
                }
                if (parkRegent && parkRegent.Persona) {
                    anyOfficers = true;
                    officerOutput += '<b>Regent:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + parkRegent.MundaneId + '" target="_blank">' + parkRegent.Persona + '</a> (' + parkRegent.Surname + ', ' + parkRegent.GivenName + ')<br>';
                }
                if (parkPM && parkPM.Persona) {
                    anyOfficers = true;
                    officerOutput += '<b>Prime Minister:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + parkPM.MundaneId + '" target="_blank">' + parkPM.Persona + '</a> (' + parkPM.Surname + ', ' + parkPM.GivenName + ')<br>';
                }
                if (parkChampion && parkChampion.Persona) {
                    anyOfficers = true;
                    officerOutput += '<b>Champion:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + parkChampion.MundaneId + '" target="_blank">' + parkChampion.Persona + '</a> (' + parkChampion.Surname + ', ' + parkChampion.GivenName + ')<br>';
                }
                if (parkGMR && parkGMR.Persona) {
                    anyOfficers = true;
                    officerOutput += '<b>GMR:</b> <a href="https://ork.amtgard.com/orkui/index.php?Route=Player/index/' + parkGMR.MundaneId + '" target="_blank">' + parkGMR.Persona + '</a> (' + parkGMR.Surname + ', ' + parkGMR.GivenName + ')<br>';
                }
                if (!anyOfficers) {
                    officerOutput += 'No officers were found';
                }
                officerOutput += '<p>';
                getPlayerData();
                // doKnights();
            });
        });
    });
}

function getPlayerData() {
    jsork.park.getPlayers(parkId, jsork.filters.ACTIVE).then(function (data) {
        allPlayersActive = data.filter(function (aPlayer) { return !aPlayer.Suspended });
        allPlayersActive.sort(function (a, b) {
            if (!a.Persona) { a.Persona = "" }
            if (!b.Persona) { b.Persona = "" }
            a.Persona = a.Persona + "";
            b.Persona = b.Persona + "";
            return b.Persona.toLowerCase().localeCompare(a.Persona.toLowerCase());
        });
        if (runinactivecheck) {
            jsork.park.getPlayers(parkId, jsork.filters.INACTIVE).then(function (data) {
                inactivePlayers = data.filter(function (aPlayer) { return !aPlayer.Suspended });
                inactivePlayers.sort(function (a, b) {
                    if (!a.Persona) { a.Persona = "" }
                    if (!b.Persona) { b.Persona = "" }
                    a.Persona = a.Persona + "";
                    b.Persona = b.Persona + "";
                    return b.Persona.toLowerCase().localeCompare(a.Persona.toLowerCase());
                });
                doNextPlayer();
            });
        } else {
            inactivePlayers = [];
            doNextPlayer();
        }
    });
}

function doNextInactivePlayer() {
    if (inactivePlayers.length === 0) {
        donePlayers();
        return;
    }
    $('.working').text('Checking ' + inactivePlayers.length + " marked inactive players to see if they have been playing");
    player = inactivePlayers.pop();
    jsork.player.getLastAttendance(player.MundaneId).then(function(lastAttendance) {
        if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) > moment().subtract(8, 'months')) {
            player.lastAttendance = lastAttendance[0].Date;
            shouldBeActiveList.push(player);
        }
        doNextInactivePlayer();
    });
}

function doNextPlayer() {
    if (allPlayersActive.length === 0) {
        doNextInactivePlayer();
        return;
    }
    $('.working').text('Computing info for ' + allPlayersActive.length + " active players");
    var player = allPlayersActive.pop();
    var now = moment(Date.now());

    jsork.player.getFirstAttendance(player.MundaneId).then(function (attendance) {
        jsork.player.getLastAttendance(player.MundaneId).then(function (lastAttendance) {
            // Show birthday if attended within the year
            if (attendance && attendance[0]) {
                if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) > moment().subtract(50, 'weeks')) {
                    birthDate = moment(attendance[0].Date);
                    thisYearBirthday = birthDate.clone().set('year', moment().year());
                    if (thisYearBirthday >= today && thisYearBirthday <= monthAway) {
                        player.birthDate = birthDate;
                        player.age = moment().year() - birthDate.year();
                        parkBirthdays.push(player);
                    }
                }
            }
            // Should be waivered?
            if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) > moment().subtract(2, 'months')) {
                if (!player.Waivered) {
                    if (shouldBeWaiveredOutput.length === 0) {
                        shouldBeWaiveredOutput += "<h2>Players who are recently active but NOT Waivered</h2>";
                        shouldBeWaiveredOutput += '<table style="width:100%"><tr><th class="left">Player</th><th class="left">Last Played</th></tr>';
                    }
                    player.lastAttendance = lastAttendance[0].Date;
                    var weeksAgo = now.diff(moment(player.lastAttendance), "weeks");
                    var weeksText = "";
                    switch (true) {
                        case (weeksAgo < 0): 
                            weeksText = "weirdly " + Math.abs(weeksAgo) + " week(s) in the future?";
                            break;
                        case (weeksAgo === 0):
                            weeksText = "within a week";
                            break;
                        case (weeksAgo === 1):
                            weeksText = "one week ago";
                            break;
                        default:
                            weeksText = weeksAgo + " weeks ago";
                    }
                    shouldBeWaiveredOutput += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Admin/player/' + player.MundaneId + '" target="_blank">' + (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
                    shouldBeWaiveredOutput += "<td>" + weeksText + "</td></tr>";
                }
            }
            // Compute if player shoud be retired?
            if ((lastAttendance.length === 0) || (lastAttendance.length > 0 && moment(lastAttendance[0].Date) < moment().subtract(24, 'months'))) {
                if (shouldBeRetiredOutput.length === 0) {
                    shouldBeRetiredOutput += "<h2>Players who are marked ACTIVE but haven't played in 2 years</h2>";
                    shouldBeRetiredOutput += "<p>Follow the link to the ORK player and toggle their status to RETIRED vs. VISIBLE</p>"
                    shouldBeRetiredOutput += '<table style="width:100%"><tr><th class="left">Player</th><th class="left">Last Played</th></tr>';
                }
                player.lastAttendance = lastAttendance.length === 0 ? "Never attended" : moment(lastAttendance[0].Date).format("MMMM Do, YYYY");
                shouldBeRetiredOutput += '<tr><td><a href="https://ork.amtgard.com/orkui/index.php?Route=Admin/player/' + player.MundaneId + '" target="_blank">' + (player.Persona || 'No persona for ID ' + player.MundaneId) + '</a></td>';
                shouldBeRetiredOutput += "<td>" + player.lastAttendance + "</td></tr>";

            }
    
            if (lastAttendance.length > 0 && moment(lastAttendance[0].Date) > moment().subtract(6, 'months')) {
                // player "active" in last 6 months
                jsork.player.getClasses(player.MundaneId).then(function (classes) {
                    classes.forEach(function (aClass) {
                        if (aClass.aboutToLevel !== 0) {
                            playerListAboutToLevel.push({ Persona: this.Persona, MundaneId: player.MundaneId, Class: aClass.class, Level: aClass.aboutToLevel });
                        }
                    }.bind(player));
                    var startDate = moment().subtract(1, 'months').isoWeekday(1).startOf('isoWeek');
                    jsork.player.getAttendanceFrom(player.MundaneId, startDate.format('MM/DD/YYYY')).then(function (attendances) {
                        if (attendances.length > 0) {
                            var leveled = classesLeveled(classes);
                            if (leveled) {
                                leveled.forEach(function (level) {
                                    var foundAttendance = attendances.find(function (attendance) { return attendance.ClassName === level.class });
                                    if (foundAttendance) {
                                        playerListRecentlyLeveled.push({ Persona: player.Persona, MundaneId: player.MundaneId, Class: level.class, Level: level.level, aquired: foundAttendance.Date });
                                    }
                                });
                            }
                        }
                        doNextPlayer();
                    });
                });
            } else {
                doNextPlayer();
            }
        });
    });
}

function rerunReport() {
    $(".allresults").hide();
    $(".overview").show();
}

function done() {
    if (shouldBeWaiveredOutput.length > 0) {
        shouldBeWaiveredOutput += "</table>";
    }
    if (shouldBeRetiredOutput.length > 0) {
        shouldBeRetiredOutput += "</table>";
    }

    $(".allContent").remove();
    $(".overview").hide();
    $(".allresults").show();
    let allContent = '';
    allContent += '<div class="allContent">';
    allContent += heraldTitle;
    allContent += officerOutput;
    allContent += attendancesOutput;
    allContent += reeveQualifiedOutput;
    allContent += knightsOutput;
    allContent += parkParagonsOutput;
    allContent += shouldBeWaiveredOutput;
    allContent += aboutToLevelOutput;
    allContent += recentlyLeveledOutput;
    allContent += parkBirthdaysOutput;
    allContent += shouldBeActiveOutput;

    allContent += shouldBeRetiredOutput;
    allContent += '</div>';
    $('.allresults').append(allContent);
    $('.allresults').attr('hidden', false);
    $('#kingdom').selectmenu('option', 'disabled', false);
    $('.working').attr('hidden', true);
    document.getElementById('kingdom').disabled = false;
    document.getElementById('park').disabled = false;
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
    var allCSV = 'Persona\tClass\t1 Away from Level\r\n';
    allCSV += playerContent;
    copyTextToClipboard(allCSV);
}

function classesLeveled(classes) {
    return classes.filter(function (item) {
        var reconciledCredits = item.credits + item.reconciled;
        return (
            (reconciledCredits === 5 || reconciledCredits === 6) ||
            (reconciledCredits === 12 || reconciledCredits === 13) ||
            (reconciledCredits === 21 || reconciledCredits === 22) ||
            (reconciledCredits === 34 || reconciledCredits === 35) ||
            (reconciledCredits === 53 || reconciledCredits === 54)
        );
    });
}

$(document).ready(function () {
    startUp();
});
