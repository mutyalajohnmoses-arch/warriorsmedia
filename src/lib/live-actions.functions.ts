
// Patch for src/lib/live-actions.functions.ts

// ... existing imports ...

export const generateAIThumbnailServerFn = createServerFn({
  method: "POST",
})
  .inputValidator((data: { prompt: string; streamTitle: string; baseImageB64?: string | null }) => data)
  .handler(async ({ data }) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Throwing a specific error that the frontend can catch
      throw new Error("OPENAI_CONFIG_ERROR: Missing API Key");
    }

    const userCorePrompt = data.prompt.trim() || data.streamTitle.trim();
    if (!userCorePrompt) {
      throw new Error("INPUT_ERROR: Prompt and title are empty");
    }

    let finalPromptDescription = `Create a professional, high-quality vibrant 16:9 cinematic YouTube live stream thumbnail. Subject: ${userCorePrompt}. Style: Clean digital art, immersive graphic composition, vivid studio lighting. Strict Rule: DO NOT include any text, typography, letters, or words on the canvas.`;

    try {
      if (data.baseImageB64) {
        const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: "Describe the visual subject, art style, character framing, and color palette of this image in detail so it can be re-created or heavily referenced in a new DALL-E 3 prompt." },
                  { type: "image_url", image_url: { url: data.baseImageB64 } }
                ]
              }
            ]
          }),
        });

        if (visionResponse.ok) {
          const visionData = await visionResponse.json();
          const visualContext = visionData.choices[0]?.message?.content || "";
          finalPromptDescription += ` Heavily adapt and incorporate the visual elements, subject framing, and character reference features described here: ${visualContext}`;
        } else {
          const errorData = await visionResponse.json();
          console.error("OpenAI Vision Error:", errorData);
          throw new Error(`OPENAI_ERROR: ${errorData.error?.code || 'vision_failed'}`);
        }
      }

      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: finalPromptDescription,
          n: 1,
          size: "1792x1024",
          quality: "standard",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("OpenAI DALL-E Error:", errorData);
        // Throwing structured error for the frontend
        throw new Error(`OPENAI_ERROR: ${errorData.error?.code || 'generation_failed'}`);
      }

      const result = await response.json();
      const imageUrl = result.data[0]?.url;

      if (!imageUrl) {
        throw new Error("OPENAI_ERROR: no_image_url");
      }

      return { imageUrl };
    } catch (error: any) {
      console.error("Server API Error during image creation:", error);
      // Ensure we propagate the OPENAI_ERROR prefix if it exists, otherwise wrap it
      if (error.message?.includes("OPENAI_ERROR") || error.message?.includes("OPENAI_CONFIG_ERROR")) {
        throw error;
      }
      throw new Error(`OPENAI_ERROR: ${error.message || "unknown_error"}`);
    }
  });
