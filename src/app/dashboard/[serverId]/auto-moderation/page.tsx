
'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Trash2, PlusCircle, ShieldAlert } from 'lucide-react';
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


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types matching Discord's API structure for Auto-Mod
interface AutoModAction {
    type: number;
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
    event_type: number;
    trigger_type: number;
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
                 <Skeleton className="h-8 w-64" />
                 <Skeleton className="h-10 w-32" />
            </div>
            <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
            </div>
        </div>
    );
}

function RuleEditor({ rule, onSave, onCancel, roles, channels }: { rule: Partial<AutoModRule>, onSave: (rule: Partial<AutoModRule>) => void, onCancel: () => void, roles: DiscordRole[], channels: DiscordChannel[] }) {
    const [editedRule, setEditedRule] = useState<Partial<AutoModRule>>(rule);
    
    const handleFieldChange = (field: keyof AutoModRule, value: any) => {
        setEditedRule(prev => ({ ...prev, [field]: value }));
    };

    const handleMetadataChange = (field: keyof AutoModTriggerMetadata, value: any) => {
        setEditedRule(prev => ({
            ...prev,
            trigger_metadata: { ...prev.trigger_metadata, [field]: value }
        }));
    };

    const handleActionChange = (index: number, field: keyof AutoModAction['metadata'], value: any) => {
         setEditedRule(prev => {
            const newActions = [...(prev.actions || [])];
            newActions[index] = {
                ...newActions[index],
                metadata: {
                    ...newActions[index].metadata,
                    [field]: value
                }
            };
            return { ...prev, actions: newActions };
        });
    }

    return (
        <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
                <DialogTitle>{rule.id ? 'Modifier la Règle' : 'Créer une Règle'}</DialogTitle>
                <DialogDescription>
                    Configurez les détails de votre règle d'auto-modération.
                </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
                {/* Rule Name */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Nom</Label>
                    <Input id="name" value={editedRule.name || ''} onChange={e => handleFieldChange('name', e.target.value)} className="col-span-3" />
                </div>

                {/* Trigger Type */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="trigger_type" className="text-right">Déclencheur</Label>
                    <Select value={String(editedRule.trigger_type || 1)} onValueChange={val => handleFieldChange('trigger_type', parseInt(val))}>
                        <SelectTrigger className="col-span-3">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="1">Mots-clés</SelectItem>
                            <SelectItem value="4">Contenu Nocif (Presets)</SelectItem>
                            <SelectItem value="5">Spam de mentions</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                
                 {/* Trigger Metadata */}
                {editedRule.trigger_type === 1 && ( // Keyword
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="keyword_filter" className="text-right">Mots-clés</Label>
                        <Textarea id="keyword_filter"
                            placeholder="mot, phrase*, *fin"
                            className="col-span-3"
                            value={(editedRule.trigger_metadata?.keyword_filter || []).join(', ')}
                            onChange={e => handleMetadataChange('keyword_filter', e.target.value.split(',').map(k => k.trim()))}
                        />
                    </div>
                )}
                 {editedRule.trigger_type === 4 && ( // Preset
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="presets" className="text-right">Types de contenu</Label>
                        <Select value={String(editedRule.trigger_metadata?.presets?.[0] || 1)} onValueChange={val => handleMetadataChange('presets', [parseInt(val)])}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">Propos grossiers</SelectItem>
                                <SelectItem value="2">Contenu sexuel</SelectItem>
                                <SelectItem value="3">Insultes et calomnies</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
                {editedRule.trigger_type === 5 && ( // Mention Spam
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="mention_total_limit" className="text-right">Mentions Max</Label>
                        <Input id="mention_total_limit" type="number" 
                            className="col-span-3"
                            value={editedRule.trigger_metadata?.mention_total_limit || 5}
                            onChange={e => handleMetadataChange('mention_total_limit', parseInt(e.target.value))}
                         />
                    </div>
                )}
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary" onClick={onCancel}>Annuler</Button>
                </DialogClose>
                <Button type="submit" onClick={() => onSave(editedRule)}>Sauvegarder</Button>
            </DialogFooter>
        </DialogContent>
    );
}

export default function AutoModerationPage() {
    const params = useParams();
    const serverId = params.serverId as string;
    const { toast } = useToast();

    const [rules, setRules] = useState<AutoModRule[]>([]);
    const [roles, setRoles] = useState<DiscordRole[]>([]);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setEditorOpen] = useState(false);
    const [currentRule, setCurrentRule] = useState<Partial<AutoModRule> | null>(null);

    // --- API Calls ---
    const fetchRules = async () => {
        // TODO: Implement API endpoint in bot/api.ts
        // For now, using mock data.
        setRules([]); 
    };

    const saveRule = async (rule: Partial<AutoModRule>) => {
         // TODO: Implement API endpoint in bot/api.ts
        toast({ title: rule.id ? "Règle mise à jour" : "Règle créée", description: `La règle "${rule.name}" a été sauvegardée.` });
        await fetchRules();
        setEditorOpen(false);
    };

    const deleteRule = async (ruleId: string) => {
        // TODO: Implement API endpoint in bot/api.ts
        toast({ title: "Règle supprimée", variant: 'destructive'});
        await fetchRules();
    }

    // --- Data Fetching ---
    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                // TODO: Replace with fetchRules() when API is ready
                await fetchRules();

                const serverDetailsRes = await fetch(`${API_URL}/get-server-details/${serverId}`);
                if (!serverDetailsRes.ok) throw new Error('Failed to fetch server details');
                const serverDetailsData = await serverDetailsRes.json();
                
                setRoles(serverDetailsData.roles);
                setChannels(serverDetailsData.channels);
            } catch (error) {
                toast({ title: "Erreur", description: "Impossible de charger la configuration.", variant: "destructive" });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serverId, toast]);

    const handleCreateClick = () => {
        setCurrentRule({
            guild_id: serverId,
            name: '',
            event_type: 1, // MESSAGE_SEND
            trigger_type: 1, // KEYWORD
            trigger_metadata: { keyword_filter: [] },
            actions: [{ type: 1 }], // BLOCK_MESSAGE
            enabled: true,
            exempt_roles: [],
            exempt_channels: [],
        });
        setEditorOpen(true);
    };

    const handleEditClick = (rule: AutoModRule) => {
        setCurrentRule(rule);
        setEditorOpen(true);
    };

    if (loading) {
        return <AutoModerationPageSkeleton />;
    }

  return (
    <Dialog open={isEditorOpen} onOpenChange={setEditorOpen}>
        <div className="space-y-8 text-white max-w-4xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Auto-Modération (Discord)</h1>
                    <p className="text-muted-foreground mt-2">
                        Gérez les règles d'auto-modération natives de Discord.
                    </p>
                </div>
                 <DialogTrigger asChild>
                    <Button onClick={handleCreateClick}>
                        <PlusCircle className="mr-2"/>
                        Créer une règle
                    </Button>
                </DialogTrigger>
            </div>
            
            <Separator />
            
            {rules.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <ShieldAlert className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-semibold">Aucune règle définie</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Cliquez sur "Créer une règle" pour commencer.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {rules.map(rule => (
                        <Card key={rule.id}>
                            <CardHeader className="flex flex-row items-center justify-between">
                                 <div>
                                    <CardTitle>{rule.name}</CardTitle>
                                    <CardDescription>
                                        {/* You can add more details here based on rule type */}
                                        Déclencheur : Mot-clé
                                    </CardDescription>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <Switch checked={rule.enabled} onCheckedChange={(val) => saveRule({...rule, enabled: val})} />
                                    <Button variant="ghost" onClick={() => handleEditClick(rule)}>Modifier</Button>
                                    <Button variant="ghost" size="icon" onClick={() => deleteRule(rule.id!)}>
                                        <Trash2 className="w-4 h-4 text-destructive"/>
                                    </Button>
                                 </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            )}
        </div>

        {/* The Dialog Content for editing/creating */}
        {currentRule && (
            <RuleEditor 
                rule={currentRule}
                onSave={saveRule}
                onCancel={() => setEditorOpen(false)}
                roles={roles}
                channels={channels}
            />
        )}
    </Dialog>
  );
}
