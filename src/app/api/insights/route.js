import OpenAI from 'openai';
import { collectUserData } from '@/app/lib/dataCollection';
import { createAnalysisPrompt, validateOpenAIResponse } from '@/app/lib/openaiPrompt';
import { db } from '@/app/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    const { userId, shoeId } = await request.json();
    
    // Validate input
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!shoeId) {
      throw new Error('Shoe ID is required');
    }

    // Get user data including preference
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    
    // Collect all required data (now includes Terra data if available)
    const data = await collectUserData(userId, shoeId);
    
    // Create prompt based on user preference and available data
    const prompt = createAnalysisPrompt(data, userData.insightPreference);
    
    console.log('Sending prompt to OpenAI:', JSON.stringify(prompt, null, 2));

    // Get OpenAI's response
    const completion = await openai.chat.completions.create({
      ...prompt,
      model: "gpt-4o",
      temperature: 0.4,
      max_tokens: 1000
    });
    
    // Extract the response content
    const responseContent = completion.choices[0].message.content;
    
    console.log('Raw OpenAI response:', responseContent);

    // Clean the response string if it contains markdown code blocks
    let cleanResponse = responseContent;
    if (responseContent.startsWith('```')) {
      cleanResponse = responseContent
        .replace(/^```json\n/, '')  // Remove opening ```json
        .replace(/\n```$/, '')      // Remove closing ```
        .trim();
    }

    // Try parsing the response before validation
    try {
      JSON.parse(cleanResponse);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('OpenAI response is not valid JSON');
    }

    // Validate and parse the response
    const validatedResponse = validateOpenAIResponse(cleanResponse);
    if (!validatedResponse) {
      throw new Error('OpenAI response validation failed');
    }

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('API Error:', error);
    return new NextResponse(error.message, { status: 500 });
  }
}

// Health check endpoint
export async function GET() {
  return Response.json({ status: 'Insights API endpoint is running' });
} 