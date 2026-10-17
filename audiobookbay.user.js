// ==UserScript==
// @name         AudioBook Bay Enhanced
// @namespace    http://tampermonkey.net/
// @version      2026-10-17
// @description  Infinite scroll (both directions), card grid layout, sticky header/sidebars, advanced search modal, clickable cards
// @author       You
// @downloadURL  https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/audiobookbay.user.js
// @updateURL    https://github.com/wagyourtail/Userscripts/raw/refs/heads/main/audiobookbay.user.js
// @match        *://audiobookbay.tld/*
// @match        *://*.audiobookbay.tld/*
// @match        https://audiobookbay.lu/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=audiobookbay.lu
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const content = document.getElementById('content');
    initSearchModal(); // works on every page, listing or not

    const navWrap = content && content.querySelector('.navigation');
    const pagenavi = navWrap && navWrap.querySelector('.wp-pagenavi');
    // Listing pages always have .wp-pagenavi with a span.current; pages past the
    // end (e.g. /page/501/) and detail pages do not.
    const initialCurrent = pagenavi && pagenavi.querySelector('span.current');
    if (!content || !navWrap || !pagenavi || !initialCurrent) return;

    const posts = content.querySelectorAll(':scope > .post');
    if (!posts.length) return;

    injectStyles();

    /**
     * In .wp-pagenavi, the first numeric <a> after span.current is page N+1.
     * On the last page nothing follows span.current.
     */
    function nextUrl(nav) {
        const cur = nav.querySelector('span.current');
        let el = cur && cur.nextElementSibling;
        while (el && (el.tagName !== 'A' || !/^\d+$/.test(el.textContent.trim()))) {
            el = el.nextElementSibling;
        }
        return el ? el.href : null;
    }

    /**
     * The <a> immediately before span.current is always page N-1 (numeric, or
     * the « arrow which also points at N-1). Page 1 has nothing before it.
     */
    function prevUrl(nav) {
        const cur = nav.querySelector('span.current');
        let el = cur && cur.previousElementSibling;
        while (el && el.tagName !== 'A') el = el.previousElementSibling;
        return el ? el.href : null;
    }

    // ---- URL tracking -------------------------------------------------------

    function syncUrl() {
        const line = window.innerHeight * 0.35;
        let cur = null;
        for (const m of content.querySelectorAll('.abb-marker')) {
            if (m.getBoundingClientRect().top <= line) cur = m;
            else break;
        }
        if (cur && cur.dataset.url !== location.href) {
            history.replaceState(null, '', cur.dataset.url);
        }
    }

    const markerObserver = new IntersectionObserver(syncUrl);
    let syncScheduled = false;
    window.addEventListener('scroll', () => {
        if (syncScheduled) return;
        syncScheduled = true;
        requestAnimationFrame(() => { syncScheduled = false; syncUrl(); });
    }, { passive: true });

    /** Full-width break line between page groups; also carries the page URL. */
    function makeMarker(url, pageNum) {
        const m = document.createElement('div');
        m.className = 'abb-marker';
        m.dataset.url = url;
        m.textContent = 'Page ' + pageNum;
        markerObserver.observe(m);
        return m;
    }

    // ---- DOM scaffolding ----------------------------------------------------

    // "Load previous" bar at the top; observed so scrolling to the top
    // auto-loads, and clickable as a fallback.
    const sentinel = document.createElement('div');
    sentinel.className = 'abb-sentinel';
    sentinel.textContent = '↑ Load previous page';
    content.insertBefore(sentinel, content.firstChild);

    // Marker for the page we started on.
    content.insertBefore(
        makeMarker(location.href, initialCurrent.textContent.trim()),
        posts[0]
    );

    // Status line above the bottom pagination bar.
    const status = document.createElement('div');
    status.className = 'abb-status';
    navWrap.parentNode.insertBefore(status, navWrap);

    // Bottom inserts go before whatever follows the last post (ad + nav).
    const anchor = posts[posts.length - 1].nextSibling;

    const seen = new Set([location.href]);
    let loading = false;
    let done = false;
    let loadingPrev = false;
    let prevHref = prevUrl(pagenavi);

    function updateSentinel() {
        if (prevHref) {
            sentinel.style.display = '';
            sentinel.textContent = '↑ Load previous page';
        } else {
            sentinel.style.display = 'none';
        }
    }
    updateSentinel();

    // ---- loaders ------------------------------------------------------------

    async function fetchPage(url) {
        const resp = await fetch(url, { credentials: 'same-origin' });
        if (!resp.ok) throw new Error('HTTP ' + resp.status);
        const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
        return {
            nav: doc.querySelector('.wp-pagenavi'),
            current: doc.querySelector('.wp-pagenavi span.current'),
            posts: doc.querySelectorAll('#content > .post')
        };
    }

    async function loadNext() {
        if (loading || done) return;
        const url = nextUrl(pagenavi);
        if (!url || seen.has(url)) return finish('');
        seen.add(url);
        loading = true;
        status.textContent = 'Loading…';

        try {
            const { nav: newNav, current: newCurrent, posts: newPosts } = await fetchPage(url);
            // Out-of-range pages return 200 with no span.current — that's the end.
            const wanted = url.match(/\/page\/(\d+)/);
            if (!newCurrent || !newPosts.length ||
                (wanted && newCurrent.textContent.trim() !== wanted[1])) {
                return finish('— end of results —');
            }

            const frag = document.createDocumentFragment();
            frag.appendChild(makeMarker(url, newCurrent.textContent.trim()));
            newPosts.forEach(p => frag.appendChild(p));
            content.insertBefore(frag, anchor);

            // Keep bottom pagination in sync with the deepest loaded page.
            pagenavi.innerHTML = newNav.innerHTML;
            status.textContent = '';
        } catch (e) {
            console.error('[ABB infinite scroll]', e);
            finish('Failed to load more');
        } finally {
            loading = false;
        }
    }

    async function loadPrev() {
        if (loadingPrev || !prevHref) return;
        if (seen.has(prevHref)) { prevHref = null; return updateSentinel(); }
        const url = prevHref;
        seen.add(url);
        loadingPrev = true;
        sentinel.textContent = 'Loading…';

        try {
            const { nav: newNav, current: newCurrent, posts: newPosts } = await fetchPage(url);
            if (!newCurrent || !newPosts.length) {
                prevHref = null;
                return updateSentinel();
            }

            const frag = document.createDocumentFragment();
            frag.appendChild(makeMarker(url, newCurrent.textContent.trim()));
            newPosts.forEach(p => frag.appendChild(p));

            // Prepend above everything loaded so far, keeping scroll position.
            const before = document.documentElement.scrollHeight;
            content.insertBefore(frag, sentinel.nextSibling);
            window.scrollBy(0, document.documentElement.scrollHeight - before);

            prevHref = prevUrl(newNav);
            updateSentinel();
        } catch (e) {
            console.error('[ABB infinite scroll]', e);
            sentinel.textContent = '↑ Load previous page (retry)';
        } finally {
            loadingPrev = false;
        }
    }

    sentinel.addEventListener('click', loadPrev);

    // Whole card opens its book page; real links inside keep working.
    // ctrl/cmd-click and middle-click open in a new tab.
    function cardLink(e) {
        const post = e.target.closest('.post');
        if (!post || !content.contains(post)) return null;
        if (e.target.closest('a, button, input, select, textarea')) return null;
        return post.querySelector('.postTitle a');
    }
    content.addEventListener('click', e => {
        const a = cardLink(e);
        if (!a || window.getSelection().toString()) return;
        if (e.ctrlKey || e.metaKey) window.open(a.href, '_blank');
        else location.href = a.href;
    });
    content.addEventListener('auxclick', e => {
        if (e.button !== 1) return;
        const a = cardLink(e);
        if (a) { e.preventDefault(); window.open(a.href, '_blank'); }
    });

    function finish(msg) {
        done = true;
        status.textContent = msg;
        bottomObserver.disconnect();
    }

    // ---- observers ----------------------------------------------------------

    const bottomObserver = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) loadNext();
    }, { rootMargin: '800px' });
    bottomObserver.observe(navWrap);

    const topObserver = new IntersectionObserver(entries => {
        if (entries.some(e => e.isIntersecting)) loadPrev();
    }, { rootMargin: '600px 0px 0px 0px' });
    if (prevHref) topObserver.observe(sentinel);

    // ---- layout -------------------------------------------------------------

    function injectStyles() {
        const css = `
/* Tile posts inside #content; everything else spans the full row. */
#content {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
    gap: 14px;
    align-items: stretch;
}
#content > :not(.post) {
    grid-column: 1 / -1;
}

/* Replace the fixed 970px float layout (200px sidebar + 470px content +
   260px sidebar) with a fluid flex row so the grid grows with the window.
   DOM order is content, lsidebar, rsidebar — flex order puts the sidebars
   back on the sides. */
@media (min-width: 989px) {
    #wrap {
        width: auto;
        max-width: none;
        margin-left: 0;
        margin-right: 0;
        padding: 0 16px;
        box-sizing: border-box;
    }
    #page {
        width: auto;
        display: flex;
        align-items: flex-start;
        gap: 20px;
    }
    /* header/footer are also fixed at 970px — unfix them so .topSearch
       floats to the true right edge and the footer spans full width */
    #header, #footer { width: auto; }

    /* Sticky chrome: header and sidebars don't scroll with the list.
       #page's overflow:hidden would break position:sticky, so override it. */
    #page { overflow: visible; }
    #header {
        position: sticky;
        top: 0;
        z-index: 500;
        margin: 0 -16px;
        padding: 0 16px;
        background: #fff url(/wp-content/themes/simplebalance/img/background.png) repeat-x left top;
        border-bottom: 1px solid #92bdbb;
        box-shadow: 0 1px 4px rgba(0,0,0,.06);
    }
    /* sidebars are taller than the viewport — they get their own scroll */
    #lsidebar, #rsidebar {
        position: sticky;
        top: 112px;
        max-height: calc(100vh - 128px);
        overflow-y: auto;
        scrollbar-width: none; /* Firefox — still scrollable */
        box-sizing: border-box;
    }
    #lsidebar::-webkit-scrollbar, #rsidebar::-webkit-scrollbar {
        display: none; /* Chromium/WebKit */
    }
    #lsidebar { border-right: 1px solid #d2ebea; padding-right: 14px; }
    #rsidebar { border-left: 1px solid #d2ebea; padding-left: 14px; }
    #lsidebar { order: 1; float: none; flex: 0 0 200px; margin: 0; }
    #content  { order: 2; float: none; flex: 1 1 0; min-width: 0; margin: 0; }
    #rsidebar { order: 3; float: none; flex: 0 0 260px; margin: 0; }
}

/* Card look for each book entry */
#content > .post {
    width: auto;
    margin: 0;
    padding: 10px 12px;
    border: 1px solid #e2e2e2;
    border-radius: 8px;
    background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,.07);
    display: flex;
    flex-direction: column;
    transition: box-shadow .15s ease, transform .15s ease;
    cursor: pointer;
}
#content > .post:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,.14);
    transform: translateY(-2px);
}

/* Card title */
#content > .post .postTitle h2,
#content > .post .postTitle h2 a {
    font-size: 15px;
    line-height: 1.3;
}
#content > .post .postTitle h2 { border-bottom: 1px solid #eee; }

/* Category/keywords block: the inline margin-left:100px breaks narrow cards */
#content > .post .postInfo { font-size: 11px; color: #666; }
#content > .post .postInfo > span { margin-left: 0 !important; display: block; }

/* Cover image */
#content > .post .postContent { width: auto; margin-top: 8px; font-size: 12px; }
#content > .post .postContent img { max-width: 100%; height: auto; }

/* Meta links pinned to the bottom like a card footer */
#content > .post .postMeta { width: auto; margin-top: auto; padding-top: 6px; }

/* Page break lines */
.abb-marker {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    gap: 12px;
    color: #999;
    font-size: 12px;
    margin: 2px 0;
    text-transform: uppercase;
    letter-spacing: 1px;
}
.abb-marker::before,
.abb-marker::after {
    content: '';
    flex: 1;
    border-top: 1px solid #ddd;
}

/* Load-previous bar */
.abb-sentinel {
    grid-column: 1 / -1;
    text-align: center;
    padding: 9px;
    border: 1px dashed #bbb;
    border-radius: 8px;
    background: #fafafa;
    color: #207f7b;
    font-size: 13px;
    cursor: pointer;
}
.abb-sentinel:hover { background: #f0f7f7; }

.abb-status {
    grid-column: 1 / -1;
    text-align: center;
    margin: 4px 0;
    color: #777;
    font-size: 13px;
}
`;
        const style = document.createElement('style');
        style.textContent = css;
        document.head.appendChild(style);
    }

    // ---- advanced search modal ----------------------------------------------

    /** Intercept the "Advanced search" header link and open a modal instead. */
    function initSearchModal() {
        const link = document.getElementById('advanced-search-link')
            || document.querySelector('a[href$="/member/advanced_search"]');
        if (link) {
            link.addEventListener('click', e => {
                e.preventDefault();
                openSearchModal();
            });
        }
    }

    // Cached pristine copy of the site's #asearchform; cloned fresh per open.
    let advFormSrc = null;

    function openSearchModal() {
        if (!document.getElementById('abb-modal-css')) {
            const st = document.createElement('style');
            st.id = 'abb-modal-css';
            st.textContent = `
.abb-modal-overlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:99999;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;box-sizing:border-box;}
.abb-modal{background:#fff;border-radius:10px;box-shadow:0 10px 40px rgba(0,0,0,.3);width:660px;max-width:100%;max-height:calc(100vh - 80px);display:flex;flex-direction:column;font:13px/1.4 Arial,sans-serif;color:#333;text-align:left;}
.abb-modal-head{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #eee;font:normal 16px Georgia,"Times New Roman",serif;color:#d90202;}
.abb-modal-close{border:0;background:none;font-size:22px;cursor:pointer;color:#888;line-height:1;padding:2px 8px;}
.abb-modal-close:hover{color:#d90202;}
.abb-modal-body{padding:14px 18px;overflow:auto;}
.abb-modal input.s{width:100%!important;max-width:340px;box-sizing:border-box;padding:6px 8px;border:1px solid #92bdbb;border-radius:4px;height:auto;font-size:14px;}
.abb-modal a.searchSubmit{float:none;margin-left:6px;vertical-align:middle;}
.abb-modal #include_div,.abb-modal #exclude_div,.abb-modal #search_in_div{padding:6px 10px;border:1px solid #ddd;border-radius:6px;margin-bottom:10px;max-width:none;}
.abb-modal #include_div a,.abb-modal #exclude_div a,.abb-modal #search_in_div a{padding-left:0;cursor:pointer;color:#207f7b;text-decoration:none;font-weight:bold;}
.abb-modal #include_div a::before,.abb-modal #exclude_div a::before,.abb-modal #search_in_div a::before{content:'\\25B8';display:inline-block;margin-right:6px;color:#999;}
.abb-modal #include_div a.open::before,.abb-modal #exclude_div a.open::before,.abb-modal #search_in_div a.open::before{content:'\\25BE';}
.abb-modal #include_inner,.abb-modal #exclude_inner{display:none;margin-top:8px;}
.abb-modal #search_in_inner{margin-top:8px;}
.abb-modal .columns{column-count:2;column-gap:26px;list-style:none;margin:0;padding:0;}
.abb-modal .columns li{border-bottom:1px solid #eee;padding:5px 5px 4px 0;}
.abb-modal .columns input[type=checkbox]{margin-right:5px;}
`;
            document.head.appendChild(st);
        }

        const overlay = document.createElement('div');
        overlay.className = 'abb-modal-overlay';
        overlay.innerHTML =
            '<div class="abb-modal" role="dialog" aria-label="Advanced search">' +
            '<div class="abb-modal-head"><span>Advanced Search</span>' +
            '<button type="button" class="abb-modal-close" aria-label="Close">×</button></div>' +
            '<div class="abb-modal-body">Loading…</div></div>';
        const close = () => {
            overlay.remove();
            document.removeEventListener('keydown', onKey);
        };
        const onKey = e => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', onKey);
        overlay.addEventListener('mousedown', e => { if (e.target === overlay) close(); });
        overlay.querySelector('.abb-modal-close').addEventListener('click', close);
        document.body.appendChild(overlay);

        loadAdvForm()
            .then(form => {
                const body = overlay.querySelector('.abb-modal-body');
                body.textContent = '';
                body.appendChild(form);
                const s = form.querySelector('input.s');
                if (s) s.focus();
            })
            .catch(err => {
                console.error('[ABB infinite scroll]', err);
                overlay.querySelector('.abb-modal-body').textContent =
                    'Failed to load advanced search.';
            });
    }

    async function loadAdvForm() {
        if (!advFormSrc) {
            const resp = await fetch(location.origin + '/member/advanced_search',
                { credentials: 'same-origin' });
            // The site serves this page with a 404 status but a full body —
            // judge by content, not status.
            const doc = new DOMParser().parseFromString(await resp.text(), 'text/html');
            advFormSrc = doc.getElementById('asearchform');
            if (!advFormSrc) throw new Error('form not found (HTTP ' + resp.status + ')');
        }
        const form = advFormSrc.cloneNode(true);
        form.setAttribute('action', location.origin + '/');
        wireAdvForm(form);
        return form;
    }

    /** Rebind the site's collapse toggles / check-all / submit serialization. */
    function wireAdvForm(form) {
        for (const id of ['search_in', 'include', 'exclude']) {
            const a = form.querySelector('#' + id + '_a');
            const inner = form.querySelector('#' + id + '_inner');
            if (!a || !inner) continue;
            a.addEventListener('click', e => {
                e.preventDefault();
                const show = getComputedStyle(inner).display === 'none';
                inner.style.display = show ? 'block' : 'none';
                a.classList.toggle('open', show);
                a.classList.toggle('close', !show);
            });
        }

        for (const [allId, innerId] of [['include_checkall', 'include_inner'],
                                        ['exclude_checkall', 'exclude_inner']]) {
            const all = form.querySelector('#' + allId);
            if (all) all.addEventListener('click', () => {
                form.querySelectorAll('#' + innerId + ' input[type=checkbox]')
                    .forEach(c => { c.checked = all.checked; });
            });
        }

        // The inline javascript: href calls .submit() which skips handlers —
        // use requestSubmit so the submit event (and our serialization) runs.
        const submitLink = form.querySelector('a.searchSubmit');
        if (submitLink) {
            submitLink.addEventListener('click', e => {
                e.preventDefault();
                form.requestSubmit();
            });
        }
        form.addEventListener('submit', () => serializeAdvForm(form));
    }

    /** Mirror main.js: collapse checkbox arrays into tt=/cat= hidden params. */
    function serializeAdvForm(form) {
        const hidden = (name, value) => {
            const i = document.createElement('input');
            i.type = 'hidden'; i.name = name; i.value = value;
            form.appendChild(i);
        };

        const tts = [...form.querySelectorAll('#search_in_inner input[name="tt[]"]')];
        if (tts.some(c => !c.checked)) {
            hidden('tt', tts.filter(c => c.checked).map(c => c.value).join(','));
        }
        tts.forEach(c => { c.disabled = true; });

        const ins = [...form.querySelectorAll('#include_inner input[name="include_cat[]"]')];
        const exs = [...form.querySelectorAll('#exclude_inner input[name="exclude_cat[]"]')];
        // All included = no filter → send nothing, same as the site.
        const inVals = ins.some(c => !c.checked)
            ? ins.filter(c => c.checked).map(c => c.value) : [];
        const exVals = exs.filter(c => c.checked).map(c => c.value);
        ins.forEach(c => { c.disabled = true; });
        exs.forEach(c => { c.disabled = true; });
        const cat = [...inVals, ...exVals].join(',');
        if (cat) hidden('cat', cat);
        ['include_checkall', 'exclude_checkall'].forEach(id => {
            const c = form.querySelector('#' + id);
            if (c) c.disabled = true;
        });

        const s = form.querySelector('input.s');
        if (s) {
            let v = s.value.toLowerCase()
                .replace(/\+/g, ' ').replace(/%26/g, ' ')
                .replace(/&/g, ' ').replace(/:/g, ' ')
                .replace(/-/g, ' ').trim();
            const exact = form.querySelector('#exact_match');
            if (exact && exact.checked && !(v.startsWith('"') && v.endsWith('"'))) {
                v = '"' + v + '"';
            }
            s.value = v;
        }
    }
})();
