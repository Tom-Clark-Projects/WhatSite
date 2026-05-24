/**
 * WhatSite — Hover Inspector (content script)
 *
 * When enabled (toggle in the popup), moving the mouse over a resource element
 * outlines it and shows a tooltip with:
 *   - the domain that served it
 *   - the request type (image, iframe, media, ...)
 *   - first-party vs third-party (relative to the page's own root domain)
 *   - the WhatSite threat score, fetched from the background's cache
 *
 * Two design choices make this work on real-world sites:
 *
 *   1. Detection uses document.elementsFromPoint() rather than the hovered
 *      event target. Modern sites (YouTube, news sites, ...) cover images
 *      with transparent click overlays, so the literal mouse target is a
 *      <div>/<a>, never the <img>. elementsFromPoint() returns the whole
 *      stack at the cursor, so we can find the resource element underneath.
 *
 *   2. Every style is applied inline via element.style.setProperty(...,
 *      'important'). Nothing relies on an injected <style> sheet, which a
 *      page's Content-Security-Policy can refuse. Inline styles set through
 *      the CSSOM are not subject to CSP and override page rules.
 *
 * Scope is limited to genuine resource elements whose URL is in the DOM. We
 * don't guess at the provenance of arbitrary <div>/<button> elements.
 *
 * The script is always injected but completely inert until the toggle is on.
 */

