import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button"

const models = [
    {
    id: "flux-kontext-pro",
    name: "FLUX Kontext Pro",
    tag: "image-to-image",
    imageUrl: "/texture-02.avif",
  },
  {
    id: "veo-3-fast",
    name: "Veo 3",
    tag: "text-to-video",
    imageUrl: "/texture-01.avif",
  },
  {
    id: "seedance-1-pro",
    name: "Seedance-1 Pro",
    tag: "text-to-video",
    imageUrl: "/texture-02.avif",
  },
  {
    id: "wan-2.2",
    name: "Wan-2.2",
    tag: "image-to-video",
    imageUrl: "/texture-01.avif",
  },
];

export function ModelGallery() {
  return (
    <section id="model-gallery" className="w-full py-16 md:py-24 lg:py-32 bg-background">
      <div className="container px-4 md:px-6">
        <h2 className="text-3xl font-bold tracking-tighter mb-8">Model Gallery</h2>
        
        {/* The Carousel component now has a relative class for arrow positioning */}
        <Carousel opts={{ align: "start", loop: true }} className="w-full relative">
          <CarouselContent className="-ml-4">
            {models.map((model, index) => (
              <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                <Link href={model.id ? `/generator?model=${model.id}` : "#"} className="group block h-full">
                  
                  <div
                    className="h-80 w-full rounded-lg overflow-hidden relative bg-cover bg-center transition-all duration-300 ease-in-out group-hover:scale-105"
                    style={{ backgroundImage: `url(${model.imageUrl})` }}
                  >
                    {/* Dark overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-black/10 group-hover:from-black/70"></div>
                    
                    {/* Content is relative to be on top of the overlay */}
                    <div className="relative z-10 flex flex-col justify-end h-full p-6 text-white">
                      <h3 className="text-4xl font-bold drop-shadow-lg">{model.name}</h3>
                      <Badge variant="secondary" className="mt-2 w-fit">{model.tag}</Badge>
                    </div>
                  </div>
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
          
          {/* --- THE FIX IS HERE --- */}
          {/* The `lg:hidden` class has been removed, so these arrows are now always visible */}
          {/* Added positioning classes for better placement on large screens */}
          <div>
            <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2 hidden lg:flex" />
            <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2 hidden lg:flex" />
          </div>
        </Carousel>
                <div className="mt-8 text-center">
            <Link href="/explore">
                <Button variant="outline">Explore All Models</Button>
            </Link>
        </div>
      </div>
    </section>
  );
}