/**
 * Generate cover images for all 5 articles using AI image generation,
 * upload them to the CDN, and update the MySQL database with the new URLs.
 */
import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import { db } from '../src/lib/db';

const CDN_URL = 'https://cdn.sanaathrumylens.co.ke';
const CDN_API_KEY = 'Uu8fNfxbBt5N98PthuFT89KHE9enMxBg';
const TEMP_DIR = '/home/z/my-project/scripts/temp-images';

interface ArticleCover {
  slug: string;
  title: string;
  category: string;
  prompt: string;
}

const ARTICLE_COVERS: ArticleCover[] = [
  {
    slug: 'ujana-ni-moshi-ndio-maana-tunavutia-kodong-klans-disko-video-review',
    title: "Kodong Klan's Disko Video Review",
    category: 'Music Reviews',
    prompt: 'Vibrant Kenyan Afro-pop music video scene, colorful African wedding celebration with dancers in traditional-modern fusion outfits, warm golden lighting, dynamic choreography, festive atmosphere, cinematic composition, rich earth tones with bursts of blue green and yellow, high quality editorial photography style',
  },
  {
    slug: 'getting-into-the-bag',
    title: 'Getting into The BAG!',
    category: 'Scene Reports',
    prompt: 'Energetic DJ event scene in Nairobi Kenya, DJ booth with turntables and colorful LED lights, stylish crowd dancing, vibrant nightlife atmosphere, purple and pink neon glow, modern African urban culture, dynamic concert photography, high quality editorial style',
  },
  {
    slug: 'the-literary-world-of-kenya',
    title: 'The Literary World of Kenya',
    category: 'Literature',
    prompt: 'Stack of Kenyan literature books on a wooden desk, warm reading lamp light, vintage typewriter in background, African literary scene, rich amber and brown tones, cozy library atmosphere, editorial photography, high quality, detailed, literary aesthetic',
  },
  {
    slug: 'ep-review-the-lick-back-by-nikita-kering',
    title: 'EP Review: The Lick Back by Nikita Kering',
    category: 'Music Reviews',
    prompt: 'Powerful female Kenyan R&B artist in recording studio, dramatic moody lighting, microphone and studio equipment, confident pose, deep purple and gold color scheme, professional music photography, editorial portrait style, high quality, atmospheric',
  },
  {
    slug: 'why-kenya-is-africas-underdog-in-the-creative-and-art-sector',
    title: "Why Kenya is Africa's Underdog in Creative Arts",
    category: 'Culture & Opinion',
    prompt: 'Nairobi creative arts scene collage, African artists painting and creating, vibrant colorful studio space, Kenyan flag colors subtly integrated, warm earthy palette with terracotta and gold, cultural celebration, editorial documentary photography style, high quality, inspiring',
  },
];

async function generateImage(prompt: string, outputPath: string): Promise<void> {
  const zai = await ZAI.create();
  console.log(`  Generating image...`);
  
  const response = await zai.images.generations.create({
    prompt: prompt,
    size: '1344x768', // Landscape, good for blog covers
  });

  const imageBase64 = response.data[0].base64;
  const buffer = Buffer.from(imageBase64, 'base64');
  fs.writeFileSync(outputPath, buffer);
  console.log(`  ✓ Saved to ${outputPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
}

async function uploadToCdn(filePath: string, filename: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  
  const formData = new FormData();
  const blob = new Blob([fileBuffer], { type: 'image/png' });
  formData.append('file', blob, filename);

  console.log(`  Uploading to CDN...`);
  const response = await fetch(`${CDN_URL}/upload.php`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CDN_API_KEY}`,
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      Accept: 'application/json',
    },
    body: formData,
  });

  const text = await response.text();
  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error(`CDN returned non-JSON: ${text.slice(0, 200)}`);
  }

  if (!response.ok || !result.ok) {
    throw new Error(`CDN upload failed: ${result.error ?? response.statusText}`);
  }

  console.log(`  ✓ Uploaded: ${result.url}`);
  return result.url;
}

async function main() {
  // Create temp directory
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  console.log(`\n🎨 Generating cover images for ${ARTICLE_COVERS.length} articles...\n`);

  for (const article of ARTICLE_COVERS) {
    console.log(`\n━━━ ${article.title} ━━━`);
    console.log(`  Category: ${article.category}`);
    
    const tempPath = path.join(TEMP_DIR, `${article.slug}.png`);
    
    try {
      // Step 1: Generate the image
      await generateImage(article.prompt, tempPath);

      // Step 2: Upload to CDN
      const cdnUrl = await uploadToCdn(tempPath, `${article.slug}.png`);

      // Step 3: Update the database
      console.log(`  Updating database...`);
      await db.post.updateMany({
        where: { slug: article.slug },
        data: { coverImage: cdnUrl },
      });
      console.log(`  ✓ Database updated`);

      // Clean up temp file
      fs.unlinkSync(tempPath);
    } catch (error) {
      console.error(`  ✗ Failed: ${error instanceof Error ? error.message : String(error)}`);
      // Continue with next article
    }
  }

  // Verify the updates
  console.log(`\n\n━━━ Verification ━━━`);
  const posts = await db.post.findMany({
    select: { title: true, slug: true, coverImage: true, category: true },
    orderBy: { createdAt: 'asc' },
  });
  
  for (const post of posts) {
    const isCdn = post.coverImage?.startsWith('https://cdn.sanaathrumylens.co.ke');
    console.log(`  ${isCdn ? '✓' : '✗'} ${post.title}`);
    console.log(`    → ${post.coverImage}`);
  }

  await db.$disconnect();
  console.log('\n✅ Done!');
}

main().catch((e) => {
  console.error('Fatal error:', e);
  process.exit(1);
});
