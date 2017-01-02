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

jtda.AnalysisConfig = function() {
  // for future usage
};

jtda.Analysis = function(id, config) {

  /* analyse the provided stack trace */
  this.analyze = function(text) {
    this._init();
    this._analyzeThreads(text);
    // TODO analyze the rest
  };
  
  this._analyzeThreads = function(text) {
    this._currentThread = null;  
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
    if (this._currentThread) {
      delete this._currentThread;
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
      this.threadMap[thread.tid] = thread;
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

    // TODO: this.ignoredData.addString(line);
  };
  
  /* Some threads are waiting for notification, but the thread dump
   * doesn't say on which object. This function guesses in the
   * simple case where those threads are holding only a single lock.
   */
  this._identifyWaitedForSynchronizers = function() {
    for (var i = 0; i < this.threads.length; i++) {
      var thread = this.threads[i];

      if (-1 === ['TIMED_WAITING (on object monitor)', 'WAITING (on object monitor)'].indexOf(thread.threadState)) {
        // Not waiting for notification
        continue;
      }
      if (thread.wantNotificationOn !== null || thread.classicalLocksHeld.length !== 1) {
        continue;
      }

      thread.setWantNotificationOn(thread.classicalLocksHeld[0]);
    }
  };

  /* (re)initialize the state of the analysis */
  this._init = function() {
    this.threads = [];
    this.threadMap = {};
    this.synchronizers = [];
    this.synchronizerMap = {};
    this.ignoredData = [];
  };
  
  this.id = id;
  this.config = config;
  this._init();
};

jtda.Thread = function(spec) {

  this.isValid = function() {
    return this.hasOwnProperty('name') && this.name !== undefined;
  };
  
  // Return true if the line was understood, false otherwise 
  this.addStackLine = function(line) {
    var match;

    var FRAME = /^\s+at (.*)/;
    match = line.match(FRAME);
    if (match !== null) {
      this.frames.push(match[1]);
      return true;
    }

    var THREAD_STATE = /^\s*java.lang.Thread.State: (.*)/;
    match = line.match(THREAD_STATE);
    if (match !== null) {
      this.threadState = match[1];
      return true;
    }

    var SYNCHRONIZATION_STATUS = /^\s+- (.*?) +<([x0-9a-f]+)> \(a (.*)\)/;
    match = line.match(SYNCHRONIZATION_STATUS);
    if (match !== null) {
      var state = match[1];
      var id = match[2];
      var className = match[3];
      this.synchronizerClasses[id] = className;

      switch (state) {
      case "eliminated":
        // JVM internal optimization, not sure why it's in the
        // thread dump at all
        return true;

      case "waiting on":
        this.wantNotificationOn = id;
        return true;

      case "parking to wait for":
        this.wantNotificationOn = id;
        return true;

      case "waiting to lock":
        this.wantToAcquire = id;
        return true;

      case "locked":
        if (this.wantNotificationOn === id) {
          // Lock is released while waiting for the notification
          return true;
        }
        // Threads can take the same lock in different frames,
        // but we just want a mapping between threads and
        // locks so we must not list any lock more than once.
        jtda.util.arrayAddUnique(this.locksHeld, id);
        jtda.util.arrayAddUnique(this.classicalLocksHeld, id);
        return true;

      default:
        return false;
      }
    }

    var HELD_LOCK = /^\s+- <([x0-9a-f]+)> \(a (.*)\)/;
    match = line.match(HELD_LOCK);
    if (match !== null) {
      var lockId = match[1];
      var lockClassName = match[2];
      this.synchronizerClasses[lockId] = lockClassName;
      // Threads can take the same lock in different frames, but
      // we just want a mapping between threads and locks so we
      // must not list any lock more than once.
      jtda.util.arrayAddUnique(this.locksHeld, lockId);
      return true;
    }

    var LOCKED_OWNABLE_SYNCHRONIZERS = /^\s+Locked ownable synchronizers:/;
    match = line.match(LOCKED_OWNABLE_SYNCHRONIZERS);
    if (match !== null) {
      // Ignore these lines
      return true;
    }

    var NONE_HELD = /^\s+- None/;
    match = line.match(NONE_HELD);
    if (match !== null) {
      // Ignore these lines
      return true;
    }

    return false;
  };
  
  this.getStatus = function() {
    // TODO: do not recreate every time
    return new jtda.TheadStatus(this);
  };
  
  this.setWantNotificationOn = function(lockId) {
    this.wantNotificationOn = lockId;

    var lockIndex = this.locksHeld.indexOf(lockId);
    if (lockIndex >= 0) {
      this.locksHeld.splice(lockIndex, 1);
    }

    var classicalLockIndex = this.classicalLocksHeld.indexOf(lockId);
    if (classicalLockIndex >= 0) {
      this.classicalLocksHeld.splice(classicalLockIndex, 1);
    }
  };
  
  this._parseSpec = function(line) {
    var match;
    match = jtda.util.extract(/\[([0-9a-fx,]+)\]$/, line);
    this.dontKnow = match.value;
    line = match.shorterString;

    match = jtda.util.extract(/ nid=([0-9a-fx,]+)/, line);
    this.nid = match.value;
    line = match.shorterString;

    match = jtda.util.extract(/ tid=([0-9a-fx,]+)/, line);
    this.tid = match.value;
    line = match.shorterString;

    if(this.tid === undefined){
      match = jtda.util.extract(/ - Thread t@([0-9a-fx]+)/,line);
      this.tid = match.value;
      line = match.shorterString;
    }

    match = jtda.util.extract(/ prio=([0-9]+)/, line);
    this.prio = match.value;
    line = match.shorterString;

    match = jtda.util.extract(/ os_prio=([0-9a-fx,]+)/, line);
    this.osPrio = match.value;
    line = match.shorterString;

    match = jtda.util.extract(/ (daemon)/, line);
    this.daemon = (match.value !== undefined);
    line = match.shorterString;

    match = jtda.util.extract(/ #([0-9]+)/, line);
    this.number = match.value;
    line = match.shorterString;

    match = jtda.util.extract(/ group="(.*)"/, line);
    this.group = match.value;
    line = match.shorterString;

    match = jtda.util.extract(/^"(.*)" /, line);
    this.name = match.value;
    line = match.shorterString;

    if (this.name === undefined) {
      match = jtda.util.extract(/^"(.*)":?$/, line);
      this.name = match.value;
      line = match.shorterString;
    }

    this.state = line.trim();

    if (this.name === undefined) {
      return undefined;
    }
    if (this.tid === undefined) {
      this.tid = "generated-id-" + jtda._internal.generatedIdCounter;
      jtda._internal.generatedIdCounter++;
    }
  };
  
  // Initialize the object
  this._parseSpec(spec);
  
  this.frames = [];
  this.wantNotificationOn = null;
  this.wantToAcquire = null;
  this.locksHeld = [];
  this.synchronizerClasses = {};
  this.threadState = null;

  // Only synchronized(){} style locks
  this.classicalLocksHeld = [];
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

jtda.util.arrayAddUnique = function(array, toAdd) {
    if (array.indexOf(toAdd) === -1) {
        array.push(toAdd);
    }
};

// Extracts a substring from a string.
//
// Returns an object with two properties:
// value = the first group of the extracted object
// shorterString = the string with the full contents of the regex removed
jtda.util.extract = function(regex, string) {
  var match = regex.exec(string);
  if (match === null) {
    return {value: undefined, shorterString: string};
  }

  return {value: match[1], shorterString: string.replace(regex, "")};
};

jtda._internal = jtda._internal || {};
jtda._internal.generatedIdCounter = 1;