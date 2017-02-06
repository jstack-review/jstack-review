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
    /* global Chart */

    jtda.render = jtda.render || {};

    jtda.render.RenderConfig = function() {
        this.threads = {
            groupSimilar: true
        };

        this.threadStatusColor = {};
        this.threadStatusColor[jtda.ThreadStatus.UNKNOWN] = '#7f7f7f';
        this.threadStatusColor[jtda.ThreadStatus.RUNNING] = '#2ca02c';
        this.threadStatusColor[jtda.ThreadStatus.NON_JAVA_THREAD] = '#9467bd';
        this.threadStatusColor[jtda.ThreadStatus.TERMINATED] = '#8c564b';
        this.threadStatusColor[jtda.ThreadStatus.NEW] = '#17becf';
        this.threadStatusColor[jtda.ThreadStatus.SLEEPING] = '#1f77b4';
        this.threadStatusColor[jtda.ThreadStatus.WAITING_ACQUIRE] = '#ff7f0e';
        this.threadStatusColor[jtda.ThreadStatus.WAITING_NOTIFY] = '#d62728';
        
        this.threadStatusColorAlt = {};
        this.threadStatusColorAlt[jtda.ThreadStatus.UNKNOWN] = '#c7c7c7';
        this.threadStatusColorAlt[jtda.ThreadStatus.RUNNING] = '#98df8a';
        this.threadStatusColorAlt[jtda.ThreadStatus.NON_JAVA_THREAD] = '#c5b0d5';
        this.threadStatusColorAlt[jtda.ThreadStatus.TERMINATED] = '#c49c94';
        this.threadStatusColorAlt[jtda.ThreadStatus.NEW] = '#9edae5';
        this.threadStatusColorAlt[jtda.ThreadStatus.SLEEPING] = '#aec7e8';
        this.threadStatusColorAlt[jtda.ThreadStatus.WAITING_ACQUIRE] = '#ffbb78';
        this.threadStatusColorAlt[jtda.ThreadStatus.WAITING_NOTIFY] = '#ff9896';

        this.synchronizerChart = {
            max: 7,
            colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf']
        };
    };

    jtda.render.Renderer = function(target, config) {
        this.getTemplate = function(name) {
            return $('#tmpl-analysis-' + name).html();
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

        this.render = function(analysis) {
            this.target.empty();
            this.target.append(Mustache.render(this.getTemplate('navbar'), {
                analysisId: analysis.id,
                analysis: analysis
            }, this._partials()));

            this.renderOverview(analysis);
            this.renderRunningMethods(analysis);
            this.renderThreads(analysis);
            this.renderSynchronizers(analysis);
            this.renderGarbage(analysis);
        };

        this.renderOverview = function(analysis) {
            this.target.append(Mustache.render(this.getTemplate('overview'), {
                analysisId: analysis.id,
                analysis: analysis
            }, this._partials()));

            new Chart(analysis.id + '_thread_status_chart', {
                type: 'doughnut',
                data: this.getThreadStatusChartData(analysis),
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    title: {
                        display: true,
                        position: "left",
                        text: "Thread Status"
                    },
                    legend: {
                        position: "right"
                    }
                }
            });

            new Chart(analysis.id + '_sync_type_chart', {
                type: 'doughnut',
                data: this.getSynchronizerTypeChartData(analysis),
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    title: {
                        display: true,
                        position: "left",
                        text: "Synchronizer Types"
                    },
                    legend: {
                        position: "right",
                    },
                    tooltips: {
                        callbacks: {
                            label: function(t, n) {
                                var lbl = n.longLabels[t.index],
                                    cnt = ': ' + n.datasets[t.datasetIndex].data[t.index];
                                return lbl + cnt;
                            }
                        }
                    }
                }
            });
        };

        this.getThreadStatusChartData = function(analysis) {
            var sorted = [];
            for (var status in analysis.threadsByStatus) {
                sorted.push([status, analysis.threadsByStatus[status].length]);
            }
            sorted.sort(function(a, b) {
                return b[1] - a[1];
            });
            var labels = [];
            var dataset = {
                data: [],
                backgroundColor: []
            };
            for (var i = 0; i < sorted.length; ++i) {
                labels.push(sorted[i][0]);
                dataset.data.push(sorted[i][1]);
                dataset.backgroundColor.push(this.config.threadStatusColor[sorted[i][0]]);
            }
            var res = {
                labels: labels,
                datasets: [dataset]
            };
            return res;
        };

        this.getSynchronizerTypeChartData = function(analysis) {
            var indexed = {};
            var sorted = [];
            for (var s = 0; s < analysis.synchronizers.length; ++s) {
                var sync = analysis.synchronizers[s];
                if (indexed[sync.className] === undefined) {
                    indexed[sync.className] = sorted.length;
                    sorted.push([sync.className, 1]);
                } else {
                    var idx = indexed[sync.className];
                    sorted[idx][1] = ++sorted[idx][1];
                }
            }
            sorted.sort(function(a, b) {
                return b[1] - a[1];
            });

            var maxLegend = this.config.synchronizerChart.max;
            var labels = [];
            var shortLabels = [];
            var dataset = {
                data: [],
                backgroundColor: []
            };
            for (var i = 0; i < sorted.length && i < maxLegend; ++i) {
                labels.push(sorted[i][0]);
                shortLabels.push(jtda.util.getPrettyClassName(sorted[i][0]));
                dataset.data.push(sorted[i][1]);
                dataset.backgroundColor.push(this.config.synchronizerChart.colors[i]);
            }
            if (sorted.length > maxLegend) {
                var cnt = 0;
                for (var j = maxLegend; j < sorted.length; ++j) {
                    cnt += sorted[j][1];
                }
                if (cnt > 0) {
                    labels.push('Others');
                    shortLabels.push('Others');
                    dataset.data.push(cnt);
                }
            }
            var res = {
                labels: shortLabels,
                longLabels: labels,
                datasets: [dataset]
            };
            return res;
        };

        this.renderRunningMethods = function(analysis) {
            this.target.append(Mustache.render(this.getTemplate('running-methods'), {
                analysisId: analysis.id,
                analysis: analysis,
                methods: function() {
                    return analysis.runningMethods.getStrings();
                },
                threadStatusColor: function() {
                    return config.threadStatusColor[this.getStatus()];
                }
            }, this._partials()));
        };

        this.renderThreads = function(analysis) {
            var config = this.config;
            var model = {
                analysisId: analysis.id,
                analysis: analysis,
                threads: analysis.threads,
                threadStatusColor: function() {
                    return config.threadStatusColor[this.getStatus()];
                },
                showThreadDetails: true
            };
            if (config.threads.groupSimilar) {
                model.threads = this.groupSimilarThreads(analysis.threads);
            }
            this.target.append(Mustache.render(this.getTemplate('threads'), model, this._partials()));
        };

        /**
         * Returns an array of objects with {threads: [thread, ...], frames: []}
         */
        this.groupSimilarThreads = function(inputThreads) {
            // Map stacks to which threads have them
            var stacksToThreads = {};
            for (var i = 0; i < inputThreads.length; i++) {
                var thread = inputThreads[i];
                var stackString = thread.frames.join('\n');
                if (!stacksToThreads.hasOwnProperty(stackString)) {
                    stacksToThreads[stackString] = [];
                }
                stacksToThreads[stackString].push(thread);
            }

            // List stacks by popularity
            var stacks = [];
            for (var stack in stacksToThreads) {
                stacks.push(stack);
            }
            stacks.sort(function(a, b) {
                if (a === b) {
                    return 0;
                }

                var scoreA = stacksToThreads[a].length;
                if (a === '') {
                    scoreA = -123456;
                }

                var scoreB = stacksToThreads[b].length;
                if (b === '') {
                    scoreB = -123456;
                }

                if (scoreB !== scoreA) {
                    return scoreB - scoreA;
                }

                // Use stack contents as secondary sort key. This is
                // needed to get deterministic enough output for being
                // able to run our unit tests in both Node.js and in
                // Chrome.
                if (a < b) {
                    return -1;
                } else {
                    return 1;
                }
            });

            // Iterate over stacks and for each stack, print first all
            // threads that have it, and then the stack itself.
            var threadsAndStacks = [];
            for (var j = 0; j < stacks.length; j++) {
                var currentStack = stacks[j];
                var threads = stacksToThreads[currentStack];

                threads.sort(jtda.Thread.compare);

                threadsAndStacks.push({
                    threads: threads,
                    frames: threads[0].frames
                });
            }

            return threadsAndStacks;
        };

        this.renderSynchronizers = function(analysis) {
            this.target.append(Mustache.render(this.getTemplate('synchronizers'), {
                analysisId: analysis.id,
                analysis: analysis,
                synchronizers: function() {
                    return analysis.synchronizers;
                },
                prettyClassName: function() {
                    return jtda.util.getPrettyClassName(this.className);
                },
                threadStatusColor: function() {
                    return config.threadStatusColor[this.getStatus()];
                }
            }, this._partials()));
        };

        this.renderGarbage = function(analysis) {
            this.target.append(Mustache.render(this.getTemplate('garbage'), {
                analysisId: analysis.id,
                analysis: analysis
            }, this._partials()));
        };

        this.target = target;
        this.config = config;
    };

}());