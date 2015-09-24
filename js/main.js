(function () {
    window.appState = new State();
    var defaultState = {
        year: 2014,
        question1: 6,
        question2: 13,
        minLinkValue: 0,
        maxLinkValue: 2000,
        splitMultipleAnswers: true
    };
    var dataFiles = {
        2015: {
            location: './data/JavaScript%20Developer%20Survey%202014.csv',
            settings: {
                answerDelimiter: ', '
            }
        },
        2013: {
            location: './data/JavaScript%20Developer%20Survey%202013.csv',
            settings: {
                answerDelimiter: ';'
            }
        },
        2014: {
            location: './data/Sibos_2014.csv',
            settings: {
                answerDelimiter: ', '
            }
        }
    };

    var surveyData = new SurveyDataProvider();
    var sankeyDiagram = new SankeyDiagram();

    //*******************
    // DATA -> VIEW
    //*******************
    appState.on('change', function (change, state) {
        if (change.year) {
            var dataFile = dataFiles[state.year];
            surveyData = new SurveyDataProvider(dataFile.settings);

            $('#disabled-while-loading').addClass('disabled');

            surveyData
                .loadData(dataFile.location)
                .done(function () {
                    $('#disabled-while-loading').removeClass('disabled');

                    updateURL();
                    updateQuestions();
                    updateInputs();
                    updateDiagram();
                });
        } else if ((change.questions || change.minLinkValue || change.maxLinkValue || change.splitMultipleAnswers) && state.question1 && state.question2) {
            updateURL();
            updateInputs();
            updateDiagram();
        }
    });

    function buildListOfQuestions(questions) {
        var root = document.createDocumentFragment();
        var option = document.createElement('option');

        questions.forEach(function (q, idx) {
            option = option.cloneNode(false);
            option.setAttribute('value', idx + 1);
            option.innerHTML = q;
            root.appendChild(option);
        });

        return root;
    }

    function updateQuestions() {
        var listOfQuestions = buildListOfQuestions(surveyData.getQuestions());

        $questionSelect1.find('option:gt(0)').remove();
        $questionSelect2.find('option:gt(0)').remove();

        $questionSelect2.append(listOfQuestions.cloneNode(true));
        $questionSelect1.append(listOfQuestions);
    }

    function updateInputs() {
        $questionSelect1.off('change', onQuestionChange);
        $questionSelect1.data('selectpicker').val(appState.get('question1'));
        $questionSelect1.on('change', onQuestionChange);

        $questionSelect2.off('change', onQuestionChange);
        $questionSelect2.data('selectpicker').val(appState.get('question2'));
        $questionSelect2.on('change', onQuestionChange);

        $('input[name=surveyYear]').off('change', onYearChange);
        $('input[name=surveyYear][value=' + appState.get('year') + ']').data('radio').toggle();
        $('input[name=surveyYear]').on('change', onYearChange);

        $slider.data('uiSlider').options['change'] = undefined;
        $slider.data('uiSlider').value(appState.get('minLinkValue'));
        $("#sliderValue").text(appState.get('minLinkValue'));
        $slider.data('uiSlider').options['change'] = onMinLinkValueChange;
        
        $slider1.data('uiSlider').options['change'] = undefined;
        $slider1.data('uiSlider').value(appState.get('maxLinkValue'));
        $("#sliderValue1").text(appState.get('maxLinkValue'));
        $slider1.data('uiSlider').options['change'] = onMaxLinkValueChange;

        $splitMultipleAnswers.off('change', onSplitMultipleAnswersChange);
        $splitMultipleAnswers.data('checkbox').setCheck(appState.get('splitMultipleAnswers') ? 'check' : 'uncheck');
        $splitMultipleAnswers.on('change', onSplitMultipleAnswersChange);
    }

    function updateURL() {
        history.pushState(
            appState.get(),
            undefined,
            '#' + appState.get('year') + '/'
                + appState.get('question1') + '/'
                + appState.get('question2') + '/'
                + appState.get('minLinkValue') + '/'
                + appState.get('maxLinkValue') + '/'
                + (appState.get('splitMultipleAnswers') ? 'true' : 'false')
        );
    }

    function updateDiagram() {
        var data = surveyData.getValuesForQuestions(
            appState.get('question1'),
            appState.get('question2'),
            appState.get('splitMultipleAnswers')
        );
        sankeyDiagram.draw(data, appState.get('minLinkValue'), appState.get('maxLinkValue'));
    }

    //*******************
    // VIEW -> DATA
    //*******************
    var $questionSelect1 = $('#questions-1');
    var $questionSelect2 = $('#questions-2');
    var $slider = $("#slider").slider({
        min: 2,
        max: 200,
        value: 10,
        range: "min"
    });
    var $slider1 = $("#slider1").slider({
        min: 2,
        max: 2000,
        value: 10,
        range: "min"
    });
    var $splitMultipleAnswers = $('#splitMultipleAnswers');

    function onMinLinkValueChange() {
            var value = $slider.data('uiSlider').value();

            $("#sliderValue").text(value);
            appState.change({
                minLinkValue: value
            });
    }
    
    function onMaxLinkValueChange() {
            var value = $slider1.data('uiSlider').value();

            $("#sliderValue1").text(value);
            appState.change({
                maxLinkValue: value
            });
    }

    $slider.data('uiSlider').options['change'] = onMinLinkValueChange;
    $("#sliderValue").text($slider.data('uiSlider').value());
    
    $slider1.data('uiSlider').options['change'] = onMaxLinkValueChange;
    $("#sliderValue1").text($slider1.data('uiSlider').value());

    function onQuestionChange() {
        appState.change({
            question1: $questionSelect1.val(),
            question2: $questionSelect2.val()
        });
    }

    $($questionSelect1).selectpicker().on('change', onQuestionChange);
    $($questionSelect2).selectpicker().on('change', onQuestionChange);

    function onYearChange() {
        if ($(this).is(':checked')) {
            appState.change({
                question1: -1,
                question2: -1,
                year: $(this).val()
            });
        }
    }

    $('input[name=surveyYear]').on('change', onYearChange);

    function onSplitMultipleAnswersChange() {
        appState.change({
            splitMultipleAnswers: $(this).is(':checked')
        });
    }

    $splitMultipleAnswers.on('change', onSplitMultipleAnswersChange);

    var parseURL = function () {
        var hash = location.hash;
        var q1, q2, year, minLinkValue, maxLinkValue, splitMultipleAnswers;

        if (history.state) {
            year = history.state.year;
            q1 = history.state.question1;
            q2 = history.state.question2;
            minLinkValue = history.state.minLinkValue;
            maxLinkValue = history.state.maxLinkValue;
            splitMultipleAnswers = history.state.splitMultipleAnswers;
        } else if (hash && hash.length > 0) {
            hash = hash.slice(1).split('/');

            if (hash.length === 6) {
                year = hash[0];
                q1 = hash[1];
                q2 = hash[2];
                minLinkValue = hash[3];
                maxLinkValue = hash[4];
                splitMultipleAnswers = (hash[5] === 'true');
            }
        }

        if (q1 !== undefined && q2 !== undefined && year !== undefined) {
            appState.change({
                question1: q1,
                question2: q2,
                year: year,
                minLinkValue: minLinkValue,
                maxLinkValue: maxLinkValue,
                splitMultipleAnswers: splitMultipleAnswers
            });
        } else {
            appState.change(defaultState);
        }
    };

    window.addEventListener('popstate', parseURL, false);

    if (location.hash === "") {
        appState.change(defaultState);
    } else {
        parseURL();
    }
})();