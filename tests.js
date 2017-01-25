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

/* global QUnit */
/* global jtda */
/* global document */

QUnit.test( "thread header 1", function(assert) {
    var header = '"thread name" prio=10 tid=0x00007f16a118e000 nid=0x6e5a runnable [0x00007f18b91d0000]';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name, 'thread name');
    assert.equal(thread.tid, '0x00007f16a118e000');
    assert.equal(thread.group, undefined);
    assert.equal(thread.prio, 10);
    assert.equal(thread.nid, '0x6e5a');
    assert.equal(thread.state, 'runnable');
    assert.equal(thread.osPrio, undefined);
    assert.equal(thread.daemon, false);
});

QUnit.test( "thread header 2", function(assert) {
    var header = '"ApplicationImpl pooled thread 1" prio=4 tid=11296d000 nid=0x118a84000 waiting on condition [118a83000]';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name, 'ApplicationImpl pooled thread 1');
    assert.equal(thread.tid, '11296d000');
    assert.equal(thread.group, undefined);
    assert.equal(thread.prio, 4);
    assert.equal(thread.nid, '0x118a84000');
    assert.equal(thread.state, 'waiting on condition');
    assert.equal(thread.osPrio, undefined);
    assert.equal(thread.daemon, false);
});

QUnit.test( "thread header 3", function(assert) {
    var header = '"Gang worker#1 (Parallel GC Threads)" prio=9 tid=105002800 nid=0x10bc88000 runnable';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name, 'Gang worker#1 (Parallel GC Threads)');
    assert.equal(thread.tid, '105002800');
    assert.equal(thread.group, undefined);
    assert.equal(thread.prio, 9);
    assert.equal(thread.nid, '0x10bc88000');
    assert.equal(thread.state, 'runnable');
    assert.equal(thread.osPrio, undefined);
    assert.equal(thread.daemon, false);
});

QUnit.test( "thread header 4", function(assert) {
    var header = '"Attach Listener" #10 daemon prio=9 os_prio=31 tid=0x00007fddb280e000 nid=0x380b waiting on condition [0x0000000000000000]';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name, 'Attach Listener');
    assert.equal(thread.tid, '0x00007fddb280e000');
    assert.equal(thread.group, undefined);
    assert.equal(thread.prio, 9);
    assert.equal(thread.nid, '0x380b');
    assert.equal(thread.state, 'waiting on condition');
    assert.equal(thread.osPrio, 31);
    assert.equal(thread.daemon, true);
});

QUnit.test( "thread header 5", function(assert) {
    var header = '"Attach Listener" #10 daemon prio=9 os_prio=31 tid=0x00007fddb280e000 nid=0x380b waiting on condition';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name, 'Attach Listener');
    assert.equal(thread.tid, '0x00007fddb280e000');
    assert.equal(thread.group, undefined);
    assert.equal(thread.prio, 9);
    assert.equal(thread.nid, '0x380b');
    assert.equal(thread.state, 'waiting on condition');
    assert.equal(thread.osPrio, 31);
    assert.equal(thread.daemon, true);
});

QUnit.test( "thread header 6", function(assert) {
    var header = '"VM Thread" os_prio=31 tid=0x00007fddb2049800 nid=0x3103 runnable';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name, 'VM Thread');
    assert.equal(thread.tid, '0x00007fddb2049800');
    assert.equal(thread.group, undefined);
    assert.equal(thread.nid, '0x3103');
    assert.equal(thread.state, 'runnable');
    assert.equal(thread.osPrio, 31);
    assert.equal(thread.daemon, false);
});

QUnit.test( "thread header 7", function(assert) {
    var header = '"Queued build chains changes collector 8" daemon group="main" prio=5 tid=431,909 nid=431,909 waiting ';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name, 'Queued build chains changes collector 8');
    assert.equal(thread.tid, '431,909');
    assert.equal(thread.group, 'main');
    assert.equal(thread.prio, 5);
    assert.equal(thread.nid, '431,909');
    assert.equal(thread.state, 'waiting');
    assert.equal(thread.osPrio, undefined);
    assert.equal(thread.daemon, true);
});

QUnit.test( "thread header 8", function(assert) {
    var header = '"Attach Listener" #10 prio=9 os_prio=31 tid=0x00007fddb280e000 nid=0x380b waiting on condition [0x0000000000000000]';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name, 'Attach Listener');
    assert.equal(thread.tid, '0x00007fddb280e000');
    assert.equal(thread.group, undefined);
    assert.equal(thread.prio, 9);
    assert.equal(thread.nid, '0x380b');
    assert.equal(thread.state, 'waiting on condition');
    assert.equal(thread.osPrio, 31);
    assert.equal(thread.daemon, false);
});

QUnit.test( "thread header 9", function(assert) {
    var header = '"Connect thread foo.net session" prio=5 tid=8,057,104 nid=8,057,104';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name, 'Connect thread foo.net session');
    assert.equal(thread.tid, '8,057,104');
    assert.equal(thread.group, undefined);
    assert.equal(thread.prio, 5);
    assert.equal(thread.nid, '8,057,104');
    assert.equal(thread.state, '');
    assert.equal(thread.osPrio, undefined);
    assert.equal(thread.daemon, false);
});

