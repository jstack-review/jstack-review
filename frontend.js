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

var tour;
var afterInit = function(){tour.start();};

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
    
    if (/\s*http(s)?:\/\/[^/]+\/.*\s*/.test(text)) {
    	importFromUrl(dumpId, text.trim()); 
    	return;
    }
    
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
        $('#'+dumpId+'_dump').scrollspy({ target: '#'+dumpId+'_navbar', offset: 50 });
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
    }
    // scroll to the requested element
    var elm = $(location.hash);
    if (elm.length === 0) {
        return;
    }
    elm[0].scrollIntoView(true);
}

function setupCompareUI() {
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
        return false;
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
    
    for (var i = 0; i < dumpIds.length; ++i) {
        var dumpId = dumpIds[i];
        var header = dumpAnalysis[dumpId].name;
        if (dumpAnalysis[dumpId].filename !== undefined) {
            header += ': '+dumpAnalysis[dumpId].filename;
        }
        if (dumpAnalysis[dumpId].dateString !== undefined) {
        	header += '\t('+dumpAnalysis[dumpId].dateString+')';
        }
        var option = '<option value="'+dumpIds[i]+'">'+header+'</option>';
        oldDump.append(option);
        newDump.append(option);
    }
    oldDump.change();
}

function compareThreadDumps(oldId, newId) {
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
            analysis: oldAnalysis
        },
        'new': {
            id: newId,
            name: newAnalysis.name,
            filename: newAnalysis.filename,
            analysis: newAnalysis
        }
    };
    $('#comparetabbtn').parent().before(Mustache.render($('#tmpl-diff-tab').html(), model));
    $('#dumptabs>li[data-diffid=' + model.id + ']>span').click(removeDiff);
    $('#dumps').append(Mustache.render($('#tmpl-diff-tab-panel').html(), model));
    $('#dumptabs>li[data-diffid=' + model.id + ']>a').on('show.bs.tab', updateTabHash).tab('show');
    
    var diff = new jtda.diff.Diff(model, oldAnalysis, newAnalysis);
    diff.compare();
    if (jtdaDebug) {
        console.log(diff);
    }
    var render = new jtda.diff.render.Render($('#'+model.id+'_diff div.results'), renderConfig);
    render.render(diff);
    
    $('#'+model.id+'_diff').scrollspy({ target: '#'+model.id+'_navbar', offset: 50 });
    
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

function adjustUrl(url) {
	// https://gist.github.com/foobar/quux
	// https://gist.githubusercontent.com/foobar/quux/raw
	var gist = /^http(s)?:\/\/gist\.github\.com\/(.*?)(\/raw)?$/i;
	if (gist.test(url)) {
		return url.replace(gist, 'https://gist.githubusercontent.com/$2/raw');
	}
	// https://github.com/irockel/tda/blob/master/tda/test/none/visualvmremote.log
	// https://github.com/irockel/tda/raw/master/tda/test/none/visualvmremote.log
	// https://raw.githubusercontent.com/irockel/tda/master/tda/test/none/visualvmremote.log
	var github = /^http(s):\/\/github.com\/(.*?)\/(.*?)\/(.*?)\/(.*)$/i;
	if (github.test(url)) {
		return url.replace(github, 'https://raw.githubusercontent.com/$2/$3/$5');
	}
	// http://pastebin.com/foobar
	// https://pastebin.com/raw/foobar
	// Does not work due to CORS
	var pastebin = /^http(s)?:\/\/pastebin.com\/([^\/]*?\/)?(.*)$/i;
	if (pastebin.test(url)) {
		return url.replace(pastebin, 'https://pastebin.com/raw/$3');
	}
	return url;
}

function importFromUrl(analysisId, url) {
	var urlLoadStack = [];
	var urls = url.split(/[\n\t;]/);
	while ((url = urls.pop()) !== undefined) {
		url.trim();
		if (!/^http(s)?:\/\//i.test(url)) {
			continue;
		}
		if (analysisId === false) {
			analysisId = addDump(false);
		}
		urlLoadStack.push({
			id: analysisId,
			url: url
		});
		analysisId = false;
	}
	var cmpIds;
	if (urlLoadStack.length == 2) {
		cmpIds = [urlLoadStack[0].id, urlLoadStack[1].id];
	}
	var origAferInit = afterInit;
	afterInit = function() {
		if (urlLoadStack.length === 0) {
			afterInit = origAferInit;
			if (cmpIds !== undefined) {
				compareThreadDumps(cmpIds[0], cmpIds[1]);
			}
			if (afterInit !== undefined) {
				afterInit();
			}
			return;
		}
		var entry = urlLoadStack.pop();
		realImportFromUrl(entry.id, entry.url);
	};
	afterInit();
}

