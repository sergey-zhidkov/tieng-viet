/*
 Zhongwen - A Chinese-English Pop-Up Dictionary
 Copyright (C) 2010-2023 Christian Schiller
 https://chrome.google.com/extensions/detail/kkmlkkjojmombglmlpbpapmhcaljjkde
 */

/**
 * Configuration options for the Zhongwen extension
 */
export interface ZhongwenOptions {
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

/**
 * Configuration for the content script
 */
export interface ZhongwenConfig {
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

/**
 * Entry in the word list
 */
export interface WordListEntry {
  id?: number;
  timestamp: number;
  simplified: string;
  traditional: string;
  pinyin: string;
  definition: string;
  notes: string;
  zhuyin?: string;
}

/**
 * Selection end item for text selection
 */
export interface SelEndItem {
  node: Node;
  offset: number;
}

/**
 * Search result from the dictionary
 */
export interface SearchResult {
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

/**
 * Dictionary entry interface
 */
export interface IDictionaryEntry {
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
}

/**
 * Tab IDs for different types of tabs
 */
export interface TabIDs {
  [key: string]: number;
}

/**
 * Message request types
 */
export interface SearchRequest {
  type: 'search';
  text: string;
  originalText: string;
}

export interface OpenRequest {
  type: 'open';
  tabType: string;
  url: string;
}

export interface CopyRequest {
  type: 'copy';
  data: string;
}

export interface AddRequest {
  type: 'add';
  entries: Array<{
    simplified: string;
    traditional: string;
    pinyin: string;
    definition: string;
  }>;
}

export type MessageRequest = SearchRequest | OpenRequest | CopyRequest | AddRequest;

/**
 * Global declarations
 */
declare global {
  interface Window {
    accentedPinyin2Zhuyin: (syllable: string) => string;
  }
}