QUnit.test( "thread header 10", function(assert) {
    var header = '"thread name" daemon prio=10 tid=0x00007f16a118e000 nid=0x6e5a runnable [0x00007f18b91d0000]';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name, 'thread name');
    assert.equal(thread.tid, '0x00007f16a118e000');
    assert.equal(thread.group, undefined);
    assert.equal(thread.prio, 10);
    assert.equal(thread.nid, '0x6e5a');
    assert.equal(thread.state, 'runnable');
    assert.equal(thread.osPrio, undefined);
    assert.equal(thread.daemon, true);
});

QUnit.test( "thread header 11", function(assert) {
    var header = '"VM Periodic Task Thread" prio=10 tid=0x00007f1af00c9800 nid=0x3c2c waiting on condition ';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name, 'VM Periodic Task Thread');
    assert.equal(thread.tid, '0x00007f1af00c9800');
    assert.equal(thread.group, undefined);
    assert.equal(thread.prio, 10);
    assert.equal(thread.nid, '0x3c2c');
    assert.equal(thread.state, 'waiting on condition');
    assert.equal(thread.osPrio, undefined);
    assert.equal(thread.daemon, false);
});

QUnit.test( "thread header 12", function(assert) {
    var header = '"Store spotify-uuid Spool Thread" daemon prio=10 tid=0x00007f1a16aa0800 nid=0x3f5b sleeping[0x00007f199997a000]';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name, 'Store spotify-uuid Spool Thread');
    assert.equal(thread.tid, '0x00007f1a16aa0800');
    assert.equal(thread.group, undefined);
    assert.equal(thread.prio, 10);
    assert.equal(thread.nid, '0x3f5b');
    assert.equal(thread.state, 'sleeping');
    assert.equal(thread.osPrio, undefined);
    assert.equal(thread.daemon, true);
});

QUnit.test( "thread header 13", function(assert) {
    var header = '"git@github.com:caoliang2598/ta-zelda-test.git#master"}; 09:09:58 Task started; VCS Periodical executor 39" prio=10 tid=0x00007f1728056000 nid=0x1347 sleeping[0x00007f169cdcb000]';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name,
                 'git@github.com:caoliang2598/ta-zelda-test.git#master"}; 09:09:58 Task started; VCS Periodical executor 39');
    assert.equal(thread.tid, '0x00007f1728056000');
    assert.equal(thread.group, undefined);
    assert.equal(thread.prio, 10);
    assert.equal(thread.nid, '0x1347');
    assert.equal(thread.state, 'sleeping');
    assert.equal(thread.osPrio, undefined);
    assert.equal(thread.daemon, false);
});

QUnit.test("thread header 14", function(assert){
    var header = '"http-bio-8810-exec-147" - Thread t@96965';
    var thread = new jtda.Thread(header);
    assert.equal(thread.name,'http-bio-8810-exec-147');
    assert.equal(thread.tid, '96965');
    assert.equal(thread.group, undefined);
    assert.equal(thread.prio, undefined);
    assert.equal(thread.nid, undefined);
    assert.equal(thread.state, '');
    assert.equal(thread.osPrio, undefined);
    assert.equal(thread.daemon, false);
});

QUnit.test("thread header 15", function(assert){
    // From: https://github.com/spotify/threaddump-analyzer/issues/12
    var header = '"ajp-bio-18009-exec-1189":';
    var thread = new jtda.Thread(header);
    
    assert.equal(thread.name,'ajp-bio-18009-exec-1189');

    var tid = thread.tid;
    assert.notEqual(tid, undefined);
    assert.equal(tid.indexOf('generated-id-'), 0);

    assert.equal(thread.group, undefined);
});

// A thread should be considered running if it has a stack trace and
// is RUNNABLE
QUnit.test("thread.running", function(assert) {
    var thread;

    thread = new jtda.Thread('"thread" prio=10 runnable');
    thread.addStackLine("	java.lang.Thread.State: RUNNABLE");
    thread.addStackLine(" at hej");
    assert.ok(thread.getStatus().isRunning());

    // We don't care about the free-text "not runnable" status
    thread = new jtda.Thread('"thread" prio=10 not runnable');
    thread.addStackLine("	java.lang.Thread.State: RUNNABLE");
    thread.addStackLine(" at hej");
    assert.ok(thread.getStatus().isRunning());

    thread = new jtda.Thread('"thread" prio=10 runnable');
    thread.addStackLine("	java.lang.Thread.State: TERMINATED");
    thread.addStackLine(" at hej");
    assert.ok(!thread.getStatus().isRunning());

    thread = new jtda.Thread('"thread" prio=10 not runnable');
    thread.addStackLine("	java.lang.Thread.State: TERMINATED");
    thread.addStackLine(" at hej");
    assert.ok(!thread.getStatus().isRunning());

    // Thread without Thread.State
    thread = new jtda.Thread('"thread" prio=10 runnable');
    thread.addStackLine(" at hej");
    assert.ok(!thread.getStatus().isRunning());
});

QUnit.test( "multiline thread name", function(assert) {
    // It's the Analyzer that joins lines so we have to go through the Analyzer here
    var multilineHeader = '"line 1\nline 2" prio=10 tid=0x00007f16a118e000 nid=0x6e5a runnable [0x00007f18b91d0000]';
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(multilineHeader);
    var threads = analyzer.threads;

    assert.equal(threads.length, 1);
    assert.equal(threads[0].name, 'line 1, line 2');
    assert.equal(threads[0].tid, '0x00007f16a118e000');
    assert.equal(threads[0].group, undefined);
    assert.equal(threads[0].prio, 10);
    assert.equal(threads[0].nid, '0x6e5a');
    assert.equal(threads[0].state, 'runnable');
    assert.equal(threads[0].osPrio, undefined);
    assert.equal(threads[0].daemon, false);
    assert.equal(threads[0].frames.length, 0);
});

