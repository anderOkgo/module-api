/**
 * Interfaz base para Commands
 * Los commands modifican el estado del sistema
 */
export interface Command<TResult = void> {
  readonly timestamp: Date;
}

export interface CommandHandler<TCommand extends Command<TResult>, TResult = void> {
  execute(command: TCommand): Promise<TResult>;
}
