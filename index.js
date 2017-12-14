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
  console.log(data);
  $('.results-count').text(`(${data.data.length})`);
  if (data.data.length === 0) {
    $('.js-results').html(`<div class="row">
        <div class='col-12'>
          Sorry! Your search didn't return any results.
        </div>
      </div>`);
  } else {
    processWordData(data.data);
  }
}

function processWordData(wordArray) {
  let currentWordArray = wordArray.slice();
  let wordsToDisplay = [];
  if (currentWordArray.length <= 5) {
    wordsToDisplay = currentWordArray.slice();
    processKanjiApiCall(wordsToDisplay, false, currentWordArray);
  } else {
    wordsToDisplay = currentWordArray.splice(0, 5);
    processKanjiApiCall(wordsToDisplay, true, currentWordArray);
  }
}

function processKanjiApiCall(
  wordsToDisplay,
  scrollListenerActive,
  wordsRemainingToDisplay
) {
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
              `<div class='no-kanji-message'>Sorry! ${
                kanjiArray[wordIndex][kanjiIndex]
              } isn't in our database.</div>`
            );
          } else {
            return accumulator + processKanjiData(kanjiData);
          }
        }, '');
      }
    );
    displayWordData(
      wordsToDisplay,
      kanjiGroupStringArray,
      scrollListenerActive,
      wordsRemainingToDisplay
    );
  });
}

function processKanjiData(data) {
  let kanjiData = data;
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

function displayWordData(
  wordArray,
  kanjiGroupStringArray,
  scrollListenerActive,
  wordsRemainingToDisplay
) {
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
        <span class="japanese-word-hiragana">${wordReading}</span> <span class='word-label'>(word)</span><br>
        <span class="japanese-word-romaji">${wordRomaji}</span> <span class='word-label'>(romaji)</span><br>`;
    } else {
      wordResultSection = `
        <span class="japanese-word">${japaneseWord}</span> <span class='word-label'>(word)</span><br>
        <span class="japanese-word-hiragana">${wordReading}</span> <span class='word-label'>(reading)</span><br>
        <span class="japanese-word-romaji">${wordRomaji}</span> <span class='word-label'>(romaji)</span><br>`;
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
  if (scrollListenerActive) pageScrollListener(wordsRemainingToDisplay);
}

function pageScrollListener(wordArray) {
  console.count('registering listener');
  $(window).on('scroll', function() {
    if ($(window).scrollTop() == $(document).height() - $(window).height()) {
      console.log(wordArray);
      $('.loading-animation').show();
      $(window).off('scroll');
      processWordData(wordArray);
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
