// This file defines the UI and parameters for each supported model.

interface ModelParameter {
  name: string;
  label: string;
  type: 'textarea' | 'image' | 'slider' | 'dropdown';
  // --- THE FIX: Replace 'any' with the specific types you are using ---
  defaultValue: string | number | null;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
}

// Add this interface to define the structure of our new tips content
interface TipContent {
  subtitle: string;
  text: string;
  list?: string[];
}

interface TipSection {
  title: string;
  content: TipContent[];
}

interface ModelConfig {
  id: string;
  displayName: string;
  outputType: 'video' | 'image';
  description: string;
  bannerImage: string;
  // THE FIX: Use a dedicated property for the card's hover video
  cardVideo: string; 
  tags: string[];
  params: ModelParameter[];
  tips?: TipSection[];
}

export const modelConfigs: { [key: string]: ModelConfig } = {
  "kling-2.5": {
    id: "kling-2.5",
    displayName: "Kling 2.5 Turbo Pro",
    description: "Kuaishou&apos;s flagship video generation model featuring industry-leading motion quality and temporal consistency.",
    bannerImage: "/banners/wan-banner.jpg",
    cardVideo: "/videos/model-2.mp4",
    tags: ["top-rated", "motion", "cinematic"],
    outputType: 'video',
    params: [
      {
        name: "prompt",
        label: "Prompt",
        type: "textarea",
        defaultValue: "A cinematic shot of a woman walking through a neon-lit city at night.",
      },
      {
        name: "start_image",
        label: "Starting Image (optional)",
        type: "image",
        defaultValue: null,
      },
      {
        name: "negative_prompt",
        label: "Negative Prompt",
        type: "textarea",
        defaultValue: "",
      },
      {
        name: "duration",
        label: "Duration (seconds)",
        type: "dropdown",
        defaultValue: "5",
        options: ["5", "10"],
      },
      {
        name: "aspect_ratio",
        label: "Aspect Ratio",
        type: "dropdown",
        defaultValue: "16:9",
        options: ["16:9", "9:16", "1:1"],
      },
    ],
    tips: [
      {
        title: "Prompting Guide",
        content: [
          {
            subtitle: "Cinematic Language",
            text: "Kling 2.5 excels with cinematic terminology. Use terms like dolly shot, tracking shot, and specific lens references for professional results."
          }
        ]
      }
    ]
  },
  "veo-3.1": {
    id: "veo-3.1",
    displayName: "VEO 3.1",
        description: "Use Wan 2.2 text to image LoRA trainer. Fine-tune Wan 2.2 for subjects and styles.",
    bannerImage: "/banners/wan-banner.jpg", // A wide, cinematic image
     cardVideo: "/videos/model-2.mp4", // This is the video that will play on hover    // A more focused, square-like image
    tags: ["new", "lora", "personalization"],
outputType: 'video',
    params: [
      {
        name: "image",
        label: "Image",
        type: "image",
        defaultValue: null,
      },
            {
        name: "prompt",
        label: "Prompt",
        type: "textarea",
        defaultValue: "The white dragon warrior stands still, eyes full of determination and strength. The camera slowly moves closer or circles around the warrior, highlighting the powerful presence and heroic spirit of the character.",
      },
            {
        name: "negative_prompt",
        label: "Negative prompt",
        type: "textarea",
        defaultValue: "",
      },

    ],
    tips: [
      {
        title: "📝 Prompting Basics for VEO 3",
        content: [
          {
            subtitle: "Be Descriptive and Specific",
            text: "Instead of 'a car', try 'a vintage red sports car driving through a neon-lit city at night'. The more detail you provide, the better the AI can interpret your vision."
          },
          {
            subtitle: "Describe the Camera Work",
            text: "Incorporate cinematic terms to guide the camera. Use phrases like 'cinematic shot', 'dolly zoom', 'aerial drone shot', or 'close-up shot' to control the perspective and movement.",
            list: [
                "Example: 'An aerial drone shot flying over a dense, foggy forest.'",
                "Example: 'Close-up on a chef's hands artfully plating a gourmet dish.'"
            ]
          },
          {
            subtitle: "Specify the Mood and Lighting",
            text: "Words like 'dramatic lighting', 'golden hour', 'moody atmosphere', or 'vibrant and colorful' can drastically change the feel of your generated video."
          }
        ]
      }
    ]
  },
  "seedance-1-pro": {
    id: "seedance-1-pro",
    displayName: "Seedance-1 Pro",
           description: "Use Wan 2.2 text to image LoRA trainer. Fine-tune Wan 2.2 for subjects and styles.",
    bannerImage: "/banners/wan-banner.jpg", // A wide, cinematic image
     cardVideo: "/videos/model-2.mp4", // This is the video that will play on hover
    tags: ["new", "lora", "personalization"],
    outputType: 'video',
    params: [
      /*{
        name: "image",
        label: "Input Image",
        type: "image",
        defaultValue: null,
      },*/
      {
        name: "prompt",
        label: "Prompt",
        type: "textarea",
        defaultValue: "The white dragon warrior stands still, eyes full of determination and strength. The camera slowly moves closer or circles around the warrior, highlighting the powerful presence and heroic spirit of the character.",
      },
      {
        name: "resolution",
        label: "Resolution",
        type: "dropdown",
        defaultValue: "480p",
        options: ["480p", "720p", "1080p"],
      },
      {
        name: "duration",
        label: "Duration",
        type: "slider",
        defaultValue: 5,
        min: 1,
        max: 5,
        step: 1,
      },
    ],
    tips: [
      {
        title: "🚀 Key Features",
        content: [
          {
            subtitle: "🎨 Cinema-Grade Aesthetic Control",
            text: "Integration of professional cinematography principles—including lighting, color, and cinematic language—allows for precise aesthetic control through multi-faceted keywords, resulting in visuals that are both stylistically diverse and rich in nuanced detail."
          },
          {
            subtitle: "🎭 Greatly Improved Complex Motion Generation",
            text: "Dynamic generation capabilities now enable precise control and stable generation of highly complex movements. This includes nuanced body motion, athletic actions, and detailed facial expressions. The resulting motion is exceptionally fluid, with details rendered in a natural and realistic manner."
          },
          {
            subtitle: "🌍 Enhanced Real-World Replication",
            text: "Featuring significantly more powerful semantic control and instruction-following capabilities. This update brings remarkable improvements in multi-subject generation, the depiction of interactions, and spatial accuracy within complex scenes. As a result, users can now reliably replicate real-world scenarios through text prompts."
          }
        ]
      },
      {
        title: "📝 Prompt Recipe Guide",
        content: [
          {
            subtitle: "🟢 Basic Formula",
            text: "For new users trying AI video for the first time or seeking creative inspiration. Simple, open-ended prompts can generate more imaginative videos.",
            list: [
              "Formula: Prompt = Subject + Scene + Motion",
              "Subject: The main focus of the video (person, animal, object, etc.).",
              "Scene: The environment where the subject is situated.",
              "Motion: The subject's specific movements and general scene dynamics."
            ]
          },
          {
            subtitle: "🔵 Advanced Formula",
            text: "For users with some experience in AI video creation. Adding richer, more detailed descriptions enhances video quality, vividness, and storytelling.",
            list: [
              "Formula: Prompt = Subject (Subject Description) + Scene (Scene Description) + Motion (Motion Description) + Aesthetic Control + Stylization"
            ]
          }
        ]
      }
    ]
  },
  // --- NEW MODEL CONFIGURATION ---
  "wan-2.2": {
    id: "wan-2.2",
    displayName: "WAN 2.2 14B",
           description: "Use Wan 2.2 text to image LoRA trainer. Fine-tune Wan 2.2 for subjects and styles.",
    bannerImage: "/banners/wan-banner.jpg", // A wide, cinematic image
     cardVideo: "/videos/model-2.mp4", // This is the video that will play on hover
    tags: ["new", "lora", "personalization"],
    outputType: 'video',
    params: [
      {
        name: "image",
        label: "Input Image",
        type: "image",
        defaultValue: null,
      },
      {
        name: "prompt",
        label: "Prompt",
        type: "textarea",
        defaultValue: "Commercial video photoshoot of a pair of shoes with tons of effect.",
      },
      {
        name: "resolution",
        label: "Resolution",
        type: "dropdown",
        defaultValue: "480p",
        options: ["480p", "720p"]
      },
      {
        name: "num_frames",
        label: "Number of frames",
        type: "slider",
        defaultValue: 81,
        min: 81,
        max: 100,
        step: 1
      },
      {
        name: "frames_per_second",
        label: "Frames per second",
        type: "slider",
        defaultValue: 16,
        min: 5,
        max: 24,
        step: 1
      },
    ],
    tips: [
      {
        title: "💡 Using WAN 2.2",
        content: [
          {
            subtitle: "Image to Video with Controlled Motion",
            text: "This model excels at bringing a still image to life. Upload your source image and describe the scene you want to create. Use the 'Camera Motion' and 'Motion Strength' controls to guide the animation precisely."
          },
          {
            subtitle: "Fine-Tuning Your Output",
            text: "Higher 'Sample Steps' can lead to more detailed videos but will take longer to generate. 'Motion Strength' controls how dynamic the camera movement is."
          }
        ]
      }
    ]
  },
    // --- IMAGE MODEL CONFIGURATION ---
  "flux-1.1-pro-ultra": {
    id: "flux-1.1-pro-ultra",
    displayName: "FLUX 1.1 Pro Ultra",
    description: "Black Forest Labs flagship text-to-image model generating ultra high-resolution images up to 4 megapixels.",
    bannerImage: "/banners/wan-banner.jpg",
    cardVideo: "/videos/model-2.mp4",
    tags: ["image", "4MP", "ultra-fast"],
    outputType: 'image',
    params: [
      {
        name: "prompt",
        label: "Prompt",
        type: "textarea",
        defaultValue: "A stunning portrait of a woman with emerald eyes, soft golden hour lighting, professional photography.",
      },
      {
        name: "aspect_ratio",
        label: "Aspect Ratio",
        type: "dropdown",
        defaultValue: "16:9",
        options: ["21:9", "16:9", "4:3", "3:2", "1:1", "2:3", "3:4", "9:16", "9:21"],
      },
      {
        name: "output_format",
        label: "Output Format",
        type: "dropdown",
        defaultValue: "jpg",
        options: ["jpg", "png"],
      },
      {
        name: "raw",
        label: "Raw Mode",
        type: "dropdown",
        defaultValue: "false",
        options: ["true", "false"],
      },
    ],
    tips: [
      {
        title: "Prompting Guide",
        content: [
          {
            subtitle: "Detailed Descriptions",
            text: "FLUX 1.1 Pro Ultra excels with detailed, descriptive prompts. Include specific details about lighting, composition, style, and atmosphere."
          }
        ]
      }
    ]
  },


};