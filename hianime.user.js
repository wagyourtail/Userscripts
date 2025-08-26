// ==UserScript==
// @name         Improved Hi-Anime
// @namespace    http://tampermonkey.net/
// @version      2025-06-29
// @description  improve interacting with hianime
// @author       You
// @downloadURL  https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/hianime.user.js
// @updateURL    https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/hianime.user.js
// @match        https://hianime.to/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=hianime.to
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    if (window.location.pathname == "/") {
        window.location.href = window.location.href + "home"
    }

    document.addEventListener('DOMContentLoaded', function() {
        //    setInterval(() => {
        for (const a of [...document.getElementsByTagName("a")]) {
            if (a.href == "") continue
            const url = new URL(a.href)
            if (url.hostname == window.location.hostname && url.pathname == "/") {
                a.href = a.href + "home"
            }
        }

        // dow on homepage
        const weekday = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
        for (const e of [...document.getElementsByClassName("fas fa-calendar")]) {
            const d = weekday[new Date(e.parentElement.innerText).getDay()]
            e.after(document.createTextNode(d + " "))
        }

        // dow on details page
        const airedElements = Array.from(document.getElementsByClassName("item-head")).filter(e => e.innerText == "Aired:")
        if (airedElements.length > 0) {
            const element = airedElements[0].parentElement.getElementsByClassName("name")[0];
            const day = weekday[new Date(element.innerText.split(" to ")[0]).getDay()]
            element.innerText = day + " " + element.innerText;
        }
    });
//    }, 200);

    // Your code here...
})();
