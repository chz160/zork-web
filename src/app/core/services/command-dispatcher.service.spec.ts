import { TestBed } from '@angular/core/testing';
import { CommandDispatcherService } from './command-dispatcher.service';
import { TelemetryService } from './telemetry.service';
import { ParserResult, CommandOutput } from '../models';

describe('CommandDispatcherService', () => {
  let service: CommandDispatcherService;
  let telemetry: TelemetryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CommandDispatcherService, TelemetryService],
    });
    service = TestBed.inject(CommandDispatcherService);
    telemetry = TestBed.inject(TelemetryService);

    // Clear telemetry events
    telemetry.clearEvents();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('executeParsedCommands', () => {
    describe('fail-early policy', () => {
      it('should execute all commands when all succeed', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
          {
            verb: 'inventory',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'inventory',
            isValid: true,
          },
        ];

        const executor = jasmine
          .createSpy('executor')
          .and.returnValues(
            { messages: ['You look around.'], success: true, type: 'description' },
            { messages: ['You are empty-handed.'], success: true, type: 'inventory' }
          );

        const report = await service.executeParsedCommands(commands, executor, {
          policy: 'fail-early',
        });

        expect(report.success).toBe(true);
        expect(report.totalCommands).toBe(2);
        expect(report.executedCommands).toBe(2);
        expect(report.successfulCommands).toBe(2);
        expect(report.failedCommands).toBe(0);
        expect(report.skippedCommands).toBe(0);
        expect(report.policy).toBe('fail-early');
        expect(executor).toHaveBeenCalledTimes(2);
      });

      it('should stop execution on first failure', async () => {
        const commands: ParserResult[] = [
          {
            verb: null,
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'invalidverb',
            isValid: false,
            errorMessage: 'Unknown verb',
          },
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
        ];

        const executor = jasmine
          .createSpy('executor')
          .and.returnValue({ messages: ['Unknown verb'], success: false, type: 'error' });

        const report = await service.executeParsedCommands(commands, executor, {
          policy: 'fail-early',
        });

        expect(report.success).toBe(false);
        expect(report.totalCommands).toBe(2);
        expect(report.executedCommands).toBe(1);
        expect(report.successfulCommands).toBe(0);
        expect(report.failedCommands).toBe(1);
        expect(report.skippedCommands).toBe(1);
        expect(executor).toHaveBeenCalledTimes(1);
      });

      it('should mark subsequent commands as skipped after failure', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'take',
            directObject: 'xyz',
            indirectObject: null,
            preposition: null,
            rawInput: 'take xyz',
            isValid: true,
          },
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
          {
            verb: 'inventory',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'inventory',
            isValid: true,
          },
        ];

        const executor = jasmine
          .createSpy('executor')
          .and.returnValue({
            messages: ["You don't see any xyz here."],
            success: false,
            type: 'error',
          });

        const report = await service.executeParsedCommands(commands, executor, {
          policy: 'fail-early',
        });

        expect(report.totalCommands).toBe(3);
        expect(report.executedCommands).toBe(1);
        expect(report.skippedCommands).toBe(2);
        expect(report.results[1].skipped).toBe(true);
        expect(report.results[2].skipped).toBe(true);
        expect(report.results[1].output.messages).toContain('Skipped due to previous error');
      });

      it('should log early termination event', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'take',
            directObject: 'xyz',
            indirectObject: null,
            preposition: null,
            rawInput: 'take xyz',
            isValid: true,
          },
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
        ];

        const executor = jasmine
          .createSpy('executor')
          .and.returnValue({ messages: ['Error'], success: false, type: 'error' });

        await service.executeParsedCommands(commands, executor, { policy: 'fail-early' });

        const events = telemetry.getEvents();
        const earlyTerminationEvent = events.find((e) =>
          String(e.type).includes('commandDispatcher.earlyTermination')
        );
        expect(earlyTerminationEvent).toBeDefined();
        expect(earlyTerminationEvent?.data['remainingCommands']).toBe(1);
      });
    });

    describe('best-effort policy', () => {
      it('should execute all commands even if some fail', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'take',
            directObject: 'xyz',
            indirectObject: null,
            preposition: null,
            rawInput: 'take xyz',
            isValid: true,
          },
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
          {
            verb: 'inventory',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'inventory',
            isValid: true,
          },
        ];

        const executor = jasmine
          .createSpy('executor')
          .and.returnValues(
            { messages: ["You don't see any xyz here."], success: false, type: 'error' },
            { messages: ['You look around.'], success: true, type: 'description' },
            { messages: ['You are empty-handed.'], success: true, type: 'inventory' }
          );

        const report = await service.executeParsedCommands(commands, executor, {
          policy: 'best-effort',
        });

        expect(report.success).toBe(false); // Overall success is false because one failed
        expect(report.totalCommands).toBe(3);
        expect(report.executedCommands).toBe(3);
        expect(report.successfulCommands).toBe(2);
        expect(report.failedCommands).toBe(1);
        expect(report.skippedCommands).toBe(0);
        expect(executor).toHaveBeenCalledTimes(3);
      });

      it('should not log early termination event', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'take',
            directObject: 'xyz',
            indirectObject: null,
            preposition: null,
            rawInput: 'take xyz',
            isValid: true,
          },
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
        ];

        const executor = jasmine
          .createSpy('executor')
          .and.returnValues(
            { messages: ['Error'], success: false, type: 'error' },
            { messages: ['You look around.'], success: true, type: 'description' }
          );

        await service.executeParsedCommands(commands, executor, { policy: 'best-effort' });

        const events = telemetry.getEvents();
        const earlyTerminationEvent = events.find((e) =>
          String(e.type).includes('commandDispatcher.earlyTermination')
        );
        expect(earlyTerminationEvent).toBeUndefined();
      });
    });

    describe('async executor support', () => {
      it('should handle async executor functions', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
        ];

        const executor = jasmine.createSpy('executor').and.returnValue(
          Promise.resolve({
            messages: ['You look around.'],
            success: true,
            type: 'description',
          })
        );

        const report = await service.executeParsedCommands(commands, executor);

        expect(report.success).toBe(true);
        expect(report.executedCommands).toBe(1);
        expect(executor).toHaveBeenCalledTimes(1);
      });

      it('should await each command before executing the next', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'open',
            directObject: 'mailbox',
            indirectObject: null,
            preposition: null,
            rawInput: 'open mailbox',
            isValid: true,
          },
          {
            verb: 'take',
            directObject: 'leaflet',
            indirectObject: null,
            preposition: null,
            rawInput: 'take leaflet',
            isValid: true,
          },
        ];

        const executionOrder: number[] = [];
        const executor = jasmine.createSpy('executor').and.callFake((cmd: ParserResult) => {
          const index = commands.indexOf(cmd);
          executionOrder.push(index);
          return new Promise<CommandOutput>((resolve) => {
            // Simulate async delay
            setTimeout(() => {
              resolve({ messages: ['Success'], success: true, type: 'success' });
            }, 10);
          });
        });

        await service.executeParsedCommands(commands, executor);

        // Verify commands executed in order
        expect(executionOrder).toEqual([0, 1]);
      });
    });

    describe('error handling', () => {
      it('should handle executor exceptions with fail-early policy', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
          {
            verb: 'inventory',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'inventory',
            isValid: true,
          },
        ];

        const executor = jasmine.createSpy('executor').and.throwError('Unexpected error');

        const report = await service.executeParsedCommands(commands, executor, {
          policy: 'fail-early',
        });

        expect(report.success).toBe(false);
        expect(report.failedCommands).toBe(1);
        expect(report.skippedCommands).toBe(1);
        expect(report.results[0].output.type).toBe('error');
        expect(report.results[0].output.messages[0]).toContain('Unexpected error');
      });

      it('should handle executor exceptions with best-effort policy', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
          {
            verb: 'inventory',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'inventory',
            isValid: true,
          },
        ];

        const executor = jasmine.createSpy('executor').and.callFake((cmd: ParserResult) => {
          if (cmd.verb === 'look') {
            throw new Error('Unexpected error');
          }
          return { messages: ['You are empty-handed.'], success: true, type: 'inventory' };
        });

        const report = await service.executeParsedCommands(commands, executor, {
          policy: 'best-effort',
        });

        expect(report.success).toBe(false);
        expect(report.executedCommands).toBe(2);
        expect(report.failedCommands).toBe(1);
        expect(report.successfulCommands).toBe(1);
        expect(report.skippedCommands).toBe(0);
      });

      it('should log error events', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
        ];

        const executor = jasmine.createSpy('executor').and.throwError('Test error');

        await service.executeParsedCommands(commands, executor);

        const events = telemetry.getEvents();
        const errorEvent = events.find((e) => String(e.type).includes('commandDispatcher.error'));
        expect(errorEvent).toBeDefined();
        expect(errorEvent?.data['error']).toContain('Test error');
      });
    });

    describe('telemetry logging', () => {
      it('should log dispatcher start event', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
        ];

        const executor = jasmine
          .createSpy('executor')
          .and.returnValue({ messages: ['Success'], success: true, type: 'success' });

        await service.executeParsedCommands(commands, executor);

        const events = telemetry.getEvents();
        const startEvent = events.find((e) => String(e.type).includes('commandDispatcher.started'));
        expect(startEvent).toBeDefined();
        expect(startEvent?.data['commandCount']).toBe(1);
        expect(startEvent?.data['policy']).toBeDefined();
      });

      it('should log command execution events', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
          {
            verb: 'inventory',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'inventory',
            isValid: true,
          },
        ];

        const executor = jasmine
          .createSpy('executor')
          .and.returnValue({ messages: ['Success'], success: true, type: 'success' });

        await service.executeParsedCommands(commands, executor);

        const events = telemetry.getEvents();
        const executedEvents = events.filter((e) =>
          String(e.type).includes('commandDispatcher.commandExecuted')
        );
        expect(executedEvents.length).toBe(2);
        expect(executedEvents[0].data['index']).toBe(0);
        expect(executedEvents[1].data['index']).toBe(1);
      });

      it('should log dispatcher completed event', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
        ];

        const executor = jasmine
          .createSpy('executor')
          .and.returnValue({ messages: ['Success'], success: true, type: 'success' });

        await service.executeParsedCommands(commands, executor);

        const events = telemetry.getEvents();
        const completedEvent = events.find((e) =>
          String(e.type).includes('commandDispatcher.completed')
        );
        expect(completedEvent).toBeDefined();
        expect(completedEvent?.data['totalCommands']).toBe(1);
        expect(completedEvent?.data['executedCommands']).toBe(1);
        expect(completedEvent?.data['successfulCommands']).toBe(1);
        expect(completedEvent?.data['executionTimeMs']).toBeGreaterThanOrEqual(0);
      });
    });

    describe('execution timing', () => {
      it('should track execution time for each command', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
        ];

        const executor = jasmine.createSpy('executor').and.callFake(() => {
          return new Promise<CommandOutput>((resolve) => {
            setTimeout(() => {
              resolve({ messages: ['Success'], success: true, type: 'success' });
            }, 10);
          });
        });

        const report = await service.executeParsedCommands(commands, executor);

        expect(report.results[0].startTime).toBeDefined();
        expect(report.results[0].endTime).toBeDefined();
        expect(report.results[0].endTime.getTime()).toBeGreaterThanOrEqual(
          report.results[0].startTime.getTime()
        );
      });

      it('should track overall execution time', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
        ];

        const executor = jasmine.createSpy('executor').and.callFake(() => {
          return new Promise<CommandOutput>((resolve) => {
            setTimeout(() => {
              resolve({ messages: ['Success'], success: true, type: 'success' });
            }, 10);
          });
        });

        const report = await service.executeParsedCommands(commands, executor);

        expect(report.executionTimeMs).toBeGreaterThanOrEqual(0);
        expect(report.endTime.getTime()).toBeGreaterThanOrEqual(report.startTime.getTime());
      });
    });

    describe('default policy', () => {
      it('should use fail-early as default policy', async () => {
        const commands: ParserResult[] = [
          {
            verb: 'look',
            directObject: null,
            indirectObject: null,
            preposition: null,
            rawInput: 'look',
            isValid: true,
          },
        ];

        const executor = jasmine
          .createSpy('executor')
          .and.returnValue({ messages: ['Success'], success: true, type: 'success' });

        const report = await service.executeParsedCommands(commands, executor);

        expect(report.policy).toBe('fail-early');
      });
    });

    describe('empty command array', () => {
      it('should handle empty command array', async () => {
        const commands: ParserResult[] = [];
        const executor = jasmine.createSpy('executor');

        const report = await service.executeParsedCommands(commands, executor);

        expect(report.totalCommands).toBe(0);
        expect(report.executedCommands).toBe(0);
        expect(report.success).toBe(true);
        expect(executor).not.toHaveBeenCalled();
      });
    });
  });

  describe('createSingleCommandReport', () => {
    it('should create a report for a single successful command', () => {
      const command: ParserResult = {
        verb: 'look',
        directObject: null,
        indirectObject: null,
        preposition: null,
        rawInput: 'look',
        isValid: true,
      };

      const output: CommandOutput = {
        messages: ['You look around.'],
        success: true,
        type: 'description',
      };

      const report = service.createSingleCommandReport(command, output);

      expect(report.totalCommands).toBe(1);
      expect(report.executedCommands).toBe(1);
      expect(report.successfulCommands).toBe(1);
      expect(report.failedCommands).toBe(0);
      expect(report.skippedCommands).toBe(0);
      expect(report.success).toBe(true);
      expect(report.results.length).toBe(1);
      expect(report.results[0].command).toBe(command);
      expect(report.results[0].output).toBe(output);
    });

    it('should create a report for a single failed command', () => {
      const command: ParserResult = {
        verb: 'take',
        directObject: 'xyz',
        indirectObject: null,
        preposition: null,
        rawInput: 'take xyz',
        isValid: true,
      };

      const output: CommandOutput = {
        messages: ["You don't see any xyz here."],
        success: false,
        type: 'error',
      };

      const report = service.createSingleCommandReport(command, output);

      expect(report.totalCommands).toBe(1);
      expect(report.executedCommands).toBe(1);
      expect(report.successfulCommands).toBe(0);
      expect(report.failedCommands).toBe(1);
      expect(report.success).toBe(false);
    });
  });
});
