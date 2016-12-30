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
"use strict";

var jtda = jtda || {};
jtda.util = jtda.util || {};

jtda.Analyze = function () {

  /* analyse the provided stack trace */
  this.analyze = function(text) {
    this._init();
    
    var lines = text.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      // TODO:
      //  1: check for start of thread
      //  1a: complete thread line (in case of wrapping)
      //  1b: do new thread
      //  2: append thread content
      while (this._isIncompleteThreadHeader(line)) {
        // Multi line thread name
        i++;
        if (i >= lines.length) {
          break;
        }

        // Replace thread name newline with ", "
        line += ', ' + lines[i];
      }

      this._handleLine(line);
    }

    this._identifyWaitedForSynchronizers();
  };
  
  this._isIncompleteThreadHeader = function(line) {
    if (line.charAt(0) !== '"') {
      // Thread headers start with ", this is not it
      return false;
    }
    if (line.indexOf('prio=') !== -1) {
      // Thread header contains "prio=" => we think it's complete
      return false;
    }
    if (line.indexOf('Thread t@') !== -1) {
      // Thread header contains a thread ID => we think it's complete
      return false;
    }
    if (line.substr(line.length - 2, 2) === '":') {
      // Thread headers ending in ": are complete as seen in the example here:
      // https://github.com/spotify/threaddump-analyzer/issues/12
      return false;
    }
    return true;
  };
  
  this._handleLine = function(line) {
    // TODO better way of new thread detection than creating a new object
    var thread = new jtda.Thread(line);
    if (thread.isValid()) {
      this.threads.push(thread);
      this._currentThread = thread;
      return;
    } else if (/^\s*$/.exec(line)) {
      // We ignore empty lines, and lines containing only whitespace
      return;
    } else if (this._currentThread !== null) {
      if (this._currentThread.addStackLine(line)) {
        return;
      }
    }

    this.ignoredData.addString(line);
  };

  /* (re)initialize the state of the analysis */
  this._init = function() {
    this.threads = [];
    this.threadMap = {};
    this.synchronizers = [];
    this.synchronizerMap = {};
    this.ignoredData = [];
  };
  
  this._init();
};

jtda.Thead = function () {
};

jtda.TheadStatus = function(thread) {
  this.UNKNOWN = "?unknown?";
  this.RUNNING = "running";
  this.NON_JAVA_THREAD = "non-Java thread";
  this.TERMINATED = "terminated";
  this.NEW = "not started";
  this.SLEEPING = "sleeping";
  this.WAITING_ACQUIRE = "waiting to acquire";
  this.WAITING_NOTIFY = "awaiting notification";

  this.isRunning = function() {
    return this.status === this.RUNNING;
  };
    
  this.isWaiting = function() {
    return this.status === this.WAITING_ACQUIRE || this.status === this.WAITING_NOTIFY;
  };
  
  this.determineStatus = function() {
    if (this.thread.wantNotificationOn !== null) {
      this.status = this.WAITING_NOTIFY;
    } else if (this.thread.wantToAcquire !== null) {
      this.status = this.WAITING_ACQUIRE;
    } else if (this.thread.threadState === 'TIMED_WAITING (sleeping)') {
      this.status = this.SLEEPING;
    } else if (this.thread.threadState === 'NEW') {
      this.status = this.NEW;
    } else if (this.thread.threadState === 'TERMINATED') {
      this.status = this.TERMINATED;
    } else if (this.thread.threadState === null || this.thread.frames.length === 0 ) {
      this.status = this.NON_JAVA_THREAD;
    } else if (this.thread.threadState === 'RUNNABLE') {
      this.status = this.RUNNING;
    } else {
      this.status = this.UNKNOWN;
    }
  };
    
  this.thread = thread;
  this.determineStatus();
};

jtda.DeadlockStatus = function(severity, trail) {
  /* There is no deadlock */ 
  this.NO_RISK = 0; 
  /*  */
  this.LOW_RISK = 1;
  /* There might be a deadlock, but cannot be confirmed. */ 
  this.HIGH_RISK = 2;
  /* Definite deadlock */ 
  this.DEADLOCKED = 3;
  
  this.severity = severity;
  this.trail = trail || []; 
};

jtda.DeadlockStatus.NONE = new jtda.DeadlockStatus(jtda.DeadlockStatus.NO_RISK, []);

jtda.Synchronizer = function(id, className) {

  this.getThreadCount = function() {
    var count = 0;
    if (this.lockHolder !== null) {
      ++count;
    }
    count += this.lockWaiters.length;
    count += this.notificationWaiters.length;
    return count;
  };
  
  this.id = id;
  this.className = className;
  
  this.notificationWaiters = [];
  this.lockWaiters = [];
  this.lockHolder = null;
  this.deadlockStatus = jtda.DeadlockStatus.NONE;
};

jtda.util.getPrettyClassName = function(className) {
  if (className === undefined) {
    return undefined;
  }

  var CLASS_FOR = /^java.lang.Class for .*\.([^.]*)$/;
  var match = className.match(CLASS_FOR);
  if (match !== null) {
    return match[1] + ".class";
  }

  var PACKAGE = /^.*\.([^.]*)$/;
  match = className.match(PACKAGE);
  if (match !== null) {
    return match[1];
  }

  return className;
};
