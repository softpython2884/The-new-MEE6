import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Bot, Handshake, MessageSquarePlus, ShieldCheck } from 'lucide-react';

const modules = [
  {
    icon: Handshake,
    title: 'Welcome Messages',
    description: 'Greet new members with a custom message and assign roles automatically.',
    enabled: true,
  },
  {
    icon: ShieldCheck,
    title: 'Auto-Moderation',
    description: 'Automatically delete messages, mute or ban users based on configurable rules.',
    enabled: true,
  },
  {
    icon: MessageSquarePlus,
    title: 'Reaction Roles',
    description: 'Allow users to get roles by reacting to a message.',
    enabled: false,
  },
  {
    icon: Bot,
    title: 'Auto-Responder',
    description: 'Set up custom text commands that trigger an automatic bot response.',
    enabled: true,
  },
];

export default function ModulesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Module Management</h1>
        <p className="text-muted-foreground">
          Enable, disable, and configure modules for your server.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {modules.map((module) => (
          <Card key={module.title} className="flex flex-col">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <module.icon className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle>{module.title}</CardTitle>
                </div>
              </div>
              <Switch defaultChecked={module.enabled} />
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground">{module.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
