# jsork

## (Pronounced J-Sork) JSON APIs to the Amtgard ORK ##

See the Github pages document as that is where more doc and examples will be added. 

[jsork Github Pages](https://kenwalker.github.io/jsork)

This is work in progress so not all APIs have been implemented yet.

There's a requirement for [jQuery](https://jquery.com/download/) to be present.

So at a minimum you need the Jsork APIs and jQuery loaded in your page as follows:

```javascript
<script src="jquery.js"></script>
<script src="jsork.js"></script>
```

The APIs are grouped into categores like _kingdom_, _park_, _player_, etc.  To use the API you
get to it through the global _jsork_ namespace.

All the API calls take whatever arguments are required and return a promise.

```javascript
jsork.kingdom.getKingdoms().then(function(allKingdoms) {
    console.log("There are " + allKingdoms.length + " Kingdoms in Amtgard");
})
```

Would print out _There are 26 Kingdoms in Amtgard_

```javascript
jsork.player.getInfo(43232).then(function(player) {
    console.log("Ken's persona is " + player.Persona);
})
```
Would print out _Ken's persona is Lord Kismet Shenchu_

Some APIs have additional parameters like getting a players awards.  You can ask for them all using _jsork.awardIDs.ALL_ or like the following example just as for the one you want.

```javascript
jsork.player.getAwards(43232, jsork.awardIDs.ORDER_OF_THE_SMITH).then(function(data) {
    console.log("Ken has " + data.length + " Orders of the Smith");}
);
```

Would print out _Ken has 3 Orders of the Smith_
