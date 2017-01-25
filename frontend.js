/*
Copyright 2017 MP Objects BV

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

/* global $ */
/* global jtda */
/* global Mustache */
/* global console */
/* global sessionStorage */
/* global document */
/* global location */

var jtdaDebug = 'file:' === location.protocol;
var dumpCounter = 0;
var dumpAnalysis = {};
var analysisConfig = new jtda.AnalysisConfig();
var renderConfig = new jtda.render.RenderConfig();

function addDump(focusTab) {
    ++dumpCounter;
    var model = {
        id: 'tda_' + dumpCounter,
        name: 'Dump #' + dumpCounter,
        fileReader: FileReaderJS.enabled
    };
    dumpAnalysis[model.id] = new jtda.Analysis(model.id, analysisConfig);
    
    $('#adddump').parent().before(Mustache.render($('#tmpl-tab').html(), model));
    $('#dumptabs>li[data-dumpid=' + model.id + ']>span').click(removeDump);
    $('#dumps').append(Mustache.render($('#tmpl-tab-panel').html(), model));
    $('#' + model.id + '_input form button').click(function() {
        executeAnalysis(model.id);
    });
    $('#' + model.id + '_inputpeak button').click(function() {
        $('#' + model.id + '_inputpeak').hide();
        $('#' + model.id + '_input').show();
    });
    if (focusTab) {
        $('#dumptabs>li[data-dumpid=' + model.id + ']>a').tab('show');
    }

    if (FileReaderJS.enabled) {
        setupFileReader(model.id);
    }

    if (!jtdaDebug) {
        return model.id;
    }
    // just to make developments easier
    $('#'+model.id+'_input form').append('<label><input type="checkbox" id="'+model.id+'_dumpInput_save" value="1"> Remember input</label>');
    var saveFlag = sessionStorage.getItem('input.save.' + model.id);
    if (saveFlag === 'true') {
        $('#' + model.id + '_dumpInput_save').prop("checked", true);
        $('#' + model.id + '_dumpInput').val(sessionStorage.getItem('input.' + model.id));
    }
    $('#' + model.id + '_dumpInput_save').change(function() {
        var checked = $(this).prop("checked");
        sessionStorage.setItem('input.save.' + model.id, checked);
        if (!checked) {
            sessionStorage.removeItem('input.' + model.id);
        }
    });
    $('#'+model.id+'_dumpInput').change(function() {
        var checked = $('#' + model.id + '_dumpInput_save').prop("checked");
        if (checked) {
            sessionStorage.setItem('input.' + model.id, $(this).val());
        }
    });
    
    return model.id;
}

function setupFileReader(dumpId) {
    var dumpIds = [];
    var opt = {
        readAsDefault: 'Text',
        on: {
            load: function(e, file) {
                var currentId = dumpIds.pop();
                if (currentId === undefined) {
                    return;
                }
                $('#' + currentId + '_dump h1:first small').html(file.name);
                $('#' + currentId + '_dumpInput').val(e.target.result).change();
                executeAnalysis(currentId);
            },
            groupstart: function(group) {
                dumpIds = [dumpId];
                for (var i = 1; i < group.files.length; ++i) {
                    dumpIds.push(addDump(false));
                }
            }
        }
    };
    $('#' + dumpId + '_dumpInput').fileReaderJS(opt);
    $('#' + dumpId + '_dumpFile').fileReaderJS(opt);
}

function removeDump() {
    var dumpId = $(this).parent('li').attr('data-dumpid');
    var tab = $('#dumptabs>li[data-dumpid=' + dumpId + ']');
    if (tab.hasClass('active')) {
        if (tab.prev('li[data-dumpid]').size() > 0) {
            tab.prev('li[data-dumpid]').children('a').tab('show');
        } else {
            tab.next('li[data-dumpid]').children('a').tab('show');
        }
    }
    tab.remove();
    $('#dumps>div[data-dumpid=' + dumpId + ']').remove();
    delete dumpAnalysis[dumpId];
    return false;
}

function executeAnalysis(dumpId) {
    var text = $('#' + dumpId + '_dumpInput').val();
    var analysis = dumpAnalysis[dumpId];
    analysis.analyze(text);
    if (jtdaDebug) {
        console.debug(analysis);
    }
    var target = $('#' + dumpId + '_dump div.results');
    target.empty();
    if (analysis.threads.length === 0) {
        target.append(Mustache.render($('#tmpl-alert').html(), {level: 'danger', message: 'No threads found in the thread dump'})); 
    }
    else {
        $('#' + dumpId + '_input').hide();
        $('#' + dumpId + '_inputpeak').show();
        $('#' + dumpId + '_inputpeak .sneakpeak').val(text.trim().split('\n').slice(0, 5).join('\n')+'\n[...]');
        new jtda.render.Renderer(target, renderConfig).render(analysis);
    }
}

$(document).ready(function() {
    $('#adddump').click(addDump);
    // create the first dump
    addDump(true);
});
