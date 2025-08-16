
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircleQuestion, Trash2, PlusCircle, Gamepad2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { KnowledgeBaseItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useServerInfo } from '@/hooks/use-server-info';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { GlobalAiStatusAlert } from '@/components/global-ai-status-alert';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

interface AgentConfig {
    enabled: boolean;
    agent_name: string;
    agent_role: string;
    agent_personality: string;
    custom_prompt: string;
    knowledge_base: KnowledgeBaseItem[];
    dedicated_channel_id: string | null;
    engagement_module_enabled: boolean; // New field
}

interface DiscordChannel {
    id: string;
    name: string;
    type: number;
}

function PageSkeleton() {
    return (
        <div className="space-y-8">
            <Card>
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-20 w-full" />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
                <CardContent>
                    <Skeleton className="h-32 w-full" />
                </CardContent>
            </Card>
        </div>
    );
}

function AgentPageContent({ isPremium, serverId }: { isPremium: boolean, serverId: string }) {
    const { toast } = useToast();
    const [config, setConfig] = useState<AgentConfig | null>(null);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/conversational-agent`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch initial data');
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();
                setConfig(configData);
                setChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 0)); // Text channels only
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration de l'agent.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);

    const saveConfig = async (newConfig: AgentConfig) => {
        setConfig(newConfig); // Optimistic update
        try {
            await fetch(`${API_URL}/update-config/${serverId}/conversational-agent`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof AgentConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handleKnowledgeBaseChange = (index: number, field: 'question' | 'answer', value: string) => {
        if (!config) return;
        const newKnowledgeBase = [...config.knowledge_base];
        newKnowledgeBase[index] = { ...newKnowledgeBase[index], [field]: value };
        handleValueChange('knowledge_base', newKnowledgeBase);
    };

    const addKnowledgeBaseItem = () => {
        if (!config) return;
        const newItem: KnowledgeBaseItem = { id: uuidv4(), question: '', answer: '' };
        handleValueChange('knowledge_base', [...config.knowledge_base, newItem]);
    };

    const removeKnowledgeBaseItem = (id: string) => {
        if (!config) return;
        handleValueChange('knowledge_base', config.knowledge_base.filter(item => item.id !== id));
    };

    if (loading || !config) {
        return <PageSkeleton />;
    }

    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <div className="space-y-8">
                 <GlobalAiStatusAlert />
                {/* Section Activation */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Activation de l'Agent</CardTitle>
                            <Switch id="enable-agent" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                        </div>
                        <CardDescription>
                            Activez l'agent pour qu'il réponde lorsqu'on le mentionne ou dans son salon dédié.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label htmlFor="dedicated-channel">Salon de conversation dédié</Label>
                             <p className="text-sm text-muted-foreground/80">
                                Dans ce salon, chaque message sera traité par l'IA (les mentions ne sont pas nécessaires).
                            </p>
                             <Select value={config.dedicated_channel_id || 'none'} onValueChange={(value) => handleValueChange('dedicated_channel_id', value === 'none' ? null : value)}>
                                <SelectTrigger id="dedicated-channel" className="w-full md:w-[280px]">
                                    <SelectValue placeholder="Sélectionner un salon" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectLabel>Salons textuels</SelectLabel>
                                        <SelectItem value="none">Aucun (répond aux mentions seulement)</SelectItem>
                                        {channels.map(channel => (
                                            <SelectItem key={channel.id} value={channel.id}># {channel.name}</SelectItem>
                                        ))}
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Section Personnalité */}
                <Card>
                    <CardHeader>
                        <CardTitle>Personnalité de l'Agent</CardTitle>
                        <CardDescription>
                            Définissez qui est votre agent IA et comment il doit se comporter.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="agent-name">Nom de l'agent</Label>
                            <Input id="agent-name" placeholder="Ex: GLaDOS, Assistant de Support" defaultValue={config.agent_name} onBlur={(e) => handleValueChange('agent_name', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="agent-role">Rôle / Mission</Label>
                            <Textarea id="agent-role" placeholder="Ex: 'Un agent de support technique pour le serveur de développement' ou 'Un guide malicieux qui donne des indices cryptiques'" defaultValue={config.agent_role} onBlur={(e) => handleValueChange('agent_role', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="agent-personality">Personnalité et Ton</Label>
                            <Textarea id="agent-personality" placeholder="Ex: 'Toujours poli et formel', 'Sarcastique et plein d'humour noir', 'Enthousiaste et utilise beaucoup d'emojis'" defaultValue={config.agent_personality} onBlur={(e) => handleValueChange('agent_personality', e.target.value)} />
                        </div>
                    </CardContent>
                </Card>

                 {/* Section Prompt Personnalisé */}
                <Card>
                    <CardHeader>
                        <CardTitle>Instructions Personnalisées</CardTitle>
                        <CardDescription>
                            Ajoutez des instructions spécifiques ou des règles que l'agent doit toujours suivre.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Textarea 
                            placeholder="Ne jamais mentionner la concurrence. Toujours terminer les phrases par 'Bip boop'." 
                            rows={4}
                            defaultValue={config.custom_prompt}
                            onBlur={(e) => handleValueChange('custom_prompt', e.target.value)}
                        />
                    </CardContent>
                </Card>

                {/* Section Engagement Module */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Gamepad2 /> Module d'Engagement</CardTitle>
                        <CardDescription>
                           Rendez votre agent plus proactif en l'autorisant à proposer des activités.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="enable-engagement" className="font-bold">Proposer des activités</Label>
                                <p className="text-sm text-muted-foreground/80">
                                    Si le salon est calme, l'agent pourra suggérer des jeux ou des sujets de discussion.
                                </p>
                            </div>
                            <Switch id="enable-engagement" checked={config.engagement_module_enabled ?? false} onCheckedChange={(val) => handleValueChange('engagement_module_enabled', val)} />
                        </div>
                    </CardContent>
                </Card>

                {/* Section Base de connaissances */}
                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Base de connaissances</CardTitle>
                            <CardDescription>
                                Fournissez à l'agent des informations spécifiques qu'il devra utiliser pour répondre.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {config.knowledge_base.map((item, index) => (
                                <div key={item.id} className="p-4 border rounded-lg bg-card-foreground/5 space-y-2">
                                    <div className="flex justify-between items-center">
                                        <Label className="font-semibold">Sujet / Question {index + 1}</Label>
                                        <Button variant="ghost" size="icon" onClick={() => removeKnowledgeBaseItem(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                                    </div>
                                    <Input 
                                        placeholder="Sujet ou question clé" 
                                        defaultValue={item.question}
                                        onBlur={(e) => handleKnowledgeBaseChange(index, 'question', e.target.value)}
                                    />
                                    <Textarea 
                                        placeholder="Informations que l'agent doit connaître sur ce sujet." 
                                        defaultValue={item.answer}
                                        onBlur={(e) => handleKnowledgeBaseChange(index, 'answer', e.target.value)}
                                    />
                                </div>
                            ))}
                             <Button variant="outline" className="w-full" onClick={addKnowledgeBaseItem}>
                                <PlusCircle className="mr-2" />
                                Ajouter un élément de connaissance
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PremiumFeatureWrapper>
    );
}

export default function ConversationalAgentPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { serverInfo, loading } = useServerInfo();

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Agent Conversationnel IA
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Créez un agent IA entièrement personnalisé qui répond lorsqu'on le mentionne ou dans un salon dédié.
        </p>
      </div>
      
      <Separator />

      {loading ? (
        <PageSkeleton />
      ) : (
        <AgentPageContent isPremium={serverInfo?.isPremium || false} serverId={serverId} />
      )}
    </div>
  );
}

if (typeof window !== 'undefined' && !(window as any).uuidv4) {
    (window as any).uuidv4 = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
