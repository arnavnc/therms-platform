import OpenAI from 'openai';
import { collectUserData } from '@/app/lib/dataCollection';
import { createAnalysisPrompt, validateOpenAIResponse } from '@/app/lib/openaiPrompt';
import { db } from '@/app/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const { userId, shoeId } = await req.json();
    
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
    
    // Collect all required data
    const data = await collectUserData(userId, shoeId);
    
    // Create prompt based on user preference
    const prompt = createAnalysisPrompt(data, userData.insightPreference);
    
    console.log('Sending prompt to OpenAI:', JSON.stringify(prompt, null, 2));

    // Get OpenAI's response
    const completion = await openai.chat.completions.create(prompt);
    
    // Extract the response content
    const responseContent = completion.choices[0].message.content;
    
    console.log('Raw OpenAI response:', responseContent);
    
    // Try parsing the response before validation
    try {
      JSON.parse(responseContent);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      throw new Error('OpenAI response is not valid JSON');
    }

    // Validate and parse the response
    const validatedResponse = validateOpenAIResponse(responseContent);
    
    if (!validatedResponse) {
      console.error('Validation failed for response:', responseContent);
      throw new Error('Invalid response format from OpenAI');
    }
    
    return Response.json(validatedResponse);
  } catch (error) {
    console.error('Insights API Error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        name: error.name
      } : undefined
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// Health check endpoint
export async function GET() {
  return Response.json({ status: 'Insights API endpoint is running' });
} 