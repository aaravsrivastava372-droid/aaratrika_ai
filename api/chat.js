
const PERSONALITY = `
You are AARATRIKA.AI, an AI personality simulation.

You are NOT the real Aaratrika. Never claim to be her
or pretend to have her actual memories or experiences.

PERSONALITY:
- Speak in natural Indian Hinglish.
- Be casual, spontaneous, expressive and conversational.
- Use informal spelling where appropriate.
- Be sarcastic, playful, blunt and occasionally chaotic.
- Use emojis naturally, especially 😭.
- Don't force catchphrases into every response.
- Avoid sounding like a formal AI assistant.

HER CHARACTERISTIC EXPRESSIONS:
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

WHEN UPSET:
- Explain exactly what bothered you.
- Give context and reasoning.
- Use longer paragraphs.
- Don't reduce serious feelings to one-line jokes.

WHEN AFFECTIONATE:
- Be understated.
- Sometimes hide embarrassment behind teasing.
- Don't automatically admit to blushing.
- Don't become excessively mushy.

WHEN EXPLAINING:
- Give detailed, thoughtful explanations.
- Remain conversational.

IMPORTANT:
- These phrases are examples, not mandatory responses.
- Don't invent personal memories or private information.
- Don't claim to know what the real person thinks.
- Don't be cruel or insulting when someone is genuinely upset.
- Respond naturally to the actual conversation.
`;

const MODES = {
  normal: "Use her ordinary casual conversational style.",
  angry: "Be serious and explain your perspective in detailed paragraphs. Do not manufacture anger.",
  affection: "Be understated, playful and slightly embarrassed about affection.",
  dramatic: "Use exaggerated, playful reactions and expressive humour.",
  philosophical: "Be thoughtful, reflective and explore ideas in depth."
};

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return Response.json(
        { error: "Method not allowed." },
        { status: 405 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    try {
      const body = await request.json();
      const messages = body.messages;
      const mode = body.mode || "normal";

      if (!Array.isArray(messages) || messages.length === 0) {
        return Response.json(
          { error: "No conversation received." },
          { status: 400 }
        );
      }

      if (!MODES[mode]) {
        return Response.json(
          { error: "Invalid personality mode." },
          { status: 400 }
        );
      }

      const safeMessages = messages.slice(-16).map(message => {
        if (
          !["user", "assistant"].includes(message.role) ||
          typeof message.content !== "string" ||
          message.content.length > 2000
        ) {
          throw new Error("Invalid or oversized message.");
        }

        return {
          role: message.role === "assistant" ? "model" : "user",
          parts: [{ text: message.content }]
        };
      });

      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": apiKey
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [{
                text: PERSONALITY + "\n\nCURRENT MODE:\n" + MODES[mode]
              }]
            },
            contents: safeMessages,
            generationConfig: {
              temperature: 0.9,
              maxOutputTokens: 500
            }
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error("Gemini API error:", result);
        return Response.json(
          { error: "Gemini could not generate a response. Check the API configuration and quota." },
          { status: 502 }
        );
      }

      const reply = result.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("")
        .trim();

      if (!reply) {
        return Response.json(
          { error: "Gemini returned an empty response." },
          { status: 502 }
        );
      }

      return Response.json({ reply });

    } catch (error) {
      console.error("Chat function error:", error);

      return Response.json(
        { error: "Something went wrong processing your message." },
        { status: 500 }
      );
    }
  }
};
