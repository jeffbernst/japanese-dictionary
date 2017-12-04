// TO DO LIST
// sections flash on page reload
// sometimes kanji aren't displayed in order
// i think i need to get the info from the api call and then push it into an array in the proper order,
// then cycle through the array in order when i display
// everything showing up at different times
// clean up code!
// add color for romaji
// add behavior for when word isn't found
// maybe move alphabet descriptions to being a subtitle of their respective section
// so start with romaji section up top, and the english word above that just below search bar
// or maybe up top show "englishWord / romaji / japaneseWord" with romaji and jp highlighted
// can offer up different info depending on what's displayed, for example a word with kanji and hiragana
// could bring up info about how kanji only replaces some of the hiragana

// doesn't properly convert ha in konnichiwa
// won't return anything for japanese

// use promise to display things at right time:
// https://css-tricks.com/multiple-simultaneous-ajax-requests-one-callback-jquery/
// http://jsfiddle.net/EN8nc/164/

let convert = require('xml-js');
let hepburn = require('hepburn');

let japaneseWord = '';
let englishWord = '';

const FADE_TIME = 600;

// i can't get an init function to work for some reason!

function watchSubmit() {
  $('.js-search-form').submit(event => {
    event.preventDefault();
    hideStuff();
    clearVariables();
    englishWord = $(this)
      .find('.js-query')
      .val();
    getWordFromApi(englishWord, displayWordSearchData);
    $(this)
      .find('.js-query')
      .val('');
  });
}

function hideStuff() {
  $('.word').hide();
  $('.kanji').hide();
  $('.hirakana').hide();
  $('.katakana').hide();
}

function clearVariables() {
  $('.js-word').html('');
  $('.js-kanji').html('');
  $('.js-hirakana').html('');
  $('.js-katakana').html('');
}

function getWordFromApi(searchTerm, callback) {
  const query = {
    url: 'https://glosbe.com/gapi/translate',
    dataType: 'jsonp',
    success: callback,
    data: {
      from: 'eng',
      dest: 'jpn',
      format: 'json',
      phrase: searchTerm,
      pretty: 'true'
    }
  };
  $.ajax(query);
}

function displayWordSearchData(data) {
  japaneseWord = data.tuc[0].phrase.text;
  getWordReadingFromApi(japaneseWord, displayWordReadingData);
  highlightCharacters();
}

function getWordReadingFromApi(searchTerm, callback) {
  const query = {
    url:
      'https://jeff-cors-anywhere-nzumhvclct.now.sh/https://jlp.yahooapis.jp/FuriganaService/V1/furigana',
    dataType: 'text',
    success: callback,
    data: {
      appid: 'dj00aiZpPXBFWnZSUGdRTFZJeSZzPWNvbnN1bWVyc2VjcmV0Jng9OWI-',
      sentence: searchTerm
    }
  };
  $.ajax(query);
}

function displayWordReadingData(data) {
  let result = convert.xml2js(data, { compact: true, ignoreDeclaration: true });
  let wordRomajiArray = result.ResultSet.Result.WordList.Word;
  let wordRomaji = '';
  if (Array.isArray(wordRomajiArray)) {
    wordRomaji = wordRomajiArray.reduce((accumulator, currentValue) => {
      return accumulator.Roman._text + currentValue.Roman._text;
    });
  } else {
    wordRomaji = wordRomajiArray.Roman._text;
  }
  let cleanedWordRomaji = hepburn.cleanRomaji(wordRomaji).toLowerCase();
  $('.js-romaji').text(cleanedWordRomaji);
  $('.word').fadeIn(FADE_TIME);
}

function highlightCharacters() {
  let charArray = japaneseWord.split('');
  let charLabelArray = charArray.map(char => {
    if (
      (char >= '\u4e00' && char <= '\u9faf') ||
      (char >= '\u3400' && char <= '\u4dbf')
    ) {
      return 'kanji';
    } else if (char >= '\u3040' && char <= '\u309f') {
      return 'hiragana';
    } else if (char >= '\u30a0' && char <= '\u30ff') {
      return ' katakana';
    } else {
      return false;
    }
  });
  let wordWithMarkup = charLabelArray
    .map((label, index) => {
      return `<span class='${label}-color'>${charArray[index]}</span>`;
    })
    .join('');
  $('.js-word').html(wordWithMarkup);
  $('.js-word-english').html(englishWord);
  requestKanjiData(charArray, charLabelArray);
}

function requestKanjiData(charArray, charLabelArray) {
  let kanjiArray = [];
  charArray.forEach((char, index) => {
    if (charLabelArray[index] === 'kanji') kanjiArray.push(char);
  });
  if (kanjiArray.length !== 0) {
    kanjiArray.forEach(char =>
      getKanjiInfoFromApi(char, displayKanjiSearchData)
    );
  }
}

// let hiraganaArray = [];
// let katakanaArray = [];
// else if (charLabelArray[index] === 'hiragana') hiraganaArray.push(char);
// else if (charLabelArray[index] === 'katakana') katakanaArray.push(char);

function getKanjiInfoFromApi(searchTerm, callback) {
  const query = {
    headers: {
      'X-Mashape-Key': 'KCKQ5WNODBmshLeydUQgzK645yIOp1a4IPpjsnOsnNPVb3ini0'
    },
    url: 'https://kanjialive-api.p.mashape.com/api/public/kanji/' + searchTerm,
    dataType: 'json',
    complete: callback
  };
  $.ajax(query);
}

function displayKanjiSearchData(data) {
  let kanjiData = JSON.parse(data.responseText);
  let kanjiChar = kanjiData.kanji.character;
  let kanjiVid = kanjiData.kanji.video.mp4;
  let kanjiVidPoster = kanjiData.kanji.video.poster;
  let kanjiMeaning = kanjiData.kanji.meaning.english;
  let $kanjiDiv = $(`
    <div>${kanjiChar}</div>
    <div>${kanjiMeaning}</div>
    <video width="320" height="240" controls poster="${kanjiVidPoster}">
    <source src="${kanjiVid}" type="video/mp4">
    Your browser does not support the video tag.</video>`);
  $('.kanji').fadeIn(FADE_TIME);
  $kanjiDiv
    .hide()
    .appendTo('.js-kanji')
    .fadeIn(FADE_TIME);
}

function displayHiraganaInfo(hiraganaArray) {}

$(watchSubmit);
