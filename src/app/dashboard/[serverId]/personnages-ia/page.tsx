
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    SelectGroup,
    SelectLabel
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Users, Trash2, PlusCircle, Sparkles, Loader2, Wand2, BotMessageSquare, VenetianMask, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useServerInfo } from '@/hooks/use-server-info';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { Badge } from '@/components/ui/badge';
import ShinyText from '@/components/ui/shiny-text';
import type { Persona } from '@/types';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GlobalAiStatusAlert } from '@/components/global-ai-status-alert';


const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';


interface DiscordChannel {
    id: string;
    name: string;
    type: number;
}
interface AIPersonasConfig {
    enabled: boolean;
    premium: boolean;
}

function PersonaPageSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}


function PersonaPageContent({ isPremium, serverId }: { isPremium: boolean, serverId: string }) {
    const { toast } = useToast();
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [channels, setChannels] = useState<DiscordChannel[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [config, setConfig] = useState<AIPersonasConfig | null>(null);
    
    const [newName, setNewName] = useState('');
    const [newInstructions, setNewInstructions] = useState('');
    const [generatedPrompt, setGeneratedPrompt] = useState('');
    const [currentStep, setCurrentStep] = useState(1);

    const fetchPersonas = async () => {
        try {
            const res = await fetch(`${API_URL}/personas/${serverId}`);
            if (!res.ok) throw new Error('Failed to fetch personas');
            const data = await res.json();
            setPersonas(data);
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de charger les personnages.", variant: "destructive" });
        }
    };
    
    const fetchData = async () => {
        setLoading(true);
        try {
            const [configRes] = await Promise.all([
                fetch(`${API_URL}/get-config/${serverId}/ai-personas`),
                fetchPersonas(),
            ]);

            if (!configRes.ok) throw new Error('Failed to fetch config');
            setConfig(await configRes.json());
            
            const serverDetailsRes = await fetch(`${API_URL}/get-server-details/${serverId}`);
            if (!serverDetailsRes.ok) throw new Error('Failed to fetch server details');
            const serverDetailsData = await serverDetailsRes.json();
            setChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 0));

        } catch (error) {
            toast({ title: "Erreur de chargement", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (serverId) {
            fetchData();
        }
    }, [serverId]);

    const handleGeneratePrompt = async () => {
        if (!newName || !newInstructions) {
            toast({ title: "Champs requis", description: "Veuillez fournir un nom et des instructions.", variant: "destructive" });
            return;
        }
        setIsGenerating(true);
        try {
            const res = await fetch(`${API_URL}/personas/generate-prompt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, instructions: newInstructions }),
            });
            if (!res.ok) throw new Error('Failed to generate prompt');
            const data = await res.json();
            setGeneratedPrompt(data.personaPrompt);
            setCurrentStep(2);
        } catch (error) {
             toast({ title: "Erreur de génération", description: "Impossible de générer la personnalité.", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCreatePersona = async () => {
         setIsGenerating(true);
         try {
            const creatorId = "panel-user";
            const res = await fetch(`${API_URL}/personas/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    guild_id: serverId,
                    name: newName,
                    persona_prompt: generatedPrompt,
                    creator_id: creatorId
                }),
            });
            if (!res.ok) throw new Error('Failed to create persona');
            toast({ title: "Succès", description: `Le personnage ${newName} a été créé.` });
            await fetchPersonas();
            resetAndCloseDialog();
         } catch(error) {
            toast({ title: "Erreur", description: "Impossible de créer le personnage.", variant: "destructive" });
         } finally {
            setIsGenerating(false);
         }
    };

    const resetAndCloseDialog = () => {
        setNewName('');
        setNewInstructions('');
        setGeneratedPrompt('');
        setCurrentStep(1);
        setDialogOpen(false);
    };
    
    const handleUpdatePersona = async (personaId: string, updates: Partial<Persona>) => {
        try {
            await fetch(`${API_URL}/personas/${personaId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            await fetchPersonas();
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de mettre à jour le personnage.", variant: "destructive" });
        }
    };

    const handleDeletePersona = async (personaId: string) => {
        try {
            await fetch(`${API_URL}/personas/${personaId}`, { method: 'DELETE' });
            toast({ title: "Succès", description: `Personnage supprimé.`, variant: 'destructive' });
            await fetchPersonas();
        } catch (error) {
             toast({ title: "Erreur", description: "Impossible de supprimer le personnage.", variant: "destructive" });
        }
    };

    const handleModuleToggle = async (enabled: boolean) => {
        if (!config) return;
        const newConfig = { ...config, enabled };
        setConfig(newConfig);
         try {
            await fetch(`${API_URL}/update-config/${serverId}/ai-personas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig),
            });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible d'activer/désactiver le module.", variant: "destructive" });
        }
    }


    if (loading || !config) {
        return <PersonaPageSkeleton />;
    }

    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <div className="space-y-4">
                <GlobalAiStatusAlert />
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Activation du Module</CardTitle>
                             <Switch
                                checked={config.enabled}
                                onCheckedChange={handleModuleToggle}
                            />
                        </div>
                        <CardDescription>
                           Activez ce module pour utiliser les commandes `/personnage` et permettre à vos IA d'interagir.
                        </CardDescription>
                    </CardHeader>
                </Card>

                 <Separator />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                     <div>
                        <h2 className="text-xl font-bold">Vos Personnages IA</h2>
                        <p className="text-muted-foreground">Créez et gérez des personnalités IA uniques pour votre serveur.</p>
                     </div>
                    <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            resetAndCloseDialog();
                        }
                        setDialogOpen(isOpen);
                    }}>
                        <DialogTrigger asChild>
                            <Button onClick={() => setCurrentStep(1)}><PlusCircle />Créer un Personnage</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px]">
                            {currentStep === 1 && (
                                <>
                                <DialogHeader>
                                    <DialogTitle>Étape 1: Créer une Personnalité</DialogTitle>
                                    <DialogDescription>Donnez un nom et des instructions de base. L'IA s'occupe du reste.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="persona-name">Nom du Personnage</Label>
                                        <Input id="persona-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Céleste, Le Gardien, R-7" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="persona-instructions">Instructions</Label>
                                        <Textarea id="persona-instructions" value={newInstructions} onChange={e => setNewInstructions(e.target.value)} placeholder="Ex: Une bibliothécaire timide obsédée par les mystères. Elle est sarcastique mais bienveillante." />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <DialogClose asChild><Button variant="ghost">Annuler</Button></DialogClose>
                                    <Button onClick={handleGeneratePrompt} disabled={isGenerating}>
                                        {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                        Générer la personnalité
                                    </Button>
                                </DialogFooter>
                                </>
                            )}
                             {currentStep === 2 && (
                                <>
                                <DialogHeader>
                                    <DialogTitle>Étape 2: Valider et Créer</DialogTitle>
                                    <DialogDescription>Vérifiez la personnalité générée par l'IA. Vous pouvez la modifier avant de créer le personnage.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-4 max-h-[50vh] overflow-y-auto">
                                     <Textarea value={generatedPrompt} onChange={e => setGeneratedPrompt(e.target.value)} rows={15} />
                                </div>
                                <DialogFooter>
                                     <Button variant="ghost" onClick={() => setCurrentStep(1)}>Retour</Button>
                                    <Button onClick={handleCreatePersona} disabled={isGenerating}>
                                        {isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 />}
                                        Créer le personnage
                                    </Button>
                                </DialogFooter>
                                </>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
                 <Separator />

                {personas.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {personas.map(persona => (
                            <Card key={persona.id} className="flex flex-col">
                                <CardHeader>
                                    <div className="flex justify-between items-start">
                                        <div className='flex items-center gap-3'>
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={persona.avatar_url || undefined} />
                                                <AvatarFallback>{persona.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <CardTitle className="flex items-center gap-2">
                                                {persona.name}
                                            </CardTitle>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeletePersona(persona.id)}><Trash2 className="text-destructive" /></Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex-grow space-y-4">
                                    <div className="space-y-2">
                                         <Label>Salon Actif</Label>
                                          <Select value={persona.active_channel_id || 'none'} onValueChange={(val) => handleUpdatePersona(persona.id, { active_channel_id: val === 'none' ? null : val })}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Sélectionner un salon..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectLabel>Salons Textuels</SelectLabel>
                                                    <SelectItem value="none">Désactivé</SelectItem>
                                                    {channels.map(channel => (
                                                        <SelectItem key={channel.id} value={channel.id}># {channel.name}</SelectItem>
                                                    ))}
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Personnalité (Prompt)</Label>
                                        <Textarea
                                            className="text-xs h-32"
                                            defaultValue={persona.persona_prompt}
                                            onBlur={(e) => handleUpdatePersona(persona.id, { persona_prompt: e.target.value })}
                                        />
                                    </div>
                                     <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <Label htmlFor={`token-${persona.id}`}>Token du Bot (Optionnel)</Label>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="w-4 h-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                    <p className="max-w-xs">Futur : Permettra de lier un bot dédié à ce personnage pour une présence et un avatar uniques.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <Input
                                            id={`token-${persona.id}`}
                                            type="password"
                                            placeholder="Fonctionnalité en développement"
                                            defaultValue={persona.bot_token || ''}
                                            onBlur={(e) => handleUpdatePersona(persona.id, { bot_token: e.target.value })}
                                            disabled
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg">
                        <BotMessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold">Aucun personnage IA créé</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Cliquez sur "Créer un Personnage" pour commencer à peupler votre serveur.
                        </p>
                    </div>
                )}
            </div>
        </PremiumFeatureWrapper>
    );
}

export default function PersonasPage() {
  const params = useParams();
  const serverId = params.serverId as string;
  const { serverInfo, loading } = useServerInfo();

  return (
    <div className="space-y-8 text-white max-w-7xl mx-auto">
      <div>
        <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
                 <ShinyText text="Personnages IA" disabled={!serverInfo?.isPremium} />
            </h1>
            <Badge className="bg-yellow-400 text-yellow-900">Premium</Badge>
        </div>
        <p className="text-muted-foreground mt-2">
          Créez une population d'IA pour votre serveur, chacune avec sa propre personnalité, son histoire et ses relations.
        </p>
      </div>
      
      <Separator />

      {loading ? (
        <PersonaPageSkeleton />
      ) : (
        <PersonaPageContent isPremium={serverInfo?.isPremium || false} serverId={serverId} />
      )}
    </div>
  );
}
