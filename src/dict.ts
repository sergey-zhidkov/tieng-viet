/*
 Zhongwen - A Chinese-English Pop-Up Dictionary
 Copyright (C) 2019 Christian Schiller
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

import { IDictionaryEntry } from './types';

export class ZhongwenDictionary {
  private wordDict: string;
  private wordIndex: string;
  private grammarKeywords: string;
  private vocabKeywords: string;
  private cache: Record<string, Array<string>>;

  constructor(wordDict: string, wordIndex: string, grammarKeywords: string, vocabKeywords: string) {
    this.wordDict = wordDict;
    this.wordIndex = wordIndex;
    this.grammarKeywords = grammarKeywords;
    this.vocabKeywords = vocabKeywords;
    this.cache = {};
  }

  static find(needle: string, haystack: string): string | null {
    let beg = 0;
    let end = haystack.length - 1;

    while (beg < end) {
      const mi = Math.floor((beg + end) / 2);
      const i = haystack.lastIndexOf('\n', mi) + 1;

      const mis = haystack.substr(i, needle.length);
      if (needle < mis) {
        end = i - 1;
      } else if (needle > mis) {
        beg = haystack.indexOf('\n', mi + 1) + 1;
      } else {
        return haystack.substring(i, haystack.indexOf('\n', mi + 1));
      }
    }

    return null;
  }

  hasGrammarKeyword(keyword: string): boolean {
    return false;
    // return this.grammarKeywords[keyword];
  }

  hasVocabKeyword(keyword: string): boolean {
    return false;
    // return this.vocabKeywords[keyword];
  }

  wordSearch(word: string, max?: number): IDictionaryEntry | null {
    const entry: IDictionaryEntry = { data: [], matchLen: 0 };

    const dict = this.wordDict;
    const index = this.wordIndex;

    const maxTrim = max || 7;

    let count = 0;
    let maxLen = 0;

    WHILE: while (word.length > 0) {
      let ix = this.cache[word];
      if (!ix) {
        const result = ZhongwenDictionary.find(word + ',', index);
        if (!result) {
          this.cache[word] = [];
          word = word.substr(0, word.length - 1);
          continue;
        }
        ix = result.split(',');
        this.cache[word] = ix;
      }

      for (let j = 1; j < ix.length; ++j) {
        const offset = parseInt(ix[j], 10);

        const dentry = dict.substring(offset, dict.indexOf('\n', offset));

        if (count >= maxTrim) {
          entry.more = 1;
          break WHILE;
        }

        ++count;
        if (maxLen === 0) {
          maxLen = word.length;
        }

        entry.data.push([dentry, word]);
      }

      word = word.substr(0, word.length - 1);
    }

    if (entry.data.length === 0) {
      return null;
    }

    entry.matchLen = maxLen;
    return entry;
  }
}