(() => {
  'use strict';

  if (window.__whatSiteInspectorLoaded) return;
  window.__whatSiteInspectorLoaded = true;

  const TOOLTIP_ID = '__whatsite-inspector-tooltip';

  let enabled       = false;
  let tooltipEl     = null;
  let currentTarget = null;
  let reqToken      = 0;          // guards async threat responses
  let lastX = 0, lastY = 0;
  let rafPending = false;

  // The highlighted element's prior inline outline, so we can restore it.
  let savedOutline = null;
  let savedOffset  = null;

  // --- Root-domain heuristic (mirrors background.js) ------------------------
  function getRootDomain(hostname) {
    if (!hostname) return '';
    const parts = hostname.replace(/^\./, '').split('.');
    if (parts.length <= 2) return parts.join('.');
    const sld = parts[parts.length - 2];
    if (sld.length <= 3 && parts.length >= 3) return parts.slice(-3).join('.');
    return parts.slice(-2).join('.');
  }
  const pageRoot = getRootDomain(location.hostname);

  // --- Element classification ----------------------------------------------
  /** Map an element to { type, url } if it's a resource element, else null. */
  function classifyElement(el) {
    if (!el || el.nodeType !== 1) return null;
    let type = null;
    let raw  = null;

    switch (el.tagName) {
      case 'IMG':    type = 'image';  raw = el.currentSrc || el.src; break;
      case 'IFRAME': type = 'iframe'; raw = el.src; break;
      case 'VIDEO':  type = 'media';  raw = el.currentSrc || el.src; break;
      case 'AUDIO':  type = 'media';  raw = el.currentSrc || el.src; break;
      case 'EMBED':  type = 'object'; raw = el.src;  break;
      case 'OBJECT': type = 'object'; raw = el.data; break;
      case 'SCRIPT': type = 'script'; raw = el.src;  break;
      case 'SOURCE': {
        const parentTag = el.parentElement ? el.parentElement.tagName : '';
        type = parentTag === 'PICTURE' ? 'image' : 'media';
        raw  = el.src || (el.srcset || '').split(',')[0].trim().split(' ')[0];
        break;
      }
      case 'LINK': {
        const rel = (el.rel || '').toLowerCase();
        if (rel.includes('stylesheet')) type = 'stylesheet';
        else if (rel.includes('icon')) type = 'icon';
        else if (rel.includes('preload') || rel.includes('prefetch')) type = 'preload';
        else return null;
        raw = el.href;
        break;
      }
      default:
        return null;
    }

    if (!raw) return null;
    let url;
    try { url = new URL(raw, location.href); } catch { return null; }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return { type, url };
  }

  /**
   * The topmost resource element at a viewport point. elementsFromPoint()
   * returns the full hit-test stack (topmost first), so a resource element
   * hidden under a transparent overlay is still found.
   */
  function resourceElementAt(x, y) {
    let stack;
    try { stack = document.elementsFromPoint(x, y); }
    catch { return null; }
    for (const el of stack) {
      if (el.id === TOOLTIP_ID) continue;
      if (classifyElement(el)) return el;
    }
    return null;
  }

  // --- Inline styling helpers (CSP-immune) ---------------------------------
  function applyStyles(el, styles) {
    for (const key in styles) {
      el.style.setProperty(key, styles[key], 'important');
    }
  }

  function ensureTooltip() {
    if (tooltipEl && document.documentElement.contains(tooltipEl)) return tooltipEl;
    tooltipEl = document.createElement('div');
    tooltipEl.id = TOOLTIP_ID;
    applyStyles(tooltipEl, {
      position:         'fixed',
      'z-index':        '2147483647',
      display:          'none',
      'max-width':      '340px',
      margin:           '0',
      padding:          '7px 10px',
      background:       '#0d1628',
      border:           '1px solid #1e2f52',
      'border-radius':  '6px',
      'box-shadow':     '0 4px 16px rgba(0,0,0,0.5)',
      'font-family':    "-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
      'font-size':      '11.5px',
      'font-weight':    '400',
      'line-height':    '1.5',
      'letter-spacing': 'normal',
      'text-align':     'left',
      'text-transform': 'none',
      'white-space':    'normal',
      color:            '#e2e8f0',
      'pointer-events': 'none',
    });
    (document.body || document.documentElement).appendChild(tooltipEl);
    return tooltipEl;
  }

  function hideTooltip() {
    if (tooltipEl) tooltipEl.style.setProperty('display', 'none', 'important');
  }

  /** A single "Label: value" line; the value is colour-coded. */
  function infoRow(label, value, valueColor) {
    const row = document.createElement('div');
    applyStyles(row, {
      display: 'block', margin: '0', padding: '0',
      'font-family': 'inherit', 'font-size': '11.5px', 'line-height': '1.5',
      color: '#94a3b8',
    });
    row.textContent = label + ': ';
    const val = document.createElement('span');
    applyStyles(val, { 'font-weight': '600', color: valueColor });
    val.textContent = value;
    row.appendChild(val);
    return row;
  }

  /**
   * Rebuild + position the tooltip. `threat` may be:
   *   undefined - not requested yet (first-party resources are never scored)
   *   null      - requested, nothing cached
   *   object    - { score, level, ... }
   */
  function renderTooltip(el, data) {
    const tip = ensureTooltip();
    const { hostname, type, party, threat, geo } = data;
    tip.textContent = ''; // clear

    const domLine = document.createElement('div');
    applyStyles(domLine, {
      display: 'block', margin: '0 0 3px 0', padding: '0',
      'font-family': "'Cascadia Code','Consolas',monospace",
      'font-size': '11.5px', 'font-weight': '700',
      color: '#38bdf8', 'word-break': 'break-all',
    });
    domLine.textContent = hostname;
    tip.appendChild(domLine);

    tip.appendChild(infoRow('Type', type, '#e2e8f0'));

    const partyColor = party === 'first-party' ? '#38bdf8' : '#f59e0b';
    tip.appendChild(infoRow('Origin', party, partyColor));

    let scoreText, scoreColor;
    if (party === 'first-party') {
      scoreText = 'n/a (first-party)'; scoreColor = '#94a3b8';
    } else if (threat === undefined) {
      scoreText = 'checking…'; scoreColor = '#94a3b8';
    } else if (!threat || threat.level === 'unknown') {
      scoreText = 'not scored'; scoreColor = '#94a3b8';
    } else {
      scoreText  = `${threat.score}/100 (${threat.level})`;
      scoreColor = threat.level === 'high'    ? '#ef4444'
                 : threat.level === 'caution' ? '#f59e0b'
                 :                              '#22c55e';
    }
    tip.appendChild(infoRow('Score', scoreText, scoreColor));

    // Country of the serving IP, when the background has geolocated it.
    // ISO code only: Windows renders a flag emoji as those same two letters,
    // so "flag + code" would read as "US US".
    if (geo && geo.countryCode) {
      tip.appendChild(infoRow('Country', geo.countryCode, '#e2e8f0'));
    }

    // Show, measure, then place above the element (flip below if no room).
    tip.style.setProperty('display', 'block', 'important');
    const rect = el.getBoundingClientRect();
    const tr   = tip.getBoundingClientRect();
    let top  = rect.top - tr.height - 8;
    let left = rect.left;
    if (top < 4) top = rect.bottom + 8;
    if (left + tr.width > window.innerWidth - 4) left = window.innerWidth - tr.width - 4;
    if (left < 4) left = 4;
    tip.style.setProperty('top',  `${Math.max(4, top)}px`, 'important');
    tip.style.setProperty('left', `${left}px`, 'important');
  }

  // --- Highlight outline (inline, restores the element's prior outline) -----
  function highlight(el, color) {
    savedOutline = {
      value:    el.style.getPropertyValue('outline'),
      priority: el.style.getPropertyPriority('outline'),
    };
    savedOffset = {
      value:    el.style.getPropertyValue('outline-offset'),
      priority: el.style.getPropertyPriority('outline-offset'),
    };
    el.style.setProperty('outline', `2px solid ${color}`, 'important');
    el.style.setProperty('outline-offset', '1px', 'important');
  }

  function unhighlight(el) {
    if (!el) return;
    if (savedOutline && savedOutline.value) {
      el.style.setProperty('outline', savedOutline.value, savedOutline.priority);
    } else {
      el.style.removeProperty('outline');
    }
    if (savedOffset && savedOffset.value) {
      el.style.setProperty('outline-offset', savedOffset.value, savedOffset.priority);
    } else {
      el.style.removeProperty('outline-offset');
    }
    savedOutline = savedOffset = null;
  }

  // --- Core processing ------------------------------------------------------
  function clearCurrent() {
    if (currentTarget) unhighlight(currentTarget);
    currentTarget = null;
    reqToken++;
    hideTooltip();
  }

  function process() {
    if (!enabled) return;
    const el = resourceElementAt(lastX, lastY);

    if (el === currentTarget) return;  // still on the same element

    if (currentTarget) unhighlight(currentTarget);
    currentTarget = el;
    reqToken++;

    if (!el) { hideTooltip(); return; }

    const info = classifyElement(el);
    if (!info) { hideTooltip(); return; }

    const hostname = info.url.hostname;
    const party = getRootDomain(hostname) === pageRoot ? 'first-party' : 'third-party';
    highlight(el, party === 'first-party' ? '#38bdf8' : '#f59e0b');
    renderTooltip(el, { hostname, type: info.type, party, threat: undefined });

    // Only third-party domains are ever scored by the background.
    if (party === 'third-party') {
      const token = reqToken;
      try {
        chrome.runtime.sendMessage({ type: 'getThreat', domain: hostname }, (res) => {
          if (chrome.runtime.lastError) return;
          if (token !== reqToken || currentTarget !== el) return;
          const threat = res && res.threat ? res.threat : null;
          const geo    = res && res.geo ? res.geo : null;
          renderTooltip(el, { hostname, type: info.type, party, threat, geo });
          if (threat && threat.level === 'high') {
            el.style.setProperty('outline-color', '#ef4444', 'important');
          }
        });
      } catch { /* extension context invalidated — ignore */ }
    }
  }

  // Coalesce mousemove/scroll bursts into one process() call per frame.
  function schedule() {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => { rafPending = false; process(); });
  }

  function onMouseMove(e) {
    lastX = e.clientX;
    lastY = e.clientY;
    schedule();
  }
  function onScroll()     { schedule(); }
  function onMouseLeave() { clearCurrent(); }

  // --- Enable / disable -----------------------------------------------------
  function setEnabled(on) {
    if (on === enabled) return;
    enabled = on;
    if (on) {
      document.addEventListener('mousemove', onMouseMove, true);
      document.addEventListener('scroll', onScroll, true);
      document.documentElement.addEventListener('mouseleave', onMouseLeave);
      console.info('[WhatSite] Hover Inspector enabled — hover images, iframes, videos.');
    } else {
      document.removeEventListener('mousemove', onMouseMove, true);
      document.removeEventListener('scroll', onScroll, true);
      document.documentElement.removeEventListener('mouseleave', onMouseLeave);
      clearCurrent();
      console.info('[WhatSite] Hover Inspector disabled.');
    }
  }

  // --- Wire up to the stored toggle ----------------------------------------
  chrome.storage.local.get('inspectorEnabled')
    .then((r) => setEnabled(!!r.inspectorEnabled))
    .catch(() => { /* storage unavailable — stay inert */ });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.inspectorEnabled) {
      setEnabled(!!changes.inspectorEnabled.newValue);
    }
  });
})();
