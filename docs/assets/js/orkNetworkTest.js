/* eslint-disable no-unused-vars */
/* global jsork, $ */

var numberOfCalls = 0;
var numberOfSuccessfullCalls = 0;
var startOfCall = 0;
var endOfCall = 0;
var totalTimeOfCalls = 0;
var numberOfFailedCalls = 0;
var callTimeout;
const msBetweenCalls = 0;
jsork.TIMEOUT = 2000;

function runORKCall() {
    if (callTimeout) {
        clearTimeout(callTimeout);
        callTimeout = null;
    }
    startOfCall = Date.now();
    numberOfCalls++;
    jsork.player.getClasses(43232).then(function(classes) {
        numberOfSuccessfullCalls++;
        endOfCall = Date.now();
        totalTimeOfCalls += endOfCall-startOfCall;
        updateStatistics();
        callTimeout = setTimeout(runORKCall, msBetweenCalls);
    }).catch(() => {
        console.log("Error");
        numberOfFailedCalls++;
        updateStatistics();
        callTimeout = setTimeout(runORKCall, msBetweenCalls);
    });
}

function updateStatistics() {
    $('#resultsTable').find('tr:gt(0)').remove();
    var playerHTMLLine = '';
    var averagePerCall = totalTimeOfCalls / numberOfCalls;
    var failedCallPercentage = (numberOfFailedCalls / numberOfCalls) * 100;
    playerHTMLLine += '<tr>';
    
    playerHTMLLine += '<td>' + numberOfCalls + '</td>';
    playerHTMLLine += '<td>' + averagePerCall.toFixed(2) + '</td>';
    playerHTMLLine += '<td>' + numberOfFailedCalls + '</td>';
    playerHTMLLine += '<td>' + failedCallPercentage.toFixed(2) + '</td>';
    playerHTMLLine += '</tr>';
    $('#resultsTable').append(playerHTMLLine);
}

function startUp() {
    runORKCall();
}

$(document).ready(function() {
  startUp();
});
