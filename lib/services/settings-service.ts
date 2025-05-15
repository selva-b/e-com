import { supabase } from '@/lib/supabase/client';

export interface Setting {
  id: string;
  key: string;
  value: string;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface SettingsMap {
  [key: string]: string;
}

/**
 * Fetch all settings from the database
 */
export async function getAllSettings(): Promise<Setting[]> {
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .order('key');
  
  if (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
  
  return data || [];
}

/**
 * Fetch a specific setting by key
 */
export async function getSetting(key: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', key)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') {
      // Setting not found
      return null;
    }
    console.error(`Error fetching setting ${key}:`, error);
    throw error;
  }
  
  return data?.value || null;
}

/**
 * Fetch multiple settings by keys
 */
export async function getSettings(keys: string[]): Promise<SettingsMap> {
  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', keys);
  
  if (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
  
  const settingsMap: SettingsMap = {};
  (data || []).forEach(setting => {
    settingsMap[setting.key] = setting.value;
  });
  
  return settingsMap;
}

/**
 * Update a setting
 */
export async function updateSetting(key: string, value: string): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .update({ value, updated_at: new Date().toISOString() })
    .eq('key', key);
  
  if (error) {
    console.error(`Error updating setting ${key}:`, error);
    throw error;
  }
}

/**
 * Update multiple settings
 */
export async function updateSettings(settings: SettingsMap): Promise<void> {
  const updates = Object.entries(settings).map(([key, value]) => {
    return supabase
      .from('settings')
      .update({ value, updated_at: new Date().toISOString() })
      .eq('key', key);
  });
  
  await Promise.all(updates);
}

/**
 * Get flash sale settings
 */
export async function getFlashSaleSettings(): Promise<{
  showFlashSaleSection: boolean;
  flashSaleSectionTitle: string;
  flashSaleSectionSubtitle: string;
}> {
  const keys = [
    'show_flash_sale_section',
    'flash_sale_section_title',
    'flash_sale_section_subtitle'
  ];
  
  const settings = await getSettings(keys);
  
  return {
    showFlashSaleSection: settings.show_flash_sale_section === 'true',
    flashSaleSectionTitle: settings.flash_sale_section_title || 'Flash Sale',
    flashSaleSectionSubtitle: settings.flash_sale_section_subtitle || 'Limited Time'
  };
}

/**
 * Update flash sale settings
 */
export async function updateFlashSaleSettings(settings: {
  showFlashSaleSection?: boolean;
  flashSaleSectionTitle?: string;
  flashSaleSectionSubtitle?: string;
}): Promise<void> {
  const updates: SettingsMap = {};
  
  if (settings.showFlashSaleSection !== undefined) {
    updates.show_flash_sale_section = settings.showFlashSaleSection.toString();
  }
  
  if (settings.flashSaleSectionTitle !== undefined) {
    updates.flash_sale_section_title = settings.flashSaleSectionTitle;
  }
  
  if (settings.flashSaleSectionSubtitle !== undefined) {
    updates.flash_sale_section_subtitle = settings.flashSaleSectionSubtitle;
  }
  
  await updateSettings(updates);
}