QUnit.test( "non-multiline thread name", function(assert) {
    // It's the Analyzer that joins lines so we have to go through the Analyzer here
    var nonMultilineHeader = '"line 1":\nat x.y.Z.service(Z.java:722)';
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(nonMultilineHeader);
    var threads = analyzer.threads;

    assert.equal(threads.length, 1);
    assert.equal(threads[0].name, 'line 1');
    assert.equal(threads[0].tid.indexOf('generated-id-'), 0);
    assert.equal(threads[0].group, undefined);
    assert.equal(threads[0].prio, undefined);
    assert.equal(threads[0].nid, undefined);
    assert.equal(threads[0].state, '');
    assert.equal(threads[0].osPrio, undefined);
    assert.equal(threads[0].daemon, false);
    assert.equal(threads[0].frames.length, 0);
});

QUnit.test( "analyze stackless thread", function(assert) {
    var threadDump = '"thread name" prio=10 tid=0x00007f16a118e000 nid=0x6e5a runnable [0x00007f18b91d0000]';
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);
    var threads = analyzer.threads;
    
    assert.equal(threads.length, 1);
    assert.equal(threads[0].name, 'thread name');
    assert.equal(threads[0].tid, '0x00007f16a118e000');
    assert.equal(threads[0].group, undefined);
    assert.equal(threads[0].prio, 10);
    assert.equal(threads[0].nid, '0x6e5a');
    assert.equal(threads[0].state, 'runnable');
    assert.equal(threads[0].osPrio, undefined);
    assert.equal(threads[0].daemon, false);
    assert.equal(threads[0].frames.length, 0);
});

QUnit.test( "analyze single thread", function(assert) {
    var threadDump = [
        '"thread name" prio=10 tid=0x00007f16a118e000 nid=0x6e5a runnable [0x00007f18b91d0000]',
        '	at fluff'
    ].join('\n');
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);
    var threads = analyzer.threads;
        
    assert.equal(threads.length, 1);
    assert.equal(threads[0].name, 'thread name');
    assert.equal(threads[0].tid, '0x00007f16a118e000');
    assert.equal(threads[0].group, undefined);
    assert.equal(threads[0].prio, 10);
    assert.equal(threads[0].nid, '0x6e5a');
    assert.equal(threads[0].state, 'runnable');
    assert.equal(threads[0].osPrio, undefined);
    assert.equal(threads[0].daemon, false);
    assert.deepEqual(threads[0].frames, ['fluff']);
});

QUnit.test( "analyze thread waiting for notification", function(assert) {
    var threadDump = [
        '"Image Fetcher 2" daemon prio=8 tid=11b885800 nid=0x11e78d000 in Object.wait() [11e78c000]',
        '   java.lang.Thread.State: TIMED_WAITING (on object monitor)',
        '	at java.lang.Object.wait(Native Method)',
        '	- waiting on <7c135ea90> (a java.util.Vector)',
        '	at sun.awt.image.ImageFetcher.nextImage(ImageFetcher.java:114)',
        '	- locked <7c135ea90> (a java.util.Vector)',
        '	at sun.awt.image.ImageFetcher.fetchloop(ImageFetcher.java:167)',
        '	at sun.awt.image.ImageFetcher.run(ImageFetcher.java:136)',
        '',
        '   Locked ownable synchronizers:',
        '	- None',
    ].join('\n');
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);
    var threads = analyzer.threads;
    assert.equal(threads.length, 1);
    var thread = threads[0];

    assert.equal(thread.wantNotificationOn, '7c135ea90');
    assert.equal(thread.wantToAcquire, null);

    var locksHeld = [ /* Lock is released while synchronizing */ ];
    assert.deepEqual(thread.locksHeld, locksHeld);

    assert.equal(thread.synchronizerClasses['7c135ea90'], 'java.util.Vector');
    assert.equal(thread.synchronizerClasses['47114712gris'], null);

    // Validate global lock analysis
    assert.deepEqual(Object.keys(analyzer.synchronizerMap), ['7c135ea90']);
    assert.ok(analyzer.synchronizerMap['7c135ea90'] !== null);
    assert.ok(analyzer.synchronizerMap['7c135ea90'] !== undefined);
    assert.deepEqual(analyzer.synchronizers, [analyzer.synchronizerMap['7c135ea90']]);
});

