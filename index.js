const wanakana = require('wanakana');

const FADE_TIME = 600;

function startApp() {
  watchSubmit();
  watchToggle();
}

function watchSubmit() {
  $('.js-search-form').submit(event => {
    event.preventDefault();
    $('.loading-animation').show();
    $('.results').hide();
    $('.js-results').html('');
    let searchTerm = $(event.currentTarget)
      .find('.js-query')
      .val();
    let toggle = $('.js-toggle-button').text();
    if (toggle === 'E \u2192 J') searchTerm = `"${searchTerm}"`;
    getWordFromApi(searchTerm, processDataFromWordApi);
    // highlight word instead of clearing it on search?
    $(event.currentTarget)
      .find('.js-query')
      .val('');
  });
}

function watchToggle() {
  $('.js-toggle-button').click(event => {
    $(event.currentTarget).text((index, text) => {
      return text === 'E \u2192 J' ? 'J \u2192 E' : 'E \u2192 J';
    });
  });
}

function getWordFromApi(searchTerm, callback) {
  const query = {
    url:
      'https://jeff-cors-anywhere-nzumhvclct.now.sh/http://beta.jisho.org/api/v1/search/words',
    success: callback,
    data: {
      keyword: searchTerm
    }
  };
  $.ajax(query);
}

function processDataFromWordApi(data) {
  processWordData(data.data);
}

function processWordData(wordArray) {
  let currentWordArray = wordArray;
  let wordsToDisplay = [];
  if (wordArray.length <= 5) {
    wordsToDisplay = currentWordArray;
    processKanjiApiCall(wordsToDisplay);
  } else {
    wordsToDisplay = currentWordArray.splice(0, 5);
    processKanjiApiCall(wordsToDisplay);
    // execute listener to load more results on scroll down
    // actually i only want to activate this one time
    // pageScrollListener(currentWordArray)
  }
}

function processKanjiApiCall(wordsToDisplay) {
  let kanjiArray = wordsToDisplay.map((word, index) => {
    return identifyKanji(word);
  });
  let kanjiPromiseArray = kanjiArray.map(kanjiInWord => {
    return Promise.all(kanjiInWord.map(kanji => getKanjiInfoFromApi(kanji)));
  });
  Promise.all(kanjiPromiseArray).then(args => {
    let kanjiDataFromApi = args;
    let kanjiGroupStringArray = kanjiDataFromApi.map(
      (kanjiInWord, wordIndex) => {
        return kanjiInWord.reduce((accumulator, kanjiData, kanjiIndex) => {
          if (typeof kanjiData === 'undefined') {
            return accumulator + '';
          } else if ('error' in kanjiData) {
            return (
              accumulator +
              `<div class='no-kanji-message'>Sorry! The kanji ${
                kanjiArray[wordIndex][kanjiIndex]
              } isn't in our database.</div>`
            );
          } else {
            return accumulator + processKanjiData(kanjiData);
          }
        }, '');
      }
    );
    displayWordData(wordsToDisplay, kanjiGroupStringArray);
  });
}

function processKanjiData(data) {
  let kanjiData = data;
  // let kanjiData = JSON.parse(data.responseText);
  // if (typeof kanjiData.kanji === 'undefined') return '';
  let kanjiChar = kanjiData.kanji.character;
  let kanjiVid = kanjiData.kanji.video.mp4;
  let kanjiVidPoster = kanjiData.kanji.video.poster;
  let kanjiMeaning = kanjiData.kanji.meaning.english;
  let kanjiStrokes = kanjiData.kanji.strokes.count;
  let kanjiGrade = kanjiData.references.grade;
  if (kanjiGrade === null) kanjiGrade = 'not listed';
  let kanjiGroup = `
      <div class="kanji-group">
        <div class="kanji-col-left">
          <div class="kanji-result">
            <video width="320" height="240" controls poster="${kanjiVidPoster}">
              <source src="${kanjiVid}" type="video/mp4">
              Your browser does not support the video tag.</video>
          </div>
        </div>
        <div class="kanji-col-right">
          ${kanjiMeaning}<br>
          <span class='kanji-info-label'>(${kanjiStrokes} strokes)</span>
        </div>
      </div>
    `;
  return kanjiGroup;
}

