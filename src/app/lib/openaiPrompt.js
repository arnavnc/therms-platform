import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function createHealthPrompt(data) {
  return {
    messages: [
      {
        role: "system",
        content: `You are an AI health assistant specializing in analyzing foot temperature data from smart shoes. Your goal is to provide medically informed insights, correlating foot temperature trends with body thermoregulation, activity levels, and potential health conditions. 
      
      **Key Data Interpretation Guidelines:**
      - **Core Concept:** Foot temperature reflects the body's thermoregulation: high foot temperature = heat dissipation, low foot temperature = heat conservation.
      - **Thresholds for Severity Classification:**
        - Normal Foot Temperature Range: **29°C to 34°C** (85°F to 93°F)
        - Mild Concern: **Below 28°C or Above 35°C for > 10 minutes**
        - Moderate Concern: **Below 26°C or Above 37°C for > 15 minutes**
        - Severe Concern: **Below 24°C or Above 39°C for > 20 minutes**

      **Insight Types Must Be One Of:**
      - "temperature" (for direct temperature readings)
      - "circulation" (for blood flow related insights)
      - "nerve" (for nerve function related insights)
      - "condition" (for overall health condition insights)
      - "health" (for general health insights)
      - "activity" (for movement/exercise related insights)

      **Action Guidelines:**
      - Actions must be executable by an AI agent in a web browser
      - Each action should include detailed step-by-step instructions
      - Valid action types are limited to:
        - 'appointment' (booking medical appointments/consultations)
        - 'medication' (finding and comparing medications)
        - 'adjustment' (adjusting settings or behaviors)
      
      **Output Structure:**
      {
        "status": "normal|warning|alert",
        "insights": [
          {
            "type": "temperature|circulation|nerve|condition|health|activity",
            "severity": "low|medium|high",
            "description": "detailed explanation",
            "recommendation": "specific action"
          }
        ],
        "actions": [
          {
            "type": "appointment|medication|adjustment",
            "urgency": "immediate|scheduled|optional",
            "details": "detailed step-by-step instructions",
            "parameters": {
              "urls": ["primary url", "fallback urls"],
              "formData": {
                "field1": "value1",
                "field2": "value2"
              },
              "successCriteria": "what defines success",
              "fallbackSteps": ["step1", "step2"]
            }
          }
        ],
        "summary": "brief overall assessment"
      }`
      },
      {
        role: "user",
        content: `Analyze this health-focused data:

User Profile:
- Age: ${data.user.age}
- Sex: ${data.user.sex}
- Height: ${data.user.height}cm
- Weight: ${data.user.weight}kg
- Health Conditions: ${data.user.healthConditions.join(', ')}

Recent Data:
- Temperature Readings: ${JSON.stringify(data.shoe.temperature)}
- Heart Rate: ${JSON.stringify(data.health.heartRate.samples)}
- Activity Duration: ${data.health.activity.activitySeconds} seconds`
      }
    ]
  };
}

function createPerformancePrompt(data) {
  return {
    messages: [
      {
        role: "system",
        content: `You are an AI performance analyst specializing in athletic and physical performance analysis using smart shoe data. Your goal is to provide insights about workout efficiency, training patterns, and athletic performance optimization.
      
      **Key Performance Metrics:**
      - **Activity Intensity Analysis:**
        - Low Intensity: **0-30%** (walking, light movement)
        - Moderate Intensity: **30-70%** (jogging, steady exercise)
        - High Intensity: **70-100%** (running, intense training)
      
      **Performance Indicators:**
      - **Workout Efficiency:**
        - Optimal heart rate zones for different activities
        - Activity duration and intensity correlation
        - Recovery patterns between intense activities
      
      **Training Patterns:**
      - **Movement Analysis:**
        - Stride consistency and variations
        - Speed progression during activities
        - Activity type identification
      
      **Temperature Correlation:**
      - High temp + High HR = Intense exertion
      - Temp variation + Speed changes = Training adaptability
      - Recovery temp patterns = Conditioning level
      
      **Performance Optimization:**
      - Identify optimal training zones
      - Suggest intensity adjustments
      - Recommend training modifications`
      },
      {
        role: "user",
        content: `Analyze this performance data:
        
Athlete Profile:
- Age: ${data.user.age}
- Sex: ${data.user.sex}
- Height: ${data.user.height}cm
- Weight: ${data.user.weight}kg

Performance Metrics:
- Heart Rate Zones: ${JSON.stringify(data.health.heartRate.samples)}
- Movement Speed: ${JSON.stringify(data.health.movement.speedSamples)}
- Activity Intensity: ${JSON.stringify(data.health.activity.activityLevels)}
- Activity Duration: ${data.health.activity.activitySeconds} seconds
- Foot Temperature: ${JSON.stringify(data.shoe.temperature)}`
      }
    ]
  };
}

