import { School } from '../../types';
import { ramtekSchools } from './ramtek';
import { saonerSchools } from './saoner';
import { moudaSchools } from './mouda';
import { parseoniSchools } from './parseoni';
import { kampteeSchools } from './kamptee';
import { bhiwapurSchools } from './bhiwapur';
import { hingnaSchools } from './hingna';
import { kalmeshwarSchools } from './kalmeshwar';

// Block-by-block export for modular loading and extensibility
export { ramtekSchools } from './ramtek';
export { saonerSchools } from './saoner';
export { moudaSchools } from './mouda';
export { parseoniSchools } from './parseoni';
export { kampteeSchools } from './kamptee';
export { bhiwapurSchools } from './bhiwapur';
export { hingnaSchools } from './hingna';
export { kalmeshwarSchools } from './kalmeshwar';

export interface BlockMeta {
  name: string;
  count: number;
  isLoaded: boolean;
}

export const AVAILABLE_BLOCKS_META: BlockMeta[] = [
  { name: 'RAMTEK', count: ramtekSchools.length, isLoaded: true },
  { name: 'SAONER', count: saonerSchools.length, isLoaded: true },
  { name: 'MOUDA', count: moudaSchools.length, isLoaded: true },
  { name: 'PARSEONI', count: parseoniSchools.length, isLoaded: true },
  { name: 'KAMPTEE', count: kampteeSchools.length, isLoaded: true },
  { name: 'BHIWAPUR', count: bhiwapurSchools.length, isLoaded: true },
  { name: 'HINGNA', count: hingnaSchools.length, isLoaded: true },
  { name: 'KALMESHWAR', count: kalmeshwarSchools.length, isLoaded: true },
  { name: 'NARKHED', count: 0, isLoaded: false },
  { name: 'KATOL', count: 0, isLoaded: false },
  { name: 'NAGPUR', count: 0, isLoaded: false },
  { name: 'UMRED', count: 0, isLoaded: false },
  { name: 'KUHI', count: 0, isLoaded: false },
  { name: 'URC 1', count: 0, isLoaded: false },
  { name: 'URC 2', count: 0, isLoaded: false },
  { name: 'URC 3', count: 0, isLoaded: false },
  { name: 'URC 4', count: 0, isLoaded: false },
  { name: 'URC 5', count: 0, isLoaded: false },
];

/**
 * Active Master Dataset: 1,595 schools across 8 connected blocks
 * - RAMTEK: 214 schools
 * - SAONER: 230 schools
 * - MOUDA: 193 schools
 * - PARSEONI: 166 schools
 * - KAMPTEE: 238 schools
 * - BHIWAPUR: 140 schools
 * - HINGNA: 252 schools
 * - KALMESHWAR: 162 schools
 * Total: 1,595 schools
 */
export const INITIAL_PHASE2_SCHOOLS: School[] = [
  ...ramtekSchools,
  ...saonerSchools,
  ...moudaSchools,
  ...parseoniSchools,
  ...kampteeSchools,
  ...bhiwapurSchools,
  ...hingnaSchools,
  ...kalmeshwarSchools,
];

