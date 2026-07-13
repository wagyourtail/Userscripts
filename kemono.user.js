// ==UserScript==
// @name         Kemono tweaks
// @namespace    http://tampermonkey.net/
// @version      1.6.1
// @description  tweak to be better on moble and allow prev/next when scrolled
// @author       Wagyourtail
// @downloadURL  https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/kemono.user.js
// @updateURL    https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/kemono.user.js
// @include      https://kemono.tld/*
// @include      https://coomer.tld/*
// @include      https://pawchive.tld/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=kemono.cr
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    setInterval(() => {
        [...document.getElementsByClassName("post__nav-link")].forEach(e => {
            e.onclick = () => document.querySelector('.main').scrollTo(0, 0)
        })
    }, 500)

    GM_addStyle(`

    .site-section {
        height: max-content;
    }

    .content-wrapper {
        display: flex;
        flex-direction: column;
    }

    .header {
        flex-grow: 0;
        flex-shrink: 0;
    }

    .post__nav-links {
        position: sticky;
        top: 0px;
        z-index: 1;
        background: #202324;
        border-bottom: solid hsl(0,0%,50%) .125em;
        border-radius: 10px 10px 0 0;
        padding: .5rem;
    }

    .post__nav-list {
        margin: 0;
    }

    .post__header {
        border-top: none;
        border-left: none;
        border-right: none;
        border-radius:0;
    }

    .post__body {
        border-left: none;
        border-right: none;
    }

    .post__footer {
        border-left: none;
        border-right: none;
        border-bottom: none;
        contain-intrinsic-height: 0px;
        content-visibility: auto;
    }

    .main {
        flex-grow: 1;
        border: solid hsl(0,0%,50%) .125em;;
        border-radius: 10px;
        margin: 1em;
        padding: 0px !important;
        overflow: scroll;
    }
    `)

})();
