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

function addDump() {
    ++dumpCounter;
    var model = {
        id: 'tda_' + dumpCounter,
        name: 'Dump #' + dumpCounter
    };
    dumpAnalysis[model.id] = new jtda.Analysis(model.id, analysisConfig);
    $('#adddump').parent().before(Mustache.render($('#tmpl-tab').html(), model));
    $('#dumptabs>li[data-dumpid=' + model.id + ']>span').click(removeDump);
    $('#dumps').append(Mustache.render($('#tmpl-tab-panel').html(), model));
    $('#dumps>div[data-dumpid=' + model.id + '] form button').click(function() {
        executeAnalysis(model.id, $('#' + model.id + '_dumpInput').val());
    });
    $('#dumptabs>li[data-dumpid=' + model.id + ']>a').tab('show');

    if (!jtdaDebug) {
        return;
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

function executeAnalysis(dumpId, text) {
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
        new jtda.render.Renderer(target, renderConfig).render(analysis);
    }
}

$(document).ready(function() {
    $('#adddump').click(addDump);
    // create the first dump
    addDump();
});
