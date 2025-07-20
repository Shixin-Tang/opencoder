import { openai, createOpenAI } from "opencoder";

export default {
    //using default OpenAI
    // model: openai("gpt-4o"),

    // Or with custom configuration
    model: createOpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    })("gpt-4o"),
};
