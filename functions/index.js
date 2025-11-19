/**
 * Firebase Cloud Functions for CityHealth Platform
 * 
 * This module contains serverless functions for the chatbot and other backend operations.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

/**
 * Chatbot Message Processing Function
 * 
 * Processes chatbot messages and returns intelligent responses.
 * This function can be enhanced with more sophisticated NLP or AI services.
 * 
 * @param {Object} data - Request data containing message and language
 * @param {Object} context - Function context with auth information
 * @returns {Object} Response with text and optional providers
 */
exports.processChatbotMessage = functions.https.onCall(async (data, context) => {
  try {
    const { message, language = 'en' } = data;

    if (!message || typeof message !== 'string') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Message is required and must be a string'
      );
    }

    // Detect intent from message
    const intent = detectIntent(message, language);

    // Get response based on intent
    const response = await getResponse(intent, message, language);

    return response;
  } catch (error) {
    console.error('Chatbot processing error:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to process message',
      error.message
    );
  }
});

/**
 * Detect user intent from message
 * @param {string} message - User message
 * @param {string} language - Language code
 * @returns {Object} Intent object
 */
function detectIntent(message, language) {
  const lowerMessage = message.toLowerCase().trim();

  // Intent patterns for different languages
  const intentPatterns = {
    findProvider: {
      en: ['find', 'search', 'looking for', 'need', 'where', 'doctor', 'clinic', 'hospital', 'pharmacy', 'lab'],
      fr: ['trouver', 'chercher', 'cherche', 'besoin', 'où', 'docteur', 'clinique', 'hôpital', 'pharmacie', 'laboratoire'],
      ar: ['ابحث', 'أبحث', 'أريد', 'أين', 'طبيب', 'عيادة', 'مستشفى', 'صيدلية', 'مختبر', 'دكتور']
    },
    emergency: {
      en: ['emergency', 'urgent', 'now', '24/7', 'immediate', 'asap'],
      fr: ['urgence', 'urgent', 'maintenant', '24/7', 'immédiat', 'tout de suite'],
      ar: ['طوارئ', 'عاجل', 'الآن', 'فوري', 'مستعجل']
    },
    hours: {
      en: ['hours', 'open', 'close', 'available', 'when', 'time', 'schedule'],
      fr: ['heures', 'ouvert', 'fermé', 'disponible', 'quand', 'horaire'],
      ar: ['ساعات', 'مفتوح', 'مغلق', 'متاح', 'متى', 'وقت', 'مواعيد']
    },
    accessibility: {
      en: ['wheelchair', 'accessible', 'disability', 'handicap'],
      fr: ['fauteuil roulant', 'accessible', 'handicap'],
      ar: ['كرسي متحرك', 'متاح', 'إعاقة', 'معاق']
    },
    homeVisit: {
      en: ['home visit', 'house call', 'come to', 'visit home'],
      fr: ['visite à domicile', 'venir à', 'domicile'],
      ar: ['زيارة منزلية', 'يأتي للمنزل', 'في البيت']
    },
    greeting: {
      en: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening'],
      fr: ['bonjour', 'salut', 'bonsoir'],
      ar: ['مرحبا', 'السلام عليكم', 'أهلا', 'صباح الخير', 'مساء الخير']
    },
    help: {
      en: ['help', 'how', 'what can', 'assist', 'support'],
      fr: ['aide', 'comment', 'que peux', 'assister', 'support'],
      ar: ['مساعدة', 'كيف', 'ماذا يمكن', 'ساعد']
    }
  };

  // Check each intent pattern
  const intents = [];
  for (const [intentType, patterns] of Object.entries(intentPatterns)) {
    const languagePatterns = patterns[language] || patterns.en;
    
    let matches = 0;
    for (const pattern of languagePatterns) {
      if (lowerMessage.includes(pattern.toLowerCase())) {
        matches++;
      }
    }

    if (matches > 0) {
      intents.push({
        type: intentType,
        confidence: matches / languagePatterns.length
      });
    }
  }

  // Sort by confidence
  intents.sort((a, b) => b.confidence - a.confidence);

  // Return highest confidence intent or unknown
  return intents.length > 0 
    ? intents[0] 
    : { type: 'unknown', confidence: 0 };
}

/**
 * Get response based on intent
 * @param {Object} intent - Detected intent
 * @param {string} message - Original message
 * @param {string} language - Language code
 * @returns {Promise<Object>} Response object
 */
async function getResponse(intent, message, language) {
  const intentType = intent.type;

  switch (intentType) {
    case 'greeting':
      return getGreetingResponse(language);
    
    case 'help':
      return getHelpResponse(language);
    
    case 'emergency':
      return await getEmergencyResponse(language);
    
    case 'findProvider':
      return await getFindProviderResponse(message, language);
    
    case 'hours':
      return getHoursResponse(language);
    
    case 'accessibility':
      return await getAccessibilityResponse(language);
    
    case 'homeVisit':
      return await getHomeVisitResponse(language);
    
    default:
      return getUnknownResponse(language);
  }
}

