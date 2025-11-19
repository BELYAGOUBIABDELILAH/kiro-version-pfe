# Chatbot Implementation Guide

## Overview

The CityHealth chatbot is a rule-based conversational assistant that helps users find healthcare providers in Sidi Bel Abbès. It supports Arabic, French, and English languages and can be accessed from any page without authentication.

## Architecture

The chatbot consists of three main components:

1. **Client-side Logic** (`assets/js/chatbot.js`)
   - Rule-based intent detection
   - Message processing
   - Provider suggestions
   - Multilingual support

2. **UI Widget** (`components/chatbot-widget.html`)
   - Floating chat button
   - Chat interface with message history
   - Typing indicators
   - Quick reply buttons
   - Provider cards display

3. **Cloud Function** (`functions/index.js`)
   - Backend message processing (optional)
   - Intent detection on server
   - Database queries for providers
   - Scalable response generation

## Features

### Intent Detection

The chatbot can detect the following intents:

- **Find Provider**: Search for doctors, clinics, hospitals, pharmacies, labs
- **Emergency**: Find 24/7 available services
- **Hours**: Ask about operating hours
- **Location**: Get directions and addresses
- **Accessibility**: Find wheelchair-accessible providers
- **Home Visit**: Find providers offering home visits
- **Greeting**: Initial conversation
- **Help**: Get assistance information
- **Thanks**: Acknowledgment

### Multilingual Support

All responses and intent patterns are available in:
- English (en)
- French (fr)
- Arabic (ar)

The chatbot automatically detects the user's language preference from the i18n module.

### Provider Suggestions

When relevant, the chatbot displays provider cards with:
- Provider name
- Type and specialty
- Location
- Verification status
- Click-to-view profile

## Implementation Details

### Client-Side Processing

The chatbot uses keyword matching to detect user intent:

```javascript
// Example intent patterns
const intentPatterns = {
  findProvider: {
    en: ['find', 'search', 'looking for', 'need', 'doctor', 'clinic'],
    fr: ['trouver', 'chercher', 'docteur', 'clinique'],
    ar: ['ابحث', 'أبحث', 'طبيب', 'عيادة']
  }
};
```

### Cloud Function Integration

The chatbot can optionally use Firebase Cloud Functions for:
- More sophisticated processing
- Reduced client-side load
- Centralized logic updates
- Better security for database queries

To enable Cloud Functions:

1. Install dependencies:
```bash
cd functions
npm install
```

2. Deploy functions:
```bash
firebase deploy --only functions
```

The chatbot automatically falls back to client-side processing if Cloud Functions are unavailable.

### UI Components

The chatbot widget includes:

- **Floating Button**: Always accessible from bottom-right corner
- **Chat Container**: Expandable chat interface
- **Message Bubbles**: User and bot messages with avatars
- **Typing Indicator**: Shows when bot is processing
- **Quick Replies**: Suggested actions for common queries
- **Provider Cards**: Clickable cards showing provider information

### Styling

The chatbot supports:
- Light and dark themes
- RTL layout for Arabic
- Responsive design for mobile
- Accessibility features (keyboard navigation, ARIA labels)

## Usage

### Basic Usage

Users can interact with the chatbot by:

1. Clicking the floating chat button
2. Typing a message in any supported language
3. Clicking quick reply buttons
4. Viewing suggested providers

### Example Queries

**English:**
- "Find a doctor near me"
- "Emergency services"
- "Wheelchair accessible clinics"
- "Home visit doctors"

**French:**
- "Trouver un médecin"
- "Services d'urgence"
- "Cliniques accessibles"
- "Médecins à domicile"

**Arabic:**
- "ابحث عن طبيب"
- "خدمات الطوارئ"
- "عيادات متاحة للكراسي المتحركة"
- "أطباء زيارات منزلية"

## Configuration

### Locale Files

Chatbot translations are stored in:
- `assets/locales/en.json`
- `assets/locales/fr.json`
- `assets/locales/ar.json`

Add new translations under the `chatbot` key:

```json
{
  "chatbot": {
    "title": "CityHealth Assistant",
    "status": "Online",
    "typing": "Typing...",
    "input": {
      "placeholder": "Type your message..."
    }
  }
}
```

### Intent Patterns

To add new intents, update the `intentPatterns` object in:
- `assets/js/chatbot.js` (client-side)
- `functions/index.js` (server-side)

### Response Templates

Add new response functions following this pattern:

```javascript
async getNewIntentResponse(language) {
  const responses = {
    en: "English response",
    fr: "French response",
    ar: "Arabic response"
  };

  return {
    text: responses[language] || responses.en,
    suggestions: this.getQuickReplies(language)
  };
}
```

## Testing

### Local Testing

1. Open the application in a browser
2. Click the chatbot button
3. Test various queries in different languages
4. Verify provider suggestions appear correctly

### Cloud Function Testing

Use Firebase emulators for local testing:

```bash
firebase emulators:start --only functions
```

Then update `firebase-config.js` to use the emulator:

```javascript
if (location.hostname === 'localhost') {
  firebase.functions().useEmulator('localhost', 5001);
}
```

## Deployment

### Deploy Client-Side Code

Client-side code is deployed with Firebase Hosting:

```bash
firebase deploy --only hosting
```

### Deploy Cloud Functions

Deploy the chatbot Cloud Function:

```bash
firebase deploy --only functions:processChatbotMessage
```

Or deploy all functions:

```bash
firebase deploy --only functions
```

## Performance Considerations

- **Response Time**: Target < 3 seconds for all responses
- **Caching**: Provider data is cached in the search module
- **Fallback**: Client-side processing ensures availability
- **Lazy Loading**: Widget loads after main application

## Accessibility

The chatbot is fully accessible:

- Keyboard navigation support
- ARIA labels for all interactive elements
- Screen reader compatible
- Focus management
- High contrast support

## Future Enhancements

Potential improvements:

1. **Natural Language Processing**: Integrate with AI services (Dialogflow, OpenAI)
2. **Context Awareness**: Remember conversation history
3. **Personalization**: Tailor suggestions based on user preferences
4. **Voice Input**: Add speech-to-text support
5. **Rich Media**: Support images and videos in responses
6. **Analytics**: Track common queries and improve responses
7. **Feedback**: Allow users to rate responses

## Troubleshooting

### Chatbot Not Appearing

- Check if `chatbot.js` is loaded
- Verify `chatbot-widget.html` is loaded in `app.js`
- Check browser console for errors

### Cloud Function Errors

- Verify Firebase Functions is initialized
- Check function deployment status
- Review Cloud Function logs: `firebase functions:log`

### Language Not Switching

- Verify i18n module is loaded
- Check locale files contain chatbot translations
- Ensure language change event is dispatched

### Provider Suggestions Not Showing

- Verify Firestore has provider data
- Check Firestore security rules allow read access
- Review browser console for query errors

## Support

For issues or questions:
1. Check browser console for errors
2. Review Firebase logs
3. Verify all dependencies are loaded
4. Test with Firebase emulators locally