function realImportFromUrl(analysisId, url) {
	if (!/^http(s)?:\/\//i.test(url)) {
		console.log('No url: '+url);
		return;
	}
	var diag = $('#download-dialog');
	var urlField = $('p samp', diag);
	url = adjustUrl(url);
		
	var performAnalysis = function(data) {
		$('#' + analysisId + '_dumpInput').val(data).change();
		executeAnalysis(analysisId);
		diag.modal('hide');
		afterInit();
	};
	
	var redirCount = 0;
	var retrieveData = function(url) {
		urlField.html(url);
		$.get({
			url: url,
			dataType: 'text',
			success: function(data, status, xhr) {
				if (xhr.status == 200) {
					performAnalysis(data);
				}
				else if (xhr.status >= 300 && xhr.status < 400) {
					++redirCount;
					if (redirCount > 5) {
						diag.modal('hide');
						showAlert('Too Many Redirects', 'Unable to download content from: '+url, 'danger');
						return;
					}
					var newUrl = xhr.getResponseHeader('Location');
					retrieveData(newUrl);
				}
			},
			error: function(xhr, textStatus, errorThrown) {
				diag.modal('hide');
				showAlert('Download Failed', ['Unable to download content from: '+url, errorThrown===''?'Cross-Origin Request possibly blocked.':errorThrown], 'danger');
			}
		});
	};
	retrieveData(url);
	diag.modal('show');
}

function showAlert(title, message, type) {
	var dialogId = 'alertDialog';
	var model = {
		dialogId: dialogId,
		title: title,
		message: message,
		type: type
	};
	$('body').append(Mustache.render($('#tmpl-alert-dialog').html(), model));
	$('#alertDialog').modal('show').on('hidden.bs.modal', function() {
		$(this).remove();
	});
}

function castValue(type, value) {
	if (type === "boolean") {
		return value === "true";
	}
	else if (type === "number") {
		return Number.parseInt(value);
	}
	else {
		return value;
	}
}

function getSetting(settingObjId, settingId) {
	var settings = window[settingObjId];
	if (settings === undefined) {
		return undefined;
	}
	var path = settingId.split('.');
	var savedValue = localStorage.getItem(settingObjId+'#'+settingId);
	var p;
	while ((p = path.shift())) {
		var isArray = p.endsWith('[]');
		if (isArray) {
			p = p.substr(0, p.length - 2);
		}
		if (settings[p] === undefined) {
			// non-existing value
		}
		else if (!isArray && typeof settings[p] == "object") {
			settings = settings[p]; 
		}
		else {
			if (isArray) {
				if (savedValue !== null) {					
					settings[p] = savedValue.split('\n');
				}
				return settings[p].join('\n');
			}
			else {
				if (savedValue !== null) {
					settings[p] = castValue(typeof settings[p], savedValue);
				}
				return settings[p];
			}
		} 
	}
	return undefined;
}

function setSetting(settingObjId, settingId, value) {
	var settings = window[settingObjId];
	if (settings === undefined) {
		return;
	}
	var path = settingId.split('.');
	var p;
	while ((p = path.shift())) {
		var isArray = p.endsWith('[]');
		if (isArray) {
			p = p.substr(0, p.length - 2);
		}
		if (settings[p] === undefined) {
			// non-existing value
		}
		else if (!isArray && typeof settings[p] == "object") {
			settings = settings[p]; 
		}
		else {
			localStorage.setItem(settingObjId+'#'+settingId, value);
			if (isArray) {
				value = value.split('\n');				
			}
			settings[p] = castValue(typeof settings[p], value);
			break;
		} 
	}	
}

