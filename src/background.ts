/*
 Zhongwen - A Chinese-English Pop-Up Dictionary
 Copyright (C) 2010-2019 Christian Schiller
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

// export interface ZhongwenOptions {
//   css: string;
//   tonecolors: string;
//   fontSize: string;
//   skritterTLD: string;
//   zhuyin: string;
//   grammar: string;
//   vocab: string;
//   simpTrad: string;
//   toneColorScheme: string;
// }

// /**
//  * Configuration for the content script
//  */
// export interface ZhongwenConfig {
//   css: string;
//   tonecolors: string;
//   fontSize: string;
//   skritterTLD: string;
//   zhuyin: string;
//   grammar: string;
//   vocab: string;
//   simpTrad: string;
//   toneColorScheme: string;
// }

// /**
//  * Entry in the word list
//  */
// export interface WordListEntry {
//   id?: number;
//   timestamp: number;
//   simplified: string;
//   traditional: string;
//   pinyin: string;
//   definition: string;
//   notes: string;
//   zhuyin?: string;
// }

// /**
//  * Selection end item for text selection
//  */
// export interface SelEndItem {
//   node: Node;
//   offset: number;
// }

// /**
//  * Search result from the dictionary
//  */
// export interface SearchResult {
//   data: Array<Array<string>>;
//   matchLen: number;
//   more?: number;
//   grammar?: {
//     keyword: string;
//     index: number;
//   };
//   vocab?: {
//     keyword: string;
//     index: number;
//   };
//   originalText?: string;
// }

// /**
//  * Dictionary entry interface
//  */
// export interface IDictionaryEntry {
//   data: Array<[string, string]>;
//   matchLen: number;
//   more?: number;
//   grammar?: {
//     keyword: string;
//     index: number;
//   };
//   vocab?: {
//     keyword: string;
//     index: number;
//   };
// }

// /**
//  * Tab IDs for different types of tabs
//  */
// export interface TabIDs {
//   [key: string]: number;
// }

// /**
//  * Message request types
//  */
interface SearchRequest {
  type: 'search';
  text: string;
  originalText: string;
}

interface OpenRequest {
  type: 'open';
  tabType: string;
  url: string;
}

interface CopyRequest {
  type: 'copy';
  data: string;
}

interface AddRequest {
  type: 'add';
  entries: Array<{
    simplified: string;
    traditional: string;
    pinyin: string;
    definition: string;
  }>;
}

type MessageRequest = SearchRequest | OpenRequest | CopyRequest | AddRequest;

console.log('Zhongwen extension loaded', {});

// let isEnabled = localStorage['enabled'] === '1';
// let isEnabled = false;
// chrome.storage.local.get('enabled', (data) => {
//   isEnabled = data.enabled === '1';
// });

// let isActivated = false;

// let tabIDs: TabIDs = {};

// let dict: ZhongwenDictionary | undefined;
// const localStorage = {} as Record<string, string>;

// let zhongwenOptions: ZhongwenOptions = ((window as any).zhongwenOptions = {
//   css: localStorage['popupcolor'] || 'yellow',
//   tonecolors: localStorage['tonecolors'] || 'yes',
//   fontSize: localStorage['fontSize'] || 'small',
//   skritterTLD: localStorage['skritterTLD'] || 'com',
//   zhuyin: localStorage['zhuyin'] || 'no',
//   grammar: localStorage['grammar'] || 'yes',
//   vocab: localStorage['vocab'] || 'yes',
//   simpTrad: localStorage['simpTrad'] || 'classic',
//   toneColorScheme: localStorage['toneColorScheme'] || 'standard',
// });

function activateExtension(tabId: number, showHelp: boolean): void {
  console.log('Activating extension', { tabId, showHelp });
  chrome.storage.local.set({ enabled: '1' });
  chrome.storage.local.set({ activated: '1' });
  // isActivated = true;

  // isEnabled = true;
  // values in localStorage are always strings
  // localStorage['enabled'] = '1';
  // chrome.storage.local.set({ enabled: '1' });

  // if (!dict) {
  //   loadDictionary().then((r) => (dict = r));
  // }

  chrome.tabs.sendMessage(tabId, {
    type: 'enable',
    // config: zhongwenOptions,
    config: {},
  });

  // if (showHelp) {
  //   chrome.tabs.sendMessage(tabId, {
  //     type: 'showHelp',
  //   });
  // }

  chrome.action.setBadgeBackgroundColor({
    color: [255, 0, 0, 255],
  });

  chrome.action.setBadgeText({
    text: 'On',
  });

  // chrome.contextMenus.create({
  //   title: 'Open word list',
  //   onclick: function (): void {
  //     let url = '/wordlist.html';
  //     let tabID = tabIDs['wordlist'];
  //     if (tabID) {
  //       chrome.tabs.get(tabID, function (tab) {
  //         if (tab && tab.url && tab.url.endsWith('wordlist.html')) {
  //           chrome.tabs.update(tabID, {
  //             active: true,
  //           });
  //         } else {
  //           chrome.tabs.create(
  //             {
  //               url: url,
  //             },
  //             function (tab) {
  //               tabIDs['wordlist'] = tab.id as number;
  //             },
  //           );
  //         }
  //       });
  //     } else {
  //       chrome.tabs.create({ url: url }, function (tab) {
  //         tabIDs['wordlist'] = tab.id as number;
  //       });
  //     }
  //   },
  // });
  // chrome.contextMenus.create({
  //   title: 'Show help in new tab',
  //   onclick: function (): void {
  //     let url = '/help.html';
  //     let tabID = tabIDs['help'];
  //     if (tabID) {
  //       chrome.tabs.get(tabID, function (tab) {
  //         if (tab && tab.url && tab.url.endsWith('help.html')) {
  //           chrome.tabs.update(tabID, {
  //             active: true,
  //           });
  //         } else {
  //           chrome.tabs.create(
  //             {
  //               url: url,
  //             },
  //             function (tab) {
  //               tabIDs['help'] = tab.id as number;
  //             },
  //           );
  //         }
  //       });
  //     } else {
  //       chrome.tabs.create({ url: url }, function (tab) {
  //         tabIDs['help'] = tab.id as number;
  //       });
  //     }
  //   },
  // });
}

