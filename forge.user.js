// ==UserScript==
// @name         MinecraftForge Tweaks
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Remove adfocus & add userdev/universal downloads
// @author       Wagyourtail
// @downloadURL  https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/forge.user.js
// @updateURL    https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/forge.user.js
// @match        https://files.minecraftforge.net/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=minecraftforge.net
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    setInterval(() => {
        $("a").each((i, e) => {
            const uri = e.getAttribute("href");
            if (uri?.startsWith("https://adfoc.us/serve/sitelinks/")) {
                e.setAttribute("href", uri.split("url=", 2)[1])
            }
        })
        $(".download .links").each((i, e) => {
            // if last is mdk
            // .link a .classifier-mdk
            if (e.lastElementChild.firstElementChild.firstElementChild.className === "fa classifier-mdk") {
                let version = e.parentElement.firstElementChild.children[2].innerText.replaceAll(" ", "")
                let n = document.createElement("div");
                n.id = "test"
                n.className = "link"
                n.innerHTML = `<a href="https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-universal.jar" title="Universal">
                                                        <i class="fa classifier-universal" aria-hidden="true"></i>
                                                        <span class="promo-label">Universal</span>
                                                    </a>`
                e.appendChild(n);

                n = document.createElement("div");
                n.id = "test"
                n.className = "link"
                n.innerHTML = `<a href="https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-userdev.jar" title="Userdev">
                                                        <i class="fa classifier-universal" aria-hidden="true"></i>
                                                        <span class="promo-label">Userdev</span>
                                                    </a>`
                e.appendChild(n);

                n = document.createElement("div");
                n.id = "test"
                n.className = "link"
                n.innerHTML = `<a href="https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-sources.jar" title="Sources">
                                                        <i class="fa classifier-universal" aria-hidden="true"></i>
                                                        <span class="promo-label">Sources</span>
                                                    </a>`

                e.appendChild(n);
            }
            // if last is universal & we are on 1.12.2
            if (e.lastElementChild.firstElementChild.firstElementChild.className === "fa classifier-universal") {
                let version = e.parentElement.firstElementChild.children[2].innerText.replaceAll(" ", "")
                if (version.startsWith("1.12.2")) {
                    let n = document.createElement("div");
                    n.id = "test"
                    n.className = "link"
                    n.innerHTML = `<a href="https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-userdev3.jar" title="Userdev">
                                                        <i class="fa classifier-universal extra" aria-hidden="true"></i>
                                                        <span class="promo-label">Userdev</span>
                                                    </a>`
                    e.appendChild(n);

                    n = document.createElement("div");
                    n.id = "test"
                    n.className = "link"
                    n.innerHTML = `<a href="https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-sources.jar" title="Sources">
                                                        <i class="fa classifier-universal extra" aria-hidden="true"></i>
                                                        <span class="promo-label">Sources</span>
                                                    </a>`

                    e.appendChild(n);
                }
            }
        })
        $(".download-files .download-links").each((i, e) => {
            if (e.lastElementChild.innerText.trim() === "Mdk") {
                let version = e.parentElement.parentElement.firstElementChild.innerText.trim()
                let mcVersion = e.baseURI.split("index_")[1].split(".htm")[0]
                version = `${mcVersion}-${version}`
                // create universal and userdev links
                let n = document.createElement("li");
                n.innerHTML = `
            <a href="https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-universal.jar">
                <i class="fa download-classifier classifier-universal" aria-hidden="true"></i> Universal
            </a>&nbsp;
            <a class="info-link tooltipstered" data-toggle="popup" href="https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-universal.jar">
                <i class="fa fa-info-circle" aria-hidden="true"></i>
            </a>
            <div class="info-tooltip">
                    <br><a href="https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-userdev.jar">(Direct Download)</a>
            </div>
        `
                e.appendChild(n)

                n = document.createElement("li");
                n.innerHTML = `
            <a href="https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-userdev.jar">
                <i class="fa download-classifier classifier-universal" aria-hidden="true"></i> Userdev
            </a>&nbsp;
            <a class="info-link tooltipstered" data-toggle="popup" href="https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-userdev.jar">
                <i class="fa fa-info-circle" aria-hidden="true"></i>
            </a>
            <div class="info-tooltip">
                    <br><a href="https://maven.minecraftforge.net/net/minecraftforge/forge/${version}/forge-${version}-userdev.jar">(Direct Download)</a>
            </div>
        `
                e.appendChild(n)
            }
        })
    }, 200);

})();