QUnit.test( "analyze thread waiting for java.util.concurrent lock", function(assert) {
    var threadDump = [
        '"Animations" daemon prio=5 tid=11bad3000 nid=0x11dbcf000 waiting on condition [11dbce000]',
        '   java.lang.Thread.State: WAITING (parking)',
        '	at sun.misc.Unsafe.park(Native Method)',
        '	- parking to wait for  <7c2cd7dd0> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)',
        '	at java.util.concurrent.locks.LockSupport.park(LockSupport.java:156)',
        '	at java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject.await(AbstractQueuedSynchronizer.java:1987)',
        '	at java.util.concurrent.DelayQueue.take(DelayQueue.java:160)',
        '	at java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(ScheduledThreadPoolExecutor.java:609)',
        '	at java.util.concurrent.ScheduledThreadPoolExecutor$DelayedWorkQueue.take(ScheduledThreadPoolExecutor.java:602)',
        '	at java.util.concurrent.ThreadPoolExecutor.getTask(ThreadPoolExecutor.java:957)',
        '	at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:917)',
        '	at java.lang.Thread.run(Thread.java:695)',
        '',
        '   Locked ownable synchronizers:',
        '	- None',
    ].join('\n');

    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);
    var threads = analyzer.threads;
    assert.equal(threads.length, 1);
    var thread = threads[0];

    assert.equal(thread.wantNotificationOn, '7c2cd7dd0');
    assert.equal(thread.wantToAcquire, null);

    var locksHeld = [ /* None */ ];
    assert.deepEqual(thread.locksHeld, locksHeld);

    assert.equal(thread.synchronizerClasses['7c2cd7dd0'], 'java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject');
    assert.equal(thread.synchronizerClasses['47114712gris'], null);
});

QUnit.test( "analyze thread waiting for traditional lock", function(assert) {
    var threadDump = [
        '"DB-Processor-14" daemon prio=5 tid=0x003edf98 nid=0xca waiting for monitor entry [0x000000000825f020]',
        '   java.lang.Thread.State: BLOCKED (on object monitor)',
        '	at beans.ConnectionPool.getConnection(ConnectionPool.java:102)',
        '	- waiting to lock <0xe0375410> (a beans.ConnectionPool)',
        '	at beans.cus.ServiceCnt.getTodayCount(ServiceCnt.java:111)',
        '	at beans.cus.ServiceCnt.insertCount(ServiceCnt.java:43)',
        '',
        '   Locked ownable synchronizers:',
        '	- None',
    ].join('\n');

    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);
    var threads = analyzer.threads;
    assert.equal(threads.length, 1);
    var thread = threads[0];

    assert.equal(thread.wantNotificationOn, null);
    assert.equal(thread.wantToAcquire, '0xe0375410');

    var locksHeld = [ /* None */ ];
    assert.deepEqual(thread.locksHeld, locksHeld);

    assert.equal(thread.synchronizerClasses['0xe0375410'], 'beans.ConnectionPool');
    assert.equal(thread.synchronizerClasses['47114712gris'], null);
});

QUnit.test(" analyze thread waiting for locks 2", function(assert){
    var threadDump= [
        '"http-5525-116" - Thread t@151',
        '   java.lang.Thread.State: BLOCKED',
        '   at org.apache.log4j.Category.callAppenders(Category.java:205)',
        '   - waiting to lock <259a4a41> (a org.apache.log4j.spi.RootLogger) owned by "http-5525-127" t@162',
        '   at org.apache.log4j.Category.forcedLog(Category.java:391)',
        '   at org.apache.log4j.Category.log(Category.java:856)',
        '   at org.apache.juli.logging.impl.Log4JLogger.error(Log4JLogger.java:251)',
        '   at org.apache.catalina.core.StandardWrapperValve.invoke(StandardWrapperValve.java:274)',
        '   at java.lang.Thread.run(Thread.java:662)',
        '',
        '   Locked ownable synchronizers:',
        '   - None',
    ].join('\n');

    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);
    var threads = analyzer.threads;
    assert.equal(threads.length, 1);
    var thread = threads[0];

    assert.equal(thread.wantNotificationOn, null);
    assert.equal(thread.wantToAcquire, '259a4a41');

    var locksHeld = [ /* None */ ];
    assert.deepEqual(thread.locksHeld, locksHeld);

    assert.equal(thread.synchronizerClasses['259a4a41'], 'org.apache.log4j.spi.RootLogger');
    assert.equal(thread.synchronizerClasses['47114712gris'], null);
});