// async function loadDictData(): Promise<[string, string, string, string]> {
//   let wordDict = fetch(chrome.runtime.getURL('data/vnedict.txt')).then((r) => r.text());
//   console.log({ wordDict });
//   const wordIndex = Promise.resolve(''); // fetch(chrome.runtime.getURL('data/cedict.idx')).then((r) => r.text());
//   let grammarKeywords = Promise.resolve(''); //fetch(chrome.runtime.getURL('data/grammarKeywordsMin.json')).then((r) => r.json(),);
//   let vocabKeywords = Promise.resolve(''); // fetch(chrome.runtime.getURL('data/vocabularyKeywordsMin.json')).then((r) =>r.json(),);

//   return Promise.all([wordDict, wordIndex, grammarKeywords, vocabKeywords]);
// }

// async function loadDictionary(): Promise<ZhongwenDictionary> {
//   let [wordDict, wordIndex, grammarKeywords, vocabKeywords] = await loadDictData();
//   return new ZhongwenDictionary(wordDict, wordIndex, grammarKeywords, vocabKeywords);
// }

function deactivateExtension(): void {
  // isActivated = false;

  // isEnabled = false;
  // values in localStorage are always strings
  // localStorage['enabled'] = '0';
  chrome.storage.local.set({ enabled: '0' });
  chrome.storage.local.set({ activated: '0' });

  // dict = undefined;

  chrome.action.setBadgeBackgroundColor({
    color: [0, 0, 0, 0],
  });

  chrome.action.setBadgeText({
    text: '',
  });

  // Send a disable message to all tabs in all windows.
  chrome.windows.getAll({ populate: true }, function (windows) {
    for (let i = 0; i < windows.length; ++i) {
      let tabs = windows[i].tabs || [];
      for (let j = 0; j < tabs.length; ++j) {
        if (tabs[j].id) {
          chrome.tabs.sendMessage(tabs[j].id, {
            type: 'disable',
          });
        }
      }
    }
  });

  chrome.contextMenus.removeAll();
}

function activateExtensionToggle(currentTab: chrome.tabs.Tab): void {
  chrome.storage.local.get('activated', (result) => {
    console.log('Enabled?', result.activated, { currentTab });
    const isActivated = result.activated === '1';

    if (isActivated) {
      deactivateExtension();
    } else {
      if (currentTab.id) {
        activateExtension(currentTab.id, true);
      }
    }
  });
}

function enableTabAndSendMessage(tabId: number): void {
  chrome.storage.local.get(['enabled', 'activated'], (result) => {
    const isActivated = result.activated === '1';
    const isEnabled = result.enabled === '1';

    if (isEnabled) {
      if (!isActivated) {
        activateExtension(tabId, false);
      }

      chrome.tabs.sendMessage(tabId, {
        type: 'enable',
        // config: zhongwenOptions,
        config: {},
      });
    }
  });
}

// function search(text: string): any {
//   if (!dict) {
//     // dictionary not loaded
//     return;
//   }

//   let entry = dict.wordSearch(text);

//   if (entry) {
//     for (let i = 0; i < entry.data.length; i++) {
//       let word = entry.data[i][1];
//       if (dict.hasGrammarKeyword(word) && entry.matchLen === word.length) {
//         // the final index should be the last one with the maximum length
//         entry.grammar = { keyword: word, index: i };
//       }
//       if (dict.hasVocabKeyword(word) && entry.matchLen === word.length) {
//         // the final index should be the last one with the maximum length
//         entry.vocab = { keyword: word, index: i };
//       }
//     }
//   }

//   return entry;
// }

chrome.action.onClicked.addListener(activateExtensionToggle);

