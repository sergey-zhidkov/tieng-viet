/*
Tiengviet Vietnamese-English Dictionary as a fork of Zhongwen

---

 Originally based on Zhongwen - A Chinese-English Pop-Up Dictionary
 Copyright (C) 2010-2023 Christian Schiller
 https://chrome.google.com/extensions/detail/kkmlkkjojmombglmlpbpapmhcaljjkde

 ---

 Originally based on Rikaikun 0.8
 Copyright (C) 2010 Erek Speed
 http://code.google.com/p/rikaikun/

 ---

 Originally based on Rikaichan 1.07
 by Jonathan Zarate
 http://www.polarcloud.com/

 ---

 Originally based on RikaiXUL 0.4 by Todd Rudick
 http://www.rikai.com/
 http://rikaixul.mozdev.org/

 ---

 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 2 of the License, or
 (at your option) any later version.

 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.

 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA

 ---

 Please do not change or remove any of the copyrights or links to web pages
 when modifying any of the files.

 */

'use strict';

// Define interfaces for the configuration and search results
interface TiengvietConfig {
  css: string;
  tonecolors: string;
  fontSize: string;
  skritterTLD: string;
  zhuyin: string;
  grammar: string;
  vocab: string;
  simpTrad: string;
  toneColorScheme: string;
}

interface SelEndItem {
  node: Node;
  offset: number;
}

interface SearchResult {
  data: Array<Array<string>>;
  matchLen: number;
  more?: number;
  grammar?: {
    keyword: string;
    index: number;
  };
  vocab?: {
    keyword: string;
    index: number;
  };
  originalText?: string;
}

const mainDivId = 'tiengvietDiv';
const tiengvietWindowId = 'tiengviet-window';

let config: TiengvietConfig;

let savedTarget: HTMLElement | null = null;

let savedRangeNode: Node | null = null;

let savedRangeOffset = 0;

let selText: string | null = null;

let clientX = 0;

let clientY = 0;

let selStartDelta = 0;

let selStartIncrement = 0;

let popX = 0;

let popY = 0;

let timer: number | null = null;

let altView = 0;

let savedSearchResults: Array<Array<string>> & {
  grammar?: { keyword: string; index: number };
  vocab?: { keyword: string; index: number };
} = [];

let savedSelStartOffset = 0;

let savedSelEndList: SelEndItem[] = [];

// Global variable to store the offset difference when finding word boundaries
let wordBoundaryOffsetDiff = 0;

// regular expression for zero-width non-joiner U+200C &zwnj;
const zwnj = /\u200c/g;

function enableTab(): void {
  document.addEventListener('mousemove', onMouseMove);
  // TODO: return to using keydown events
  // document.addEventListener('keydown', onKeyDown);
}

function disableTab(): void {
  document.removeEventListener('mousemove', onMouseMove);
  // document.removeEventListener('keydown', onKeyDown);

  const popup = document.getElementById(tiengvietWindowId);
  if (popup) {
    popup.parentNode?.removeChild(popup);
  }

  clearHighlight();
}

