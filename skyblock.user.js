// ==UserScript==
// @name         Show Margin As Percent
// @namespace    http://tampermonkey.net/
// @version      2024-01-01
// @description  margin percents go brr..
// @author       Wagyourtail
// @downloadURL  https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/skyblock.user.js
// @updateURL    https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/skyblock.user.js
// @match        https://www.skyblock.bz/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=skyblock.bz
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    let marginPercentMap = new Map()

    setInterval(() => {
        [...document.getElementsByClassName("card_menu")].forEach(e => {
            // calculate margin %'s
            let v = e.innerText.split("\n").map(e => e.split(":"))
            if (v != null) {
                let buy = parseFloat(v.filter(e => e[0] == "Buy Price")[0][1].replaceAll("," , ""))
                let sell = parseFloat(v.filter(e => e[0] == "Sell Price" || e[0] == "Craft Price")[0][1].replaceAll("," , ""))
                let margin = ((buy/sell-1) * 100).toFixed(2)
                // find if margin % in elements
                if (marginPercentMap.has(e)) {
                    marginPercentMap.get(e).textContent = ": " + margin + "%"
                } else {
                    let title = document.createElement("b")
                    title.innerHTML = "Margin %"
                    let text = document.createTextNode(": " + margin + "%")
                    marginPercentMap.set(e, text)
                    let br = document.createElement("br")
                    e.appendChild(br)
                    e.appendChild(title)
                    e.appendChild(text)
                }
                //if (margin < minProfitPercent || sell < minBuyPrice) {
                //    e.parentElement.parentElement.style.display = "hidden"
                //} else {
                //    e.parentElement.parentElement.style.display = null
                //}
            }
        });

        // remove ad cards
        let cards = document.getElementsByClassName("edges")[0].children
        for (const card of cards) {
            if (card.id) {
                card.style.display = "none"
            }
        }
    }, 200);
})();
