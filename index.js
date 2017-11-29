// TO DO LIST
// figure out init function
// clear search box and enable setting up new search

let japaneseWord = '';
let englishWord = '';
let charArray = [];

// i can't get an init function to work for some reason!

function watchSubmit() {
  $('.word').hide();
  $('.kanji').hide();
  $('.kana').hide();
  $('.js-search-form').submit(event => {
    event.preventDefault();
    englishWord = $(this)
      .find('.js-query')
      .val();
    getWordFromApi(englishWord, displayWordSearchData);
  });
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
  // $('.js-word').html(`${japaneseWord} ${englishWord}`);
  highlightCharacters();
}

function highlightCharacters() {
  charArray = japaneseWord.split('');
  // let charCodeArray = charArray.map(char => char.charCodeAt(0));
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
  let charArrayWithMarkup = charLabelArray.map((label, index) => {
    return `<span class='${label}-color'>${charArray[index]}</span>`;
  });
  let wordWithMarkup = charArrayWithMarkup.join('');
  $('.js-word').html(wordWithMarkup + ' ' + englishWord);
  $('.word').fadeIn(1000);
  createKanjiArray(charArray, charLabelArray);
}

function createKanjiArray(charArray, charLabelArray) {
  let kanjiArray = [];
  charArray.forEach((char, index) => {
    if (charLabelArray[index] === 'kanji') kanjiArray.push(char);
  });
  // run each kanji through API
  kanjiArray.forEach(char => getKanjiInfoFromApi(char, displayKanjiSearchData));
  // want to make fade in wait until api calls are done
  $('.kanji').fadeIn(1000);
}

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
  let $kanjiDiv = $(`<div>${
    kanjiChar
  }</div><video width="320" height="240" controls>
  <source src="${
    kanjiVid
  }" type="video/mp4">Your browser does not support the video tag.</video>`);
  // $('.js-kanji').append($kanjiDiv);
  $kanjiDiv
    .hide()
    .appendTo('.js-kanji')
    .fadeIn(1000);
}

$(watchSubmit);
