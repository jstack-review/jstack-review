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
    
    jtda.diff.Diff = function(meta, olderDump, newerDump) {
    
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
            
            this.goneThreads.sort(jtda.Thread.compare);
            this.newThreads.sort(jtda.Thread.compare);
            this.changedThreads.sort(jtda.diff.ThreadDiff.compare);
            this.unchangedThreads.sort(jtda.diff.ThreadDiff.compare);
        };
        
        this._compareThreads = function(oldThread, newThread) {
            var changes = new jtda.diff.ThreadChanges();
            changes.name = oldThread.name !== newThread.name;
            changes.status = oldThread.getStatus().status !== newThread.getStatus().status;
            changes.wantNotificationOn = oldThread.wantNotificationOn !== newThread.wantNotificationOn;
            changes.wantToAcquire = oldThread.wantToAcquire !== newThread.wantToAcquire;
            changes.locksHeld = !jtda.util.arraysEqual(oldThread.locksHeld, newThread.locksHeld);
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
    
        this.id = meta.id;
        this.info = meta;
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
        
        this.isProperties = function() {
            for (var prop in this) {
                if (prop === "frames") {
                    continue;
                }
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

        /**
         * Returns false if the stack frames are identical. Otherwise it returns
         * an array with objects: { ins : true if new, del: true if old, line: 
         * the stack entry } 
         */
        this.stackDiff = function() {
            if (!this.changed.frames) {
                return false;
            }
            if (this._stackDiff === undefined) {
                this._stackDiff = jtda.util.diff(this.older.frames, this.newer.frames); 
            }
            return this._stackDiff;
        };
    
        this.older = olderThread;
        this.newer = newerThread;
        this.changed = changed;
    };
    
    jtda.diff.ThreadDiff.compare = function(a, b) {
    	// put threads with frame changes on top
    	if (a.changed.frames && b.changed.frames) {
    		// TODO return jtda.diff.ThreadDiff.compareDiff(a, b);
    	}
    	else if (a.changed.frames && !b.changed.frames) {
    		return -1;
    	}
    	else if (!a.changed.frames && b.changed.frames) {
    		return 1;
    	}
    	var res = a.older.name.localeCompare(b.older.name);
        if (res !== 0) {
            return res;
        }
        return a.older.tid.localeCompare(b.older.tid);
    };
    
    jtda.diff.ThreadDiff.compareDiff = function(a, b) {
    	// TODO
    	return 0;
    };
    
    /*
     * Generates an array with differences between two provided arrays. Each 
     * entry might contain a "ins", or "del", or nothing, to signal that the
     * entry was added, removed, or the same.
     * 
     * Based on: http://ejohn.org/files/jsdiff.js
     */
    jtda.util.diff = function(oldStack, newStack) {
        var i, n;
        var out = jtda.util._diff(oldStack.slice(), newStack.slice());
        var res = [];
        if (out.n.length === 0) {
            for (i = 0; i < out.o.length; i++) {
                res.push({
                    del: true,
                    line: out.o[i]
                });
            }
        } else {
            if (out.n[0].text === undefined) {
                for (n = 0; n < out.o.length && out.o[n].text === undefined; n++) {
                    res.push({
                        del: true,
                        line: out.o[n]
                    });
                }
            }
            for (i = 0; i < out.n.length; i++) {
                if (out.n[i].text === undefined) {
                    res.push({
                        ins: true,
                        line: out.n[i]
                    });
                } else {
                    res.push({
                        line: out.n[i].text
                    });
                    for (n = out.n[i].row + 1; n < out.o.length && out.o[n].text === undefined; n++) {
                        res.push({
                            del: true,
                            line: out.o[n]
                        });
                    }
                }
            }
        }

        return res;
    };

    /*
     * Internal logic of the diff 
     * Based on: http://ejohn.org/files/jsdiff.js
     */
    jtda.util._diff = function(o, n) {
        var ns = {};
        var os = {};

        for (var i = 0; i < n.length; i++) {
            if (ns[n[i]] === undefined) {
                ns[n[i]] = {
                    rows: [],
                    o: null
                };
            }
            ns[n[i]].rows.push(i);
        }

        for (i = 0; i < o.length; i++) {
            if (os[o[i]] === undefined) {
                os[o[i]] = {
                    rows: [],
                    n: null
                };
            }
            os[o[i]].rows.push(i);
        }

        for (i in ns) {
            if (ns[i].rows.length === 1 && os[i] !== undefined && os[i].rows.length === 1) {
                n[ns[i].rows[0]] = {
                    text: n[ns[i].rows[0]],
                    row: os[i].rows[0]
                };
                o[os[i].rows[0]] = {
                    text: o[os[i].rows[0]],
                    row: ns[i].rows[0]
                };
            }
        }

        for (i = 0; i < n.length - 1; i++) {
            if (n[i].text !== undefined && n[i + 1].text === undefined && n[i].row + 1 < o.length && o[n[i].row + 1].text === undefined &&
                n[i + 1] == o[n[i].row + 1]) {
                n[i + 1] = {
                    text: n[i + 1],
                    row: n[i].row + 1
                };
                o[n[i].row + 1] = {
                    text: o[n[i].row + 1],
                    row: i + 1
                };
            }
        }

        for (i = n.length - 1; i > 0; i--) {
            if (n[i].text !== undefined && n[i - 1].text === undefined && n[i].row > 0 && o[n[i].row - 1].text === undefined &&
                n[i - 1] === o[n[i].row - 1]) {
                n[i - 1] = {
                    text: n[i - 1],
                    row: n[i].row - 1
                };
                o[n[i].row - 1] = {
                    text: o[n[i].row - 1],
                    row: i - 1
                };
            }
        }

        return {
            o: o,
            n: n
        };
    };
    
}());
