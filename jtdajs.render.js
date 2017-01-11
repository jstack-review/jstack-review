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
  
};

jtda.render.Renderer = function(target, config) {
  this.render = function(analysis) {
    this.target.empty();
    this.target.append(Mustache.render($('#tmpl-analysis-navbar').html(), analysis));
    
    this.renderOverview(analysis);
    this.renderRunningMethods(analysis);
    this.renderThreads(analysis);
    this.renderSynchronizers(analysis);
    this.renderGarbage(analysis);
  };
  
  this.renderOverview = function(analysis) {
    this.target.append(Mustache.render($('#tmpl-analysis-overview').html(), analysis));
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
  };
  
  this.getThreadStatusChartData = function(analysis) {
    var sorted = [];
    for (var status in analysis.threadsByStatus) {
      sorted.push([status, analysis.threadsByStatus[status].length])
    }
    sorted.sort(function(a, b) {
        return b[1] - a[1];
    })
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
  
  this.renderRunningMethods = function(analysis) {
    this.target.append(Mustache.render($('#tmpl-analysis-running-methods').html(), analysis));
  };
  
  this.renderThreads = function(analysis) {
    this.target.append(Mustache.render($('#tmpl-analysis-threads').html(), analysis));
  };
  
  this.renderSynchronizers = function(analysis) {
    this.target.append(Mustache.render($('#tmpl-analysis-synchronizers').html(), analysis));
  };
  
  this.renderGarbage = function(analysis) {
    this.target.append(Mustache.render($('#tmpl-analysis-garbage').html(), analysis));
  };

  this.target = target;
  this.config = config;
};
