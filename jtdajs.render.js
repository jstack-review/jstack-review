/*
Copyright 2017 MP Objects BV

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/
"use strict";

var jtda = jtda || {};
jtda.render = jtda.render || {};

jtda.render.RenderConfig = function() {
  this.threadStatusColor = {}; 
  this.threadStatusColor[jtda.TheadStatus.UNKNOWN] = '#7f7f7f'; 
  this.threadStatusColor[jtda.TheadStatus.RUNNING] = '#2ca02c'; 
  this.threadStatusColor[jtda.TheadStatus.NON_JAVA_THREAD] = '#9467bd'; 
  this.threadStatusColor[jtda.TheadStatus.TERMINATED] = '#8c564b';
  this.threadStatusColor[jtda.TheadStatus.NEW] = '#17becf';
  this.threadStatusColor[jtda.TheadStatus.SLEEPING] = '#1f77b4'; 
  this.threadStatusColor[jtda.TheadStatus.WAITING_ACQUIRE] = '#ff7f0e'; 
  this.threadStatusColor[jtda.TheadStatus.WAITING_NOTIFY] = '#d62728';
  
  this.synchronizerChart = {
    max: 7,
    colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf' ]
  };
};

jtda.render.Renderer = function(target, config) {
  this.getTemplate = function(name) {
    return $('#tmpl-analysis-'+name).html();
  };
  
  /**
   * returns a function to lookup Mustache partials
   */
  this._partials = function() {
    var _this = this;
    return function(name) {return _this.getTemplate(name);};
  }; 

  this.render = function(analysis) {
    this.target.empty();
    this.target.append(Mustache.render(this.getTemplate('navbar'), {analysis_id: analysis.id, analysis: analysis}, this._partials()));
    
    this.renderOverview(analysis);
    this.renderRunningMethods(analysis);
    this.renderThreads(analysis);
    this.renderSynchronizers(analysis);
    this.renderGarbage(analysis);
  };
  
  this.renderOverview = function(analysis) {
    this.target.append(Mustache.render(this.getTemplate('overview'), {
      analysis_id: analysis.id, 
      analysis: analysis
    }, this._partials()));
    
    new Chart('thread_status_chart_'+analysis.id, {
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
    
    new Chart('sync_type_chart_'+analysis.id, {
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
              return lbl+cnt;
            }
          }
        }
      }
    });
  };
  
  this.getThreadStatusChartData = function(analysis) {
    var sorted = [];
    for (var status in analysis.threadsByStatus) {
      sorted.push([status, analysis.threadsByStatus[status].length])
    }
    sorted.sort(function(a, b) {
        return b[1] - a[1];
    });
    var labels = [];          
    var dataset = { data: [], backgroundColor: [] };
    for (var i = 0; i < sorted.length; ++i) {
      labels.push(sorted[i][0]);
      dataset.data.push(sorted[i][1]);
      dataset.backgroundColor.push(this.config.threadStatusColor[sorted[i][0]]);
    }
    var res = { labels: labels, datasets: [dataset] };
    return res;
  };
  
  this.getSynchronizerTypeChartData = function(analysis) {
    var indexed = {};
    var sorted = [];
    for (var sync of analysis.synchronizers) {
      if (indexed[sync.className] === undefined) {
        indexed[sync.className] = sorted.length;
        sorted.push([sync.className, 1])
      }
      else {
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
    var dataset = { data: [], backgroundColor: [] };
    for (var i = 0; i < sorted.length && i < maxLegend; ++i) {
      labels.push(sorted[i][0]);
      shortLabels.push(jtda.util.getPrettyClassName(sorted[i][0]));
      dataset.data.push(sorted[i][1]);
      dataset.backgroundColor.push(this.config.synchronizerChart.colors[i]);
    }
    if (sorted.length > maxLegend) {
      var cnt = 0;
      for (var i = maxLegend; i < sorted.length; ++i) {
        cnt += sorted[i][1];
      }
      if (cnt > 0) {
        labels.push('Others');
        shortLabels.push('Others');
        dataset.data.push(cnt);
      }
    }
    var res = { labels: shortLabels, longLabels: labels, datasets: [dataset] };
    return res;
  };
  
  this.renderRunningMethods = function(analysis) {
    this.target.append(Mustache.render(this.getTemplate('running-methods'), {
      analysis_id: analysis.id, 
      analysis: analysis,
      methods: function() {return analysis.runningMethods.getStrings();}
    }, this._partials()));
  };
  
  this.renderThreads = function(analysis) {
    var config = this.config;
    this.target.append(Mustache.render(this.getTemplate('threads'), {
      analysis_id: analysis.id, 
      analysis: analysis,
      threads: function() {return analysis.threads;},
      threadStatusColor: function() {        
        return config.threadStatusColor[this.getStatus()]; 
      }
    }, this._partials()));
  };
  
  this.renderSynchronizers = function(analysis) {
    this.target.append(Mustache.render(this.getTemplate('synchronizers'), {
      analysis_id: analysis.id, 
      analysis: analysis,
      synchronizers: function() {return analysis.synchronizers;},
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
      analysis_id: analysis.id, 
      analysis: analysis
    }, this._partials()));
  };

  this.target = target;
  this.config = config;
};
