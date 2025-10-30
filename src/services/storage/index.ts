/**
 * Storage Service Exports
 *
 * This module exports the storage service singleton.
 * To migrate to Supabase, simply replace LocalStorageService with SupabaseStorageService.
 */

import { LocalStorageService } from './LocalStorageService';
import type { IStorageService } from './IStorageService';

// Singleton instance
// To switch to Supabase: export const storageService: IStorageService = new SupabaseStorageService();
export const storageService: IStorageService = new LocalStorageService();

// Export types for convenience
export type { IStorageService };