function setupSettingsUI() {
	$('#settingsClear').click(function() {
		localStorage.clear();
		showAlert('Settings Reset', ['All settings have been reset to their initial value.', 'Reload the page for the changes to take effect.'], 'success');
	});
	
	$('#settings :input[data-settings]').each(function(idx, elm) {
		elm = $(elm);
		var settingObjId = elm.data('settings');
		if (settingObjId === "") {
			settingObjId = elm.parents('[data-settings]').first().data('settings');
		}
		var settingId = elm.data('setting-id');
		if (settingId === undefined) {
			settingId = elm.attr('id');
		}
		if (elm.is(':checkbox')) {
			elm.prop('checked', getSetting(settingObjId, settingId));
			elm.change(function() { setSetting(settingObjId, settingId, $(this).is(':checked') ); });
		}
		else {
			elm.val(getSetting(settingObjId, settingId));
			elm.change(function() { setSetting(settingObjId, settingId, $(this).val() ); });
		}
	});
}

function setupTour() {
	$('#tourbtn').click(function() {
		tour.restart();
	});
	tour = new Tour({
		onStart: function() {
			$('#dumptabs a:first').tab('show');
		},
		steps: [
			{
				orphan: true,
				title: 'Welcome to jstack.review',
				content: 'This tour will guide you how to use jstack.review to analyze your Java thread dumps.<br />'+
					'You can restart this tour at any time from the about section.',
				backdrop: true
			},
			{
				element: '#dumptabs li:first',
				title: 'Thread Dumps',
				content: 'Every thread dump analysis has its own tab.',
				placement: 'bottom'
			},
			{
				element: '#adddump',
				title: 'Adding an Analysis',
				content: 'You can add an additional thread dump analysis by adding a new tab.',
				placement: 'bottom',
				onNext: function() {
					$('#tda_1_inputpeak:visible').hide();
					$('#tda_1_input:hidden').show();
				}
			},
			{
				element: '#tda_1_input',
				title: 'Providing the thread dump',
				content: 'You can provide the thread dump by pasting from your clipboard, selecting files, or '+
					'simply by dropping files in this area.',
				placement: 'top'				
			},
			{
				element: '#tda_1_input',
				title: 'Multiple files',
				content: 'When you select or drop multiple files it will automatically open additional tabs.',
				placement: 'top'
			},
			{
				element: '#tda_1_input button',
				title: 'Analysis',
				content: 'After pasting the thread dump, press the analyze button to perform the analysis. '+
					'This is done automatically when files are selected or dropped.',
				placement: 'right'
			},
			{
				element: '#dumptabs li[data-tabtarget="compare"] a',
				title: 'Compare Dump',
				content: 'When two or more thread dumps are analyzed you can perform a comparison between the two dumps.',
				placement: 'bottom'
			},
			{
				element: '#dumptabs li[data-tabtarget="settings"] a',
				title: 'Settings',
				content: 'Here you can fine tune some settings of jstack.review which will affect the analysis results.',
				placement: 'bottom'
			},
			{
				orphan: true,
				title: 'jstack.review',
				content: 'Thank you for your attention. <br />We hope this tool will be valuable to you.',
				backdrop: true
			}
		]
	});
	tour.init();
}

$(document).ready(function() {
	setupSettingsUI();
	if (localStorage.getItem('clientSideNotice') === '1') {
		$('#clientSideNotice').remove();
	}
	else {
		$('#clientSideNotice button').click(function() {
			localStorage.setItem('clientSideNotice', '1');
		});
	}
	
    $('#adddump').click(addDump);
    setupCompareUI();
    
	$('#dumptabs>li[data-tabtarget]').on('show.bs.tab', updateTabHash);
    $(window).on('hashchange', ensureActiveTab);
    
    setupTour();
    
    // save initial hash to possibly switch back
    if (location.hash !== undefined && location.hash !== "") {
    	var rethash = location.hash;
    	afterInit = function() {
    		if (rethash !== undefined && $(rethash).length > 0) {
    			location.hash = rethash; 
    		}
    		afterInit = function(){};
		};
    }
    
    // create the first dump window
    var currentId = addDump(true);
    
    // Load data from query string
    if (location.search !== '') {
    	importFromUrl(currentId, location.search.substring(1)); 
    }
	else {
		afterInit();
	}
});
