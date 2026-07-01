// fal image endpoint maps + picker, shared by the image start route.

export const FAL_IMAGE_MAP = {
  "Flux 2 Pro": "fal-ai/flux-2-pro",
  "Flux 2 Max": "fal-ai/flux-2-max",
  "Nano Banana Pro": "fal-ai/nano-banana-pro",
  "Nano Banana 2": "fal-ai/nano-banana-2",
  "Seedream 4.5": "fal-ai/bytedance/seedream/v4.5/text-to-image",
  "GPT Image 2": "openai/gpt-image-2",
};

// Image-to-image / edit endpoints (take prompt + image_urls).
export const FAL_EDIT_MAP = {
  "Flux 2 Pro": "fal-ai/flux-2-pro",
  "Flux 2 Max": "fal-ai/flux-2-max",
  "Nano Banana Pro": "fal-ai/nano-banana-pro/edit",
  "Nano Banana 2": "fal-ai/nano-banana-2/edit",
  "Seedream 4.5": "fal-ai/bytedance/seedream/v4.5/edit",
  "GPT Image 2": "openai/gpt-image-2/edit",
};

export function pickImageEndpoint(model, hasImages) {
  return hasImages
    ? FAL_EDIT_MAP[model] || "fal-ai/nano-banana-pro/edit"
    : FAL_IMAGE_MAP[model] || "fal-ai/flux-2-pro";
}
