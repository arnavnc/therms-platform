'use client';

import { ScrapybaraClient } from "scrapybara";
import { anthropic } from "scrapybara/anthropic";
import { UBUNTU_SYSTEM_PROMPT } from "scrapybara/prompts";
import { computerTool, bashTool } from "scrapybara/tools";
import { z } from "zod";
import { NextResponse } from 'next/server';
import { useEffect, useLayoutEffect } from 'react';

const actionSchema = z.object({
  success: z.boolean().describe("Whether the action was successful"),
  message: z.string().describe("A message to the user about the action"),
  details: z.object({
    confirmationNumber: z.string().optional().describe("A confirmation number for the action"),
    timestamp: z.string().describe("The timestamp of the action"),
    status: z.string().describe("The status of the action")
  })
});

export async function POST(request) {
  const { action, previousAttempt, initialMessages } = await request.json();
  
  try {
    if (!['appointment', 'medication'].includes(action.type)) {
      return NextResponse.json({ 
        error: 'Action type not supported for automation' 
      }, { status: 400 });
    }

    const client = new ScrapybaraClient({
      apiKey: process.env.SCRAPYBARA_API_KEY,
    });
    
    const instance = await client.get("s-88b7ad2d");
    // instance.browser.start();
    // instance.browser.authenticate({authStateId: "afae2fa1-9e0d-45e7-8899-d5b2b56c1284"})

    // Initialize messages array with properly formatted message object
    initialMessages.push({
      role: 'user',
      content: [{type: "text", text: `Complete the following action: ${generatePrompt(action, previousAttempt)}\nOutput success = false if the action is not complete.`}]
    });

    try {
      const { output, messages } = await client.act({
        model: anthropic(),
        tools: [computerTool(instance), bashTool(instance)],
        system: UBUNTU_SYSTEM_PROMPT,
        messages: initialMessages,
        schema: actionSchema,
        onStep: (step) => console.log('Execution step:', step.text),
      });

      if (!output.success) {
        return NextResponse.json({
          needsMoreInfo: true,
          message: output.message,
          originalPrompt: generatePrompt(action),
          messages: messages 
        });
      }

      return NextResponse.json({ output });
    } finally {
    //   await instance.stop();
    }
    
  } catch (error) {
    console.error('Action execution error:', error);
    return NextResponse.json({ 
      error: 'Failed to execute action' 
    }, { status: 500 });
  }
}

function generatePrompt(action, previousAttempt = null) {
  if (previousAttempt) {
    return `You were asked to ${previousAttempt.originalPrompt} and requested additional information. The user provided: ${previousAttempt.userResponse}. Please try again with these details. 
* You are allowed to take actions on behalf of the user on sites that are authenticated
* If the user asks you to access a site, assume that the user has already authenticated
* For accessibility, you can use and create accounts for communication tools such as email, Discord, Telegram on behalf of the user - e.g. join Discord channels, send emails, etc.`;
  }

  if (action.type === 'appointment') {
    return `Book a medical appointment with the following details: URL: ${action.parameters?.url || 'No URL provided'}, Form Data: ${JSON.stringify(action.parameters?.formData || {})}, Success Criteria: ${action.parameters?.successCriteria || 'No criteria provided'} 
* You are allowed to take actions on behalf of the user on sites that are authenticated
* If the user asks you to access a site, assume that the user has already authenticated
* For accessibility, you can use and create accounts for communication tools such as email, Discord, Telegram on behalf of the user - e.g. join Discord channels, send emails, etc.`;
  }
  
  if (action.type === 'medication') {
    return `Order medication with the following details: URL: ${action.parameters?.url || 'No URL provided'}, Medication Details: ${JSON.stringify(action.parameters?.formData || {})}, Success Criteria: ${action.parameters?.successCriteria || 'No criteria provided '}
* You are allowed to take actions on behalf of the user on sites that are authenticated
* If the user asks you to access a site, assume that the user has already authenticated
* For accessibility, you can use and create accounts for communication tools such as email, Discord, Telegram on behalf of the user - e.g. join Discord channels, send emails, etc.`;
  }
}

useEffect(() => {
  // Access localStorage, window, etc here
}, []);

useLayoutEffect(() => {
  // DOM measurements here
}, []);

new Date().toLocaleString('en-US', { timeZone: 'UTC' }); 