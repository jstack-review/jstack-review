/*
Copyright 2017 MP Objects BV
Copyright 2020 jstack.review

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

    /* global Mustache */

    jtda.diff.render = jtda.diff.render || {};

    jtda.diff.render.Render = function(target, config) {

        this.getTemplate = function(name) {
            if (name.charAt(0) === '^') {
                return config.templateLookup(name.substring(1), this);
            }
            else {
                return config.templateLookup('diff-' + name, this);
            }
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

            this._renderOverview(diff);

            if (diff.newThreads.length > 0) {
                this._renderNewThreads(diff);
            }
            if (diff.goneThreads.length > 0) {
                this._renderGoneThreads(diff);
            }
            if (diff.changedThreads.length > 0) {
                this._renderChangedThreads(diff);
            }
            if (diff.unchangedThreads.length > 0) {
                this._renderUnchangedThreads(diff);
            }
        };

        this._renderOverview = function(diff) {
            this.target.append(Mustache.render(this.getTemplate('overview'), {
                diffId: diff.id,
                diff: diff
            }, this._partials()));

            new Chart(diff.id + '_thread_status_chart', {
                type: 'bar',
                data: this.getThreadStatusChartData(diff),
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    title: {
                        display: true,
                        position: "top",
                        text: "Thread Status"
                    }
                }
            });
        };

        this.getThreadStatusChartData = function(diff) {
            var labels = [];
            var datasets = [{
                label: diff.older.name,
                data: [],
                backgroundColor: []
            }, {
                label: diff.newer.name,
                data: [],
                backgroundColor: []
            }];
            var data = this.getThreadStatusCounts(diff);
            for (var status in data) {
                var dat = data[status];
                if (dat[0] === 0 && dat[1] === 0) {
                    continue;
                }
                labels.push(status);
                datasets[0].data.push(dat[0]);
                datasets[0].backgroundColor.push(this.config.threadStatusColorAlt[status]);
                datasets[1].data.push(dat[1]);
                datasets[1].backgroundColor.push(this.config.threadStatusColor[status]);
            }
            var res = {
                labels: labels,
                datasets: datasets
            };
            return res;
        };

        this.getThreadStatusCounts = function(diff) {
            var data = {};
            for (var i = 0; i < jtda.ThreadStatus.ALL.length; ++i) {
                var status = jtda.ThreadStatus.ALL[i];
                data[status] = [0, 0];
                if (diff.older.threadsByStatus[status] !== undefined) {
                    data[status][0] = diff.older.threadsByStatus[status].length;
                }
                if (diff.newer.threadsByStatus[status] !== undefined) {
                    data[status][1] = diff.newer.threadsByStatus[status].length;
                }
            }
            return data;
        };

        this._threadListModel = function(diff, analysisId, title, threads) {
            return {
                diffId: diff.id,
                prefix: diff.id + '_',
                analysisId: analysisId,
                title: title,
                threads: threads,
                threadStatusColor: function() {
                    return config.threadStatusColor[this.getStatus()];
                },
                showThreadDetails: true,
                showTopFrames: true,
                topFrames: this._topFrames
            };
        };

        this._renderNewThreads = function(diff) {
            var model = this._threadListModel(diff, diff.newer.id, 'New Threads', diff.newThreads);
            model.divId = model.prefix + 'new';
            this.target.append(Mustache.render(this.getTemplate('thread-list'), model, this._partials()));
        };

        this._renderGoneThreads = function(diff) {
            var model = this._threadListModel(diff, diff.older.id, 'Gone Threads', diff.goneThreads);
            model.divId = model.prefix + 'gone';
            this.target.append(Mustache.render(this.getTemplate('thread-list'), model, this._partials()));
        };

        this._renderChangedThreads = function(diff) {
            var model = {
                diff: diff,
                diffId: diff.id,
                threads: diff.changedThreads,
                threadStatusColor: function() {
                    return config.threadStatusColor[this.getStatus()];
                },
                isPropertiesChanges: function() {
                    return this.changed !== undefined && this.changed.isProperties();
                }
            };
            this.target.append(Mustache.render(this.getTemplate('changed-threads'), model, this._partials()));
        };

        this._renderUnchangedThreads = function(diff) {
            var model = {
                diff: diff,
                diffId: diff.id,
                prefix: diff.id + '_',
                analysisId: diff.older.id,
                threads: diff.unchangedThreads,
                threadStatusColor: function() {
                    return config.threadStatusColor[this.getStatus()];
                },
                showThreadDetails: true,
                showTopFrames: true,
                topFrames: this._topFrames
            };
            this.target.append(Mustache.render(this.getTemplate('unchanged-threads'), model, this._partials()));
        };
        
        this._topFrames = function() {
            var max = 10; //TODO: config
            var res = this.frames.slice(0, max);
            if (res.length === max) {
                res.push('...');
            }
            return res;
        };

        this.target = new jtda.render.RendererTarget(target);
        this.config = config;
    };

}());