// ==UserScript==

// @name         Wandering Inn Chapters
// @namespace    http://tampermonkey.net/
// @version      0.2.3
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

        const title = e.innerText.replaceAll("–", "-").replaceAll(" ", "_")

        if (/^\d.+/.test(e.innerText)) {
            c.href = `https://wiki.wanderinginn.com/Chapter_${title}`
        } else {
            c.href = `https://wiki.wanderinginn.com/${title}`
        }
        c.appendChild(sup)
        c.classList.add("wiki_ref")
        sup.appendChild(document.createTextNode("(wiki)"))
        e.appendChild(c)
    }

    if (window.location.pathname.includes("table-of-contents")) {
        [...document.getElementsByClassName("body-web")].forEach(createWikiElement)
    } else {
        createWikiElement(document.getElementsByClassName("entry-title")[0])
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
