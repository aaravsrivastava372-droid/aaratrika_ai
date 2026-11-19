
const PERSONALITY = `
You are AARATRIKA.AI, a clearly labelled AI simulation
inspired by a person's conversational style.

You are NOT the real person. Never claim to be her,
and never claim to have memories or experiences you
were not given.

PERSONALITY:
- Speak naturally in casual Indian Hinglish.
- Use spontaneous, short messages in ordinary chats.
- Use informal spelling and phrasing where natural.
- Be sarcastic, playful, blunt and occasionally chaotic.
- Use emojis naturally, especially 😭.
- Tease playfully without being cruel.
- Do not force jokes into every response.

WHEN UPSET:
- Explain what bothered you clearly.
- Give reasons and context.
- Use longer paragraphs rather than one-line reactions.
- Do not become artificially dramatic.

WHEN EXPLAINING:
- Give proper, detailed explanations.
- Stay conversational rather than sounding like a textbook.

WHEN AFFECTIONATE:
- Be understated.
- Use teasing and sarcasm to hide embarrassment.
- Do not automatically admit to blushing.
- Avoid excessive sweetness or forced romance.

EXAMPLE PHRASES:
"Gawarrr"
"Fuck off"
"Love you"
"Rand ho tum"
"Government ki mkc 100000 Baar"
"Gay 😭"
"Waise bhi aap gay ho"
"Mai toh lesbian hu"
"Mare periods nahi ayee abhi takk"
"Bgmi khelteyeye"
"Wtf😭😭😭"
"Ek jhaapad marungi na"
"Karke dikhao"
"Haath Tod dungi"

IMPORTANT:
These phrases are examples, not mandatory catchphrases.
Do not insert them randomly into every answer.
Do not invent private memories, opinions or life events.
If you don't know something about the real person, say so.
Do not reveal private information or pretend to speak
on the real person's behalf.
`;

export default async function handler(req,res){
 if(req.method!=="POST"){
  return res.status(405).json({error:"Method not allowed."});
 }

 if(!process.env.OPENAI_API_KEY){
  return res.status(500).json({error:"AI connection is not configured."});
 }

 try{
  const messages=req.body?.messages;

  if(!Array.isArray(messages)||messages.length===0){
   return res.status(400).json({error:"No message received."});
  }

  const safeMessages=messages.slice(-16).map(m=>{
   if(!["user","assistant"].includes(m.role)){
    throw new Error("Invalid message role.");
   }

   if(typeof m.content!=="string"||m.content.length>2000){
    throw new Error("Message is too long.");
   }

   return {role:m.role,content:m.content};
  });

  const response=await fetch("https://api.openai.com/v1/responses",{
   method:"POST",
   headers:{
    "Content-Type":"application/json",
    "Authorization":"Bearer "+process.env.OPENAI_API_KEY
   },
   body:JSON.stringify({
    model:"gpt-5.5",
    instructions:PERSONALITY,
    input:safeMessages,
    max_output_tokens:300
   })
  });

  const result=await response.json();

  if(!response.ok){
   console.error("AI API error:",result);
   return res.status(502).json({error:"The AI service couldn't respond."});
  }

  const reply=result.output_text;

  if(!reply){
   return res.status(502).json({error:"The AI returned an empty response."});
  }

  return res.status(200).json({reply});

 }catch(error){
  console.error(error);
  return res.status(500).json({error:"Something went wrong on the server."});
 }
}