QUnit.test( "analyze thread holding locks", function(assert) {
    var threadDump = [
        '"ApplicationImpl pooled thread 8" daemon prio=4 tid=10d96d000 nid=0x11e68a000 runnable [11e689000]',
        '   java.lang.Thread.State: RUNNABLE',
        '	at sun.nio.ch.KQueueArrayWrapper.kevent0(Native Method)',
        '	at sun.nio.ch.KQueueArrayWrapper.poll(KQueueArrayWrapper.java:136)',
        '	at sun.nio.ch.KQueueSelectorImpl.doSelect(KQueueSelectorImpl.java:69)',
        '	at sun.nio.ch.SelectorImpl.lockAndDoSelect(SelectorImpl.java:69)',
        '	- locked <7c37ef220> (a io.netty.channel.nio.SelectedSelectionKeySet)',
        '	- locked <7c392fac0> (a java.util.Collections$UnmodifiableSet)',
        '	- locked <7c37f5b88> (a sun.nio.ch.KQueueSelectorImpl)',
        '	at sun.nio.ch.SelectorImpl.select(SelectorImpl.java:80)',
        '	at io.netty.channel.nio.NioEventLoop.select(NioEventLoop.java:618)',
        '	at io.netty.channel.nio.NioEventLoop.run(NioEventLoop.java:306)',
        '	at io.netty.util.concurrent.SingleThreadEventExecutor$5.run(SingleThreadEventExecutor.java:824)',
        '	at com.intellij.openapi.application.impl.ApplicationImpl$8.run(ApplicationImpl.java:419)',
        '	at java.util.concurrent.Executors$RunnableAdapter.call(Executors.java:439)',
        '	at java.util.concurrent.FutureTask$Sync.innerRun(FutureTask.java:303)',
        '	at java.util.concurrent.FutureTask.run(FutureTask.java:138)',
        '	at java.util.concurrent.ThreadPoolExecutor$Worker.runTask(ThreadPoolExecutor.java:895)',
        '	at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:918)',
        '	at java.lang.Thread.run(Thread.java:695)',
        '	at com.intellij.openapi.application.impl.ApplicationImpl$1$1.run(ApplicationImpl.java:149)',
        '',
        '   Locked ownable synchronizers:',
        '	- <7c393f190> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)',
    ].join('\n');
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);
    var threads = analyzer.threads;
    assert.equal(threads.length, 1);
    var thread = threads[0];

    assert.equal(thread.wantNotificationOn, null);
    assert.equal(thread.wantToAcquire, null);

    var locksHeld = [ '7c37ef220', '7c392fac0', '7c37f5b88', '7c393f190' ];
    assert.deepEqual(thread.locksHeld, locksHeld);

    assert.equal(thread.synchronizerClasses['7c37ef220'], 'io.netty.channel.nio.SelectedSelectionKeySet');
    assert.equal(thread.synchronizerClasses['7c392fac0'], 'java.util.Collections$UnmodifiableSet');
    assert.equal(thread.synchronizerClasses['7c37f5b88'], 'sun.nio.ch.KQueueSelectorImpl');
    assert.equal(thread.synchronizerClasses['7c393f190'], 'java.util.concurrent.locks.ReentrantLock$NonfairSync');
    assert.equal(thread.synchronizerClasses['47114712gris'], null);

    assert.equal(analyzer.synchronizerMap['7c37f5b88'].lockHolder, thread);
});

QUnit.test( "analyze two threads with same stack", function(assert) {
    // Thread dump with zebra before aardvark
    var threadDump = [
        '"zebra thread" prio=10 tid=0x00007f16a118e000 nid=0x6e5a runnable [0x00007f18b91d0000]',
        '	at fluff',
        "",
        '"aardvark thread" prio=10 tid=0x00007f16a118e000 nid=0x6e5a runnable [0x00007f18b91d0000]',
        '	at fluff'
    ].join('\n');

    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);

    var threads = analyzer.threads;
    assert.equal(threads.length, 2);
    var zebra = threads[0];
    assert.equal(zebra.name, "zebra thread");
    var aardvark = threads[1];
    assert.equal(aardvark.name, "aardvark thread");

    var renderer = new jtda.render.Renderer(undefined, {});
    var analysisResult = renderer.groupSimilarThreads(analyzer.threads);
    assert.deepEqual(analysisResult, [{
        // Make sure the aardvark comes before the zebra
        threads: [aardvark, zebra],
        frames: ["fluff"]
    }]);
});

QUnit.test( "thread stack", function(assert) {
    var header = '"Thread name" prio=10 tid=0x00007f1728056000 nid=0x1347 sleeping[0x00007f169cdcb000]';
    var thread = new jtda.Thread(header);
    assert.ok(thread.addStackLine("	at java.security.AccessController.doPrivileged(Native Method)"));
    assert.ok(thread.addStackLine("	- eliminated <0x00000006b3ccb178> (a java.io.PipedInputStream)"));
    assert.ok(thread.addStackLine("	at java.net.SocksSocketImpl.connect(SocksSocketImpl.java:353)"));
    assert.ok(thread.addStackLine("	- parking to wait for  <0x00000003138d65d0> (a java.util.concurrent.locks.AbstractQueuedSynchronizer$ConditionObject)"));

    // When adding stack frames we should just ignore unsupported
    // lines, and the end result should contain only supported data.
    var threadLines = thread.toString().split('\n');
    assert.deepEqual(thread.frames, [
        "java.security.AccessController.doPrivileged(Native Method)",
        "java.net.SocksSocketImpl.connect(SocksSocketImpl.java:353)"
    ]);
});

function unescapeHtml(escaped) {
    var e = document.createElement('div');
    e.innerHTML = escaped;
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
}

QUnit.test( "full dump analysis", function(assert) {
    var input = unescapeHtml(document.getElementById("sample-input").innerHTML);
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(input);
    
    assert.equal(analyzer.threads.length, 54);
    assert.equal(analyzer.threadsByStatus[jtda.ThreadStatus.WAITING_NOTIFY].length, 29);
    assert.equal(analyzer.threadsByStatus[jtda.ThreadStatus.NON_JAVA_THREAD].length, 18);
    assert.equal(analyzer.threadsByStatus[jtda.ThreadStatus.RUNNING].length, 4);
    assert.equal(analyzer.threadsByStatus[jtda.ThreadStatus.SLEEPING].length, 3);
    
    assert.equal(analyzer.synchronizers.length, 33);
    
    // TODO: validate other things
});

QUnit.test( "Top Methods from running threads", function(assert) {
    var input = unescapeHtml(document.getElementById("sample-input").innerHTML);
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(input);
    var running = analyzer.runningMethods.getStrings();
    assert.equal(running.length, 3);
    assert.equal(running[0].string, 'java.net.PlainSocketImpl.socketAccept(Native Method)');
    assert.equal(running[0].count, 2);
    assert.equal(running[1].string, 'java.lang.UNIXProcess.waitForProcessExit(Native Method)');
    assert.equal(running[1].count, 1);
    assert.equal(running[2].string, 'sun.nio.ch.KQueueArrayWrapper.kevent0(Native Method)');
    assert.equal(running[2].count, 1);    
});

