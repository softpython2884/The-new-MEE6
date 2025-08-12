'use client';

import { useEffect } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { getAiSuggestions, type FormState } from './actions';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Bot, FileText, Loader2, MessageSquareQuote, ShieldCheck } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        'Generate Suggestions'
      )}
    </Button>
  );
}

function SuggestionResult({ data }: { data: FormState['data'] }) {
  if (!data) return null;

  return (
    <div className="mt-8 space-y-6 animate-in fade-in-50">
       <h2 className="text-2xl font-semibold tracking-tight">Generated Suggestions</h2>
      <div className="grid gap-6 lg:grid-cols-1">
        <Card>
          <CardHeader className='flex-row items-center gap-4 space-y-0'>
            <ShieldCheck className='h-8 w-8 text-primary' />
            <CardTitle>Moderation Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{data.moderationSettings}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex-row items-center gap-4 space-y-0'>
            <MessageSquareQuote className='h-8 w-8 text-primary' />
            <CardTitle>Welcome Message</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">{data.welcomeMessage}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex-row items-center gap-4 space-y-0'>
            <FileText className='h-8 w-8 text-primary' />
            <CardTitle>Auto-Moderation Rules</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-muted-foreground">{data.autoModerationRules}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AiSuggestionsPage() {
  const { toast } = useToast();
  const initialState: FormState = { data: null, error: null, success: false };
  const [state, formAction] = useFormState(getAiSuggestions, initialState);

  useEffect(() => {
    if (state.success === false && state.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: state.error,
      });
    }
  }, [state, toast]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI-Powered Suggestions</h1>
        <p className="text-muted-foreground">
          Let our AI help you configure your server for success.
        </p>
      </div>
      <Card>
        <form action={formAction}>
          <CardHeader>
            <CardTitle>Describe Your Server</CardTitle>
            <CardDescription>
              Provide some details about your server to get the best configuration suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="server-size">Server Size</Label>
              <Select name="serverSize" required>
                <SelectTrigger id="server-size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (1-100 members)</SelectItem>
                  <SelectItem value="medium">Medium (100-1,000 members)</SelectItem>
                  <SelectItem value="large">Large (1,000+ members)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="server-activity">Server Activity</Label>
              <Select name="serverActivity" required>
                <SelectTrigger id="server-activity">
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="community-type">Community Type</Label>
              <Select name="communityType" required>
                <SelectTrigger id="community-type">
                  <SelectValue placeholder="Select community type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gaming">Gaming</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="educational">Educational</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="support">Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            <SubmitButton />
          </CardFooter>
        </form>
      </Card>
      
      <SuggestionResult data={state.data} />
    </div>
  );
}
