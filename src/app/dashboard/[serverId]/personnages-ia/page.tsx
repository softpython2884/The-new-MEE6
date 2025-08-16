
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
import { Users, Trash2, PlusCircle, Sparkles, Loader2, Wand2, BotMessageSquare, VenetianMask } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useServerInfo } from '@/hooks/use-server-info';
import { PremiumFeatureWrapper } from '@/components/premium-wrapper';
import { Badge } from '@/components/ui/badge';
import ShinyText from '@/components/ui/shiny-text';

const API_URL = process.env.NEXT_PUBLIC_BOT_API_URL || 'http://localhost:3001/api';

// Types
interface Persona {
    id: string;
    guild_id: string;
    name: string;
    persona_prompt: string;
    active_channel_id: string | null;
}
interface DiscordChannel {
    id: string;
    name: string;
    type: number;
}

function PersonaPageSkeleton() {
    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Skeleton className="h-10 w-40" />
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    
    // States for the creation dialog
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
    
    useEffect(() => {
        if (!serverId) return;
        const fetchData = async () => {
            setLoading(true);
            await fetchPersonas();
             try {
                const serverDetailsRes = await fetch(`${API_URL}/get-server-details/${serverId}`);
                if (!serverDetailsRes.ok) throw new Error('Failed to fetch server details');
                const serverDetailsData = await serverDetailsRes.json();
                setChannels(serverDetailsData.channels.filter((c: DiscordChannel) => c.type === 0));
            } catch (error) {
                 toast({ title: "Erreur", description: "Impossible de charger les salons.", variant: "destructive" });
            }
            setLoading(false);
        };
        fetchData();
    }, [serverId, toast]);

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
            // This is a placeholder for the creator's ID. In a real app with user auth, this would be the actual user's ID.
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
            await fetchPersonas(); // Refresh list
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
            await fetchPersonas(); // Refresh
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de mettre à jour le personnage.", variant: "destructive" });
        }
    };

    const handleDeletePersona = async (personaId: string) => {
        try {
            await fetch(`${API_URL}/personas/${personaId}`, { method: 'DELETE' });
            toast({ title: "Succès", description: `Personnage supprimé.`, variant: 'destructive' });
            await fetchPersonas(); // Refresh
        } catch (error) {
             toast({ title: "Erreur", description: "Impossible de supprimer le personnage.", variant: "destructive" });
        }
    };


    if (loading) {
        return <PersonaPageSkeleton />;
    }

    return (
        <PremiumFeatureWrapper isPremium={isPremium}>
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                     <div>
                        <h2 className="text-xl font-bold">Vos Personnages IA</h2>
                        <p className="text-muted-foreground">Créez et gérez des personnalités IA uniques pour votre serveur.</p>
                     </div>
                    <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
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
                                    <DialogClose asChild><Button variant="ghost" onClick={resetAndCloseDialog}>Annuler</Button></DialogClose>
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
                                        <CardTitle className="flex items-center gap-2">
                                            <VenetianMask /> {persona.name}
                                        </CardTitle>
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