QUnit.test("extract regex from string", function(assert) {
    var extracted = jtda.util.extract(/a(p)a/, "gris");
    assert.equal(extracted.value, undefined);
    assert.equal(extracted.shorterString, "gris");

    extracted = jtda.util.extract(/a(p)a/, "hejapagris");
    assert.equal(extracted.value, "p");
    assert.equal(extracted.shorterString, "hejgris");
});

QUnit.test("identical string counter", function(assert) {
    var counter = new jtda.util.StringCounter();
    assert.deepEqual(counter.getStrings().length, 0);
    assert.equal(counter.toString(), "");
    assert.equal(counter.length, 0);

    counter.addString("hej");
    assert.deepEqual(counter.getStrings(), [{count:1, string:"hej", sources: [undefined]}]);
    assert.deepEqual(counter.toString().split('\n'), [
        "1 hej"
    ]);
    assert.equal(counter.length, 1);

    counter.addString("nej");
    counter.addString("nej");
    assert.deepEqual(counter.getStrings(),
                     [
                         {count:2, string:"nej", sources:[undefined, undefined]},
                         {count:1, string:"hej", sources:[undefined]}
                     ]);
    assert.deepEqual(counter.toString().split('\n'), [
        "2 nej",
        "1 hej"
    ]);
    assert.equal(counter.length, 3);

    counter.addString("hej", "foo");
    counter.addString("hej", "bar");
    assert.deepEqual(counter.getStrings(),
                     [
                         {count:3, string:"hej", sources:[undefined, "foo", "bar"]},
                         {count:2, string:"nej", sources:[undefined, undefined]}
                     ]);
    assert.deepEqual(counter.toString().split('\n'), [
        "3 hej",
        "2 nej"
    ]);
    assert.equal(counter.length, 5);

    assert.ok(counter.hasString('hej'));
    assert.ok(counter.hasString('nej'));
    assert.ok(!counter.hasString('gris'));
});

QUnit.test("getPrettyClassName", function(assert) {
    assert.equal(jtda.util.getPrettyClassName("java.lang.Foo"), "Foo");
    assert.equal(jtda.util.getPrettyClassName("java.lang.Class for java.lang.Foo"), "Foo.class");
    assert.equal(jtda.util.getPrettyClassName("Foo"), "Foo");
    assert.equal(jtda.util.getPrettyClassName(undefined), undefined);
});

QUnit.test("thread status running", function(assert) {
    var threadStatus = new jtda.ThreadStatus({
        frames: ['frame'],
        wantNotificationOn: null,
        wantToAcquire: null,
        locksHeld: [],
        threadState: 'RUNNABLE',
    });

    assert.ok(threadStatus.isRunning());
    assert.ok(!threadStatus.isWaiting());
    assert.equal(threadStatus.toString(), 'running');
});

QUnit.test("thread status unset", function(assert) {
    var threadStatus = new jtda.ThreadStatus({
        frames: ['frame'],
        wantNotificationOn: null,
        wantToAcquire: null,
        locksHeld: [],
        threadState: null /* = missing from thread dump */,
    });

    assert.ok(!threadStatus.isRunning());
    assert.ok(!threadStatus.isWaiting());
    assert.equal(threadStatus.toString(), 'non-Java thread');
});

QUnit.test("thread status sleeping", function(assert) {
    var threadStatus = new jtda.ThreadStatus({
        frames: ['frame'],
        wantNotificationOn: null,
        wantToAcquire: null,
        locksHeld: ['aaa'],
        threadState: 'TIMED_WAITING (sleeping)',
    });

    assert.ok(!threadStatus.isRunning());
    assert.ok(!threadStatus.isWaiting());
    assert.equal(threadStatus.toString(), 'sleeping');
});

QUnit.test("thread status waiting for lock", function(assert) {
    var threadStatus = new jtda.ThreadStatus({
        frames: ['frame'],
        wantNotificationOn: null,
        wantToAcquire: '1234',
        locksHeld: ['aaa', 'bbb'],
        threadState: 'whatever',
    });

    assert.ok(!threadStatus.isRunning());
    assert.ok(threadStatus.isWaiting());
    assert.equal(threadStatus.toString(), 'waiting to acquire');
});

QUnit.test("thread status waiting for notification", function(assert) {
    var threadStatus = new jtda.ThreadStatus({
        frames: ['frame'],
        wantNotificationOn: '1234',
        wantToAcquire: null,
        locksHeld: [],
        threadState: 'whatever',
    });

    assert.ok(!threadStatus.isRunning());
    assert.ok(threadStatus.isWaiting());
    assert.equal(threadStatus.toString(), 'awaiting notification');
});

QUnit.test("thread status not started", function(assert) {
    var threadStatus = new jtda.ThreadStatus({
        frames: ['frame'],
        wantNotificationOn: null,
        wantToAcquire: null,
        locksHeld: [],
        threadState: 'NEW',
    });

    assert.ok(!threadStatus.isRunning());
    assert.ok(!threadStatus.isWaiting());
    assert.equal(threadStatus.toString(), 'not started');
});