function onKeyDown(keyDown: KeyboardEvent): void {
  if (keyDown.ctrlKey || keyDown.metaKey) {
    return;
  }

  if (keyDown.keyCode === 27) {
    // esc key pressed
    hidePopup();
    return;
  }

  if (keyDown.altKey && keyDown.keyCode === 87) {
    // Alt + w
    chrome.runtime.sendMessage({
      type: 'open',
      tabType: 'wordlist',
      url: '/wordlist.html',
    });
    return;
  }

  if (!isVisible()) {
    return;
  }

  switch (keyDown.keyCode) {
    case 65: // 'a'
      altView = (altView + 1) % 3;
      triggerSearch();
      break;

    case 67: // 'c'
      copyToClipboard(getTextForClipboard());
      break;

    case 66: // 'b'
      {
        let offset = selStartDelta;
        for (let i = 0; i < 10; i++) {
          selStartDelta = --offset;
          let ret = triggerSearch();
          if (ret === 0) {
            break;
          } else if (ret === 2) {
            if (savedRangeNode && savedRangeNode.parentNode) {
              savedRangeNode = findPreviousTextNode(savedRangeNode.parentNode, savedRangeNode);
              savedRangeOffset = 0;
              offset = savedRangeNode ? savedRangeNode.textContent?.length || 0 : 0;
            }
          }
        }
      }
      break;

    case 71: // 'g'
      if (config.grammar !== 'no' && savedSearchResults.grammar) {
        let sel = encodeURIComponent(window.getSelection()?.toString() || '');

        // https://resources.allsetlearning.com/chinese/grammar/%E4%B8%AA
        let allset = 'https://resources.allsetlearning.com/chinese/grammar/' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'grammar',
          url: allset,
        });
      }
      break;

    case 77: // 'm'
      selStartIncrement = 1;
    // falls through
    case 78: // 'n'
      for (let i = 0; i < 10; i++) {
        selStartDelta += selStartIncrement;
        let ret = triggerSearch();
        if (ret === 0) {
          break;
        } else if (ret === 2) {
          if (savedRangeNode && savedRangeNode.parentNode) {
            savedRangeNode = findNextTextNode(savedRangeNode.parentNode, savedRangeNode);
            savedRangeOffset = 0;
            selStartDelta = 0;
            selStartIncrement = 0;
          }
        }
      }
      break;

    case 82: // 'r'
      {
        const entries = [] as Record<string, string>[];
        for (let j = 0; j < savedSearchResults.length; j++) {
          const entry = {
            simplified: savedSearchResults[j][0],
            traditional: savedSearchResults[j][1],
            pinyin: savedSearchResults[j][2],
            definition: savedSearchResults[j][3],
          };
          entries.push(entry);
        }

        chrome.runtime.sendMessage({
          type: 'add',
          entries: entries,
        });

        showPopup('Added to word list.<p>Press Alt+W to open word list.', null, -1, -1);
      }
      break;

    case 83: // 's'
      {
        // https://www.skritter.com/vocab/api/add?from=Chrome&lang=zh&word=浏览&trad=瀏 覽&rdng=liú lǎn&defn=to skim over; to browse

        let skritter = 'https://skritter.com';
        if (config.skritterTLD === 'cn') {
          skritter = 'https://skritter.cn';
        }

        skritter +=
          '/vocab/api/add?from=zhongwen&ref=zhongwen&lang=zh&word=' +
          encodeURIComponent(savedSearchResults[0][0]) +
          '&trad=' +
          encodeURIComponent(savedSearchResults[0][1]) +
          '&rdng=' +
          encodeURIComponent(savedSearchResults[0][4]) +
          '&defn=' +
          encodeURIComponent(savedSearchResults[0][3]);

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'skritter',
          url: skritter,
        });
      }
      break;

    case 84: // 't'
      {
        let sel = encodeURIComponent(window.getSelection()?.toString() || '');

        // https://tatoeba.org/eng/sentences/search?from=cmn&to=eng&query=%E8%BF%9B%E8%A1%8C
        let tatoeba = 'https://tatoeba.org/eng/sentences/search?from=cmn&to=eng&query=' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'tatoeba',
          url: tatoeba,
        });
      }
      break;

    case 86: // 'v'
      if (config.vocab !== 'no' && savedSearchResults.vocab) {
        let sel = encodeURIComponent(window.getSelection()?.toString() || '');

        // https://resources.allsetlearning.com/chinese/vocabulary/%E4%B8%AA
        let allset = 'https://resources.allsetlearning.com/chinese/vocabulary/' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'vocab',
          url: allset,
        });
      }
      break;

    case 88: // 'x'
      altView = 0;
      popY -= 20;
      triggerSearch();
      break;

    case 89: // 'y'
      altView = 0;
      popY += 20;
      triggerSearch();
      break;

    case 49: // '1'
      if (keyDown.altKey) {
        // use the simplified character for linedict lookup
        let simp = savedSearchResults[0][0];

        // https://english.dict.naver.com/english-chinese-dictionary/#/search?query=%E8%AF%8D%E5%85%B8
        let linedict =
          'https://english.dict.naver.com/english-chinese-dictionary/#/search?query=' +
          encodeURIComponent(simp);

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'linedict',
          url: linedict,
        });
      }
      break;

    case 50: // '2'
      if (keyDown.altKey) {
        let sel = encodeURIComponent(window.getSelection()?.toString() || '');

        // https://forvo.com/search/%E4%B8%AD%E6%96%87/zh/
        var forvo = 'https://forvo.com/search/' + sel + '/zh/';

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'forvo',
          url: forvo,
        });
      }
      break;

    case 51: // '3'
      if (keyDown.altKey) {
        let sel = encodeURIComponent(window.getSelection()?.toString() || '');

        // https://dict.cn/%E7%BF%BB%E8%AF%91
        let dictcn = 'https://dict.cn/' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'dictcn',
          url: dictcn,
        });
      }
      break;

    case 52: // '4'
      if (keyDown.altKey) {
        let sel = encodeURIComponent(window.getSelection()?.toString() || '');

        // https://www.iciba.com/%E4%B8%AD%E9%A4%90
        let iciba = 'https://www.iciba.com/' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'iciba',
          url: iciba,
        });
      }
      break;

    case 53: // '5'
      if (keyDown.altKey) {
        let sel = encodeURIComponent(window.getSelection()?.toString() || '');

        // https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=%E4%B8%AD%E6%96%87
        let mdbg = 'https://www.mdbg.net/chinese/dictionary?page=worddict&wdrst=0&wdqb=' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'mdbg',
          url: mdbg,
        });
      }
      break;

    case 54: // '6'
      if (keyDown.altKey) {
        let sel = encodeURIComponent(window.getSelection()?.toString() || '');

        let reverso = 'https://context.reverso.net/translation/chinese-english/' + sel;

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'reverso',
          url: reverso,
        });
      }
      break;

    case 55: // '7'
      if (keyDown.altKey) {
        // use the traditional character for moedict lookup
        let trad = savedSearchResults[0][1];

        // https://www.moedict.tw/~%E4%B8%AD%E6%96%87
        let moedict = 'https://www.moedict.tw/~' + encodeURIComponent(trad);

        chrome.runtime.sendMessage({
          type: 'open',
          tabType: 'moedict',
          url: moedict,
        });
      }
      break;

    default:
      return;
  }
}

