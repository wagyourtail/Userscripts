// ==UserScript==

// @name         Wandering Inn Chapters
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Add wiki urls to wandering inn chapter list
// @author       Wagyourtail
// @downloadURL  https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/wanderinginn.user.js
// @updateURL    https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/wanderinginn.user.js
// @match        https://wanderinginn.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=wanderinginn.com
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    function createWikiElement(e) {
        const c = document.createElement("a")
        const sup = document.createElement("sup")
        if (/^\d.+/.test(e.innerText)) {
            c.href = `https://wiki.wanderinginn.com/Chapter_${e.innerText.replaceAll(" ", "_")}`
        } else {
            c.href = `https://wiki.wanderinginn.com/${e.innerText.replaceAll(" ", "_")}`
        }
        c.appendChild(sup)
        c.classList.add("wiki_ref")
        sup.appendChild(document.createTextNode("(wiki)"))
        return c
    }

    if (window.location.pathname.startsWith("table-of-contents")) {
        [...document.getElementsByClassName("body-web")].forEach(e => {
            e.appendChild(createWikiElement(e))
        })
    } else {
        const e = document.getElementsByClassName("entry-title")[0]
        e.appendChild(createWikiElement(e))
    }

     GM_addStyle(`
     .wiki_ref {
         text-decoration: none;
         font-size: 60%;
         padding-left: 2px;
     }
     .wiki_ref:hover {
         text-decoration: none;
         font-size: 60%;
         padding-left: 2px;
     }
     `);
})();