QUnit.test("thread status terminated", function(assert) {
    var threadStatus = new jtda.ThreadStatus({
        frames: ['frame'],
        wantNotificationOn: null,
        wantToAcquire: null,
        locksHeld: [],
        threadState: 'TERMINATED',
    });

    assert.ok(!threadStatus.isRunning());
    assert.ok(!threadStatus.isWaiting());
    assert.equal(threadStatus.toString(), 'terminated');
});

QUnit.test( "analyze thread waiting for unspecified notification 1", function(assert) {
    var threadDump = [
        '"Thread Name" daemon prio=10 tid=0x000000000219d000 nid=0x3fa3 in Object.wait() [0x00007f0fc985d000]',
        '   java.lang.Thread.State: TIMED_WAITING (on object monitor)',
        '        at java.lang.Object.wait(Native Method)',
        '        at java.lang.ref.ReferenceQueue.remove(ReferenceQueue.java:136)',
        '        - locked <0x0000000780b17bc8> (a java.lang.ref.ReferenceQueue$Lock)',
        '        at org.netbeans.lib.profiler.server.ProfilerRuntimeObjLiveness$ReferenceManagerThread.run(ProfilerRuntimeObjLiveness.java:54)'
    ].join('\n');
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);
    var threads = analyzer.threads;
    assert.equal(threads.length, 1);
    var thread = threads[0];
    var threadStatus = thread.getStatus();

    assert.ok(!threadStatus.isRunning());
    assert.ok(threadStatus.isWaiting());
    assert.equal(threadStatus.toString(), 'awaiting notification');
});

QUnit.test( "analyze thread waiting for unspecified notification 2", function(assert) {
    var threadDump = [
        '"Thread Name" daemon prio=10 tid=0x00007f0fd45cf800 nid=0x2937 in Object.wait() [0x00007f0fc995e000]',
        '   java.lang.Thread.State: TIMED_WAITING (on object monitor)',
        '        at java.lang.Object.wait(Native Method)',
        '        at org.hsqldb.lib.HsqlTimer$TaskQueue.park(Unknown Source)',
        '        - locked <0x00000007805debf8> (a org.hsqldb.lib.HsqlTimer$TaskQueue)',
        '        at org.hsqldb.lib.HsqlTimer.nextTask(Unknown Source)',
        '        - locked <0x00000007805debf8> (a org.hsqldb.lib.HsqlTimer$TaskQueue)',
        '        at org.hsqldb.lib.HsqlTimer$TaskRunner.run(Unknown Source)',
        '        at java.lang.Thread.run(Thread.java:745)'
    ].join('\n');
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);
    var threads = analyzer.threads;
    assert.equal(threads.length, 1);
    var thread = threads[0];
    var threadStatus = thread.getStatus();

    assert.ok(!threadStatus.isRunning());
    assert.ok(threadStatus.isWaiting());
    assert.equal(threadStatus.toString(), 'awaiting notification');
});

QUnit.test( "analyze thread waiting for unspecified notification 3", function(assert) {
    var threadDump = [
        '"Thread Name" daemon prio=10 tid=0x000000000219d000 nid=0x3fa3 in Object.wait() [0x00007f0fc985d000]',
        '   java.lang.Thread.State: WAITING (on object monitor)',
        '        at java.lang.Object.wait(Native Method)',
        '        at java.lang.ref.ReferenceQueue.remove(ReferenceQueue.java:136)',
        '        - locked <0x0000000780b17bc8> (a java.lang.ref.ReferenceQueue$Lock)',
        '        at org.netbeans.lib.profiler.server.ProfilerRuntimeObjLiveness$ReferenceManagerThread.run(ProfilerRuntimeObjLiveness.java:54)'
    ].join('\n');
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);
    var threads = analyzer.threads;
    assert.equal(threads.length, 1);
    var thread = threads[0];
    var threadStatus = thread.getStatus();

    assert.ok(!threadStatus.isRunning());
    assert.ok(threadStatus.isWaiting());
    assert.equal(threadStatus.toString(), 'awaiting notification');
});

QUnit.test( "analyze thread waiting for unspecified notification 4", function(assert) {
    var threadDump = [
        '"Monkey" daemon prio=10 tid=0x00007f56b52a2000 nid=0x75f5 in Object.wait() [0x00007f5b01201000]',
        '   java.lang.Thread.State: TIMED_WAITING (on object monitor)',
        '	at java.lang.Object.wait(Native Method)',
        '	at java.io.PipedReader.read(PipedReader.java:257)',
        '	- eliminated <0x000000057c46ee20> (a java.io.PipedReader)',
        '	at java.io.PipedReader.read(PipedReader.java:309)',
        '	- locked <0x000000057c46ee20> (a java.io.PipedReader)',
        '	at org.cyberneko.html.HTMLScanner.load(HTMLScanner.java:1082)',
        '	at org.cyberneko.html.HTMLScanner.read(HTMLScanner.java:1043)',
        '	at java.util.concurrent.ThreadPoolExecutor$Worker.run(ThreadPoolExecutor.java:615)',
        '	at java.lang.Thread.run(Thread.java:744)',
        '',
        '   Locked ownable synchronizers:',
        '	- <0x00000004f00094c0> (a java.util.concurrent.ThreadPoolExecutor$Worker)'
    ].join('\n');
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);
    var threads = analyzer.threads;
    assert.equal(threads.length, 1);
    var thread = threads[0];
    var threadStatus = thread.getStatus();

    assert.ok(!threadStatus.isRunning());
    assert.ok(threadStatus.isWaiting());
    assert.equal(threadStatus.toString(), 'awaiting notification');
});