function onMouseMove(mouseMove: MouseEvent): void {
  if (
    mouseMove.target instanceof HTMLElement &&
    (mouseMove.target.nodeName === 'TEXTAREA' ||
      mouseMove.target.nodeName === 'INPUT' ||
      mouseMove.target.nodeName === 'DIV')
  ) {
    let div = document.getElementById(mainDivId);

    if (mouseMove.altKey) {
      if (
        !div &&
        (mouseMove.target.nodeName === 'TEXTAREA' || mouseMove.target.nodeName === 'INPUT')
      ) {
        div = makeDiv(mouseMove.target);
        document.body.appendChild(div);
        div.scrollTop = mouseMove.target.scrollTop;
        div.scrollLeft = mouseMove.target.scrollLeft;
      }
    } else {
      if (div) {
        document.body.removeChild(div);
      }
    }
  }

  if (clientX && clientY) {
    if (mouseMove.clientX === clientX && mouseMove.clientY === clientY) {
      return;
    }
  }
  clientX = mouseMove.clientX;
  clientY = mouseMove.clientY;

  let rangeNode: Node | null = null;
  let rangeOffset = 0;

  const range = document.caretPositionFromPoint(mouseMove.clientX, mouseMove.clientY);
  if (range === null) {
    return;
  }
  rangeNode = range.offsetNode;
  rangeOffset = range.offset;

  if (mouseMove.target === savedTarget) {
    if (rangeNode === savedRangeNode && rangeOffset === savedRangeOffset) {
      return;
    }
  }

  if (timer) {
    clearTimeout(timer);
    timer = null;
  }

  if (
    rangeNode &&
    rangeNode.nodeType === Node.TEXT_NODE &&
    rangeOffset === rangeNode.textContent?.length
  ) {
    if (rangeNode.parentNode) {
      rangeNode = findNextTextNode(rangeNode.parentNode, rangeNode);
      rangeOffset = 0;
    }
  }

  if (
    !rangeNode ||
    (mouseMove.target instanceof Node && rangeNode.parentNode !== mouseMove.target)
  ) {
    rangeNode = null;
    rangeOffset = -1;
  }

  savedTarget = mouseMove.target as HTMLElement;
  savedRangeNode = rangeNode;
  savedRangeOffset = rangeOffset;

  selStartDelta = 0;
  selStartIncrement = 1;

  if (
    rangeNode &&
    rangeNode.nodeType === Node.TEXT_NODE &&
    rangeNode.textContent &&
    rangeOffset < rangeNode.textContent.length
  ) {
    popX = mouseMove.clientX;
    popY = mouseMove.clientY;
    timer = window.setTimeout(() => triggerSearch(), 50);
    return;
  }

  // Don't close just because we moved from a valid pop-up slightly over to a place with nothing.
  const dx = popX - mouseMove.clientX;
  const dy = popY - mouseMove.clientY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  if (distance > 4) {
    clearHighlight();
    hidePopup();
  }
}

