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

    jtda.diff = jtda.diff || {};
    
    jtda.diff.Diff = function(olderDump, newerDump) {
    
        this.compare = function() {
            this._init();
            this._walkThreads();
            return this.newThreads.length === 0 &&
                this.goneThreads.length === 0 &&
                this.changedThreads.length === 0;
        };
        
        this._walkThreads = function() {
            var seenOldTid = {};
            
            for (var i = 0; i < this.older.threads.length; ++i) {
                var oldThread = this.older.threads[i];
                seenOldTid[oldThread.tid] = true;
                var newThread = this.newer.threadMap[oldThread.tid];
                if (newThread === undefined) {
                    this.goneThreads.push(oldThread);
                    continue;
                }
                this._compareThreads(oldThread, newThread);
            }
            
            for (i = 0; i < this.newer.threads.length; ++i) {
                var thread = this.newer.threads[i];
                if (seenOldTid[thread.tid] === true) {
                    continue;
                }
                this.newThreads.push(thread);
            }
        };
        
        this._compareThreads = function(oldThread, newThread) {
            var changes = new jtda.diff.ThreadChanges();
            changes.name = oldThread.name !== newThread.name;
            changes.status = oldThread.getStatus().status !== newThread.getStatus().status;
            changes.wantNotificationOn = oldThread.wantNotificationOn !== newThread.wantNotificationOn;
            changes.wantToAcquire = oldThread.wantToAcquire !== newThread.wantToAcquire;
            changes.locksHeld = oldThread.locksHeld !== newThread.locksHeld;
            changes.frames = !jtda.util.arraysEqual(oldThread.frames, newThread.frames);
            if (changes.isChanged()) {
                this.changedThreads.push(new jtda.diff.ThreadDiff(oldThread, newThread, changes));
            } else {
                this.unchangedThreads.push(new jtda.diff.ThreadDiff(oldThread, newThread, changes));
            }
        };
    
        this._init = function() {
            this.goneThreads = [];
            this.newThreads = [];
            // array of jtda.diff.ThreadDiff instances
            this.changedThreads = [];
            this.unchangedThreads = [];
        };
    
        this.older = olderDump;
        this.newer = newerDump;
        this._init();
    };
    
    jtda.diff.ThreadChanges = function() {
        this.isChanged = function() {
            for (var prop in this) {
                if (this.hasOwnProperty(prop) && typeof this[prop] == "boolean" && this[prop] === true) {
                    return true;
                }                
            }
            return false;
        };
    
        this.name = false;
        this.frames = false;
        this.status = false;
        this.wantNotificationOn = false;
        this.wantToAcquire = false;
        this.locksHeld = false;
    };
    
    jtda.diff.ThreadDiff = function(olderThread, newerThread, changed) {
    
        this.older = olderThread;
        this.newer = newerThread;
        this.changed = changed;                
    };
    
}());
