/*
 Zhongwen - A Chinese-English Pop-Up Dictionary
 Copyright (C) 2010-2019 Christian Schiller
 https://chrome.google.com/extensions/detail/kkmlkkjojmombglmlpbpapmhcaljjkde
 */

'use strict';

// Make this file a module with an empty export
export {};

// Define interface for the background page's zhongwenOptions
interface ZhongwenOptions {
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

// Extend the chrome.extension type to include our background page
declare namespace chrome.extension {
  function getBackgroundPage(): Window & {
    zhongwenOptions: ZhongwenOptions;
  };
}

function loadVals(): void {
  const popupColor = localStorage['popupcolor'] || 'yellow';
  (
    document.querySelector(`input[name="popupColor"][value="${popupColor}"]`) as HTMLInputElement
  ).checked = true;

  const toneColors = localStorage['tonecolors'] || 'yes';
  if (toneColors === 'no') {
    (document.querySelector('#toneColorsNone') as HTMLInputElement).checked = true;
  } else {
    const toneColorScheme = localStorage['toneColorScheme'] || 'standard';
    (
      document.querySelector(
        `input[name="toneColors"][value="${toneColorScheme}"]`,
      ) as HTMLInputElement
    ).checked = true;
  }

  const fontSize = localStorage['fontSize'] || 'small';
  (
    document.querySelector(`input[name="fontSize"][value="${fontSize}"]`) as HTMLInputElement
  ).checked = true;

  const simpTrad = localStorage['simpTrad'] || 'classic';
  (
    document.querySelector(`input[name="simpTrad"][value="${simpTrad}"]`) as HTMLInputElement
  ).checked = true;

  const zhuyin = localStorage['zhuyin'] || 'no';
  (document.querySelector('#zhuyin') as HTMLInputElement).checked = zhuyin === 'yes';

  const grammar = localStorage['grammar'] || 'yes';
  (document.querySelector('#grammar') as HTMLInputElement).checked = grammar !== 'no';

  const vocab = localStorage['vocab'] || 'yes';
  (document.querySelector('#vocab') as HTMLInputElement).checked = vocab !== 'no';

  const saveToWordList = localStorage['saveToWordList'] || 'allEntries';
  (
    document.querySelector(
      `input[name="saveToWordList"][value="${saveToWordList}"]`,
    ) as HTMLInputElement
  ).checked = true;

  const skritterTLD = localStorage['skritterTLD'] || 'com';
  (
    document.querySelector(`input[name="skritterTLD"][value="${skritterTLD}"]`) as HTMLInputElement
  ).checked = true;
}

function setPopupColor(popupColor: string): void {
  localStorage['popupcolor'] = popupColor;
  chrome.extension.getBackgroundPage().zhongwenOptions.css = popupColor;
}

function setToneColorScheme(toneColorScheme: string): void {
  if (toneColorScheme === 'none') {
    setOption('tonecolors', 'no');
  } else {
    setOption('tonecolors', 'yes');
    setOption('toneColorScheme', toneColorScheme);
  }
}

function setOption(option: string, value: string): void {
  localStorage[option] = value;
  chrome.extension.getBackgroundPage().zhongwenOptions[option as keyof ZhongwenOptions] = value;
}

function setBooleanOption(option: string, value: boolean): void {
  const yesNo = value ? 'yes' : 'no';
  setOption(option, yesNo);
}

window.addEventListener('load', () => {
  document.querySelectorAll('input[name="popupColor"]').forEach((input: Element) => {
    input.addEventListener('change', () => {
      const value = input.getAttribute('value');
      if (value) {
        setPopupColor(value);
      }
    });
  });

  document.querySelectorAll('input[name="toneColors"]').forEach((input: Element) => {
    input.addEventListener('change', () => {
      const value = input.getAttribute('value');
      if (value) {
        setToneColorScheme(value);
      }
    });
  });

  document.querySelectorAll('input[name="fontSize"]').forEach((input: Element) => {
    input.addEventListener('change', () => {
      const value = input.getAttribute('value');
      if (value) {
        setOption('fontSize', value);
      }
    });
  });

  document.querySelectorAll('input[name="simpTrad"]').forEach((input: Element) => {
    input.addEventListener('change', () => {
      const value = input.getAttribute('value');
      if (value) {
        setOption('simpTrad', value);
      }
    });
  });

  (document.querySelector('#zhuyin') as HTMLInputElement).addEventListener('change', (event) => {
    setBooleanOption('zhuyin', (event.target as HTMLInputElement).checked);
  });

  (document.querySelector('#grammar') as HTMLInputElement).addEventListener('change', (event) => {
    setBooleanOption('grammar', (event.target as HTMLInputElement).checked);
  });

  (document.querySelector('#vocab') as HTMLInputElement).addEventListener('change', (event) => {
    setBooleanOption('vocab', (event.target as HTMLInputElement).checked);
  });

  document.querySelectorAll('input[name="saveToWordList"]').forEach((input: Element) => {
    input.addEventListener('change', () => {
      const value = input.getAttribute('value');
      if (value) {
        setOption('saveToWordList', value);
      }
    });
  });

  document.querySelectorAll('input[name="skritterTLD"]').forEach((input: Element) => {
    input.addEventListener('change', () => {
      const value = input.getAttribute('value');
      if (value) {
        setOption('skritterTLD', value);
      }
    });
  });
});

loadVals();
