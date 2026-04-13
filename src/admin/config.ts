/**
 * Deployment configuration — controls how this admin instance is scoped.
 *
 * In production, derive DEPLOYMENT_MODE and CURRENT_STACK_ID from environment
 * variables or build-time injection (e.g. import.meta.env.VITE_DEPLOYMENT_MODE).
 *
 * To flip this instance to a global control panel:
 *   DEPLOYMENT_MODE = 'global'
 *
 * To target a specific stack in single-stack mode:
 *   CURRENT_STACK_ID = 'stack_cf'   // Cedar Fair dedicated stack
 *   CURRENT_STACK_ID = 'stack_na1'  // NA1 shared stack
 */

export type DeploymentMode = 'single-stack' | 'global';

// export const DEPLOYMENT_MODE: DeploymentMode = 'single-stack';
export const DEPLOYMENT_MODE: DeploymentMode = 'global';

/**
 * The stack this instance is scoped to.
 * Only used when DEPLOYMENT_MODE === 'single-stack'.
 */
export const CURRENT_STACK_ID = 'stack_na1';

/**Stack IDs for reference:
 *   'stack_cf'   // Cedar Fair dedicated stack
 *   'stack_na1'  // NA1 shared stack
 *   'stack_na2'  // NA2 shared stack
 *   'stack_na3'  // NA3 shared stack
 *   'stack_sf' // Six Flags dedicated stack
 *   'stack_eu' // EU1 shared stack
 */
