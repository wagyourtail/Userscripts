// ==UserScript==
// @name         Twitch AutoClaim
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  auto claim bonuses from twitch (this may violate tos, use at own risk)
// @downloadURL  https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/twitch.user.js
// @updateURL    https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/twitch.user.js
// @author       You
// @match        https://www.twitch.tv/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitch.tv
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    setInterval(() => {
        [...document.getElementsByTagName("button")].filter(it => it.attributes["aria-label"]?.value == "Claim Bonus")[0]?.click()
    }, 1000);
    // Your code here...
})();