QUnit.test("thread status no stack trace", function(assert) {
    var threadDump =
        '"Attach Listener" daemon prio=10 tid=0x00007f1b5c001000 nid=0x1bd4 waiting on condition [0x0000000000000000]\n' +
        '   java.lang.Thread.State: RUNNABLE';
    var analyzer = new jtda.Analysis(0, {});
    analyzer.analyze(threadDump);
    var threads = analyzer.threads;
    assert.equal(threads.length, 1);
    var thread = threads[0];
    var threadStatus = thread.getStatus();

    assert.ok(!threadStatus.isRunning());
    assert.equal(threadStatus.toString(), 'non-Java thread');
});

QUnit.test("synchronizer thread count", function(assert) {
    var thread = new jtda.Thread('"Thread" prio=10 tid=1234 nid=0x6e5a runnable');
    var synchronizer = new jtda.Synchronizer("foo", "bar");
    synchronizer.notificationWaiters = [thread, thread, thread];
    synchronizer.lockWaiters = [thread, thread];
    synchronizer.lockHolder = thread;

    assert.equal(synchronizer.getThreadCount(), 6);
});

QUnit.test("synchronizer sort function", function(assert) {
    var unused = new jtda.Synchronizer("id", "ClassName");

    assert.equal(jtda.Synchronizer.compare(unused, unused), 0);

    var thread = new jtda.Thread('"Thread" prio=10 tid=1234 nid=0x6e5a runnable');
    var held = new jtda.Synchronizer("id", "ClassName");
    held.lockHolder = thread;
    assert.deepEqual([unused, held].sort(jtda.Synchronizer.compare), [held, unused]);

    var zebra = new jtda.Synchronizer("id", "Zebra");
    assert.deepEqual([zebra, unused].sort(jtda.Synchronizer.compare), [unused, zebra]);
    assert.deepEqual([zebra, unused, held].sort(jtda.Synchronizer.compare),
                     [held, unused, zebra]);

    var biggerId = new jtda.Synchronizer("jd", "ClassName");
    assert.deepEqual([zebra, biggerId, unused, held].sort(jtda.Synchronizer.compare),
                     [held, unused, biggerId, zebra]);
});

QUnit.test("deadlock, waiters but no holders", function(assert) {
    var analysis = new jtda.Analysis(0, {});
    var sync = new jtda.Synchronizer('12345', 'foo');
    sync.lockWaiters.push(new jtda.Thread('"Thread" prio=10 tid=1234 nid=0x6e5a waiting to lock [12345]'));
    analysis.synchronizers.push(sync);
    analysis._analyzeDeadlocks();
    
    assert.equal(analysis.deadlockStatus.severity, jtda.DeadlockStatus.DEADLOCKED);
    assert.equal(sync.deadlockStatus.severity, jtda.DeadlockStatus.DEADLOCKED);
    
});

QUnit.test("no deadlock, waiting for notification", function(assert) {
    var analysis = new jtda.Analysis(0, {});
    var sync = new jtda.Synchronizer('12345', 'foo');
    sync.notificationWaiters.push(new jtda.Thread('"Thread" prio=10 tid=1234 nid=0x6e5a waiting to lock [12345]'));
    analysis.synchronizers.push(sync);
    analysis._analyzeDeadlocks();
    
    assert.deepEqual(sync.deadlockStatus, jtda.DeadlockStatus.NONE);    
});

QUnit.test("no deadlock, running thread", function(assert) {
    var analysis = new jtda.Analysis(0, {});
    var sync = new jtda.Synchronizer('12345', 'foo');
    sync.lockHolder = new jtda.Thread('"Thread" prio=10 tid=1234 nid=0x6e5a running');
    analysis.synchronizers.push(sync);
    analysis._analyzeDeadlocks();
    
    assert.deepEqual(sync.deadlockStatus, jtda.DeadlockStatus.NONE);    
});

QUnit.test("no deadlock, no waiters", function(assert) {
    var analysis = new jtda.Analysis(0, {});
    var sync = new jtda.Synchronizer('12345', 'foo');
    sync.lockHolder = new jtda.Thread('"Thread" prio=10 tid=1234 nid=0x6e5a waiting to lock [12345]');
    analysis.synchronizers.push(sync);
    analysis._analyzeDeadlocks();
    
    assert.deepEqual(sync.deadlockStatus, jtda.DeadlockStatus.NONE);    
});

QUnit.test("deadlock, waiting for self", function(assert) {
    var analysis = new jtda.Analysis(0, {});
    var sync = new jtda.Synchronizer('12345', 'foo');
    sync.lockHolder = new jtda.Thread('"Thread" prio=10 tid=1234 nid=0x6e5a waiting to lock [12345]');
    sync.lockHolder.wantToAcquire = '12345';
    sync.lockWaiters.push(sync.lockHolder);
    analysis.synchronizers.push(sync);
    analysis.synchronizerMap[sync.id] = sync;
    analysis._analyzeDeadlocks();
    
    assert.equal(sync.deadlockStatus.severity, jtda.DeadlockStatus.DEADLOCKED);    
});


