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
var diffCounter = 0;
var dumpAnalysis = {};
var analysisConfig = new jtda.AnalysisConfig();
var renderConfig = new jtda.render.RenderConfig();
// Keep in sync with code in addDump()
var dumpIdRegEx = /^(((tda)|(diff))_[0-9]+)/;

function addDump(focusTab) {
    ++dumpCounter;
    var model = {
        id: 'tda_' + dumpCounter,
        name: 'Dump #' + dumpCounter,
        fileReader: FileReaderJS.enabled
    };
    dumpAnalysis[model.id] = new jtda.Analysis(model.id, model.name, analysisConfig);
    
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
    $('#dumptabs>li[data-dumpid=' + model.id + ']>a').on('show.bs.tab', updateTabHash);
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
    var updatedDumpIds = [];
    var opt = {
        readAsDefault: 'Text',
        on: {
            load: function(e, file) {
                var currentId = dumpIds.shift();
                if (currentId === undefined) {
                    return;
                }
                dumpAnalysis[currentId].filename = file.name;
                $('#' + currentId + '_dump h1:first small').html(file.name);
                $('#' + currentId + '_dumpInput').val(e.target.result).change();
                executeAnalysis(currentId);
                if (dumpAnalysis[currentId].threads.length > 0) {
                    updatedDumpIds.push(currentId);
                }
            },
            groupstart: function(group) {
                dumpIds = [dumpId];
                updatedDumpIds = [];
                for (var i = 1; i < group.files.length; ++i) {
                    dumpIds.push(addDump(false));
                }
            },
            groupend: function(group) {
                if (updatedDumpIds.length === 2) {
                    compareThreadDumps(updatedDumpIds[0], updatedDumpIds[1]);
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
    if ($('#comparetabbtn').parent('li').hasClass('active')) {
        populateCompareTab();
    }
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

var allowTabHashUpdate = true;

function updateTabHash(event) {
    if (allowTabHashUpdate) {
        location.hash = $(event.target).attr('href');
    }
}

/*
 * Bound to onhashchange event to allow linking from different tabs
 */
function ensureActiveTab() {
    if (location.hash === undefined) {
        return;
    }    
    var activeTab = $('#dumptabs>li.active').attr('data-tabtarget');
    var requestedTab = dumpIdRegEx.exec(location.hash.substring(1));
    if (requestedTab !== null) {
        requestedTab = requestedTab[1];
    }
    else {
        requestedTab = location.hash.substring(1);
    }
    var targetTab = $('#dumptabs>li[data-tabtarget="'+requestedTab+'"]');
    if (targetTab.length === 0) {
        return;
    }
    
    if (activeTab !== requestedTab) {
        allowTabHashUpdate = false;
        $('a:first', targetTab).tab('show');
        allowTabHashUpdate = true;
        // scroll to the requested element
        var elm = $(location.hash);
        if (elm.length === 0) {
            return true;
        }
        elm[0].scrollIntoView(true);
    }
    return;
}

function setupCompareUI() {
    if (!jtdaDebug) {
        //TODO not ready yet
        $('#comparetabbtn').parent('li').hide();
    }
    $('#comparetabbtn').on('show.bs.tab', populateCompareTab);
    $('#olderAnalysis').on('change', function() {
        var newval = $(this).val();
        $('#newerAnalysis option').show();
        $('#newerAnalysis option[value="'+newval+'"]').hide();
        if ($('#newerAnalysis').val() === newval) {
            $('#newerAnalysis').val(null);
        }
    });
    $('#compareform').submit(function() {
        compareThreadDumps($('#olderAnalysis').val(), $('#newerAnalysis').val());
    });
}

function getCompletedAnalysisIds() {
    var dumpIds = Object.getOwnPropertyNames(dumpAnalysis);
    var result = [];
    for (var i = 0; i < dumpIds.length; ++i) {
        if (dumpAnalysis[dumpIds[i]].threads.length > 0) {
            result.push(dumpIds[i]);
        }
    }
    return result;
}

function populateCompareTab() {
    var dumpIds = getCompletedAnalysisIds();
    if (dumpIds.length < 2) {
        $('#compareform').hide();
        $('#comparenotenough').show();
        return;
    }
    $('#comparenotenough').hide();
    $('#compareform').show();
    
    var oldDump = $('#olderAnalysis');
    var newDump = $('#newerAnalysis');
    oldDump.empty();
    newDump.empty();
    
    var titles = {};
    for (var i = 0; i < dumpIds.length; ++i) {
        var dumpId = dumpIds[i];
        var header = dumpAnalysis[dumpId].name;
        if (dumpAnalysis[dumpId].filename !== undefined) {
            header += ': '+dumpAnalysis[dumpId].filename;
        }        
        var option = '<option value="'+dumpIds[i]+'">'+header+'</option>';
        oldDump.append(option);
        newDump.append(option);
    }
    oldDump.change();
}

function compareThreadDumps(oldId, newId) {
    if (!jtdaDebug) {
        return;
    }
    var oldAnalysis = dumpAnalysis[oldId];
    var newAnalysis = dumpAnalysis[newId];
    ++diffCounter;
    var model = {
        id: 'diff_' + diffCounter,
        name: 'Diff #' + diffCounter,
        old: {
            id: oldId,
            name: oldAnalysis.name,
            filename: oldAnalysis.filename,
        },
        'new': {
            id: newId,
            name: newAnalysis.name,
            filename: newAnalysis.filename,
        }
    };
    $('#comparetabbtn').parent().before(Mustache.render($('#tmpl-diff-tab').html(), model));
    $('#dumptabs>li[data-diffid=' + model.id + ']>span').click(removeDiff);
    $('#dumps').append(Mustache.render($('#tmpl-diff-tab-panel').html(), model));
    $('#dumptabs>li[data-diffid=' + model.id + ']>a').on('show.bs.tab', updateTabHash).tab('show');
    
    // TODO: execute the analysis and print results
    var diff = new jtda.diff.Diff(model, oldAnalysis, newAnalysis);
    diff.compare();
    if (jtdaDebug) {
        console.log(diff);
    }
    var render = new jtda.diff.render.Render($('#'+model.id+'_diff div.results'), renderConfig);
    render.render(diff);
    
    return false;
}

function removeDiff() {
    var diffId = $(this).parent('li').attr('data-diffid');
    var tab = $('#dumptabs>li[data-diffid=' + diffId + ']');
    if (tab.hasClass('active')) {
        $('#comparetabbtn').tab('show');
    }
    tab.remove();
    $('#dumps>div[data-diffid=' + diffId + ']').remove();
    return false;
}

$(document).ready(function() {
    $('#adddump').click(addDump);
    $('#dumptabs>li[data-tabtarget]').on('show.bs.tab', updateTabHash);
    setupCompareUI();
    $(window).on('hashchange', ensureActiveTab);
    // create the first dump window
    addDump(true);
});