/**
 * Get greeting response
 */
function getGreetingResponse(language) {
  const responses = {
    en: "Hello! I'm here to help you find healthcare providers in Sidi Bel Abbès. You can ask me about doctors, clinics, hospitals, pharmacies, or labs. How can I assist you today?",
    fr: "Bonjour ! Je suis là pour vous aider à trouver des prestataires de soins de santé à Sidi Bel Abbès. Vous pouvez me poser des questions sur les médecins, les cliniques, les hôpitaux, les pharmacies ou les laboratoires. Comment puis-je vous aider aujourd'hui ?",
    ar: "مرحباً! أنا هنا لمساعدتك في العثور على مقدمي الرعاية الصحية في سيدي بلعباس. يمكنك أن تسألني عن الأطباء أو العيادات أو المستشفيات أو الصيدليات أو المختبرات. كيف يمكنني مساعدتك اليوم؟"
  };

  return {
    text: responses[language] || responses.en,
    suggestions: getQuickReplies(language)
  };
}

/**
 * Get help response
 */
function getHelpResponse(language) {
  const responses = {
    en: "I can help you with:\n• Finding doctors, clinics, hospitals, pharmacies, or labs\n• Emergency services (24/7 available)\n• Providers with wheelchair accessibility\n• Providers offering home visits\n• Operating hours and locations\n\nJust ask me what you need!",
    fr: "Je peux vous aider avec :\n• Trouver des médecins, cliniques, hôpitaux, pharmacies ou laboratoires\n• Services d'urgence (disponibles 24h/24 et 7j/7)\n• Prestataires accessibles en fauteuil roulant\n• Prestataires proposant des visites à domicile\n• Horaires d'ouverture et emplacements\n\nDemandez-moi simplement ce dont vous avez besoin !",
    ar: "يمكنني مساعدتك في:\n• العثور على الأطباء والعيادات والمستشفيات والصيدليات أو المختبرات\n• خدمات الطوارئ (متاحة 24/7)\n• مقدمي الخدمة مع إمكانية الوصول بالكراسي المتحركة\n• مقدمي الخدمة الذين يقدمون زيارات منزلية\n• ساعات العمل والمواقع\n\nفقط اسألني عما تحتاجه!"
  };

  return {
    text: responses[language] || responses.en,
    suggestions: getQuickReplies(language)
  };
}

/**
 * Get emergency response with 24/7 providers
 */
async function getEmergencyResponse(language) {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('providers')
      .where('verified', '==', true)
      .where('available24_7', '==', true)
      .orderBy('rating', 'desc')
      .limit(5)
      .get();

    const providers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const responses = {
      en: `I found ${providers.length} emergency healthcare providers available 24/7:`,
      fr: `J'ai trouvé ${providers.length} prestataires de soins d'urgence disponibles 24h/24 et 7j/7 :`,
      ar: `وجدت ${providers.length} من مقدمي الرعاية الصحية الطارئة المتاحين على مدار الساعة:`
    };

    return {
      text: responses[language] || responses.en,
      providers: providers,
      action: 'showProviders'
    };
  } catch (error) {
    console.error('Error getting emergency providers:', error);
    return getErrorResponse(language);
  }
}

/**
 * Get find provider response
 */
async function getFindProviderResponse(message, language) {
  try {
    const db = admin.firestore();
    
    // Simple query for verified providers
    const snapshot = await db.collection('providers')
      .where('verified', '==', true)
      .orderBy('rating', 'desc')
      .limit(5)
      .get();

    const providers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (providers.length === 0) {
      const responses = {
        en: "I couldn't find any providers matching your request. Try searching for doctors, clinics, hospitals, pharmacies, or labs.",
        fr: "Je n'ai trouvé aucun prestataire correspondant à votre demande. Essayez de rechercher des médecins, des cliniques, des hôpitaux, des pharmacies ou des laboratoires.",
        ar: "لم أتمكن من العثور على أي مقدمي خدمة يطابقون طلبك. حاول البحث عن الأطباء أو العيادات أو المستشفيات أو الصيدليات أو المختبرات."
      };

      return {
        text: responses[language] || responses.en,
        suggestions: getQuickReplies(language)
      };
    }

    const responses = {
      en: `I found ${providers.length} healthcare providers for you:`,
      fr: `J'ai trouvé ${providers.length} prestataires de soins de santé pour vous :`,
      ar: `وجدت ${providers.length} من مقدمي الرعاية الصحية لك:`
    };

    return {
      text: responses[language] || responses.en,
      providers: providers,
      action: 'showProviders'
    };
  } catch (error) {
    console.error('Error finding providers:', error);
    return getErrorResponse(language);
  }
}

/**
 * Get hours response
 */
