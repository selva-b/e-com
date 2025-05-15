'use client';

import { useState, useEffect } from 'react';
import { useRouter, redirect } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Undo } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { getFlashSaleSettings, updateFlashSaleSettings } from '@/lib/services/settings-service';

export default function FlashSaleSettingsPage() {
  const { user, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [settings, setSettings] = useState({
    showFlashSaleSection: true,
    flashSaleSectionTitle: 'Flash Sale',
    flashSaleSectionSubtitle: 'Limited Time',
  });

  const [originalSettings, setOriginalSettings] = useState({
    showFlashSaleSection: true,
    flashSaleSectionTitle: 'Flash Sale',
    flashSaleSectionSubtitle: 'Limited Time',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && (!user || !isAdmin)) {
      redirect('/login');
    }
  }, [user, isAdmin, isLoading]);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        const flashSaleSettings = await getFlashSaleSettings();
        setSettings(flashSaleSettings);
        setOriginalSettings(flashSaleSettings);
      } catch (error) {
        console.error('Error fetching flash sale settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load flash sale settings',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [toast]);

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update all settings directly using the settings service
      await updateFlashSaleSettings({
        showFlashSaleSection: settings.showFlashSaleSection,
        flashSaleSectionTitle: settings.flashSaleSectionTitle,
        flashSaleSectionSubtitle: settings.flashSaleSectionSubtitle,
      });

      setOriginalSettings(settings);
      toast({
        title: 'Settings saved',
        description: 'Flash sale settings have been updated successfully',
      });
    } catch (error: any) {
      console.error('Error saving flash sale settings:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to save flash sale settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
  };

  const hasChanges = () => {
    return (
      settings.showFlashSaleSection !== originalSettings.showFlashSaleSection ||
      settings.flashSaleSectionTitle !== originalSettings.flashSaleSectionTitle ||
      settings.flashSaleSectionSubtitle !== originalSettings.flashSaleSectionSubtitle
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto py-10 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Flash Sale Settings</h1>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Home Page Flash Sale Section</CardTitle>
          <CardDescription>
            Configure the flash sale section that appears on the home page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="show-flash-sale">Show Flash Sale Section</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable the flash sale section on the home page
              </p>
            </div>
            <Switch
              id="show-flash-sale"
              checked={settings.showFlashSaleSection}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, showFlashSaleSection: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="flash-sale-title">Section Title</Label>
            <Input
              id="flash-sale-title"
              value={settings.flashSaleSectionTitle}
              onChange={(e) =>
                setSettings({ ...settings, flashSaleSectionTitle: e.target.value })
              }
              placeholder="Flash Sale"
              disabled={!settings.showFlashSaleSection}
            />
            <p className="text-sm text-muted-foreground">
              The main heading for the flash sale section
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="flash-sale-subtitle">Section Subtitle</Label>
            <Input
              id="flash-sale-subtitle"
              value={settings.flashSaleSectionSubtitle}
              onChange={(e) =>
                setSettings({ ...settings, flashSaleSectionSubtitle: e.target.value })
              }
              placeholder="Limited Time"
              disabled={!settings.showFlashSaleSection}
            />
            <p className="text-sm text-muted-foreground">
              The subtitle or badge text for the flash sale section
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges() || saving}
          >
            <Undo className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges() || saving}
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            How the flash sale section will appear on the home page
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings.showFlashSaleSection ? (
            <div className="border rounded-lg p-6 bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950/20 dark:to-red-900/20">
              <div className="flex items-center mb-2">
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-500">
                  {settings.flashSaleSectionTitle}
                </h2>
                <span className="ml-3 px-3 py-1 bg-red-500 text-white text-sm font-semibold rounded-full animate-pulse">
                  {settings.flashSaleSectionSubtitle}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                This section will display flash sale products with a countdown timer.
              </p>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Flash sale section is currently disabled.</p>
              <p className="text-sm mt-2">Enable it to show flash sale products on the home page.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
