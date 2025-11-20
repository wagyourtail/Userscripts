// ==UserScript==
// @name         Kemono upgrades
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  copy nav to bottom of post
// @author       Wagyourtail
// @downloadURL  https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/kemono.user.js
// @updateURL    https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/kemono.user.js
// @include        https://kemono.tld/*
// @include        https://coomer.tld/*
// @run-at       document-end
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kemono.party
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    function waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    observer.disconnect();
                    resolve(document.querySelector(selector));
                }
            });

            // If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    // store url on load
    let currentPage = "";

    // listen for changes
    setInterval(() => {
        if (currentPage != location.href) {

            waitForElm('.post__footer').then((elm) => {
                if (elm.previousElementSibling.className != "post__nav-links") {
                    elm.before(document.getElementsByClassName("post__nav-links")[0].cloneNode(true))
                }
            });

            currentPage = location.href;
        }
    }, 500);
})();