function triggerSearch(): number {
  if (!savedRangeNode) {
    clearHighlight();
    hidePopup();
    return 1;
  }

  const rangeNode = savedRangeNode;
  const selStartOffset = savedRangeOffset + selStartDelta;

  selStartIncrement = 1;
  console.log('triggerSearch', { rangeNode, selStartOffset });

  if (rangeNode.nodeType !== Node.TEXT_NODE || !rangeNode.textContent) {
    clearHighlight();
    hidePopup();
    return 1;
  }

  if (selStartOffset < 0 || rangeNode.textContent.length <= selStartOffset) {
    clearHighlight();
    hidePopup();
    return 2;
  }

  // TODO: is Vietnamese character?
  // let u = rangeNode.textContent.charCodeAt(selStartOffset);
  // let isChineseCharacter =
  //   !isNaN(u) &&
  //   (u === 0x25cb ||
  //     (0x3400 <= u && u <= 0x9fff) ||
  //     (0xf900 <= u && u <= 0xfaff) ||
  //     (0xff21 <= u && u <= 0xff3a) ||
  //     (0xff41 <= u && u <= 0xff5a) ||
  //     (0xd800 <= u && u <= 0xdfff));

  // if (!isChineseCharacter) {
  //   clearHighlight();
  //   hidePopup();
  //   return 3;
  // }

  const selEndList: SelEndItem[] = [];
  const originalText = getText(rangeNode, selStartOffset, selEndList, 90 /*maxlength*/);

  // Workaround for Google Docs: remove zero-width non-joiner &zwnj;
  const text = originalText.replace(zwnj, '');
  console.log('triggerSearch', { text });

  savedSelStartOffset = selStartOffset;
  savedSelEndList = selEndList;

  chrome.runtime.sendMessage(
    {
      type: 'search',
      text: text,
      originalText: originalText,
    },
    processSearchResult,
  );

  return 0;
}

