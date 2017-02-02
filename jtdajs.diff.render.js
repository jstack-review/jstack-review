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

var jtda = jtda || {};
(function() {
    "use strict";

    /* global $ */
    /* global Mustache */
    
    jtda.diff.render = jtda.diff.render || {};
    
    jtda.diff.render.Render = function(target, config) {
    
        this.getTemplate = function(name) {
            if (name.charAt(0) === '^') {
                return $('#tmpl-' + name.substring(1)).html();
            }
            return $('#tmpl-diff-' + name).html();
        };

        /**
         * returns a function to lookup Mustache partials
         */
        this._partials = function() {
            var _this = this;
            return function(name) {
                return _this.getTemplate(name);
            };
        };
        
        this.render = function(diff) {
            this.target.empty();
            this.target.append(Mustache.render(this.getTemplate('navbar'), {
                diffId: diff.id,
                diff: diff
            }, this._partials()));
            
            if (diff.newThreads.length > 0) {
                this._renderNewThreads(diff);
            }
            if (diff.goneThreads.length > 0) {
                this._renderGoneThreads(diff);
            }
            if (diff.changedThreads.length > 0) {
                this._renderChangedThreads(diff);
            }
        };
        
        this._threadListModel = function(diff, analysisId, title, threads) {
            return {
                diffId: diff.id,
                prefix: diff.id+'_',
                analysisId: analysisId,
                title: title,
                threads: threads,
                threadStatusColor: function() {
                    return config.threadStatusColor[this.getStatus()];
                },
                showThreadDetails: true,
                showTopFrames: true,
                topFrames: function() {
                    var max = 10;  //TODO: config
                    var res = this.frames.slice(0, max);
                    if (res.length === max) {
                        res.push('...');
                    }
                    return res;
                }
            };
        };
        
        this._renderNewThreads = function(diff) {
            var model = this._threadListModel(diff, diff.newer.id, 'New Threads', diff.newThreads);
            model.divId = model.prefix+'new';
            this.target.append(Mustache.render(this.getTemplate('thread-list'), model, this._partials()));
        };

        this._renderGoneThreads = function(diff) {
            var model = this._threadListModel(diff, diff.older.id, 'Gone Threads', diff.goneThreads);
            model.divId = model.prefix+'gone';
            this.target.append(Mustache.render(this.getTemplate('thread-list'), model, this._partials()));
        };

        this._renderChangedThreads = function(diff) {
            var model = {
                diffId: diff.id
            };
            this.target.append(Mustache.render(this.getTemplate('changed-threads'), model, this._partials()));
        };
        
        this.target = target;
        this.config = config;
    };
    
}());
