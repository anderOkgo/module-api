/**
 * Base interface for Commands
 * Commands modify the system state
 */
export interface Command<TResult = void> {
  readonly timestamp: Date;
}

export interface CommandHandler<TCommand extends Command<TResult>, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}
