
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle, ShieldAlert, Sparkles, Loader2, Bot } from 'lucide-react';
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
import { generateKeywords } from '@/ai/flows/keyword-generation-flow';
import { Switch } from '@/components/ui/switch';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types matching Discord's API structure for Auto-Mod
interface AutoModAction {
    type: number; // 1: Block Message, 2: Send Alert, 3: Timeout User
    metadata?: {
        channel_id?: string;
        duration_seconds?: number;
        custom_message?: string;
    };
}
interface AutoModTriggerMetadata {
    keyword_filter?: string[];
    regex_patterns?: string[];
    presets?: number[];
    allow_list?: string[];
    mention_total_limit?: number;
    mention_raid_protection_enabled?: boolean;
}
interface AutoModRule {
    id?: string;
    guild_id: string;
    name: string;
    event_type: number; // 1: Message Send
    trigger_type: number; // 1: Keyword, 2: Spam, 3: Keyword Preset, 4: Mention Spam
    trigger_metadata: AutoModTriggerMetadata;
    actions: AutoModAction[];
    enabled: boolean;
    exempt_roles: string[];
    exempt_channels: string[];
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
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    );
}

function KeywordGenerator({ onKeywordsGenerated }: { onKeywordsGenerated: (keywords: string[]) => void }) {
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const { toast } = useToast();

    const handleGeneration = async () => {
        if (!prompt) {
            toast({ title: 'Veuillez entrer une description.', variant: 'destructive' });
            return;
        }
        setIsGenerating(true);
        try {
            const result = await generateKeywords({ prompt });
            onKeywordsGenerated(result.keywords);
        } catch (error) {
            console.error(error);
            toast({ title: "Erreur de génération", description: "Impossible de générer les mots-clés.", variant: 'destructive' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Générer des mots-clés avec l'IA</DialogTitle>
                <DialogDescription>
                    Décrivez le type de mots que vous souhaitez bloquer. L'IA générera une liste de mots-clés correspondants que vous pourrez affiner.
                </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
                <Label htmlFor="keyword-prompt">Description</Label>
                <Textarea 
                    id="keyword-prompt"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Ex: 'Insultes légères en français', 'Mots liés aux arnaques et au phishing en anglais', 'Noms de logiciels de triche pour les jeux vidéo'."
                />
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                <Button onClick={handleGeneration} disabled={isGenerating}>
                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                    Générer
                </Button>
            </DialogFooter>
        </DialogContent>
    )
}

function RuleCard({ rule, onEdit, onDelete }: { rule: AutoModRule, onEdit: () => void, onDelete: () => void }) {
    const triggerTypeMap: { [key: number]: string } = {
        1: 'Mots-clés personnalisés',
        3: 'Mots-clés Discord',
        4: 'Spam de Mentions'
    };
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>{rule.name}</CardTitle>
                    <CardDescription>{triggerTypeMap[rule.trigger_type] || 'Type inconnu'}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Switch checked={rule.enabled} onCheckedChange={onEdit} />
                </div>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
                 <Button variant="ghost" onClick={onDelete}>
                    <Trash2 className="w-4 h-4 mr-2 text-destructive"/>
                    Supprimer
                </Button>
                <Button variant="outline" onClick={onEdit}>
                    Modifier
                </Button>
            </CardContent>
        </Card>
    )
}

export default function AutoModerationPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [rules, setRules] = useState<AutoModRule[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRules = async () => {
        // TODO: Implement API endpoint in bot/api.ts
        // For now, this will be empty.
        setRules([]); 
    };

    useEffect(() => {
        setLoading(true);
        fetchRules().finally(() => setLoading(false));
    }, [serverId]);
    
    const onSave = async (rule: AutoModRule) => {
        console.log("Saving rule:", rule);
        // TODO: Implement API logic
        toast({ title: rule.id ? "Règle mise à jour" : "Règle créée", description: `La règle "${rule.name}" a été sauvegardée.` });
        await fetchRules();
    };

    const onDelete = async (ruleId: string) => {
        console.log("Deleting rule:", ruleId);
        // TODO: Implement API logic
        toast({ title: "Règle supprimée", variant: 'destructive'});
        await fetchRules();
    };

    if (loading) {
        return <AutoModerationPageSkeleton />;
    }

  return (
    <div className="space-y-8 text-white max-w-4xl">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Auto-Modération (Discord)</h1>
                <p className="text-muted-foreground mt-2">
                    Gérez les règles d'auto-modération natives de Discord pour filtrer le contenu.
                </p>
            </div>
             <Button disabled>
                <PlusCircle className="mr-2"/>
                Créer une règle
            </Button>
        </div>
        
        <Separator />
        
        {rules.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <Bot className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Aucune règle définie</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    La gestion des règles d'auto-modération natives est en cours de développement.
                </p>
                 <p className="mt-1 text-sm text-muted-foreground">
                    Utilisez l'assistant de modération IA en attendant.
                </p>
            </div>
        ) : (
            <div className="space-y-4">
                {rules.map(rule => (
                    <RuleCard 
                        key={rule.id} 
                        rule={rule} 
                        onEdit={() => {/* TODO */}}
                        onDelete={() => onDelete(rule.id!)}
                    />
                ))}
            </div>
        )}
    </div>
  );
}
