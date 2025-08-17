
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { MessageSquare, Trash2, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import type { KnowledgeBaseItem } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { useServerInfo } from '@/hooks/use-server-info';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { Badge } from '@/components/ui/badge';
import { GlobalAiStatusAlert } from '@/components/global-ai-status-alert';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface CommunityAssistantConfig {
    enabled: boolean;
    confidence_threshold: number;
    knowledge_base: KnowledgeBaseItem[];
    command_permissions: { [key: string]: string | null };
    faq_scan_enabled: boolean;
}

interface DiscordRole {
    id: string;
    name: string;
}

const faqCommand = {
    name: '/faq',
    key: 'faq',
    description: "Pose une question à l'assistant communautaire.",
};

function CommunityAssistantPageContent({ isPremium, serverId }: { isPremium: boolean, serverId: string }) {
    const { toast } = useToast();

    const [config, setConfig] = useState<CommunityAssistantConfig | null>(null);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [sliderValue, setSliderValue] = useState([75]);

    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const [configRes, serverDetailsRes] = await Promise.all([
                    fetch(`${API_URL}/get-config/${serverId}/community-assistant`),
                    fetch(`${API_URL}/get-server-details/${serverId}`)
                ]);
                if (!configRes.ok || !serverDetailsRes.ok) throw new Error('Failed to fetch initial data');
                
                const configData = await configRes.json();
                const serverDetailsData = await serverDetailsRes.json();

                setConfig(configData);
                setRoles(serverDetailsData.roles);
                setSliderValue([configData.confidence_threshold || 75]);
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);

    const saveConfig = async (newConfig: CommunityAssistantConfig) => {
        setConfig(newConfig); // Optimistic update for UI responsiveness
        try {
            const response = await fetch(`${API_URL}/update-config/${serverId}/community-assistant`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
            if (!response.ok) throw new Error('Save failed');
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };
    
    const handleValueChange = (key: keyof CommunityAssistantConfig, value: any) => {
        if (!config) return;
        saveConfig({ ...config, [key]: value });
    };

    const handleSliderCommit = (value: number[]) => {
        handleValueChange('confidence_threshold', value[0]);
    };

    const handlePermissionChange = (commandKey: string, roleId: string) => {
        if (!config) return;
        const newPermissions = { ...config.command_permissions, [commandKey]: roleId === 'none' ? null : roleId };
        handleValueChange('command_permissions', newPermissions);
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
                {/* Section Options */}
                <Card>
                    <CardHeader>
                        <h2 className="text-xl font-bold">Options</h2>
                        <p className="text-muted-foreground">
                            Personnalisez le comportement de l'assistant communautaire.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="enable-assistant" className="font-bold text-sm uppercase text-muted-foreground">Activer le module</Label>
                                <p className="text-sm text-muted-foreground/80">
                                    Active ou désactive complètement la commande /faq et le scan.
                                </p>
                            </div>
                            <Switch id="enable-assistant" checked={config.enabled} onCheckedChange={(val) => handleValueChange('enabled', val)} />
                        </div>
                        <Separator />
                         <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="faq-scan" className="font-bold text-sm uppercase text-muted-foreground">Activer le scan des questions fréquentes (FAQ)</Label>
                                <p className="text-sm text-muted-foreground/80">
                                    Si activé, le bot scannera les messages et répondra automatiquement aux questions de votre base de connaissances.
                                </p>
                            </div>
                            <Switch id="faq-scan" checked={config.faq_scan_enabled} onCheckedChange={(val) => handleValueChange('faq_scan_enabled', val)} />
                        </div>
                        <Separator />
                        <div className="space-y-4">
                            <Label htmlFor="confidence-threshold" className="font-bold text-sm uppercase text-muted-foreground">Seuil de confiance</Label>
                            <p className="text-sm text-muted-foreground/80">
                                Le bot ne répondra que si sa confiance est supérieure à ce seuil.
                            </p>
                            <div className="flex items-center gap-4">
                                <Slider 
                                    id="confidence-threshold" 
                                    value={sliderValue} 
                                    onValueChange={setSliderValue}
                                    onValueCommit={handleSliderCommit}
                                    max={100} 
                                    step={1} 
                                    className="w-full" />
                                <span className="font-mono text-lg w-12 text-center">{sliderValue[0]}%</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Separator />

                {/* Section Commandes */}
                <div className="space-y-6">
                    <div>
                    <h2 className="text-xl font-bold">Commandes</h2>
                    <p className="text-muted-foreground">
                        Gérez les permissions pour la commande de ce module.
                    </p>
                    </div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="w-5 h-5 text-primary" />
                                <span>{faqCommand.name}</span>
                            </CardTitle>
                            <CardDescription>{faqCommand.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <Label htmlFor={`role-select-${faqCommand.key}`} className="text-sm font-medium">Rôle minimum requis</Label>
                                <Select 
                                    value={config.command_permissions?.[faqCommand.key] || 'none'}
                                    onValueChange={(value) => handlePermissionChange(faqCommand.key, value)}
                                >
                                    <SelectTrigger id={`role-select-${faqCommand.key}`} className="w-full">
                                        <SelectValue placeholder="Sélectionner un rôle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectGroup>
                                            <SelectItem value="none">@everyone</SelectItem>
                                            {roles.filter(r => r.name !== '@everyone').map(role => (
                                                <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                                            ))}
                                        </SelectGroup>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* Section Questions & Réponses */}
                <div className="space-y-4">
                    <div>
                        <h2 className="text-xl font-bold">Base de connaissances</h2>
                        <p className="text-muted-foreground">
                            Définissez ici les paires de questions et réponses que l'assistant utilisera.
                        </p>
                    </div>
                    <Card className="p-6">
                    <div className="space-y-4">
                        {config.knowledge_base.map((item, index) => (
                        <div key={item.id} className="p-4 border rounded-lg bg-card-foreground/5">
                            <div className="flex justify-between items-center mb-4">
                                <Label className="text-base font-semibold">Question {index + 1}</Label>
                                <Button variant="ghost" size="icon" onClick={() => removeKnowledgeBaseItem(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                            <div className="space-y-2">
                                <Input 
                                placeholder="Entrez la question ou des mots-clés" 
                                defaultValue={item.question}
                                onBlur={(e) => handleKnowledgeBaseChange(index, 'question', e.target.value)}
                                />
                                <Textarea 
                                placeholder="Entrez la réponse que le bot doit fournir" 
                                defaultValue={item.answer}
                                onBlur={(e) => handleKnowledgeBaseChange(index, 'answer', e.target.value)}
                                />
                            </div>
                        </div>
                        ))}
                    </div>
                    <Button variant="default" className="mt-6 w-full" onClick={addKnowledgeBaseItem}>
                        <PlusCircle className="mr-2" />
                        Ajouter une Question/Réponse
                    </Button>
                    </Card>
                </div>
            </div>
        </PremiumFeatureWrapper>
    );
}

export default function CommunityAssistantPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { serverInfo, loading } = useServerInfo();

  return (
    <div className="space-y-8 text-white max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Assistant Communautaire
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </h1>
        <p className="text-muted-foreground mt-2">
          Configurez l'IA pour répondre aux questions fréquentes de votre communauté.
        </p>
      </div>
      
      <Separator />

      {loading ? (
        <PageSkeleton />
      ) : (
        <CommunityAssistantPageContent isPremium={serverInfo?.isPremium || false} serverId={serverId} />
      )}
    </div>
  );
}


function PageSkeleton() {
    return (
        <div className="space-y-8 text-white max-w-4xl">
            <div>
                <Skeleton className="h-8 w-72 mb-2" />
                <Skeleton className="h-4 w-[500px]" />
            </div>
            <Separator />
            <Skeleton className="h-48 w-full" />
            <Separator />
            <Skeleton className="h-48 w-full" />
             <Separator />
            <Skeleton className="h-64 w-full" />
        </div>
    );
}

// Simple UUID generator for new items
// In a real app, you might use a library like `uuid`
if (typeof window !== 'undefined' && !(window as any).uuidv4) {
    (window as any).uuidv4 = function() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}
