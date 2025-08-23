

'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle, Sparkles, Loader2, BotMessageSquare } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Switch } from '@/components/ui/switch';
import { v4 as uuidv4 } from 'uuid';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// --- Types ---
interface AutoModRule {
    id: string;
    name: string;
    keywords: string[];
    action: 'delete' | 'warn';
    exempt_roles: string[];
    exempt_channels: string[];
}
interface AutoModConfig {
    enabled: boolean;
    rules: AutoModRule[];
    log_channel_id: string | null;
}
interface DiscordRole {
  id: string;
  name: string;
}
interface DiscordChannel {
    id: string;
    name: string;
    type: number;
}

// --- Skeletons ---
function AutoModerationPageSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                 <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-96" />
                 </div>
                 <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        </div>
    );
}

// --- Main Component ---
export default function AutoModerationPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [config, setConfig] = useState<AutoModConfig | null>(null);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchConfig = async () => {
        if (!serverId) return;
        setLoading(true);
        try {
            const [configRes, serverDetailsRes] = await Promise.all([
                fetch(`${API_URL}/get-config/${serverId}/auto-moderation`),
                fetch(`${API_URL}/get-server-details/${serverId}`),
            ]);
            if (!configRes.ok || !serverDetailsRes.ok) throw new Error("Impossible de récupérer les données.");
            
            const configData = await configRes.json();
            const serverDetailsData = await serverDetailsRes.json();

            setConfig(configData);
            setRoles(serverDetailsData.roles);
            setChannels(serverDetailsData.channels);
        } catch (error: any) {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };
    
    useEffect(() => {
        fetchConfig();
    }, [serverId]);

    const saveConfig = async (newConfig: AutoModConfig) => {
        setConfig(newConfig); // Optimistic update
         try {
            await fetch(`${API_URL}/update-config/${serverId}/auto-moderation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur de sauvegarde", variant: "destructive" });
        }
    };

    const handleAddRule = () => {
        if (!config) return;
        const newRule: AutoModRule = {
            id: uuidv4(),
            name: 'Nouvelle Règle',
            keywords: [],
            action: 'delete',
            exempt_roles: [],
            exempt_channels: [],
        };
        saveConfig({ ...config, rules: [...config.rules, newRule] });
    };

    const handleUpdateRule = (updatedRule: AutoModRule) => {
        if (!config) return;
        const newRules = config.rules.map(rule => rule.id === updatedRule.id ? updatedRule : rule);
        saveConfig({ ...config, rules: newRules });
    };

    const handleDeleteRule = (ruleId: string) => {
        if (!config) return;
        saveConfig({ ...config, rules: config.rules.filter(rule => rule.id !== ruleId) });
    };

    const handleToggleModule = (enabled: boolean) => {
        if (!config) return;
        saveConfig({ ...config, enabled });
    };

    if (loading || !config) {
        return <AutoModerationPageSkeleton />;
    }

  return (
    <div className="space-y-8 text-white max-w-5xl">
        <div className="flex items-start justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Auto-Modération Personnalisée</h1>
                <p className="text-muted-foreground mt-2">
                    Créez vos propres filtres de mots-clés. Les messages correspondants seront supprimés et un avertissement sera enregistré pour l'utilisateur.
                </p>
            </div>
             <div className="flex items-center space-x-4">
                 <Switch id="enable-module" checked={config.enabled} onCheckedChange={handleToggleModule} />
                 <Button onClick={handleAddRule}>
                    <PlusCircle className="mr-2"/>
                    Créer une règle
                </Button>
            </div>
        </div>
        
        <Separator />
        
        {config.rules.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <BotMessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Aucune règle définie</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Utilisez le bouton "Créer une règle" pour commencer à filtrer les messages.
                </p>
            </div>
        ) : (
            <div className="space-y-4">
                {config.rules.map(rule => (
                    <RuleCard 
                        key={rule.id} 
                        rule={rule} 
                        roles={roles}
                        channels={channels.filter(c => c.type === 0)} // Only text channels
                        onUpdate={handleUpdateRule}
                        onDelete={() => handleDeleteRule(rule.id)}
                    />
                ))}
            </div>
        )}
    </div>
  );
}

// --- RuleCard Component ---
function RuleCard({ rule, roles, channels, onUpdate, onDelete }: { rule: AutoModRule, roles: DiscordRole[], channels: DiscordChannel[], onUpdate: (rule: AutoModRule) => void, onDelete: () => void }) {
    
    const [name, setName] = useState(rule.name);
    const [keywords, setKeywords] = useState(rule.keywords.join(', '));

    const handleBlur = () => {
        onUpdate({ ...rule, name, keywords: keywords.split(',').map(k => k.trim()).filter(Boolean) });
    };

    const handleMultiSelectChange = (type: 'exempt_roles' | 'exempt_channels', newSelectedIds: string[]) => {
        onUpdate({
            ...rule,
            name,
            keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
            [type]: newSelectedIds,
        });
    };

    return (
        <Card className="bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between">
                <Input value={name} onChange={e => setName(e.target.value)} onBlur={handleBlur} className="text-xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto bg-transparent" />
                <Button variant="ghost" size="icon" onClick={onDelete}><Trash2 className="w-4 h-4 text-destructive"/></Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`keywords-${rule.id}`}>Mots-clés (séparés par des virgules)</Label>
                    <Textarea id={`keywords-${rule.id}`} value={keywords} onChange={e => setKeywords(e.target.value)} onBlur={handleBlur} />
                    <KeywordGenerator onGenerate={(newKeywords) => {
                        const updatedKeywords = [...new Set([...keywords.split(',').map(k => k.trim()).filter(Boolean), ...newKeywords])];
                        setKeywords(updatedKeywords.join(', '));
                        onUpdate({ ...rule, name, keywords: updatedKeywords });
                    }}/>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label>Rôles exemptés</Label>
                         <MultiSelectCombobox 
                            options={roles.map(r => ({ value: r.id, label: r.name }))} 
                            selected={rule.exempt_roles} 
                            onSelectedChange={(selected) => handleMultiSelectChange('exempt_roles', selected)}
                            placeholder="Sélectionner des rôles..."
                         />
                    </div>
                     <div className="space-y-2">
                        <Label>Salons exemptés</Label>
                        <MultiSelectCombobox 
                            options={channels.map(c => ({ value: c.id, label: `# ${c.name}` }))} 
                            selected={rule.exempt_channels} 
                            onSelectedChange={(selected) => handleMultiSelectChange('exempt_channels', selected)}
                            placeholder="Sélectionner des salons..."
                        />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// --- KeywordGenerator Dialog ---
function KeywordGenerator({ onGenerate }: { onGenerate: (keywords: string[]) => void }) {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const { toast } = useToast();

    const handleGenerate = async () => {
        if (!prompt) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${API_URL}/generate-keywords`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });
            if (!response.ok) throw new Error('Keyword generation failed');
            const result = await response.json();
            onGenerate(result.keywords);
            setIsOpen(false);
            setPrompt('');
        } catch (error) {
            toast({ title: "Erreur de génération IA", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="mt-2"><Sparkles className="w-4 h-4 mr-2"/>Générer avec l'IA</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Générateur de mots-clés par IA</DialogTitle>
                    <DialogDescription>Décrivez le type de mots que vous souhaitez bloquer, et l'IA vous proposera une liste.</DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <Label htmlFor="ia-prompt">Description</Label>
                    <Input id="ia-prompt" value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Ex: insultes en français, arnaques crypto, liens pub..." />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                    <Button onClick={handleGenerate} disabled={isLoading || !prompt}>
                        {isLoading ? <Loader2 className="animate-spin" /> : 'Générer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

if (typeof window !== 'undefined') {
    (window as any).uuidv4 = uuidv4;
}
