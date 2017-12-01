// TO DO LIST
// add reading and audio for full japanese word
// sections flash on page reload
// figure out init function
// sometimes kanji aren't displayed in order
// i think i need to get the info from the api call and then push it into an array in the proper order,
// then cycle through the array in order when i display
// links to APIs in footer

let japaneseWord = '';
let englishWord = '';
let charArray = [];

const FADE_TIME = 600;

// i can't get an init function to work for some reason!

function watchSubmit() {
  $('.js-search-form').submit(event => {
    event.preventDefault();
    // clear old search data
    hideStuff();
    $('.js-word').html('');
    $('.js-kanji').html('');
    $('.js-hirakana').html('');
    $('.js-katakana').html('');
    // find seach term
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
  $('.learn-more').hide();
  $('.word').hide();
  $('.kanji').hide();
  $('.hirakana').hide();
  $('.katakana').hide();
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
  highlightCharacters();
  getWordReadingFromApi(japaneseWord, displayWordReadingData);
}

function highlightCharacters() {
  charArray = japaneseWord.split('');
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
  $('.learn-more').fadeIn(FADE_TIME);
  $('.word').fadeIn(FADE_TIME);
  createKanjiArray(charArray, charLabelArray);
}

function createKanjiArray(charArray, charLabelArray) {
  let kanjiArray = [];
  // let hiraganaArray = [];
  // let katakanaArray = [];
  charArray.forEach((char, index) => {
    if (charLabelArray[index] === 'kanji') kanjiArray.push(char);
    // else if (charLabelArray[index] === 'hiragana') hiraganaArray.push(char);
    // else if (charLabelArray[index] === 'katakana') katakanaArray.push(char);
  });
  // run each kanji through API
  if (kanjiArray.length !== 0) {
    console.log(kanjiArray);
    kanjiArray.forEach(char =>
      getKanjiInfoFromApi(char, displayKanjiSearchData)
    );
    $('.kanji').fadeIn(FADE_TIME);
  }
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
  let kanjiMeaning = kanjiData.kanji.meaning.english;
  let $kanjiDiv = $(`
  <div>${kanjiChar}</div>
  <div>${kanjiMeaning}</div>
  <video width="320" height="240" controls>
  <source src="${kanjiVid}" type="video/mp4">
  Your browser does not support the video tag.</video>`);
  // $('.js-kanji').append($kanjiDiv);
  $kanjiDiv
    .hide()
    .appendTo('.js-kanji')
    .fadeIn(FADE_TIME);
}

function getWordReadingFromApi(searchTerm, callback) {
  const query = {
    url: 'https://jlp.yahooapis.jp/FuriganaService/V1/furigana',
    dataType: 'jsonp',
    success: callback,
    data: {
      appid: 'dj00aiZpPXBFWnZSUGdRTFZJeSZzPWNvbnN1bWVyc2VjcmV0Jng9OWI-',
      sentence: 'searchTerm'
    }
  };
  $.ajax(query);
}

function displayWordReadingData(data) {
  console.log(data);
}

function displayHiraganaInfo(hiraganaArray) {}

$(watchSubmit);

// accordian code from:
// https://www.w3schools.com/howto/tryit.asp?filename=tryhow_js_accordion_symbol

var acc = document.getElementsByClassName('accordion');
var i;

for (i = 0; i < acc.length; i++) {
  acc[i].onclick = function() {
    this.classList.toggle('active');
    var panel = this.nextElementSibling;
    if (panel.style.maxHeight) {
      panel.style.maxHeight = null;
    } else {
      panel.style.maxHeight = panel.scrollHeight + 'px';
    }
  };
}
