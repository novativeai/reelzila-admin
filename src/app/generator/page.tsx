"use client";

import { useState, Suspense, useEffect, ChangeEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import { modelConfigs } from '@/lib/modelConfigs';

// Shadcn UI Component Imports
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TipsSection } from "@/components/TipsSection";
import { Separator } from "@/components/ui/separator";

// Lucide React Icon Imports
import { Wand2, Frown, Video, Image as ImageIcon } from 'lucide-react';

// Define the possible types for parameters state
type ParamValues = string | number | null;
// Define the possible types for the output media
type OutputType = 'video' | 'image' | null;

/**
 * Helper function to determine if the output is a video or image based on the URL extension.
 * @param url The URL of the generated media.
 * @returns 'video', 'image', or null if the type is unknown.
 */
const getOutputTypeFromUrl = (url: string): OutputType => {
  if (!url) return null;
  // Use URL constructor for robust parsing, even with query parameters
  const pathname = new URL(url).pathname;
  const extension = pathname.split('.').pop()?.toLowerCase();
  
  if (extension === 'mp4') return 'video';
  if (['png', 'jpg', 'jpeg', 'webp', 'avif'].includes(extension || '')) return 'image';
  
  // Fallback if no known extension is found
  return null;
};

function GeneratorComponent() {
  const { user, credits, setCredits } = useAuth();
  const searchParams = useSearchParams();
  const modelId = searchParams.get('model') || 'veo-3-fast';
  const currentModelConfig = modelConfigs[modelId];

  // State Management
  const [params, setParams] = useState<{[key: string]: ParamValues}>({});
  const [outputUrl, setOutputUrl] = useState('');
  const [detectedOutputType, setDetectedOutputType] = useState<OutputType>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Effect to reset state when the model is changed via URL
  useEffect(() => {
    if (!currentModelConfig) return;
    const defaultParams: {[key: string]: ParamValues} = {};
    currentModelConfig.params.forEach(param => { defaultParams[param.name] = param.defaultValue; });
    setParams(defaultParams);
    
    // Reset all outputs and previews
    setImagePreview(null);
    setOutputUrl('');
    setError('');
    setGenerating(false);
    setDetectedOutputType(null);
  }, [currentModelConfig]);

  const handleParamChange = (name: string, value: string | number) => { setParams(prev => ({ ...prev, [name]: value })); };
  
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        handleParamChange('image', dataUrl);
        setImagePreview(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!user || credits <= 0) {
      setError(user ? "You don't have enough credits." : "Please sign in.");
      return;
    }
    setGenerating(true);
    setError('');
    setOutputUrl('');
    setDetectedOutputType(null);

    try {

           // const apiURL = 'https://aivideogenerator-production.up.railway.app/generate-video';
      const apiUrl = `http://0.0.0.0:8000/generate-video`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.uid, model_id: modelId, params }),
      });
      if (!response.ok) {
        throw new Error((await response.json()).detail || 'Failed to generate');
      }
      const data = await response.json();

      if (data.output_urls && Array.isArray(data.output_urls) && data.output_urls.length > 0) {
        const newUrl = data.output_urls[0];
        setOutputUrl(newUrl);
        // Detect and set the output type from the resulting URL
        setDetectedOutputType(getOutputTypeFromUrl(newUrl));
      } else {
        throw new Error("The model did not return a valid output.");
      }
      setCredits(credits - 1);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setGenerating(false);
    }
  };

  if (!currentModelConfig) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-xl font-semibold text-red-500">Error: Model Configuration Not Found</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <section className="text-center max-w-4xl mx-auto mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight flex items-center justify-center gap-3">
          <Wand2 className="h-8 w-8"/>
          Generating with {currentModelConfig.displayName}
        </h1>
      </section>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="lg:col-span-2">
          <Card className="sticky top-20">
            <CardHeader><CardTitle>Input Parameters</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {currentModelConfig.params.map(param => (
                <div key={param.name} className="grid w-full items-center gap-2">
                  <Label htmlFor={param.name} className="font-semibold">{param.label}</Label>
                  {param.type === 'textarea' && <Textarea id={param.name} value={params[param.name] as string || ''} onChange={(e) => handleParamChange(param.name, e.target.value)} rows={5} disabled={generating} />}
                  {param.type === 'slider' && <div className="flex items-center gap-4 pt-1"><Slider id={param.name} value={[params[param.name] as number || 0]} onValueChange={([value]) => handleParamChange(param.name, value)} min={param.min} max={param.max} step={param.step} disabled={generating} /><span className="font-mono text-sm w-12 text-center rounded-md border p-2">{params[param.name] as number}</span></div>}
                  {param.type === 'image' && <div className='grid gap-3'><Input id={param.name} type="file" onChange={handleImageChange} accept="image/*" disabled={generating} />{imagePreview && <AspectRatio ratio={16 / 9} className="bg-muted rounded-md border"><img src={imagePreview} alt="Image preview" className="object-contain w-full h-full rounded-md" /></AspectRatio>}</div>}
                  {param.type === 'dropdown' && <Select value={params[param.name] as string || ''} onValueChange={(value) => handleParamChange(param.name, value)} disabled={generating}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{param.options?.map(option => <SelectItem key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</SelectItem>)}</SelectContent></Select>}
                </div>
              ))}
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
              <Button onClick={handleGenerate} disabled={generating} size="lg" className="w-full">
                <Wand2 className="mr-2 h-5 w-5" /> Generate Media ({credits} Credits)
              </Button>
              {error && <p className="text-red-500 text-sm flex items-center"><Frown className="mr-2 h-4 w-4" />{error}</p>}
            </CardFooter>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between items-center">
                Result
                <Badge variant={generating ? "secondary" : "default"}>
                  {generating ? "Generating..." : (outputUrl ? "Complete" : "Example")}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AspectRatio ratio={16/9} className="bg-muted rounded-md flex items-center justify-center overflow-hidden">
                {generating ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    <p className="mt-4">Rendering your masterpiece...</p>
                  </div>
                ) : outputUrl ? (
                  <>
                    {detectedOutputType === 'video' && (
                      <video src={outputUrl} controls autoPlay loop className="w-full h-full rounded-md" />
                    )}
                    {detectedOutputType === 'image' && (
                      <img src={outputUrl} alt="Generated result" className="object-contain w-full h-full rounded-md" />
                    )}
                    {detectedOutputType === null && (
                        <div className="text-center text-muted-foreground p-4">
                            <p>Unsupported output format.</p>
                            <a href={outputUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline mt-2 block">View Raw Output</a>
                        </div>
                    )}
                  </>
                ) : (
                  <video src="/warrior.mp4" autoPlay loop muted playsInline className="w-full h-full object-cover" />
                )}
              </AspectRatio>
            </CardContent>
          </Card>
        </div>
      </div>
      <Separator className="my-16" />
      <TipsSection tips={currentModelConfig.tips} />
    </div>
  );
}

export default function GeneratorPage() {
    return (
        <Suspense fallback={
          <div className="container mx-auto p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading Model...</p>
          </div>
        }>
            <GeneratorComponent />
        </Suspense>
    )
}