function identifyKanji(word) {
  // if word data doesn't have 'word' field then word contains no kanji
  if (typeof word.japanese[0].word === 'undefined') return [''];
  let wordCharacters = word.japanese[0].word.split('');
  let kanjiInWord = wordCharacters.filter((char, index) => {
    return (
      (char >= '\u4e00' && char <= '\u9faf') ||
      (char >= '\u3400' && char <= '\u4dbf')
    );
  });
  return kanjiInWord;
}

// //remove this
// function addKanjiLocation(kanjiArray) {
//   let kanjiArrayWithLocation = [];
//   let kanjiCounter = 0;
//   kanjiArray.forEach((kanjiInWord, wordIndex) => {
//     kanjiInWord.forEach((kanji, kanjiIndex) => {
//       kanjiArrayWithLocation[kanjiCounter] = {
//         kanji: kanji,
//         location: [wordIndex, kanjiIndex]
//       };
//       kanjiCounter++;
//     });
//   });
//   return kanjiArrayWithLocation;
// }

function displayWordData(wordArray, kanjiGroupStringArray) {
  $('.loading-animation').hide();
  $('.results').fadeIn(FADE_TIME);
  let wordAndKanjiData = wordArray.map((wordData, index) => {
    return {
      word: wordData,
      kanji: kanjiGroupStringArray[index]
    };
  });
  wordAndKanjiData.forEach((group, index) => {
    let japaneseWord = group.word.japanese[0].word;
    let wordReading = group.word.japanese[0].reading;
    let wordRomaji = wanakana.toRomaji(wordReading);
    let kanjiSection = group.kanji;
    let wordDefinitions = group.word.senses.map((definition, index) => {
      return definition.english_definitions.join(', ');
    });
    let wordResultSection = '';
    if (typeof japaneseWord === 'undefined') {
      wordResultSection = `
        <span class="japanese-word-hiragana">${wordReading}</span> (word)<br>
        <span class="japanese-word-romaji">${wordRomaji}</span> (romaji)<br>`;
    } else {
      wordResultSection = `
        <span class="japanese-word">${japaneseWord}</span> (word)<br>
        <span class="japanese-word-hiragana">${wordReading}</span> (reading)<br>
        <span class="japanese-word-romaji">${wordRomaji}</span> (romaji)<br>`;
    }
    let definitionSection = wordDefinitions
      .map((definition, index) => {
        return `<div class="definition"><span class='definition-index'>
          ${index + 1})</span> ${definition}</span></div>`;
      })
      .join('');
    let $resultDiv = $(`
      <div class="row">
        <div class="col-3">
          <div class="word-result">
            ${wordResultSection}
          </div>
        </div>
        <div class="col-5">
          <div class="definition-result">
            ${definitionSection}
          </div>
        </div>
        <div class="col-4">
          <div class="kanji-info">
            ${kanjiSection}
          </div>
          </div>
      </div>
      <hr>
    `);
    $resultDiv
      .hide()
      .appendTo('.js-results')
      .fadeIn(FADE_TIME);
  });
}

function pageScrollListener(wordArray) {
  // set this infinite scroll listener up
  $(window).scroll(function() {
    if ($(window).scrollTop() == $(document).height() - $(window).height()) {
      // ajax call get data from server and append to the div
    }
  });
}

function getKanjiInfoFromApi(searchTerm) {
  return new Promise((resolve, reject) => {
    const query = {
      headers: {
        'X-Mashape-Key': 'KCKQ5WNODBmshLeydUQgzK645yIOp1a4IPpjsnOsnNPVb3ini0'
      },
      url:
        'https://kanjialive-api.p.mashape.com/api/public/kanji/' + searchTerm,
      dataType: 'json',
      complete: function(data) {
        resolve(data);
      },
      error: function(data) {
        resolve();
      }
    };
    $.ajax(query);
  });
}

