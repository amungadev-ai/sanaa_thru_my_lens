/**
 * Add <h2> headings to 3 articles that are missing them.
 * The headings are inserted before the most natural section-break paragraphs.
 */
import { db } from "../src/lib/db";

async function main() {
  // 1. Getting into The BAG! — add headings for section breaks
  const bagId = "cmt9w1qy00007qpqf0unflwd9";
  const bagContent = `<p>The BAG- a DJ‐mix event or series showcasing top Kenyan DJs.</p>
<p>It is the superior version of the mfuko, the kikapu, the mkoba and other tinier versions (no shade intended) as Kenyans like to refer to them. As we await the bag awards, it is important to note that The Bag has been one of the most entertaining things the 2025 Kenyan music scene gave us.</p>
<p>Is it just a showcase for DJs, though? Honestly, that's debatable. Because beyond the decks, there's a whole ecosystem at play, brands showing out, makeup artists who worked their magic, stylists and hair gurus who perfected every look and drink vendors keeping the vibe alive. All of it seems to orbit around one thing: the sexy mamis. They're the sous chefs to the chef, the sidekicks to the hero, the helpers to the help (lol). In my opinion they are The Bag. They hold the power to influence how the audience receives any edition, any mix, any DJ's playlist. It's a lot of power, maybe too much if you ask me. But then again, Beyoncé did say girls run the world.</p>
<h2>The DJs Behind the Decks</h2>
<p>As a country that enjoys sherehe (partying) a little too much, it is no surprise just how quickly the Bag caught on and how impressively it's grown. It is an opportunity for DJs to showcase their prowess and get their flowers while at it on a grander scale. I saw someone say Kaneda's rate card is about to shoot up after she showcased her mastery of music mixing at the 9th edition and honestly, they weren't lying. I hadn't heard any of her sets before that one, but yeees, Miss Ma'am did her thing. I was instantly hooked. DJs Tophaz, Bash and Kym Nickdee also gave us premium bashment in their respective editions. It would be wrong to invalidate the other DJs and so I'm handing Mista C, Ally Fresh, Sir M, Festa, Shinski and Big Sam flowers as well.</p>
<h2>The Frontline: Where the Magic Happens</h2>
<p>It's not just about the music when it comes to The Bag, is it? It's about the vibes, the energy, the aura brought by the audience or everyone attending the different editions. This is especially true for those stationed on the decks next to the DJ, a spot mostly reserved for females. I heard someone call it the "frontline," and honestly, I see why. To be there is to be seen, noticed, envied by some and respected by others, loved by a lot and even hated by a fair few. Frontline is a name that perfectly fits that position. The people there have to be nothing short of exceptional; lyrical knowledge, dance skills, face cards (yes, you absolutely have to serve face) and of course boujee.</p>
<h2>More Than Entertainment: A Cultural Moment</h2>
<p>What has been keeping viewers hooked over the different editions is the girls. How they act, dress, lip sync. dance, not dance, look, is under the scrutiny of watchful Kenyan eyes. Some of us, me at least, live vicariously through them. What's there to learn you wonder. For fellow ladies, confidence, the art of seduction, slow whining, how to dress. The list is limitless. You start watching and a girl aura farms so hard you can't even hear the song list as you get lost in her trance, Hi Miriam. if you were to ask me, I'd honestly say that this concept of the bag, the ladies and how they act (told to or not), is an amazing thing. At the end of the day, the Kenyan bag isn't just entertainment; it's a whole cultural moment. It's the confidence, the soft-life energy, the bold outfits, the unapologetic femininity and the fact that these girls get up there and own it every single time. Honestly, that alone is a lesson in self-love. You can't step out in your sexiest fit, dance under blazing lights and have half the country watching unless you've built yourself from the inside out. That's power. That's queen behaviour.</p>
<h2>Themed Experiences and Kenyan Destinations</h2>
<p>The rotating themes across the sets keep you hooked, always wondering what the attendees will show up in next. The Halloween edition was especially striking; unexpected, bold and creatively executed in ways few would have imagined. The "sexy safari" and "tropical seduction" themes also stood out, blending style with atmosphere in a way that felt both playful and immersive.</p>
<p>What makes it even more captivating is how these themed experiences double as a showcase of Kenyan destinations, turning familiar locations into something almost cinematic. And it doesn't stop at home. The South African and Ugandan girls absolutely delivered, raising the bar with every appearance. Now all eyes are on what the rest of the continent will bring next—the sets, the locations, and of course, the mamis.</p>
<h2>Long Live THE BAG</h2>
<p>So as we wait for the awards that crown people's favourites across the different categories, and in the spirit of the award season, it is important to remember that there are no losers in the Bag ecosystem. Getting into that space alone already places you in a league of your own because visibility, creativity and consistency in such a competitive entertainment landscape is its own form of victory. The Bag is not just about who takes home a title; it is about the culture being built, the stories being told and the moments that continue to shape Kenyan entertainment on screen and beyond. In that sense, to be in the conversation at all is to have already won. Here's to more love, more confidence and everyone on that stage shining in their own way. Long Live THE BAG!</p>`;

  // 2. The literary world of Kenya
  const litId = "cmt9w1scy0008qpqfavgbiapy";
  const litContent = `<p>Kenya's literary scene has always been pulsating like a heartbeat, slow sometimes, but always steady, even when you are not paying attention to it. From the stories told around the fireplace on a moonlit night, to the dog-eared storybooks passed from one child to another, storytelling has always been part of who we are.</p>
<p>If you grew up around the same time as I did, the first story you read was probably a worn-out Hello Children. For me, I did not even know the title of the book because all I had was an old copy that barely had a cover, but I liked it regardless.</p>
<p>I clung on to every word of the book, so much that by the time I was in grade 4, I could recite it from memory. Looking back now, maybe my parents should have bought me more storybooks because how on earth do I still remember the first line of a book I read over 15 years ago?</p>
<p>Then came the graded readers that we all read and reread all across Primary school. Those were fire. But Kenyan literature did not end there. Not even close.</p>
<h2>Falling in Love with Kenyan Literature</h2>
<p>Progressively, I have come to love, no, be obsessed with Kenyan literature. This may or may not have stemmed from my first literature class a few years ago when Professor Rutere spoke so passionately about Ngugi wa Thiong'o and made us read nearly every single one of Ngugi's work over the four years he lectured us.</p>
<p>With every chapter of The River Between and every line of I Will Marry When I Want, I began to think that the good Professor may have underreacted. I was sold on the Kenyan literature train and nothing could make me disembark.</p>
<h2>The Pioneers Who Paved the Way</h2>
<p>Pioneer writers like Ngugi, Grace Ogot, Meja Mwangi, Yvonne Odhiambo and Charles Mangua crafted a path so clear that modern writers had no option but to follow. Kenyan literature has always had a pulse of its own and the rise in self-publishing houses has given a platform for so many stories to be told.</p>
<h2>A New Wave of Literary Energy</h2>
<p>Lately, there has been a shift. Writers, readers, enthusiasts and the entire literary community in Kenya has awakened. Not only have there been more book launches but there are more writing workshops, more book readings and newer voices being forged. Places like the Goethe-Institut, Cheche bookstore and the Alliance Française continue to provide the stage for readings, discussions and launches that bring the literary community together. What's more, bookstores stocked with every Kenyan play, novel or anthology you can think of, have been on the rise. Just thinking of this gives me goosebumps.</p>
<h2>New Voices, New Platforms</h2>
<p>Writers like Troy Onyango, through his literary magazine Lolwe, are curating spaces for African storytelling that feels both global and deeply personal. Communities like Qwani have become hubs for new, bold voices. Young Kenyans are experimenting with form, language and identity and it is nothing short of amazing.</p>
<p>From traditional publishing giants to online blogs and magazines, from school anthologies to open mic nights, Kenyan literature is not just surviving, it is thriving. It is spoken, read, performed and lived.</p>
<h2>Like a Heartbeat, Our Stories Live On</h2>
<p>Like a heartbeat, our stories live on. Even when we are long gone, they will stay and tell the kind of people we were. Philanthropic, charismatic, romantic and most importantly, unafraid of telling the truth.</p>
<p>I am excited to see the upward movement that the literary community is taking. Because one thing about Kenyan literature is that just like its people, it lingers even longer after the encounter.</p>`;

  // 3. Why Kenya is Africa's underdog
  const whyId = "cmt9w1vbo000aqpqfsl2philo";
  const whyContent = `<p>Majestic. Undiluted. Authentic. Raw. Vibrant. Ever evolving. These are words I would use to describe the Kenyan creative and art landscape. These words don't even put to justice just how colourful and flavourful the scene is.</p>
<p>Kenya stands at the crossroads of culture, creativity and technology; a nation where art doesn't just entertain but speaks, questions and transforms. From the vibrant streets of Nairobi to the rhythmic shores of Kisumu and the coastal stages of Mombasa, creativity pulses through our veins. It tells our stories. Ours is a generation that creates without apology, where every beat, brushstroke and post carries the power to inspire change.</p>
<h2>A Growing Appreciation for Art</h2>
<p>The emergence and pride in identifying with our art and creative forms is louder now more than ever. The artists are creating remarkable pieces, audiences are appreciative and media is amplifying their voices. A perfect recipe for success if you ask me. Our art is everywhere, mainstream media, social media and print media and people are engaging with these art forms in their own ways - by attending shows, purchasing pieces, liking, sharing or simply pausing to feel the message behind the work.</p>
<h2>A Magnetic Draw for International Artists</h2>
<p>This growing appreciation for art doesn't stop at our borders; it resonates far beyond. An innumerable number of artists outside Kenya has and is endlessly flooding our country drawn by the energy of our creative space and enthusiastic crowd. They come because of the love, the loud, genuine love, that Kenyans show to artists, both local and foreign. It's a beautiful exchange of culture and admiration. There's something magnetic about the warmth and kindness of the people; they make artists feel right at home. Tems herself couldn't resist, saying she'd love to settle here and even find love in Kenya.</p>
<h2>Social Media: The Great Enabler</h2>
<p>Kenya's rich cultural diversity, youthful energy and technological advancement make it a thriving creative hub. Today, social media stands as our most constant form of connection, a space where artists can freely express themselves and gain visibility. Whatever your art form, create, copyright your work and share it boldly online. You never know. Your big break could be just one post away. And when opportunity strikes, seize it fully cause lightning rarely hits the same spot twice. Ask the amazing Miss Azziad. Social media gave her a platform and Kenyans ran with her craft. But she is not the only one who Kenyan's have been accommodative of. International artists like Jessica Mashaba realised just the other day what it means to have our people in your corner with a sold out show. The nature of the art scene in Kenya allows room for all to thrive. Comedians and spoken word artists. Musicians and actors. There has been a running joke that any time an international artist goes broke they announce a show in Kenya. That is how much Kenyans are in the game.</p>
<h2>Art as a Mirror of Society</h2>
<p>Kenyan art doesn't exist in isolation. It integrates itself into the very fabric of our society, touching politics, religion and sports to mention a few. Through sharp political satire and skits, artists challenge mediocrity and hold leaders accountable. We all saw our anti government protests, how different artists used their individual brands to speak for Kenyans was an absolute sight for sore eyes. Visual artists use their craft to question and reflect on matters of faith, while musicians celebrate and immortalize the achievements of our sports icons like Kipchoge keep jogging. Our art speaks loudly; it mirrors our reality and connects with every aspect of life. Look closely, and you'll see how creativity flows seamlessly through all sectors, binding them together in a uniquely Kenyan rhythm.</p>
<h2>The Hub, Not the Underdog</h2>
<p>It doesn't have to be loud, out there or mainstream to make it relevant. It is quiet. Impactful. Moving. That's what makes our art and creative scene an underdog, no scratch that, the HUB of Africa's creative scene.</p>`;

  // Update all 3
  await db.post.update({ where: { id: bagId }, data: { content: bagContent } });
  console.log("✓ Updated: Getting into The BAG! (added 5 headings)");

  await db.post.update({ where: { id: litId }, data: { content: litContent } });
  console.log("✓ Updated: The literary world of Kenya (added 5 headings)");

  await db.post.update({ where: { id: whyId }, data: { content: whyContent } });
  console.log("✓ Updated: Why Kenya is Africa's underdog (added 5 headings)");

  // Verify
  const updated = await db.post.findMany({
    where: { id: { in: [bagId, litId, whyId] } },
    select: { title: true, content: true },
  });
  for (const p of updated) {
    const headings = (p.content.match(/<h2>/g) || []).length;
    console.log(`  ${p.title}: ${headings} headings`);
  }

  await db.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
