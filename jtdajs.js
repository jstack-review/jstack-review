/*
Copyright 2014-2016 Spotify AB
Copyright 2016-2017 MP Objects BV

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
(function() {
    "use strict";

    jtda.AnalysisConfig = function() {
        // for future usage
    };

    jtda.Analysis = function(id, name, config) {

        /* analyse the provided stack trace */
        this.analyze = function(text) {
            this._init();
            this._analyzeThreads(text);
            this._countRunningMethods();
            this._analyzeSynchronizers();
            this._analyzeDeadlocks();
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
            this._mapThreadsByStatus();
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

            this.ignoredData.addString(line);
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

        this._mapThreadsByStatus = function() {
            for (var i = 0; i < this.threads.length; i++) {
                var thread = this.threads[i];
                var status = thread.getStatus().status;
                if (this.threadsByStatus[status]) {
                    this.threadsByStatus[status].push(thread);
                } else {
                    this.threadsByStatus[status] = [thread];
                }
            }
        };

        this._countRunningMethods = function() {
            for (var i = 0; i < this.threads.length; i++) {
                var thread = this.threads[i];
                if (!thread.getStatus().isRunning() || thread.frames.length === 0) {
                    continue;
                }
                var runningMethod = thread.frames[0].replace(/^\s+at\s+/, '');
                this.runningMethods.addString(runningMethod, thread);
            }
            this.runningMethods.sortSources(this.threadComparator);
        };

        this._analyzeSynchronizers = function() {
            this._mapSynchronizers();
            this._xrefSynchronizers();
            this._sortSynchronizersRefs();
            // Sort the synchronizers by number of references
            this.synchronizers.sort(jtda.Synchronizer.compare);
        };

        /**
         * Build up the synchronizer map
         */
        this._mapSynchronizers = function() {
            for (var i = 0; i < this.threads.length; i++) {
                var thread = this.threads[i];

                this._registerSynchronizer(thread.wantNotificationOn, thread.synchronizerClasses);
                this._registerSynchronizer(thread.wantToAcquire, thread.synchronizerClasses);

                for (var j = 0; j < thread.locksHeld.length; j++) {
                    this._registerSynchronizer(thread.locksHeld[j], thread.synchronizerClasses);
                }
            }

            var ids = Object.keys(this.synchronizerMap);
            for (var k = 0; k < ids.length; k++) {
                var id = ids[k];
                this.synchronizers.push(this.synchronizerMap[id]);
            }
        };

        this._registerSynchronizer = function(id, synchronizerClasses) {
            if (id === null) {
                return;
            }
            if (this.synchronizerMap[id] === undefined) {
                this.synchronizerMap[id] = new jtda.Synchronizer(id, synchronizerClasses[id]);
            }
        };

        /**
         * Cross reference the synchronizers and threads
         */
        this._xrefSynchronizers = function() {
            for (var i = 0; i < this.threads.length; i++) {
                var thread = this.threads[i];

                var synchronizer;
                if (thread.wantNotificationOn !== null) {
                    synchronizer = this.synchronizerMap[thread.wantNotificationOn];
                    synchronizer.notificationWaiters.push(thread);
                }
                if (thread.wantToAcquire !== null) {
                    synchronizer = this.synchronizerMap[thread.wantToAcquire];
                    synchronizer.lockWaiters.push(thread);
                }

                for (var j = 0; j < thread.locksHeld.length; j++) {
                    synchronizer = this.synchronizerMap[thread.locksHeld[j]];
                    synchronizer.lockHolder = thread;
                }
            }
        };
        
        this._sortSynchronizersRefs = function() {
            for (var i = 0; i < this.synchronizers.length; ++i) {
                var synchronizer = this.synchronizers[i];
                synchronizer.lockWaiters.sort(this.threadComparator);
                synchronizer.notificationWaiters.sort(this.threadComparator);
            }
        };

        this._analyzeDeadlocks = function() {
            for (var i = 0; i < this.synchronizers.length; ++i) {
                var synchronizer = this.synchronizers[i];
                var status = this._determineDeadlockStatus(synchronizer);
                if (status.severity === 0) {
                    continue;
                }
                if (this.deadlockStatus.severity < status.severity) {
                    // TODO: use compareTo which also takes into account other factors
                    this.deadlockStatus = status;
                }
                synchronizer.deadlockStatus = status;
            }
        };

        this._determineDeadlockStatus = function(sync) {
            if (sync.lockHolder === null) {
                if (sync.lockWaiters.length > 0) {
                    return new jtda.DeadlockStatus(jtda.DeadlockStatus.DEADLOCKED, []);
                } else {
                    return jtda.DeadlockStatus.NONE;
                }
            }
            if (sync.lockHolder.getStatus().status === jtda.ThreadStatus.WAITING_NOTIFY && sync.lockHolder.wantNotificationOn === null) {
                // waiting, but no notification object??
                return new jtda.DeadlockStatus(jtda.DeadlockStatus.HIGH_RISK, []);
            }
            if (!sync.lockHolder.getStatus().isWaiting()) {
                return jtda.DeadlockStatus.NONE;
            }
            if (sync.lockWaiters.length === 0 && sync.notificationWaiters.length === 0) {
                // nobody is waiting for us
                return jtda.DeadlockStatus.NONE;
            }
            // If there is a loop on "waiting to acquire" then there is a deadlock
            // If a thread is "awaiting notification" then there might be a deadlock
            var work = [];
            work.push(sync.lockHolder);
            var visited = {};
            visited[sync.id] = true;
            while (work.length > 0) {
                var thread = work.pop();
                if (thread.wantNotificationOn !== null) {
                    return new jtda.DeadlockStatus(jtda.DeadlockStatus.HIGH_RISK, []);
                }
                if (thread.wantToAcquire !== null) {
                    if (visited[thread.wantToAcquire]) {
                        return new jtda.DeadlockStatus(jtda.DeadlockStatus.DEADLOCKED, []);
                    }
                    visited[thread.wantToAcquire] = true;
                    var synchro = this.synchronizerMap[thread.wantToAcquire];
                    if (synchro.lockHolder !== null) {
                        work.push(synchro.lockHolder);
                    }
                }
            }
            // ???
            return new jtda.DeadlockStatus(jtda.DeadlockStatus.DEADLOCKED, []);
        };

        /* (re)initialize the state of the analysis */
        this._init = function() {
            this.threads = [];
            this.threadMap = {};
            this.threadsByStatus = {};
            this.synchronizers = [];
            this.synchronizerMap = {};
            this.ignoredData = new jtda.util.StringCounter();
            this.runningMethods = new jtda.util.StringCounter();
            this.deadlockStatus = jtda.DeadlockStatus.NONE;
        };

        this.id = id;
        this.name = name;
        this.filename = undefined;
        this.config = config;
        this.threadComparator = jtda.Thread.compare;
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
            return new jtda.ThreadStatus(this);
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

            if (this.tid === undefined) {
                match = jtda.util.extract(/ - Thread t@([0-9a-fx]+)/, line);
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
    
    jtda.Thread.compare = function(a, b) {
        var res = a.name.localeCompare(b.name);
        if (res !== 0) {
            return res;
        }
        return a.tid.localeCompare(b.tid);
    };

    jtda.ThreadStatus = function(thread) {
        this.isRunning = function() {
            return this.status === jtda.ThreadStatus.RUNNING;
        };

        this.isWaiting = function() {
            return this.status === jtda.ThreadStatus.WAITING_ACQUIRE || this.status === jtda.ThreadStatus.WAITING_NOTIFY;
        };

        this.determineStatus = function() {
            if (this.thread.wantNotificationOn !== null) {
                this.status = jtda.ThreadStatus.WAITING_NOTIFY;
            } else if (this.thread.threadState === 'WAITING (on object monitor)') {
                this.status = jtda.ThreadStatus.WAITING_NOTIFY;
            } else if (this.thread.wantToAcquire !== null) {
                this.status = jtda.ThreadStatus.WAITING_ACQUIRE;
            } else if (this.thread.threadState === 'TIMED_WAITING (sleeping)') {
                this.status = jtda.ThreadStatus.SLEEPING;
            } else if (this.thread.threadState === 'NEW') {
                this.status = jtda.ThreadStatus.NEW;
            } else if (this.thread.threadState === 'TERMINATED') {
                this.status = jtda.ThreadStatus.TERMINATED;
            } else if (this.thread.threadState === null || this.thread.frames.length === 0) {
                this.status = jtda.ThreadStatus.NON_JAVA_THREAD;
            } else if (this.thread.threadState === 'RUNNABLE') {
                this.status = jtda.ThreadStatus.RUNNING;
            } else {
                this.status = jtda.ThreadStatus.UNKNOWN;
            }
        };

        this.toString = function() {
            return this.status;
        };

        this.thread = thread;
        this.determineStatus();
    };

    jtda.ThreadStatus.UNKNOWN = "?unknown?";
    jtda.ThreadStatus.RUNNING = "running";
    jtda.ThreadStatus.NON_JAVA_THREAD = "non-Java thread";
    jtda.ThreadStatus.TERMINATED = "terminated";
    jtda.ThreadStatus.NEW = "not started";
    jtda.ThreadStatus.SLEEPING = "sleeping";
    jtda.ThreadStatus.WAITING_ACQUIRE = "waiting to acquire";
    jtda.ThreadStatus.WAITING_NOTIFY = "awaiting notification";
    
    jtda.ThreadStatus.ALL = [
        jtda.ThreadStatus.RUNNING,
        jtda.ThreadStatus.WAITING_NOTIFY,
        jtda.ThreadStatus.WAITING_ACQUIRE,
        jtda.ThreadStatus.SLEEPING,
        jtda.ThreadStatus.NEW,
        jtda.ThreadStatus.TERMINATED,
        jtda.ThreadStatus.NON_JAVA_THREAD,
        jtda.ThreadStatus.UNKNOWN
    ];

    jtda.DeadlockStatus = function(severity, trail) {
        this.severity = severity;
        this.trail = trail || [];

        this.toString = function() {
            switch (this.severity) {
                case jtda.DeadlockStatus.NO_RISK:
                    return "No deadlock";
                case jtda.DeadlockStatus.LOW_RISK:
                    return "Deadlock suspect";
                case jtda.DeadlockStatus.HIGH_RISK:
                    return "Possible deadlock";
                case jtda.DeadlockStatus.DEADLOCKED:
                    return "Deadlocked";
                default:
                    return "Unknown?";
            }
        };

        this.notificationLevel = function() {
            switch (this.severity) {
                case jtda.DeadlockStatus.NO_RISK:
                    return "";
                case jtda.DeadlockStatus.LOW_RISK:
                    return "info";
                case jtda.DeadlockStatus.HIGH_RISK:
                    return "warning";
                case jtda.DeadlockStatus.DEADLOCKED:
                    return "danger";
                default:
                    return "default";
            }
        };
    };

    /* There is no deadlock */
    jtda.DeadlockStatus.NO_RISK = 0;
    /*  */
    jtda.DeadlockStatus.LOW_RISK = 1;
    /* There might be a deadlock, but cannot be confirmed. */
    jtda.DeadlockStatus.HIGH_RISK = 2;
    /* Definite deadlock */
    jtda.DeadlockStatus.DEADLOCKED = 3;

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

    jtda.Synchronizer.compare = function(a, b) {
        var deadlock = b.deadlockStatus.severity - b.deadlockStatus.severity;
        if (deadlock !== 0) {
            return deadlock;
        }

        var countDiff = b.getThreadCount() - a.getThreadCount();
        if (countDiff !== 0) {
            return countDiff;
        }

        var prettyA = jtda.util.getPrettyClassName(a.className);
        var prettyB = jtda.util.getPrettyClassName(b.className);
        if (prettyA !== prettyB) {
            return prettyA.localeCompare(prettyB);
        }

        return a.id.localeCompare(b.id);
    };

    jtda.util = jtda.util || {};

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
            return {
                value: undefined,
                shorterString: string
            };
        }

        return {
            value: match[1],
            shorterString: string.replace(regex, "")
        };
    };

    jtda.util.StringCounter = function() {
        this.addString = function(string, source) {
            if (!this._stringsToCounts.hasOwnProperty(string)) {
                this._stringsToCounts[string] = {
                    count: 0,
                    sources: []
                };
            }
            this._stringsToCounts[string].count++;
            this._stringsToCounts[string].sources.push(source);
            this.length++;
        };

        this.hasString = function(string) {
            return this._stringsToCounts.hasOwnProperty(string);
        };

        // Returns all individual string and their counts as
        // {count:5, string:"foo", sources: [...]} hashes.
        this.getStrings = function() {
            var returnMe = [];

            for (var string in this._stringsToCounts) {
                var count = this._stringsToCounts[string].count;
                var sources = this._stringsToCounts[string].sources;
                returnMe.push({
                    count: count,
                    string: string,
                    sources: sources
                });
            }

            returnMe.sort(function(a, b) {
                if (a.count === b.count) {
                    return a.string < b.string ? -1 : 1;
                }

                return b.count - a.count;
            });

            return returnMe;
        };

        this.toString = function() {
            var string = "";
            var countedStrings = this.getStrings();
            for (var i = 0; i < countedStrings.length; i++) {
                if (string.length > 0) {
                    string += '\n';
                }
                string += countedStrings[i].count +
                    " " + countedStrings[i].string;
            }
            return string;
        };
        
        this.sortSources = function(compare) {
            if (compare === undefined) {
                return;
            }
            for (var string in this._stringsToCounts) {
                this._stringsToCounts[string].sources.sort(compare);
            }
        };

        this._stringsToCounts = {};
        this.length = 0;
    };
    
    jtda.util.arraysEqual = function (a, b) {
        if (a.length != b.length) {
            return false;
        }
        return a.every(function(e, idx) {
            return e === b[idx];
        });
    };

    jtda._internal = jtda._internal || {};
    jtda._internal.generatedIdCounter = 1;

}());