function processSearchResult(result: SearchResult | null): void {
  console.log('processSearchResult', { result });
  const selStartOffset = savedSelStartOffset;
  const selEndList = savedSelEndList;

  if (!result || !result.data?.length) {
    hidePopup();
    clearHighlight();
    return;
  }

  let index = 0;
  for (let i = 0; i < result.matchLen; i++) {
    // Google Docs workaround: determine the correct highlight length
    while (result.originalText && result.originalText[index] === '\u200c') {
      index++;
    }
    index++;
  }

  console.log('>>> highlight', { index, matchLen: result.matchLen, selEndList });
  const highlightLength = index;

  selStartIncrement = result.matchLen;
  selStartDelta = selStartOffset - savedRangeOffset;

  const rangeNode = savedRangeNode;
  // don't try to highlight form elements
  if (rangeNode && savedTarget && !('form' in savedTarget)) {
    const doc = rangeNode.ownerDocument;
    if (!doc) {
      clearHighlight();
      hidePopup();
      return;
    }
    highlightMatch(doc, rangeNode, selStartOffset, highlightLength, selEndList);
  }

  showPopup(makeHtml(result, config.tonecolors !== 'no'), savedTarget, popX, popY, false);
}

// modifies selEndList as a side-effect
function getText(
  startNode: Node,
  offset: number,
  selEndList: SelEndItem[],
  maxLength: number,
): string {
  let text = '';

  if (startNode.nodeType !== Node.TEXT_NODE || !startNode.textContent) {
    return '';
  }

  // Move offset to the beginning of the word if not already there
  const originalOffset = offset;
  if (offset > 0 && startNode.textContent) {
    // Check if we're already at the beginning of a word
    const isWordBoundary = (char: string): boolean => /\s|[.,;:!?()[\]{}'"<>]/.test(char);
    const prevChar = startNode.textContent[offset - 1];

    // If the previous character is not a word boundary, we're in the middle of a word
    if (!isWordBoundary(prevChar)) {
      // Move backward until we find a word boundary or reach the beginning of the text
      while (offset > 0) {
        const char = startNode.textContent[offset - 1];
        if (isWordBoundary(char)) {
          break;
        }
        offset--;
      }
    }
  }

  // Update the wordBoundaryOffsetDiff with the difference between original and adjusted offset
  wordBoundaryOffsetDiff = originalOffset - offset;

  const endIndex = Math.min(startNode.textContent.length, originalOffset + maxLength);
  text += startNode.textContent.substring(offset, endIndex);
  selEndList.push({
    node: startNode,
    offset: endIndex,
  });

  console.log('getText', { firstText: text, selEndList });

  let nextNode: Node | null = startNode;
  while (
    text.length < maxLength &&
    nextNode &&
    nextNode.parentNode &&
    (nextNode = findNextTextNode(nextNode.parentNode, nextNode)) !== null
  ) {
    text += getTextFromSingleNode(nextNode, selEndList, maxLength - text.length);
  }

  return text;
}

// modifies selEndList as a side-effect
function getTextFromSingleNode(node: Node, selEndList: SelEndItem[], maxLength: number): string {
  let endIndex;

  if (node.nodeName === '#text' && node.textContent) {
    endIndex = Math.min(maxLength, node.textContent.length);
    selEndList.push({
      node: node,
      offset: endIndex,
    });
    return node.textContent.substring(0, endIndex);
  } else {
    return '';
  }
}

function showPopup(
  html: string,
  elem: HTMLElement | null = null,
  x: number = 0,
  y: number = 0,
  looseWidth: boolean = false,
): void {
  if (!x || !y) {
    x = y = 0;
  }

  let popup = document.getElementById(tiengvietWindowId);

  if (!popup) {
    popup = document.createElement('div');
    popup.setAttribute('id', tiengvietWindowId);
    document.documentElement.appendChild(popup);
  }

  popup.style.width = 'auto';
  popup.style.height = 'auto';
  popup.style.maxWidth = looseWidth ? '' : '600px';
  popup.className = `background-${config.css} tonecolor-${config.toneColorScheme}`;

  $(popup).html(html);

  if (elem) {
    popup.style.top = '-1000px';
    popup.style.left = '0px';
    popup.style.display = '';

    let pW = popup.offsetWidth;
    let pH = popup.offsetHeight;

    if (pW <= 0) {
      pW = 200;
    }
    if (pH <= 0) {
      pH = 0;
      let j = 0;
      while ((j = html.indexOf('<br/>', j)) !== -1) {
        j += 5;
        pH += 22;
      }
      pH += 25;
    }

    if (altView === 1) {
      x = window.scrollX;
      y = window.scrollY;
    } else if (altView === 2) {
      x = window.innerWidth - (pW + 20) + window.scrollX;
      y = window.innerHeight - (pH + 20) + window.scrollY;
    } else if (elem instanceof HTMLOptionElement) {
      x = 0;
      y = 0;

      let p: HTMLElement | null = elem;
      while (p) {
        x += p.offsetLeft;
        y += p.offsetTop;
        p = p.offsetParent as HTMLElement;
      }

      if (elem.offsetTop > (elem.parentNode as HTMLElement).clientHeight) {
        y -= elem.offsetTop;
      }

      if (x + popup.offsetWidth > window.innerWidth) {
        // too much to the right, go left
        x -= popup.offsetWidth + 5;
        if (x < 0) {
          x = 0;
        }
      } else {
        // use SELECT's width
        x += (elem.parentNode as HTMLElement).offsetWidth + 5;
      }
    } else {
      // go left if necessary
      if (x + pW > window.innerWidth - 20) {
        x = window.innerWidth - pW - 20;
        if (x < 0) {
          x = 0;
        }
      }

      // below the mouse
      let v = 25;

      // go up if necessary
      if (y + v + pH > window.innerHeight) {
        let t = y - pH - 30;
        if (t >= 0) {
          y = t;
        }
      } else {
        y += v;
      }

      x += window.scrollX;
      y += window.scrollY;
    }
  } else {
    x += window.scrollX;
    y += window.scrollY;
  }

  // (-1, -1) indicates: leave position unchanged
  if (x !== -1 && y !== -1) {
    popup.style.left = x + 'px';
    popup.style.top = y + 'px';
    popup.style.display = '';
  }
}

function hidePopup(): void {
  const popup = document.getElementById(tiengvietWindowId);
  if (popup) {
    popup.style.display = 'none';
    popup.textContent = '';
  }
}

function highlightMatch(
  doc: Document,
  rangeStartNode: Node,
  rangeStartOffset: number,
  matchLen: number,
  selEndList: SelEndItem[],
): void {
  if (!selEndList || selEndList.length === 0) {
    return;
  }

  // Apply the same offset adjustment that was used in getText
  // This ensures we highlight the same text that was searched
  const adjustedRangeStartOffset = rangeStartOffset - wordBoundaryOffsetDiff;

  let selEnd;
  let offset = adjustedRangeStartOffset + matchLen;

  console.log('highlightMatch', { adjustedRangeStartOffset, offset });

  for (let i = 0, len = selEndList.length; i < len; i++) {
    selEnd = selEndList[i];
    if (offset <= selEnd.offset) {
      break;
    }
    offset -= selEnd.offset;
  }
  console.log('highlightMatch after', { offset });

  const range = doc.createRange();
  range.setStart(rangeStartNode, adjustedRangeStartOffset);
  range.setEnd(selEnd.node, offset);

  const sel = window.getSelection();
  if (sel && !sel.isCollapsed && selText !== sel.toString()) {
    return;
  }
  sel?.empty();
  sel?.addRange(range);
  selText = sel?.toString() || null;
}

function clearHighlight(): void {
  if (selText === null) {
    return;
  }

  const selection = window.getSelection();
  if (selection && (selection.isCollapsed || selText === selection.toString())) {
    selection.empty();
  }
  selText = null;
}

function isVisible(): boolean {
  const popup = document.getElementById(tiengvietWindowId);
  return popup !== null && popup.style.display !== 'none';
}

function getTextForClipboard(): string {
  let result = '';
  for (let i = 0; i < savedSearchResults.length; i++) {
    result += savedSearchResults[i].slice(0, -1).join('\t');
    result += '\n';
  }
  return result;
}

function makeDiv(input: HTMLElement): HTMLDivElement {
  const div = document.createElement('div');

  div.id = mainDivId;

  let text;
  if ('value' in input && typeof input.value === 'string') {
    text = input.value;
  } else {
    text = '';
  }
  div.innerText = text;

  div.style.cssText = window.getComputedStyle(input, '').cssText;
  div.scrollTop = input.scrollTop;
  div.scrollLeft = input.scrollLeft;
  div.style.position = 'absolute';
  div.style.zIndex = '7000';
  $(div).offset({
    top: $(input).offset().top,
    left: $(input).offset().left,
  });

  return div;
}

function findNextTextNode(root: Node | null, previous: Node): Node | null {
  if (root === null) {
    return null;
  }
  const nodeIterator = document.createNodeIterator(root, NodeFilter.SHOW_TEXT, null);
  let node = nodeIterator.nextNode();
  console.log('findNextTextNode', { root, previous, node });
  while (node !== previous) {
    node = nodeIterator.nextNode();
    if (node === null) {
      return findNextTextNode(root.parentNode, previous);
    }
  }
  const result = nodeIterator.nextNode();
  console.log('findNextTextNode result', { result });
  if (result !== null) {
    return result;
  } else {
    return findNextTextNode(root.parentNode, previous);
  }
}

function findPreviousTextNode(root: Node | null, previous: Node): Node | null {
  if (root === null) {
    return null;
  }
  const nodeIterator = document.createNodeIterator(root, NodeFilter.SHOW_TEXT, null);
  let node = nodeIterator.nextNode();
  while (node !== previous) {
    node = nodeIterator.nextNode();
    if (node === null) {
      return findPreviousTextNode(root.parentNode, previous);
    }
  }
  nodeIterator.previousNode();
  const result = nodeIterator.previousNode();
  if (result !== null) {
    return result;
  } else {
    return findPreviousTextNode(root.parentNode!, previous);
  }
}

function copyToClipboard(data: string): void {
  chrome.runtime.sendMessage({
    type: 'copy',
    data: data,
  });

  showPopup('Copied to clipboard', null, -1, -1);
}

function makeHtml(result: SearchResult, showToneColors: boolean = true): string {
  let html = '';
  const texts: Array<Array<string>> & {
    grammar?: { keyword: string; index: number };
    vocab?: { keyword: string; index: number };
  } = [];
  let hanziClass;

  if (result === null) {
    return '';
  }

  for (const dataEntry of result.data) {
    const vietnamese = dataEntry.at(1);
    const [, ...translations] = dataEntry.at(0).split(' : ');
    const translation = translations.join(' : ');

    hanziClass = 'w-hanzi';
    if (config.fontSize === 'small') {
      hanziClass += '-small';
    }
    html += '<span class="' + hanziClass + '">' + tonify(vietnamese) + '</span>&nbsp;';

    let defClass = 'w-def';
    if (config.fontSize === 'small') {
      defClass += '-small';
    }
    html += '<br><span class="' + defClass + '">' + translation + '</span><br>';
  }
  if (result.more) {
    html += '&hellip;<br/>';
  }

  savedSearchResults = texts;
  savedSearchResults.grammar = result.grammar;
  savedSearchResults.vocab = result.vocab;

  return html;
}

function tonify(text: string): string {
  if (!text) {
    return '';
  }

  let pinyinClass = 'w-pinyin';
  if (config.fontSize === 'small') {
    pinyinClass += '-small';
  }

  let result = '';
  for (const word of text.split(' ')) {
    const tone = detectVietnameseTone(word);
    result += `<span class="${pinyinClass} ${tone}">${word}</span> `;
  }

  return result;
}

/**
 * Detect the Vietnamese tone from a given word.
 *
 * @param word - Vietnamese word to check.
 * @returns - A string indicating the tone type: 'sắc', 'huyền', 'hỏi', 'ngã', 'nặng', or 'ngang'.
 */
function detectVietnameseTone(word: string): string {
  // Normalize the word to decompose characters (NFD form).
  const normalized = word.normalize('NFD');
  // These are the Unicode codes for the tone marks.
  // const toneMap: { [key: string]: string } = {
  //   '\u0301': 'sắc', // Combining Acute Accent
  //   '\u0300': 'huyền', // Combining Grave Accent
  //   '\u0309': 'hỏi', // Combining Hook Above
  //   '\u0303': 'ngã', // Combining Tilde
  //   '\u0323': 'nặng', // Combining Dot Below
  // };

  const toneMap: { [key: string]: string } = {
    '\u0301': 'tone1', // Combining Acute Accent
    '\u0300': 'tone2', // Combining Grave Accent
    '\u0309': 'tone3', // Combining Hook Above
    '\u0303': 'tone4', // Combining Tilde
    '\u0323': 'tone5', // Combining Dot Below
  };

  // Iterate through each character in the normalized string.
  for (const char of normalized) {
    if (toneMap[char]) {
      return toneMap[char];
    }
  }

  // If no tone mark is found, return level tone.
  // return 'ngang';
  return 'tone6';
}

const miniHelp = `
    <span style="font-weight: bold;">Tiengviet Vietnamese-English Dictionary</span><br><br>
    <p>Keyboard shortcuts:<p>
    <table style="margin: 10px;" cellspacing=5 cellpadding=5>
    <tr><td><b>n&nbsp;:</b></td><td>&nbsp;Next word</td></tr>
    <tr><td><b>b&nbsp;:</b></td><td>&nbsp;Previous character</td></tr>
    <tr><td><b>m&nbsp;:</b></td><td>&nbsp;Next character</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>a&nbsp;:</b></td><td>&nbsp;Alternate pop-up location</td></tr>
    <tr><td><b>y&nbsp;:</b></td><td>&nbsp;Move pop-up location down</td></tr>
    <tr><td><b>x&nbsp;:</b></td><td>&nbsp;Move pop-up location up</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>c&nbsp;:</b></td><td>&nbsp;Copy translation to clipboard</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>r&nbsp;:</b></td><td>&nbsp;Remember word by adding it to the built-in word list</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>Alt w&nbsp;:</b></td><td>&nbsp;Show the built-in word list in a new tab</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>s&nbsp;:</b></td><td>&nbsp;Add word to Skritter queue</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    </table>
    Look up selected text in online resources:
    <table style="margin: 10px;" cellspacing=5 cellpadding=5>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>Alt + 1 :</b></td><td>&nbsp;LINE Dict</td></tr>
    <tr><td><b>Alt + 2 :</b></td><td>&nbsp;Forvo</td></tr>
    <tr><td><b>Alt + 3 :</b></td><td>&nbsp;Dict.cn</td></tr>
    <tr><td><b>Alt + 4&nbsp;:</b></td><td>&nbsp;iCIBA</td></tr>
    <tr><td><b>Alt + 5&nbsp;:</b></td><td>&nbsp;MDBG</td></tr>
    <tr><td><b>Alt + 6&nbsp;:</b></td><td>&nbsp;Reverso</td></tr>
    <tr><td><b>Alt + 7&nbsp;:</b></td><td>&nbsp;MoE Dict</td></tr>
    <tr><td><b>&nbsp;</b></td><td>&nbsp;</td></tr>
    <tr><td><b>t&nbsp;:</b></td><td>&nbsp;Tatoeba</td></tr>
    </table>`;

// event listener
chrome.runtime.onMessage.addListener((request) => {
  console.log('onMessage', request);
  switch (request.type) {
    case 'enable':
      enableTab();
      config = request.config;
      break;
    case 'disable':
      disableTab();
      break;
    // case 'showPopup':
    //   if (!request.isHelp || window === window.top) {
    //     showPopup(request.text);
    //   }
    //   break;
    // case 'showHelp':
    //   showPopup(miniHelp);
    //   break;
    default:
  }
});
