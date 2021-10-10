import time
#import gc
#import math

STOPPED = 1
RUNNING = 2
WAITING = 3
ERROR   = 4
class TaskMaster:
    starts_complete = False
    count = 0
    dur = 0
    current = -1
    MODES = []
    STARTS = []

    def register(self, name, runner, type):
        mode = {
            "name":name,
            "runner":runner,
            "gen":0,
            "start":time.monotonic(),
            "delay":0,
            "type":type,
            "restart":True,
            "state":STOPPED,
        }
        if mode['type'] == 'start':
            mode['restart'] = False
        self.MODES.append(mode)

    def getCurrentMode(self):
        return self.MODES[self.current]

    def start(self):
        print("starting the taskmaster")
        self.current = 0
        # only run starts once
        for mode in self.MODES:
            if mode['type'] == 'start':
                mode['gen'] = mode['runner']()
                mode['state'] = RUNNING
            else:
                mode['gen'] = mode['runner']()
                mode['state'] = RUNNING
#         if len(self.MODES) > 0:
#             self.startMode(self.getCurrentMode())

    def startMode(self, mode):
        print("starting", mode["name"])
        mode['gen'] = mode["runner"]()
        mode['state'] = RUNNING

    def stopMode(self, mode):
        print("stopping", mode["name"])
        mode['state'] = STOPPED
#         mode["shutdown"]()

    def nextMode(self):
        self.stopMode(self.getCurrentMode())
        self.current = (self.current + 1) %  len(self.MODES)
        self.startMode(self.getCurrentMode())

    def prevMode(self):
        self.stopMode(self.getCurrentMode())
        self.current = (self.current - 1) %  len(self.MODES)
        if self.current < 0:
            self.current = len(self.MODES)-1
        self.startMode(self.getCurrentMode())

    def cycleMode(self, event):
        if event['state'] == STOPPED:
            return
        now = time.monotonic()
        delay = event['delay']
        start = event['start']
        diff = now-start
        if diff > delay:
            try:
                event['delay'] = next(event['gen'])
            except StopIteration:
                if event['type'] == 'start':
                    print("stopping ", event['type'], event['name'])
                    self.starts_complete = True
                    event['state'] = STOPPED
                if event['restart']:
                     event['gen'] = event['runner']()
            except TypeError:
                if event['type'] == 'start':
                    print("stopping ", event['type'], event['name'])
                    self.starts_complete = True
                    event['state'] = STOPPED
                if event['restart']:
                     event['gen'] = event['runner']()
            event['start'] = now

    def cycle(self, rate):
        if self.starts_complete:
            self.cycle_modes()
        else:
            self.cycle_starts()
        time.sleep(rate)

    def cycle_starts(self):
        # run start handlers first
        for mode in self.MODES:
            if mode['type'] == 'start':
                self.cycleMode(mode)

    def cycle_modes(self):
        for mode in self.MODES:
            if mode['type'] == 'start':
                pass
            self.cycleMode(mode)
            self.count = self.count + 1
#             if self.count % 10 == 0:
#                 now = time.monotonic()
#                 diff = now - self.dur
#                 mf = gc.mem_free()
#                 frmem = gc.mem_free()/1024
#                 almem = gc.mem_alloc()/1024
#                 fps = 10/diff
#
#                 print(f'fps {fps:2.0f}',f'free mem {frmem:5.1f}KB', f' allo mem {almem:5.1f}KB')
#                 self.dur = now


