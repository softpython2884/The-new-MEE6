
'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';

// --- Schema Definition ---
const LevelCardInputSchema = z.object({
  userName: z.string().describe("The user's display name."),
  avatarUrl: z.string().describe("The URL to the user's avatar."),
  currentLevel: z.number().describe("The user's current level."),
  currentXp: z.number().describe("The user's current XP."),
  requiredXp: z.number().describe("The XP required for the next level."),
  rank: z.number().describe("The user's rank on the server."),
  backgroundUrl: z.string().optional().describe("URL of a custom background image for the card."),
});

// --- Register Font ---
// We need to register the font file for canvas to use it.
const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Inter-Bold.ttf');
try {
    registerFont(fontPath, { family: 'Inter', weight: 'bold' });
} catch(e) {
    console.error("Failed to register font for level card. Ensure 'public/fonts/Inter-Bold.ttf' exists.", e);
}


// --- Main Flow ---
export const generateLevelCard = ai.defineFlow(
  {
    name: 'generateLevelCard',
    inputSchema: LevelCardInputSchema,
    outputSchema: z.any(), // Returns a buffer
  },
  async (input) => {
    const {
      userName,
      avatarUrl,
      currentLevel,
      currentXp,
      requiredXp,
      rank,
      backgroundUrl
    } = input;

    const width = 934;
    const height = 282;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // --- Background ---
    ctx.fillStyle = '#23272A';
    ctx.fillRect(0, 0, width, height);

    if (backgroundUrl) {
        try {
            const background = await loadImage(backgroundUrl);
            ctx.drawImage(background, 0, 0, width, height);
        } catch (e) {
             console.error(`[LevelCard] Failed to load background image from ${backgroundUrl}`, e);
        }
    }
    
    // Dimmed overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, width, height);


    // --- Progress Bar ---
    const barWidth = 610;
    const barHeight = 38;
    const barX = 280;
    const barY = 180;
    
    // Background of the bar
    ctx.fillStyle = '#484b4e';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 20);
    ctx.fill();

    // Filled part of the bar
    const progress = Math.max(0, currentXp / requiredXp);
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * progress, barHeight, 20);
    ctx.fill();


    // --- Text ---
    ctx.font = 'bold 36px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'start';
    ctx.fillText(userName, 280, 160);

    ctx.font = 'bold 30px Inter';
    ctx.fillStyle = '#B9BBBE';
    ctx.textAlign = 'end';
    ctx.fillText(`${currentXp} / ${requiredXp} XP`, 890, 160);

    // Level
    ctx.font = 'bold 42px Inter';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'end';
    ctx.fillText(`LVL`, 890, 80);
    ctx.font = 'bold 60px Inter';
    ctx.fillText(`${currentLevel}`, 890, 130);

    // Rank
    ctx.font = 'bold 42px Inter';
    ctx.fillStyle = '#B9BBBE';
    ctx.textAlign = 'start';
    ctx.fillText(`RANK #${rank}`, 280, 80);
    

    // --- Avatar ---
    ctx.save();
    ctx.beginPath();
    ctx.arc(141, 141, 100, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    
    try {
        const avatar = await loadImage(avatarUrl);
        ctx.drawImage(avatar, 41, 41, 200, 200);
    } catch (e) {
        console.error(`[LevelCard] Failed to load avatar from ${avatarUrl}`, e);
        // Draw a placeholder if avatar fails
        ctx.fillStyle = '#7289DA';
        ctx.fillRect(41, 41, 200, 200);
    }
    ctx.restore();

    return canvas.toBuffer('image/png');
  }
);
