/*
Tiengviet Vietnamese-English Dictionary as a fork of Zhongwen

---

 Originally based on  - A Chinese-English Pop-Up Dictionary
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

/**
 * Dictionary entry interface
 */
interface IDictionaryEntry {
  data: Array<[string, string]>;
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

type MessageRequest = SearchRequest | OpenRequest | CopyRequest | AddRequest;

let tiengvietDict: TiengvietDictionary;

// let isEnabled = localStorage['enabled'] === '1';
// let isEnabled = false;
// chrome.storage.local.get('enabled', (data) => {
//   isEnabled = data.enabled === '1';
// });

// let isActivated = false;

// let tabIDs: TabIDs = {};

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

function sendTabMessage(tabId: number): void {
  const localStorage = {} as Record<string, string>;
  const tiengvietOptions = {
    css: localStorage['popupcolor'] || 'yellow',
    tonecolors: localStorage['tonecolors'] || 'yes',
    fontSize: localStorage['fontSize'] || 'small',
    skritterTLD: localStorage['skritterTLD'] || 'com',
    zhuyin: localStorage['zhuyin'] || 'no',
    grammar: localStorage['grammar'] || 'yes',
    vocab: localStorage['vocab'] || 'yes',
    simpTrad: localStorage['simpTrad'] || 'classic',
    toneColorScheme: localStorage['toneColorScheme'] || 'standard',
  };

  chrome.tabs.sendMessage(tabId, {
    type: 'enable',
    config: tiengvietOptions,
  });
}

function activateExtension(tabId: number, showHelp: boolean): void {
  // console.log('Activating extension', { tabId, showHelp });
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
  sendTabMessage(tabId);

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

function deactivateExtension(): void {
  chrome.storage.local.set({ enabled: '0' });
  chrome.storage.local.set({ activated: '0' });

  tiengvietDict = undefined;

  chrome.action.setBadgeBackgroundColor({
    color: [0, 0, 0, 0],
  });

  chrome.action.setBadgeText({
    text: '',
  });

  // Send a disable message to all tabs in all windows.
  chrome.windows.getAll({ populate: true }, function (windows) {
    for (let i = 0; i < windows.length; ++i) {
      const tabs = windows[i].tabs || [];
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
      sendTabMessage(tabId);
    }
  });
}

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
  let tabID: number | undefined;

  switch (request.type) {
    case 'search':
      {
        ensureDictLoaded().then((tiengvietDict: TiengvietDictionary) => {
          const response = tiengvietDict.search((request as { text: string })?.text);
          // console.log('Search results:', { results: response });
          if (response) {
            response.originalText = request.originalText;
          }
          callback(response);
        });
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

async function ensureDictLoaded(): Promise<TiengvietDictionary> {
  if (tiengvietDict && tiengvietDict.dict) {
    return tiengvietDict;
  }

  const response = await fetch(chrome.runtime.getURL('data/vnedict.txt'));
  const text = await response.text();

  tiengvietDict = new TiengvietDictionary(text);
  return tiengvietDict;
}

class TiengvietDictionary {
  dict: Record<string, string[]>;

  constructor(text: string) {
    this.dict = this.parseDictionary(text);
  }

  private parseDictionary(text: string): Record<string, string[]> {
    const dict: Record<string, string[]> = {};
    const lines = text.split('\n');
    for (const line of lines) {
      const [originalVietnameseWord, ...values] = line.split(' : ');
      const translation = values.join(' : ');
      const [, , existingTranslation] = dict[originalVietnameseWord.toLocaleLowerCase()] || [];
      dict[originalVietnameseWord.toLocaleLowerCase()] = [
        line + `${existingTranslation ? `; ${existingTranslation}` : ''}`,
        originalVietnameseWord,
        translation,
      ];
    }
    return dict;
  }

  search(query: string): IDictionaryEntry | null {
    const entry: IDictionaryEntry = { data: [], matchLen: 0 };
    query = query.toLocaleLowerCase();

    let currentQuery = query;
    let maxLen = 0;

    while (currentQuery.length > 0) {
      const dentry = tiengvietDict.getWordEntry(currentQuery.toLocaleLowerCase());

      if (dentry) {
        if (maxLen < currentQuery.length) {
          maxLen = currentQuery.length;
        }
        entry.data.push([dentry.at(0), currentQuery]);
      }

      // console.log('Searching for:', currentQuery, { dentry });

      // Check if the rightmost character is an alphabet character
      if (currentQuery.length > 0) {
        const lastChar = currentQuery.charAt(currentQuery.length - 1);
        const isAlphabet = /\p{L}/u.test(lastChar);

        if (isAlphabet) {
          // If it's an alphabet character, remove all characters until we meet non-alphabet characters
          let i = currentQuery.length - 1;
          while (i >= 0 && /\p{L}/u.test(currentQuery.charAt(i))) {
            i--;
          }
          currentQuery = currentQuery.substring(0, i + 1);
        } else {
          // If it's not an alphabet character, remove just one character
          currentQuery = currentQuery.substring(0, currentQuery.length - 1);
        }
      }
      currentQuery = currentQuery.trimEnd();
    }

    entry.matchLen = maxLen;
    return entry;
  }

  getWordEntry(word: string): string[] | undefined {
    return this.dict[word];
  }
}