function getHoursResponse(language) {
  const responses = {
    en: "To see operating hours for a specific provider, please search for them and view their profile. You can also filter for 24/7 emergency services if you need immediate care.",
    fr: "Pour voir les heures d'ouverture d'un prestataire spécifique, veuillez le rechercher et consulter son profil. Vous pouvez également filtrer les services d'urgence 24h/24 et 7j/7 si vous avez besoin de soins immédiats.",
    ar: "لمعرفة ساعات العمل لمقدم خدمة معين، يرجى البحث عنه وعرض ملفه الشخصي. يمكنك أيضًا تصفية خدمات الطوارئ على مدار الساعة إذا كنت بحاجة إلى رعاية فورية."
  };

  return {
    text: responses[language] || responses.en,
    suggestions: [
      { text: language === 'ar' ? 'خدمات الطوارئ' : language === 'fr' ? 'Services d\'urgence' : 'Emergency services', action: 'emergency' }
    ]
  };
}

/**
 * Get accessibility response
 */
async function getAccessibilityResponse(language) {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('providers')
      .where('verified', '==', true)
      .where('accessibility', '==', true)
      .orderBy('rating', 'desc')
      .limit(5)
      .get();

    const providers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const responses = {
      en: `I found ${providers.length} wheelchair-accessible healthcare providers:`,
      fr: `J'ai trouvé ${providers.length} prestataires de soins de santé accessibles en fauteuil roulant :`,
      ar: `وجدت ${providers.length} من مقدمي الرعاية الصحية الذين يمكن الوصول إليهم بالكراسي المتحركة:`
    };

    return {
      text: responses[language] || responses.en,
      providers: providers,
      action: 'showProviders'
    };
  } catch (error) {
    console.error('Error getting accessible providers:', error);
    return getErrorResponse(language);
  }
}

/**
 * Get home visit response
 */
async function getHomeVisitResponse(language) {
  try {
    const db = admin.firestore();
    const snapshot = await db.collection('providers')
      .where('verified', '==', true)
      .where('homeVisits', '==', true)
      .orderBy('rating', 'desc')
      .limit(5)
      .get();

    const providers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const responses = {
      en: `I found ${providers.length} healthcare providers offering home visits:`,
      fr: `J'ai trouvé ${providers.length} prestataires de soins de santé proposant des visites à domicile :`,
      ar: `وجدت ${providers.length} من مقدمي الرعاية الصحية الذين يقدمون زيارات منزلية:`
    };

    return {
      text: responses[language] || responses.en,
      providers: providers,
      action: 'showProviders'
    };
  } catch (error) {
    console.error('Error getting home visit providers:', error);
    return getErrorResponse(language);
  }
}

/**
 * Get unknown intent response
 */
function getUnknownResponse(language) {
  const responses = {
    en: "I'm not sure I understand. I can help you find healthcare providers, emergency services, or answer questions about accessibility and home visits. What would you like to know?",
    fr: "Je ne suis pas sûr de comprendre. Je peux vous aider à trouver des prestataires de soins de santé, des services d'urgence ou répondre à des questions sur l'accessibilité et les visites à domicile. Que voudriez-vous savoir ?",
    ar: "لست متأكدًا من أنني أفهم. يمكنني مساعدتك في العثور على مقدمي الرعاية الصحية أو خدمات الطوارئ أو الإجابة على أسئلة حول إمكانية الوصول والزيارات المنزلية. ماذا تريد أن تعرف؟"
  };

  return {
    text: responses[language] || responses.en,
    suggestions: getQuickReplies(language)
  };
}

/**
 * Get error response
 */
function getErrorResponse(language) {
  const responses = {
    en: "I'm sorry, I encountered an error. Please try again or use the search function to find providers.",
    fr: "Je suis désolé, j'ai rencontré une erreur. Veuillez réessayer ou utiliser la fonction de recherche pour trouver des prestataires.",
    ar: "أنا آسف، واجهت خطأ. يرجى المحاولة مرة أخرى أو استخدام وظيفة البحث للعثور على مقدمي الخدمة."
  };

  return {
    text: responses[language] || responses.en,
    error: true
  };
}

/**
 * Get quick reply suggestions
 */
function getQuickReplies(language) {
  const replies = {
    en: [
      { text: 'Find a doctor', action: 'findDoctor' },
      { text: 'Emergency services', action: 'emergency' },
      { text: 'Wheelchair accessible', action: 'accessibility' },
      { text: 'Home visits', action: 'homeVisit' }
    ],
    fr: [
      { text: 'Trouver un médecin', action: 'findDoctor' },
      { text: 'Services d\'urgence', action: 'emergency' },
      { text: 'Accessible en fauteuil roulant', action: 'accessibility' },
      { text: 'Visites à domicile', action: 'homeVisit' }
    ],
    ar: [
      { text: 'ابحث عن طبيب', action: 'findDoctor' },
      { text: 'خدمات الطوارئ', action: 'emergency' },
      { text: 'متاح للكراسي المتحركة', action: 'accessibility' },
      { text: 'زيارات منزلية', action: 'homeVisit' }
    ]
  };

  return replies[language] || replies.en;
}