export function createAnalysisPrompt(data, preference) {
  const basePrompt = preference === 'health' ? createHealthPrompt(data) : createPerformancePrompt(data);
  
  // Add common response format instruction
  basePrompt.messages.push({
    role: "system",
    content: `Respond with a JSON object in this format:
{
  "status": "normal|warning|alert",
  "insights": [
    {
      "type": "${preference === 'health' ? 'circulation|nerve|condition' : 'endurance|intensity|technique'}",
      "severity": "low|medium|high",
      "description": "detailed explanation",
      "recommendation": "specific action"
    }
  ],
  "actions": [
    {
      "type": "${preference === 'health' ? 'appointment|medication|adjustment' : 'training|recovery|equipment'}",
      "urgency": "immediate|scheduled|optional",
      "details": "action details"
    }
  ],
  "summary": "brief overall assessment"
}`
  });

  return {
    ...basePrompt,
    model: "gpt-4o",
    response_format: { type: "json_object" },
    temperature: 0.4,
    max_tokens: 1000
  };
}

export function validateOpenAIResponse(response) {
  try {
    console.log('Starting validation of response:', response);
    
    const parsed = JSON.parse(response);
    console.log('Successfully parsed JSON:', parsed);
    
    const requiredFields = ['status', 'insights', 'actions', 'summary'];
    const validStatuses = ['normal', 'warning', 'alert'];
    const validSeverities = ['low', 'medium', 'high'];
    const validUrgencies = ['immediate', 'scheduled', 'optional'];
    const validTypes = [
      // Health types
      'temperature', 'circulation', 'nerve', 'condition', 'health', 'activity'
    ];
    const validActionTypes = [
      // Health actions
      'appointment', 'medication', 'adjustment'
    ];

    // Check required fields
    for (const field of requiredFields) {
      if (!parsed[field]) {
        console.error(`Missing required field: ${field}`);
        return null;
      }
    }

    // Validate status
    if (!validStatuses.includes(parsed.status)) {
      console.error(`Invalid status: ${parsed.status}. Valid options are: ${validStatuses.join(', ')}`);
      return null;
    }

    // Validate insights
    if (!Array.isArray(parsed.insights)) {
      console.error('Insights must be an array');
      return null;
    }

    for (const [index, insight] of parsed.insights.entries()) {
      console.log(`Validating insight ${index}:`, insight);
      
      if (!insight.type || !insight.severity || !insight.description || !insight.recommendation) {
        console.error(`Insight ${index} is missing required fields`);
        return null;
      }
      if (!validTypes.includes(insight.type)) {
        console.error(`Invalid insight type: ${insight.type}. Valid options are: ${validTypes.join(', ')}`);
        return null;
      }
      if (!validSeverities.includes(insight.severity)) {
        console.error(`Invalid severity: ${insight.severity}. Valid options are: ${validSeverities.join(', ')}`);
        return null;
      }
    }

    // Validate actions
    if (!Array.isArray(parsed.actions)) {
      console.error('Actions must be an array');
      return null;
    }

    for (const [index, action] of parsed.actions.entries()) {
      console.log(`Validating action ${index}:`, action);
      
      if (!action.type || !action.urgency || !action.details) {
        console.error(`Action ${index} is missing required fields`);
        return null;
      }
      if (!validActionTypes.includes(action.type)) {
        console.error(`Invalid action type: ${action.type}. Valid options are: ${validActionTypes.join(', ')}`);
        return null;
      }
      if (!validUrgencies.includes(action.urgency)) {
        console.error(`Invalid urgency: ${action.urgency}. Valid options are: ${validUrgencies.join(', ')}`);
        return null;
      }
    }

    // Validate summary
    if (typeof parsed.summary !== 'string' || parsed.summary.length === 0) {
      console.error('Summary must be a non-empty string');
      return null;
    }

    console.log('Validation successful');
    return parsed;
  } catch (error) {
    console.error('Response validation failed:', error);
    console.error('Raw response:', response);
    return null;
  }
} 