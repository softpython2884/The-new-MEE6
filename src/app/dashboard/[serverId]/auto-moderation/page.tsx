
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle, Sparkles, Loader2, Bot, BotMessageSquare, ShieldAlert } from 'lucide-react';
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
import { useServerInfo } from '@/hooks/use-server-info';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types matching Discord's API structure for Auto-Mod
interface AutoModAction {
    type: number; // 1: Block Message, 2: Send Alert, 3: Timeout User
    metadata?: {
        channel_id?: string;
        duration_seconds?: number;
    };
}
interface AutoModTriggerMetadata {
    keyword_filter?: string[];
    presets?: number[]; // 1: Profanity, 2: Sexual Content, 3: Slurs
    allow_list?: string[];
    mention_total_limit?: number;
    mention_raid_protection_enabled?: boolean;
}
interface AutoModRule {
    id: string;
    guild_id: string;
    name: string;
    event_type: number; // 1: Message Send
    trigger_type: number; // 1: Keyword, 3: Keyword Preset, 4: Mention Spam
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

const triggerTypeMap: { [key: number]: string } = {
    1: 'Mots-clés personnalisés',
    3: 'Listes de mots Discord',
    4: 'Spam de Mentions'
};

const presetTypeMap: { [key: number]: string } = {
    1: 'Propos injurieux',
    2: 'Contenu sexuel',
    3: 'Insultes et Incitations à la haine'
}

function RuleCard({ rule, onEdit, onDelete, onToggle }: { rule: AutoModRule, onEdit: () => void, onDelete: () => void, onToggle: (enabled: boolean) => void }) {
    const hasTimeout = rule.actions.some(a => a.type === 3);

    return (
        <Card>
            <CardHeader className="flex flex-row items-start justify-between">
                <div>
                    <CardTitle>{rule.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{triggerTypeMap[rule.trigger_type] || 'Type inconnu'}</Badge>
                         {hasTimeout && <Badge variant="destructive">Timeout</Badge>}
                    </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                    <Switch checked={rule.enabled} onCheckedChange={onToggle} />
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
    const { serverInfo, loading: serverInfoLoading } = useServerInfo();


    const fetchRules = useCallback(async () => {
        if (!serverId) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/automod-rules/${serverId}`);
            if (!res.ok) throw new Error("Impossible de récupérer les règles.");
            const data = await res.json();
            setRules(data);
        } catch (error: any) {
            toast({ title: "Erreur", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [serverId, toast]);

    useEffect(() => {
        fetchRules();
    }, [fetchRules]);

    const onSave = async (rule: Partial<AutoModRule>) => {
        try {
            const url = rule.id 
                ? `${API_URL}/automod-rules/${serverId}/${rule.id}`
                : `${API_URL}/automod-rules/${serverId}`;
            const method = rule.id ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(rule)
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "La sauvegarde a échoué.");
            }

            toast({ title: rule.id ? "Règle mise à jour" : "Règle créée", description: `La règle "${rule.name}" a été sauvegardée.` });
            await fetchRules();
            return true;
        } catch (error: any) {
            toast({ title: "Erreur de sauvegarde", description: error.message, variant: "destructive" });
            return false;
        }
    };

    const onDelete = async (ruleId: string) => {
        try {
            const res = await fetch(`${API_URL}/automod-rules/${serverId}/${ruleId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("La suppression a échoué.");
            toast({ title: "Règle supprimée", variant: 'destructive'});
            await fetchRules();
        } catch (error: any) {
             toast({ title: "Erreur de suppression", description: error.message, variant: "destructive" });
        }
    };

    if (loading || serverInfoLoading) {
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
             {/* <RuleEditorDialog onSave={onSave} serverInfo={serverInfo}>
                <Button>
                    <PlusCircle className="mr-2"/>
                    Créer une règle
                </Button>
            </RuleEditorDialog> */}
        </div>
        
        <Separator />
        
        {rules.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg">
                <BotMessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">Aucune règle définie</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                    Utilisez le bouton "Créer une règle" pour commencer à protéger votre serveur.
                </p>
            </div>
        ) : (
            <div className="space-y-4">
                {rules.map(rule => (
                    <RuleCard 
                        key={rule.id} 
                        rule={rule} 
                        onEdit={() => {/* TODO: Implement edit dialog opening */}}
                        onDelete={() => onDelete(rule.id!)}
                        onToggle={(enabled) => onSave({ id: rule.id, enabled })}
                    />
                ))}
            </div>
        )}
    </div>
  );
}