$(startApp);

//  OLD *****

// function displayHiraganaInfo(charArray, charLabelArray) {
//   let hiraganaArray = [];
//   charArray.forEach((char, index) => {
//     if (charLabelArray[index] === 'hiragana') hiraganaArray.push(char);
//   });
//   if (hiraganaArray.length !== 0) {
//     hiraganaArray.forEach(char =>
//       $('.js-hiragana').append(`<span class='large-character'>${char}</span>`)
//     );
//   }
// }

// function displayKatakanaInfo(charArray, charLabelArray) {
//   let katakanaArray = [];
//   charArray.forEach((char, index) => {
//     if (charLabelArray[index] === 'katakana') katakanaArray.push(char);
//   });
//   if (katakanaArray.length !== 0) {
//     katakanaArray.forEach(char =>
//       $('.js-katakana').append(`<span class='large-character'>${char}</span>`)
//     );
//   }
// }

// function highlightCharacters(japaneseWord) {
//   let containsKanji = false;
//   let charArray = japaneseWord.split('');
//   let charLabelArray = charArray.map(char => {
//     if (
//       (char >= '\u4e00' && char <= '\u9faf') ||
//       (char >= '\u3400' && char <= '\u4dbf')
//     ) {
//       containsKanji = true;
//       return 'kanji';
//     } else if (char >= '\u3040' && char <= '\u309f') {
//       return 'hiragana';
//     } else if (char >= '\u30a0' && char <= '\u30ff') {
//       return 'katakana';
//     } else {
//       return false;
//     }
//   });
//   let wordWithMarkup = charLabelArray
//     .map((label, index) => {
//       return `<span class='${label}-color'>${charArray[index]}</span>`;
//     })
//     .join('');
//   $('.js-word').html(wordWithMarkup);
//   requestKanjiData(charArray, charLabelArray, containsKanji);
//   displayHiraganaInfo(charArray, charLabelArray);
//   displayKatakanaInfo(charArray, charLabelArray);
// }

// function getWordFromApi(searchTerm, callback) {
//   const query = {
//     url: 'https://glosbe.com/gapi/translate',
//     dataType: 'jsonp',
//     success: callback,
//     data: {
//       from: 'eng',
//       dest: 'jpn',
//       format: 'json',
//       phrase: searchTerm,
//       pretty: 'true'
//     }
//   };
//   $.ajax(query);
// }

// make section for alert! right now put it in learn more
// function displayWordSearchData(data) {
//   if (data.tuc.length === 0) {
//     $('.learn-more').text('sorry, nothing found!');
//     $('.learn-more').fadeIn(FADE_TIME);
//   } else {
//     let japaneseWord = data.tuc[0].phrase.text;
//     getWordReadingFromApi(japaneseWord, displayWordReadingData);
//     highlightCharacters(japaneseWord);
//   }
// }

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
// function requestKanjiData(charArray, charLabelArray, containsKanji) {
//   if (containsKanji) {
//     let kanjiArray = [];
//     charArray.forEach((char, index) => {
//       if (charLabelArray[index] === 'kanji') kanjiArray.push(char);
//     });
//     kanjiArray.forEach(char =>
//       getKanjiInfoFromApi(char, displayKanjiSearchData)
//     );
//   }
// }
// function fadeInContent() {
//   $('.word').fadeIn(FADE_TIME);
//   $('.learn-more').fadeIn(FADE_TIME);
//   if (!$('.js-romaji').is(':empty')) $('.romaji').fadeIn(FADE_TIME);
//   if (!$('.js-kanji').is(':empty')) $('.kanji').fadeIn(FADE_TIME);
//   if (!$('.js-hiragana').is(':empty')) $('.hiragana').fadeIn(FADE_TIME);
//   if (!$('.js-katakana').is(':empty')) $('.katakana').fadeIn(FADE_TIME);
// }
