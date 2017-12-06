// TO DO LIST
// check bug with search for 'japan' (i think it's that the kanji search returns nothing)
// about this site page?
// add auto populated link to forvo for pronunciations, this format: https://forvo.com/search/%E8%A9%A6%E9%A8%93/
// loading spinner -- maybe animated text kaomoji that says loading? -- css animations
// add sentences on front page for explanation of site
// remove bootstrap

// STYLE
// favicon
// show search bar in middle of screen before searching, then shift it up when showing results
// polka dot focus around search bar

// BUGS
// doesn't properly convert ha in konnichiwa (also apostrophe is wrong in this case i think)
// won't return anything for japanese
// remove global variables
// sometimes kanji aren't displayed in order, use promise

// use promise to display things at right time:
// https://css-tricks.com/multiple-simultaneous-ajax-requests-one-callback-jquery/
// http://jsfiddle.net/EN8nc/164/

const kuroshiro = require('kuroshiro');

const FADE_TIME = 600;

function startApp() {
  watchSubmit();
}

function watchSubmit() {
  $('.js-search-form').submit(event => {
    event.preventDefault();
    hideStuff();
    clearDivs();
    let englishWord = $(event.currentTarget)
      .find('.js-query')
      .val();
    $('.js-word-english').html(englishWord);
    getWordFromApi(englishWord, displayWordSearchData);
    $(event.currentTarget)
      .find('.js-query')
      .val('');
  });
}

function hideStuff() {
  $('.word').hide();
  $('.romaji').hide();
  $('.learn-more').hide();
  $('.kanji').hide();
  $('.hiragana').hide();
  $('.katakana').hide();
}

function clearDivs() {
  $('.js-word').html('');
  $('.js-romaji').html('');
  $('.js-kanji').html('');
  $('.js-hiragana').html('');
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

// make section for alert! right now put it in learn more
function displayWordSearchData(data) {
  if (data.tuc.length === 0) {
    $('.learn-more').text('sorry, nothing found!');
    $('.learn-more').fadeIn(FADE_TIME);
  } else {
    let japaneseWord = data.tuc[0].phrase.text;
    console.log(japaneseWord);
    // getWordReadingFromApi(japaneseWord, displayWordReadingData);
    let wordRomaji = kuroshiro.toRomaji(japaneseWord);
    $('.js-romaji').text(wordRomaji);
    fadeInContent();
    highlightCharacters();
  }
}

// function getWordReadingFromApi(searchTerm, callback) {
//   const query = {
//     url:
//       'https://jeff-cors-anywhere-nzumhvclct.now.sh/https://jlp.yahooapis.jp/FuriganaService/V1/furigana',
//     dataType: 'text',
//     success: callback,
//     data: {
//       appid: 'dj00aiZpPXBFWnZSUGdRTFZJeSZzPWNvbnN1bWVyc2VjcmV0Jng9OWI-',
//       sentence: searchTerm
//     }
//   };
//   $.ajax(query);
// }

// function displayWordReadingData(data) {
//   let result = convert.xml2js(data, { compact: true, ignoreDeclaration: true });
//   let wordReadingData = result.ResultSet.Result.WordList.Word;
//   let wordFurigana = '';
//   if (Array.isArray(wordReadingData)) {
//     wordFurigana = wordReadingData.reduce((accumulator, currentValue) => {
//       return accumulator.Furigana._text + currentValue.Furigana._text;
//     });
//   } else {
//     wordFurigana = wordReadingData.Furigana._text;
//   }
//   let wordRomaji = wanakana.toRomaji(wordFurigana);
//   $('.js-romaji').text(wordRomaji);
//   fadeInContent();
// }

function fadeInContent() {
  $('.word').fadeIn(FADE_TIME);
  $('.learn-more').fadeIn(FADE_TIME);
  if (!$('.js-romaji').is(':empty')) $('.romaji').fadeIn(FADE_TIME);
  if (!$('.js-kanji').is(':empty')) $('.kanji').fadeIn(FADE_TIME);
  if (!$('.js-hiragana').is(':empty')) $('.hiragana').fadeIn(FADE_TIME);
  if (!$('.js-katakana').is(':empty')) $('.katakana').fadeIn(FADE_TIME);
}

function highlightCharacters(japaneseWord) {
  // can eliminate some of these contains variables?
  let containsKanji = false;
  let containsHiragana = false;
  let containsKatakana = false;
  let charArray = japaneseWord.split('');
  let charLabelArray = charArray.map(char => {
    if (
      (char >= '\u4e00' && char <= '\u9faf') ||
      (char >= '\u3400' && char <= '\u4dbf')
    ) {
      containsKanji = true;
      return 'kanji';
    } else if (char >= '\u3040' && char <= '\u309f') {
      containsHiragana = true;
      return 'hiragana';
    } else if (char >= '\u30a0' && char <= '\u30ff') {
      containsKatakana = true;
      return 'katakana';
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
  requestKanjiData(charArray, charLabelArray, containsKanji);
  displayHiraganaInfo(charArray, charLabelArray, containsHiragana);
  displayKatakanaInfo(charArray, charLabelArray);
}

function requestKanjiData(charArray, charLabelArray, containsKanji) {
  let kanjiArray = [];
  // charArray.forEach((char, index) => {
  //   if (charLabelArray[index] === 'kanji') kanjiArray.push(char);
  // });
  // if (kanjiArray.length !== 0) {
  if (containsKanji) {
    charArray.forEach((char, index) => {
      if (charLabelArray[index] === 'kanji') kanjiArray.push(char);
    });
    kanjiArray.forEach(char =>
      getKanjiInfoFromApi(char, displayKanjiSearchData)
    );
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
  let kanjiVidPoster = kanjiData.kanji.video.poster;
  let kanjiMeaning = kanjiData.kanji.meaning.english;
  let kanjiStrokes = kanjiData.kanji.strokes.count;
  let kanjiGrade = kanjiData.references.grade;
  if (kanjiGrade === null) kanjiGrade = 'not listed';
  let $kanjiDiv = $(`
    <div class='row'>
      <div class='col-md-6'>
        <video width="320" height="240" controls poster="${kanjiVidPoster}">
          <source src="${kanjiVid}" type="video/mp4">
          Your browser does not support the video tag.</video>
      </div>
      <div class='col-md-6'>
        <div>Meaning: ${kanjiMeaning}</div>
        <div>Strokes: ${kanjiStrokes}</div>
        <div>Grade Level: ${kanjiGrade}</div>
      </div>
    </div>`);
  $kanjiDiv
    .hide()
    .appendTo('.js-kanji')
    .fadeIn(FADE_TIME);
}

function displayHiraganaInfo(charArray, charLabelArray, containsHiragana) {
  let hiraganaArray = [];
  charArray.forEach((char, index) => {
    if (charLabelArray[index] === 'hiragana') hiraganaArray.push(char);
  });
  if (hiraganaArray.length !== 0) {
    hiraganaArray.forEach(char =>
      $('.js-hiragana').append(`<span class='large-character'>${char}</span>`)
    );
  }
}

function displayKatakanaInfo(charArray, charLabelArray) {
  let katakanaArray = [];
  charArray.forEach((char, index) => {
    if (charLabelArray[index] === 'katakana') katakanaArray.push(char);
  });
  if (katakanaArray.length !== 0) {
    katakanaArray.forEach(char =>
      $('.js-katakana').append(`<span class='large-character'>${char}</span>`)
    );
  }
}

$(startApp);
