import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function createHealthPrompt(data) {
  let promptContent = `Analyze this health-focused data:

User Profile:
- Age: ${data.user.age}
- Sex: ${data.user.sex}
- Height: ${data.user.height}cm
- Weight: ${data.user.weight}kg
- Health Conditions: ${data.user.healthConditions?.join(', ') || 'None reported'}

Shoe Data:
- Temperature Readings: ${JSON.stringify(data.shoe.temperature)}
- Stimulus Data: ${JSON.stringify(data.shoe.stimulus)}`;

  // Only add health data if it exists and has the required properties
  if (data.health) {
    let healthData = '\n\nWearable Device Data:';
    
    // Safely add heart rate data if available
    if (data.health.heartRate?.samples) {
      healthData += `\n- Heart Rate: ${JSON.stringify(data.health.heartRate.samples)}`;
    }
    
    // Safely add movement data if available
    if (data.health.movement?.speedSamples) {
      healthData += `\n- Movement Speed: ${JSON.stringify(data.health.movement.speedSamples)}`;
    }
    
    // Safely add activity data if available
    if (data.health.activity) {
      if (data.health.activity.activityLevels) {
        healthData += `\n- Activity Intensity: ${JSON.stringify(data.health.activity.activityLevels)}`;
      }
      if (data.health.activity.activitySeconds) {
        healthData += `\n- Activity Duration: ${data.health.activity.activitySeconds} seconds`;
      }
    }

    promptContent += healthData;
  } else {
    promptContent += '\n\nNote: No wearable device data available for this time period.';
  }

  return {
    messages: [
      {
        role: "system",
        content: `You are an AI health assistant specializing in analyzing foot temperature data from smart shoes. Your goal is to provide medically informed insights, correlating foot temperature trends with body thermoregulation, activity levels, and potential health conditions.

        **Key Data Interpretation Guidelines:**
        - Core Concept: Foot temperature reflects the body's thermoregulation
        - Normal Foot Temperature Range: 29°C to 34°C (85°F to 93°F)
        - Analyze patterns in temperature changes
        - Consider activity levels when available
        - Account for environmental factors
        
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
        content: promptContent
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
  let basePrompt = `Analyze this health-focused data:

User Profile:
- Age: ${data.user?.age || 'Not specified'}
- Sex: ${data.user?.sex || 'Not specified'}
- Height: ${data.user?.height || 'Not specified'}cm
- Weight: ${data.user?.weight || 'Not specified'}kg
- Health Conditions: ${data.user?.healthConditions?.join(', ') || 'None reported'}

Shoe Data:
- Temperature Readings: ${JSON.stringify(data.shoe?.temperature || [])}
- Stimulus Data: ${JSON.stringify(data.shoe?.stimulus || [])}`;

  // Only add health data if it exists and has valid data
  if (data.health) {
    let healthData = '\n\nWearable Device Data:';
    
    // Heart Rate Data
    if (data.health.heartRate?.summary) {
      healthData += `\nHeart Rate Summary:`;
      if (data.health.heartRate.summary.avg_hr_bpm) {
        healthData += `\n- Average: ${data.health.heartRate.summary.avg_hr_bpm} BPM`;
      }
      if (data.health.heartRate.summary.max_hr_bpm) {
        healthData += `\n- Max: ${data.health.heartRate.summary.max_hr_bpm} BPM`;
      }
      if (data.health.heartRate.summary.min_hr_bpm) {
        healthData += `\n- Min: ${data.health.heartRate.summary.min_hr_bpm} BPM`;
      }
    }

    // Movement Data
    if (data.health.movement) {
      healthData += `\n\nMovement Summary:`;
      if (data.health.movement.distance) {
        healthData += `\n- Distance: ${data.health.movement.distance} meters`;
      }
      if (data.health.movement.steps) {
        healthData += `\n- Steps: ${data.health.movement.steps}`;
      }
    }

    // Activity Data
    if (data.health.activity) {
      healthData += `\n\nActivity Summary:`;
      if (data.health.activity.duration) {
        healthData += `\n- Total Duration: ${data.health.activity.duration} seconds`;
      }
      if (data.health.activity.intensities) {
        healthData += `\n- Low Intensity: ${data.health.activity.intensities.low} seconds`;
        healthData += `\n- Moderate Intensity: ${data.health.activity.intensities.moderate} seconds`;
        healthData += `\n- Vigorous Intensity: ${data.health.activity.intensities.vigorous} seconds`;
      }
    }

    // Calories Data
    if (data.health.calories) {
      healthData += `\n\nCalories Summary:`;
      if (data.health.calories.total) {
        healthData += `\n- Total Burned: ${data.health.calories.total} calories`;
      }
      if (data.health.calories.active) {
        healthData += `\n- Active Calories: ${data.health.calories.active} calories`;
      }
    }

    basePrompt += healthData;
  } else {
    basePrompt += '\n\nNote: No wearable device data available for this time period.';
  }

  return {
    messages: [
      {
        role: "system",
        content: `You are an AI health assistant specializing in analyzing foot temperature data from smart shoes. Your goal is to provide medically informed insights, correlating foot temperature trends with body thermoregulation, activity levels, and potential health conditions.

        **Key Data Interpretation Guidelines:**
        - Core Concept: Foot temperature reflects the body's thermoregulation
        - Normal Foot Temperature Range: 29°C to 34°C (85°F to 93°F)
        - Analyze patterns in temperature changes
        - Consider activity levels when available
        - Account for environmental factors
        
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
        content: basePrompt
      }
    ]
  };
}

export function validateOpenAIResponse(response) {
  try {
    console.log('Starting validation of response:', response);
    
    // Clean the response string if it contains markdown code blocks
    let cleanResponse = response;
    if (response.startsWith('```')) {
      cleanResponse = response
        .replace(/^```json\n/, '')  // Remove opening ```json
        .replace(/\n```$/, '')      // Remove closing ```
        .trim();
    }
    
    const parsed = JSON.parse(cleanResponse);
    console.log('Successfully parsed JSON:', parsed);
    
    const requiredFields = ['status', 'insights', 'actions', 'summary'];
    const validStatuses = ['normal', 'warning', 'alert'];
    const validSeverities = ['low', 'medium', 'high'];
    const validUrgencies = ['immediate', 'scheduled', 'optional'];
    const validTypes = [
      'temperature', 'circulation', 'nerve', 'condition', 'health', 'activity'
    ];
    const validActionTypes = [
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