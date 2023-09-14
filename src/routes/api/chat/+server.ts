import { Configuration, OpenAIApi } from 'openai-edge';
import { OpenAIStream, StreamingTextResponse } from 'ai';

import { OPENAI_API_KEY, OPENAI_MODEL } from '$env/static/private';

import type { RequestHandler } from './$types';

// Create an OpenAI API client
const config = new Configuration({
    apiKey: OPENAI_API_KEY
});
const openai = new OpenAIApi(config);

export const POST = (async ({ request }) => {
    // Extract the `prompt` from the body of the request
    const { prompt } = await request.json();

    // Ask OpenAI for a streaming chat completion given the prompt
    const response = await openai.createChatCompletion({
        model: OPENAI_MODEL,
        stream: true,
        // messages: messages.map((message: any) => ({
        //     content: message.content,
        //     role: message.role
        // }))
        messages: [ {role: "user", content: prompt}]
    });

    // Convert the response into a friendly text-stream
    const stream = OpenAIStream(response);
    // Respond with the stream
    return new StreamingTextResponse(stream);
}) satisfies RequestHandler;
