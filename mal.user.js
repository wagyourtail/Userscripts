// ==UserScript==
// @name         Add DotW to MAL
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  adds day of the week to mal season listings
// @author       Wagyourtail
// @match        https://myanimelist.net/anime/season*
// @downloadURL  https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/mal.user.js
// @updateURL    https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/mal.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=myanimelist.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    [...document.getElementsByClassName("info")].map(e => e.getElementsByClassName("item")[0]).forEach(e => {
        const day = weekday[new Date(e.innerHTML).getDay()]
        if (day != undefined) {
            e.innerHTML = `${day}, ${e.innerHTML}`
        }
    })
})();
