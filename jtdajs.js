/*
Copyright 2014 Spotify AB
Copyright 2014 MP Objects BV

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

var jtda = jtda || {};
jtda.util = jtda.util || {};

jtda.Analyze = function () {

  this.analyze = function(text) {
    this._init();
  };

  this._init = function() {
    this.threads = [];
    this.threadMap = {};
    this.synchronizers = [];
    this.synchronizerMap = {};
  };
  
  this._init();
};

jtda.Thead = function () {
};

jtda.TheadStatus = function(thread) {
  this.isRunning = function() {
    return this.thread.frames.length > 0 && 
      this.thread.threadState === "RUNNABLE";
  };
    
  this.isWaiting = function() {
    return this.thread.wantNotificationOn !== null ||
      this.thread.wantToAcquire !== null;
  };
  
  this.getStatus = function () {
    if (this.thread.wantNotificationOn !== null) {
      return 'awaiting notification';
    } else if (this.thread.wantToAcquire !== null) {
      return 'waiting to acquire';
    } else if (this.thread.threadState === 'TIMED_WAITING (sleeping)') {
      return 'sleeping';
    } else if (this.thread.threadState === 'NEW') {
      return 'not started';
    } else if (this.thread.threadState === 'TERMINATED') {
      return 'terminated';
    } else if (this.thread.threadState === null) {
      return 'non-Java thread';
    } else if (this.thread.frames.length === 0 ) {
      return 'non-Java thread';
    } else if (this.thread.threadState === 'RUNNABLE') {
      return 'running';
    } else {
      return '?unknown?';
    }
  };
  
  this.getThread = function() {
    return this.thread;
  }
    
  this.thread = thread;
};

jtda.Synchronizer = function() {
};

