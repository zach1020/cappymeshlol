import type { AssetMode } from "@cappymesh/shared";
import { Box, Brush, Gamepad2, Printer, ShoppingBag, Sparkles } from "lucide-react";

export const modes: Array<{
  id: AssetMode;
  label: string;
  description: string;
  icon: typeof Gamepad2;
  accent: string;
}> = [
  {
    id: "game",
    label: "Game Asset",
    description: "Low, mid, or high-poly exports for Unity, Unreal, Godot, and web games.",
    icon: Gamepad2,
    accent: "var(--green)"
  },
  {
    id: "print",
    label: "Print",
    description: "STL-first pipeline with manifold checks, scale controls, and repair notes.",
    icon: Printer,
    accent: "var(--amber)"
  },
  {
    id: "creator",
    label: "Creator Prop",
    description: "Stylized props and accessories for VTubers, stream rooms, and scenes.",
    icon: Sparkles,
    accent: "var(--purple)"
  },
  {
    id: "shop",
    label: "Shop",
    description: "Product-ready charms, ornaments, mockups, and batch-friendly exports.",
    icon: ShoppingBag,
    accent: "var(--cyan)"
  }
];

export const examples = [
  {
    title: "Cyberpunk chair",
    mode: "Game Asset",
    prompt: "clean game asset, 5k tris, neon vinyl material",
    formats: "GLB, OBJ"
  },
  {
    title: "Tabletop relic",
    mode: "Print",
    prompt: "watertight miniature prop, 75mm tall",
    formats: "STL, GLB"
  },
  {
    title: "Stream desk cactus",
    mode: "Creator Prop",
    prompt: "cozy stylized prop with soft painted texture",
    formats: "GLB"
  }
];

export const pricingPlans = [
  {
    name: "Free",
    price: "$0",
    note: "Try the pipeline",
    features: ["5 starter credits", "1 low-quality preview", "GLB export only", "Launch-gated billing"]
  },
  {
    name: "Starter",
    price: "$9",
    note: "Light creator work",
    features: ["100 credits/month", "Private assets", "GLB + OBJ exports", "Standard queue"]
  },
  {
    name: "Creator",
    price: "$19",
    note: "Best first paid plan",
    features: ["350 credits/month", "GLB + OBJ + STL", "Faster queue", "Remixes and history"]
  },
  {
    name: "Studio",
    price: "$49",
    note: "Heavy production",
    features: ["1,200 credits/month", "Priority queue", "Batch generation later", "API beta later"]
  }
];

export const demoAssets = [
  {
    id: "demo-chair",
    title: "Cyberpunk stool",
    status: "complete",
    mode: "Game Asset",
    created: "Mocked today",
    formats: ["GLB", "OBJ"]
  },
  {
    id: "demo-print",
    title: "Moon charm",
    status: "exporting",
    mode: "Print",
    created: "Mocked today",
    formats: ["STL"]
  },
  {
    id: "demo-cactus",
    title: "Desk cactus prop",
    status: "complete",
    mode: "Creator Prop",
    created: "Mocked yesterday",
    formats: ["GLB"]
  }
];

export const pipelineStages = [
  "Validate image",
  "Request object mask",
  "Run SAM 3D Objects",
  "Clean mesh",
  "Bake texture",
  "Export package"
];

export const meshIcon = Box;
export const styleIcon = Brush;
