/**
 * Public API for TrollActor module.
 *
 * Exports the main actor class, config, and strategies for use in the game engine.
 */

export { TrollActor } from './troll-actor';
export { TrollConfig, DEFAULT_TROLL_CONFIG, TROLL_CONFIG } from './troll-config';
export { TrollBehaviorStrategy, TrollState, BehaviorResult } from './troll-behavior.strategy';
export { TrollPerceptionStrategy } from './troll-perception.strategy';
export { TrollConversationStrategy } from './troll-conversation.strategy';