chrome.tabs.onActivated.addListener((activeInfo) => {
  if (activeInfo.tabId !== undefined) {
    const tabId: number = activeInfo.tabId;
    // if (tabId === tabIDs['wordlist']) {
    //   chrome.tabs.reload(tabId);
    // } else if (tabId !== tabIDs['help']) {
    enableTabAndSendMessage(tabId);
    // }
  }
});

chrome.tabs.onUpdated.addListener(function (tabId, changeInfo) {
  if (
    changeInfo.status === 'complete'
    // &&
    // tabId !== tabIDs['help'] &&
    // tabId !== tabIDs['wordlist']
  ) {
    enableTabAndSendMessage(tabId);
  }
});

// function createTab(url: string, tabType: string): void {
//   chrome.tabs.create({ url }, (tab) => {
//     if (tab.id) {
//       tabIDs[tabType] = tab.id;
//     }
//   });
// }

chrome.runtime.onMessage.addListener((request: MessageRequest, sender, callback) => {
  console.log('Received message:', { request, sender });
  callback({ resp: 'ping' });
  let tabID: number | undefined;

  ensureDictLoaded().then((dictText) => {
    console.log('Search results:', { dictText });
    const results = searchDictionary(dictText as string, (request as { text: string })?.text);
    callback({ results });
  });

  switch (request.type) {
    case 'search':
      {
        // let response = search(request.text);
        // if (response) {
        //   response.originalText = request.originalText;
        // }
        // callback(response);
      }
      break;

    case 'open':
      {
        // tabID = tabIDs[request.tabType];
        // if (tabID) {
        //   chrome.tabs.get(tabID, () => {
        //     if (!chrome.runtime.lastError) {
        //       // activate existing tab
        //       chrome.tabs.update(tabID as number, { active: true, url: request.url });
        //     } else {
        //       createTab(request.url, request.tabType);
        //     }
        //   });
        // } else {
        //   createTab(request.url, request.tabType);
        // }
      }
      break;

    case 'copy':
      {
        // TODO: move to content script
        // let txt = document.createElement('textarea');
        // txt.style.position = 'absolute';
        // txt.style.left = '-100%';
        // txt.value = request.data;
        // document.body.appendChild(txt);
        // txt.select();
        // document.execCommand('copy');
        // document.body.removeChild(txt);
      }
      break;

    case 'add':
      {
        // TODO: update localStorage use
        // let json = localStorage['wordlist'];
        // let saveFirstEntryOnly = localStorage['saveToWordList'] === 'firstEntryOnly';
        // let wordlist: WordlistEntry[];
        // if (json) {
        //   wordlist = JSON.parse(json);
        // } else {
        //   wordlist = [];
        // }
        // for (let i in request.entries) {
        //   let entry: WordlistEntry = {
        //     timestamp: Date.now(),
        //     simplified: request.entries[i].simplified,
        //     traditional: request.entries[i].traditional,
        //     pinyin: request.entries[i].pinyin,
        //     definition: request.entries[i].definition,
        //   };
        //   wordlist.push(entry);
        //   if (saveFirstEntryOnly) {
        //     break;
        //   }
        // }
        // localStorage['wordlist'] = JSON.stringify(wordlist);
        // tabID = tabIDs['wordlist'];
      }
      break;
  }

  // Return true to indicate we want to use sendResponse asynchronously
  return true;
});

// chrome.runtime.onInstalled.addListener(() => {
//   console.log('Extension installed');
// });

// 2. Extension icon clicked
// chrome.action.onClicked.addListener((tab) => {
//   console.log('Extension icon clicked');
// });

// chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
//   if (changeInfo.status === 'complete') {
//     console.log('Tab finished loading:', tab.url);
//   }
// });

// chrome.alarms.onAlarm.addListener((alarm) => {
//   console.log('Alarm triggered:', alarm.name);
// });

// chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
//   sendResponse({ pong: true });
// });

let db: IDBDatabase;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('ZhongwenDB', 1);

    request.onupgradeneeded = (event) => {
      db = request.result;
      db.createObjectStore('dictionary');
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

function saveToIndexedDB(text: string) {
  return openDatabase().then((db) => {
    const tx = db.transaction('dictionary', 'readwrite');
    const store = tx.objectStore('dictionary');
    store.put(text, 'dict');
    // return tx.complete;
  });
}

function getFromIndexedDB() {
  return openDatabase().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('dictionary', 'readonly');
      const store = tx.objectStore('dictionary');
      const request = store.get('dict');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  });
}

async function ensureDictLoaded() {
  const existing = await getFromIndexedDB();
  if (existing) return existing;

  const response = await fetch(chrome.runtime.getURL('data/vnedict.txt'));
  const text = await response.text();
  await saveToIndexedDB(text);
  return text;
}

function searchDictionary(dictText: string, query: string) {
  const lines: string[] = dictText.split('\n');
  return lines.filter((line) => line.includes(query)).slice(0, 10); // example: return top 10 matches
}
