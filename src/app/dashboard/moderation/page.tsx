import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquareWarning, Shield, UserX } from 'lucide-react';

export default function ModerationPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Moderation</h1>
        <p className="text-muted-foreground">
          Configure moderation settings for your server.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Accordion type="multiple" defaultValue={['item-1', 'item-2']} className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger className="text-lg font-semibold">
                General Settings
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="mod-anonymity">Moderator Anonymity</Label>
                    <p className="text-sm text-muted-foreground">
                      Hide moderator names in sanction notifications.
                    </p>
                  </div>
                  <Switch id="mod-anonymity" />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label htmlFor="dm-notifications">DM Sanction Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send users a direct message when they are sanctioned.
                    </p>
                  </div>
                  <Switch id="dm-notifications" defaultChecked />
                </div>
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger className="text-lg font-semibold">
                Sanction Messages
              </AccordionTrigger>
              <AccordionContent className="space-y-6 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="ban-message">Ban Message</Label>
                  <Textarea
                    id="ban-message"
                    placeholder="e.g., You have been banned for: {{reason}}."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="kick-message">Kick Message</Label>
                  <Textarea
                    id="kick-message"
                    placeholder="e.g., You have been kicked for: {{reason}}."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mute-message">Mute Message</Label>
                  <Textarea
                    id="mute-message"
                    placeholder="e.g., You have been muted for: {{reason}}."
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sanction Presets</CardTitle>
              <CardDescription>
                Create and manage preset sanctions for quick moderation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label>Spamming</Label>
                    <div className="flex gap-2">
                        <Input value="30m Mute" readOnly/>
                        <Button variant="ghost" size="icon"><UserX className="h-4 w-4" /></Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Inappropriate Content</Label>
                    <div className="flex gap-2">
                        <Input value="1d Ban" readOnly/>
                        <Button variant="ghost" size="icon"><UserX className="h-4 w-4" /></Button>
                    </div>
                </div>
              <Button className="w-full">Add Preset</Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex justify-end">
          <Button>Save Changes</Button>
      </div>
    </div>
  );
}
